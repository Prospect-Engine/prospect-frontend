import getCookie from "./cookie";

const platformLogo = {
  LINKEDIN: {
    title: "Linkedin",
    icon: "mdi:linkedin",
  },
  FACEBOOK: {
    title: "Facebook",
    icon: "mdi:facebook",
  },
  GMAIL: {
    title: "Gmail",
    icon: "mdi:gmail",
  },
  WHATSAPP: {
    title: "Whatsapp",
    icon: "mdi:whatsapp",
  },
  TWITTER: {
    title: "Twitter",
    icon: "mdi:twitter",
  },
  TELEGRAM: {
    title: "Telegram",
    icon: "mdi:telegram",
  },
} as const;

export const getAppLogo = () => {
  const defaultLogo = "/temp_logo.png";
  try {
    const templateLogo = getCookie("logo_url");
    return templateLogo ? decodeURIComponent(templateLogo) : defaultLogo;
  } catch (_) {
    return defaultLogo;
  }
};

export default platformLogo;
