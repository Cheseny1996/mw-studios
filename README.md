# Mzima Wells Studios

Digital ecosystem for Mzima Wells, built with Next.js and MongoDB and designed for deployment on Vercel.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `MONGODB_URI` to a MongoDB Atlas connection string in `.env.local`.
Set `AUTH_SECRET` to a unique, long random value. To bootstrap a global administrator,
set `SUPER_ADMIN_EMAIL` to the administrator's email before that account registers.
Restart the development server after changing `.env.local`. Never commit the file or
share the secret values.

## Database health

`GET /api/health/db` reports whether MongoDB is configured and connected. It does not expose credentials.

## MW Shop setup

Shop staff can add categories and published products from the admin shop tab. Product prices are whole KSh amounts; a product image can be supplied as an HTTPS URL or uploaded as a JPEG, PNG or WebP (up to 4 MB). Image uploads require a Vercel Blob store linked to the project, which provides `BLOB_READ_WRITE_TOKEN`.

Checkout supports delivery or pickup and starts a Safaricom M-Pesa STK Push. Configure these values in Vercel Project Settings → Environment Variables:

- `MPESA_ENV`: `sandbox` for testing or `production` for live payments.
- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE` and `MPESA_PASSKEY`: credentials from the matching Daraja environment.
- `MPESA_TRANSACTION_TYPE`: `CustomerPayBillOnline` for a Paybill or `CustomerBuyGoodsOnline` for a Till.
- `MPESA_CALLBACK_URL`: the public HTTPS URL ending in `/api/shop/mpesa/callback`.

Use the matching Safaricom credentials and shortcode type for the selected environment. Never put payment credentials in source control or chat. M-Pesa checkouts remain unavailable until the required settings are present.

## Jishindie challenges

Administrators can create a custom challenge, edit its slug, description, format, prizes and schedule, then save it as a draft or publish it. Only published challenges are listed publicly, and draft challenges cannot accept registrations or votes. Dates must be ordered as registration start, registration end, voting start and voting end.

## Deployment

Deploy to Vercel and add `MONGODB_URI` in the Vercel production environment settings. Do not commit `.env.local`.
