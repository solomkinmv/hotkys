const URL_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const HOST_LABEL_PATTERN = "[a-z\\d](?:[a-z\\d-]{0,61}[a-z\\d])?";
const HOST_PATTERN = `(?:${HOST_LABEL_PATTERN}\\.)*${HOST_LABEL_PATTERN}`;
const PORT_PATTERN =
  "(?::(?:0|[1-9]\\d{0,3}|[1-5]\\d{4}|6[0-4]\\d{3}|65[0-4]\\d{2}|655[0-2]\\d|6553[0-5]))?";
const HTTP_URL_PATTERN = new RegExp(
  `^https?://${HOST_PATTERN}${PORT_PATTERN}(?:[/?#]|$)`,
  "i",
);

export function isHttpUrl(value: string): boolean {
  if (CONTROL_CHARACTER_PATTERN.test(value)) return false;
  const trimmed = value.trim();
  if (!HTTP_URL_PATTERN.test(trimmed)) return false;

  try {
    const url = new URL(trimmed);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.length > 0
    );
  } catch {
    return false;
  }
}

export function isSafeImageLocation(value: string): boolean {
  if (CONTROL_CHARACTER_PATTERN.test(value)) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("//") || trimmed.startsWith("\\")) return false;
  if (URL_SCHEME_PATTERN.test(trimmed)) return isHttpUrl(trimmed);
  return true;
}
