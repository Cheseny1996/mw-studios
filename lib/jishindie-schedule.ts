import { ChallengeSettingsModel } from "@/lib/models";

export function getJishindieSchedule(now = new Date()) {
  const shifted = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const date = shifted.getUTCDate();
  const day = shifted.getUTCDay();
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();

  const elapsedMinutes = hour * 60 + minute;
  let daysUntilSunday = (7 - day) % 7;
  if (day === 0 && elapsedMinutes < 21 * 60) daysUntilSunday = 0;

  const sunday = Date.UTC(year, month, date + daysUntilSunday);
  const registrationEndsAt = new Date(sunday + 8 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000);
  const votingEndsAt = new Date(sunday + 21 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000);

  let status: "registration" | "voting" | "closed" = "registration";
  if (now.getTime() >= registrationEndsAt.getTime() && now.getTime() < votingEndsAt.getTime()) status = "voting";
  if (now.getTime() >= votingEndsAt.getTime()) status = "closed";

  return {
    timezone: "Africa/Nairobi (EAT)",
    status,
    registrationStartsAt: new Date(sunday - 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(),
    registrationEndsAt: registrationEndsAt.toISOString(),
    votingStartsAt: registrationEndsAt.toISOString(),
    votingEndsAt: votingEndsAt.toISOString(),
    nextAnnouncement: status === "registration"
      ? "Registration closes Sunday at 8:00 AM EAT. Voting opens immediately."
      : status === "voting"
        ? "Voting is live until Sunday at 9:00 PM EAT."
        : "The challenge is complete. The next Sunday challenge opens for registration.",
  };
}

export async function getChallengeSchedule(challengeSlug: string, now = new Date()) {
  const config = await ChallengeSettingsModel.findOne({ challengeSlug }).lean();
  if (!config) {
    const fallback = getJishindieSchedule(now);
    return {
      ...fallback,
      challengeSlug,
      title: challengeSlug === "kapsokwony-annual-run" ? "Kapsokwony Annual Run" : "Weekly Jishindie Challenge",
      challengeType: "creative",
      prizeSummary: "",
    };
  }

  const registrationStartsAt = new Date(config.registrationStartsAt).toISOString();
  const registrationEndsAt = new Date(config.registrationEndsAt).toISOString();
  const votingStartsAt = new Date(config.votingStartsAt).toISOString();
  const votingEndsAt = new Date(config.votingEndsAt).toISOString();
  const timestamp = now.getTime();
  const status = timestamp < new Date(registrationStartsAt).getTime()
    ? "scheduled"
    : timestamp < new Date(registrationEndsAt).getTime()
      ? "registration"
      : timestamp < new Date(votingStartsAt).getTime()
        ? "scheduled"
        : timestamp < new Date(votingEndsAt).getTime()
          ? "voting"
          : "closed";

  return {
    timezone: "Africa/Nairobi (EAT)",
    status,
    challengeSlug: config.challengeSlug,
    title: config.title,
    challengeType: config.challengeType,
    registrationStartsAt,
    registrationEndsAt,
    votingStartsAt,
    votingEndsAt,
    nextAnnouncement: config.nextAnnouncement,
    prizeSummary: config.prizeSummary,
  };
}
