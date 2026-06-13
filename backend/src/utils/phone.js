function normalizePhone(value) {
  const digits = String(value || "").replace(/[^\d+]/g, "");
  if (!digits) return "";

  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("09")) return `+98${digits.slice(1)}`;
  if (digits.startsWith("9") && digits.length === 10) return `+98${digits}`;
  if (digits.startsWith("964")) return `+${digits}`;
  if (digits.startsWith("98")) return `+${digits}`;

  return digits;
}

module.exports = {
  normalizePhone,
};
