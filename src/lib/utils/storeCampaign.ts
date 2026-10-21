import config from "@/config/config.json";

const KEY = "skoolz_campaign";

type Campaign = { source: string; medium: string; campaign: string };

// Kept for the session: the visitor may browse a few pages before tapping a store button.
const readCampaign = (): Campaign | null => {
  const params = new URLSearchParams(location.search);
  const source = params.get("utm_source");
  const campaign = params.get("utm_campaign");
  if (source || campaign) {
    const found = {
      source: source || campaign!,
      medium: params.get("utm_medium") || "social",
      campaign: campaign || source!,
    };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(found));
    } catch {}
    return found;
  }
  try {
    const saved = sessionStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

// Add the store's own campaign tags so App Store Connect and Play Console count the installs.
export const tagStoreLink = (href: string): string => {
  const campaign = readCampaign();
  if (!campaign) return href;
  const url = new URL(href);
  if (url.hostname === "apps.apple.com") {
    const token = config.params.apple_provider_token;
    if (token) url.searchParams.set("pt", token);
    // Apple caps ct at 40 chars.
    url.searchParams.set("ct", `${campaign.source}-${campaign.campaign}`.slice(0, 40));
    url.searchParams.set("mt", "8");
  } else if (url.hostname === "play.google.com") {
    const referrer = new URLSearchParams({
      utm_source: campaign.source,
      utm_medium: campaign.medium,
      utm_campaign: campaign.campaign,
    });
    url.searchParams.set("referrer", referrer.toString());
  }
  return url.toString();
};

export const tagStoreLinks = () => {
  document
    .querySelectorAll<HTMLAnchorElement>('a[href^="https://apps.apple.com"], a[href^="https://play.google.com"]')
    .forEach((link) => (link.href = tagStoreLink(link.href)));
};
