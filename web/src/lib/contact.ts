// Something that looks like one email address: no spaces, one @, a dot in the domain.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The operator's address from CONTACT_EMAIL, for Privacy Policy, Terms and "Suggest an edit"
 * (MORE-02, MORE-03). Read on the server when the page is rendered, so one image works with any
 * address. Without a usable value there is none, and the pages point to the project's issues instead.
 */
export function contactEmail(): string | null {
  const value = process.env.CONTACT_EMAIL?.trim();
  return value && EMAIL.test(value) ? value : null;
}

/** A mailto: link with its subject and body encoded, or null without an address. */
export function mailtoHref(email: string | null, subject: string, body: string): string | null {
  if (!email) {
    return null;
  }
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
