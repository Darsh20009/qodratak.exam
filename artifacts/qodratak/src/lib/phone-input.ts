const digitsOnly = (value: string) => value
  .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
  .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
  .replace(/\D/g, "");

/** A pasted international number must not receive a second country prefix. */
export function fullPhone(code: string, value: string) {
  const prefix = digitsOnly(code);
  const digits = digitsOnly(value);
  if (value.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00") && digits.length >= 11) return `+${digits.slice(2)}`;
  if (prefix && digits.startsWith(prefix) && digits.length >= prefix.length + 9) return `+${digits}`;
  return `+${prefix}${digits.replace(/^0+/, "")}`;
}
