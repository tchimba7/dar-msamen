const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

export function isPhoneVerificationRequired() {
  const rawValue = process.env.PHONE_VERIFICATION_REQUIRED;
  if (!rawValue) {
    return false;
  }

  return !FALSE_VALUES.has(rawValue.trim().toLowerCase());
}
