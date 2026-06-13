function pad(value) {
  return String(value).padStart(2, "0");
}

function todayYmd(timeZone = "Asia/Tehran") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function parseGregorianDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const match = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    ymd: `${year}-${pad(month)}-${pad(day)}`,
    utcTime: Date.UTC(year, month - 1, day),
  };
}

function diffDays(fromYmd, toYmd) {
  const from = parseGregorianDate(fromYmd);
  const to = parseGregorianDate(toYmd);
  if (!from || !to) return null;
  return Math.round((to.utcTime - from.utcTime) / 86400000);
}

module.exports = {
  todayYmd,
  parseGregorianDate,
  diffDays,
};
