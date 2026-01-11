export default function getCookie(key: string, cookie?: string | null) {
  try {
    if (cookie) {
      return cookie
        .split(";")
        .find(c => c.trim().startsWith(key + "="))
        ?.split("=")[1];
    }
    const b = document.cookie.match("(^|;)\\s*" + key + "\\s*=\\s*([^;]+)");
    return b ? b.pop() : "";
  } catch {
    return null;
  }
}
