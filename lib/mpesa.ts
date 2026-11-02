type MpesaConfig = {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  transactionType: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
  baseUrl: string;
};

function getMpesaConfig(): MpesaConfig | null {
  const {
    MPESA_CONSUMER_KEY: consumerKey,
    MPESA_CONSUMER_SECRET: consumerSecret,
    MPESA_SHORTCODE: shortcode,
    MPESA_PASSKEY: passkey,
    MPESA_CALLBACK_URL: callbackUrl,
  } = process.env;
  const environment = process.env.MPESA_ENV;
  const transactionType = process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline";
  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl
    || !["sandbox", "production"].includes(environment || "")
    || !["CustomerPayBillOnline", "CustomerBuyGoodsOnline"].includes(transactionType)) {
    return null;
  }
  try {
    const callback = new URL(callbackUrl);
    if (callback.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return {
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    callbackUrl,
    transactionType: transactionType as MpesaConfig["transactionType"],
    baseUrl: environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke",
  };
}

export function isMpesaConfigured() {
  return getMpesaConfig() !== null;
}

export function normalizeMpesaPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `254${digits.slice(1)}` : digits.startsWith("254") ? digits : `254${digits}`;
  return /^254(?:7\d{8}|1\d{8})$/.test(normalized) ? normalized : null;
}

function darajaTimestamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

export async function requestMpesaStkPush(amount: number, phone: string, orderNumber: string) {
  const config = getMpesaConfig();
  if (!config) throw new Error("M-Pesa checkout is not configured. Add the Daraja settings in the Vercel environment.");
  if (!Number.isInteger(amount) || amount < 1) throw new Error("M-Pesa checkout requires a whole-number amount of at least KSh 1.");
  const timestamp = darajaTimestamp();
  const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString("base64");
  const tokenResponse = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64")}` },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!tokenResponse.ok) throw new Error("M-Pesa could not authenticate the payment request. Check the Daraja credentials and environment.");
  const tokenData: unknown = await tokenResponse.json();
  if (!tokenData || typeof tokenData !== "object" || !("access_token" in tokenData) || typeof tokenData.access_token !== "string") {
    throw new Error("M-Pesa returned an invalid authentication response.");
  }
  const stkResponse = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: config.transactionType,
      Amount: amount,
      PartyA: phone,
      PartyB: config.shortcode,
      PhoneNumber: phone,
      CallBackURL: config.callbackUrl,
      AccountReference: orderNumber,
      TransactionDesc: `MW Shop order ${orderNumber}`,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const responseData: unknown = await stkResponse.json().catch(() => null);
  if (!stkResponse.ok || !responseData || typeof responseData !== "object") {
    throw new Error("M-Pesa could not start the payment. Please try again or contact the shop.");
  }
  const response = responseData as Record<string, unknown>;
  if (response.ResponseCode !== "0" || typeof response.CheckoutRequestID !== "string" || typeof response.MerchantRequestID !== "string") {
    const message = typeof response.CustomerMessage === "string" ? response.CustomerMessage : "M-Pesa did not accept the payment request.";
    throw new Error(message);
  }
  return {
    checkoutRequestId: response.CheckoutRequestID,
    merchantRequestId: response.MerchantRequestID,
    customerMessage: typeof response.CustomerMessage === "string" ? response.CustomerMessage : "Check your phone and enter your M-Pesa PIN.",
  };
}
