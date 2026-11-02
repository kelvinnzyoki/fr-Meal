/**
 * Avatar initials from a full name.
 *  - one name            -> its first two letters   ("Mercy"        -> "ME")
 *  - two names           -> first letter of each    ("Mercy Wanjiru" -> "MW")
 *  - three or more names -> first and last names    ("Mary Anne Wanjiru" -> "MW")
 */
export function getInitials(fullName?: string | null): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const chars = (s: string) => Array.from(s); // safe for non-ASCII / emoji
  if (parts.length === 1) return chars(parts[0]).slice(0, 2).join("").toUpperCase();
  const first = chars(parts[0])[0];
  const last = chars(parts[parts.length - 1])[0];
  return (first + last).toUpperCase();
}
