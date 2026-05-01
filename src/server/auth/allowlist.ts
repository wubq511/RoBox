export function parseAllowedEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string, allowlist: string[]) {
  return allowlist.includes(email.trim().toLowerCase());
}
