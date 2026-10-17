/** Historical Saudi phone representations; never rewrite the account to resolve login. */
export function authPhoneLookupVariants(value: string): string[] {
  const text = value.trim()
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0));
  if (!/^[+\d\s()-]+$/.test(text)) return [];
  const digits = text.replace(/\D/g, "").replace(/^00966/, "966");
  const local = digits.replace(/^(?:966|0)/, "");
  if (!/^5\d{8}$/.test(local)) return [];
  return [`966${local}`, `+966${local}`, `0${local}`, local];
}

export function authPhoneStorageCandidates(value: string): string[] {
  const saudiVariants = authPhoneLookupVariants(value);
  if (saudiVariants.length) return saudiVariants;

  const text = value.trim()
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0));
  if (!/^[+\d\s()-]+$/.test(text)) return [];

  const digits = text.replace(/\D/g, "");
  return digits ? [...new Set([digits, `+${digits}`])] : [];
}
