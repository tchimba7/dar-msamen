export function normalizeMoroccanPhone(rawPhone: string) {
  let phone = rawPhone.replace(/[\s().-]/g, "");

  if (phone.startsWith("+212")) {
    phone = `0${phone.slice(4)}`;
  } else if (phone.startsWith("212")) {
    phone = `0${phone.slice(3)}`;
  } else if (/^[5-7]\d{8}$/.test(phone)) {
    phone = `0${phone}`;
  }

  return phone;
}

export function isValidMoroccanPhone(rawPhone: string) {
  const phone = normalizeMoroccanPhone(rawPhone);
  return /^0[5-7]\d{8}$/.test(phone);
}

export function toMoroccanE164(rawPhone: string) {
  const phone = normalizeMoroccanPhone(rawPhone);

  if (/^0[5-7]\d{8}$/.test(phone)) {
    return `+212${phone.slice(1)}`;
  }

  return rawPhone.replace(/[\s().-]/g, "");
}
