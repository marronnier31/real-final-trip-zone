import { CHOSEONG, WEEK_DAYS } from "./homeConstants";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function getInitialConsonants(value) {
  return Array.from(String(value ?? ""))
    .map((char) => {
      const code = char.charCodeAt(0) - 44032;
      if (code < 0 || code > 11171) return char.toLowerCase();
      return CHOSEONG[Math.floor(code / 588)] ?? "";
    })
    .join("");
}

export function matchesKeyword(item, keyword) {
  const term = normalizeText(keyword);
  if (!term) return false;

  const fields = [item.label, item.subtitle, item.region, ...(item.aliases ?? [])]
    .filter(Boolean)
    .map((field) => normalizeText(field));
  const initialFields = [item.label, item.subtitle, item.region, ...(item.aliases ?? [])]
    .filter(Boolean)
    .map((field) => getInitialConsonants(field));

  return fields.some((field) => field.includes(term)) || initialFields.some((field) => field.includes(term));
}

export function computePosition(anchorRect, wantedWidth, wantedHeight, options = {}) {
  const { preferBelow = false } = options;
  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const left = clamp(anchorRect.left, margin, viewportWidth - wantedWidth - margin);
  let top = anchorRect.bottom + 8;

  if (!preferBelow && top + wantedHeight > viewportHeight - margin) {
    top = clamp(anchorRect.top - wantedHeight - 8, margin, viewportHeight - wantedHeight - margin);
  }

  return { left, top };
}

export function parseISO(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function monthGrid(baseDate) {
  const first = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
  // Trim trailing row if it's entirely outside the current month
  if (days[35].getMonth() !== baseDate.getMonth()) {
    days.splice(35, 7);
  }
  return days;
}

export function sameDate(left, right) {
  return (
    left &&
    right &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function betweenDate(day, start, end) {
  if (!start || !end) return false;
  const time = day.getTime();
  return time > start.getTime() && time < end.getTime();
}

export function formatDateSummary(checkIn, checkOut) {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (!start || !end) return "날짜를 선택하세요";
  const nights = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
  return `${start.getMonth() + 1}.${start.getDate()} ${WEEK_DAYS[start.getDay()]} - ${end.getMonth() + 1}.${end.getDate()} ${WEEK_DAYS[end.getDay()]} · ${nights}박`;
}

export function buildCollectionCards(collection, lodgings) {
  const base = collection.ids
    .map((id) => lodgings.find((item) => item.id === id))
    .filter(Boolean);

  return Array.from({ length: 4 }, (_, index) => {
    const lodging = base[index % base.length];
    const currentPrice = Number(String(lodging.price).replace(/[^\d]/g, ""));
    const rateSeed = [0, 0.08, 0.11, 0.14, 0.17][(lodging.id + index) % 5];
    const hasDiscount = (lodging.id + index) % 4 !== 0;
    const originalPrice = hasDiscount ? Math.round(currentPrice / (1 - rateSeed) / 1000) * 1000 : currentPrice;
    const discountRate = hasDiscount ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;
    const highlights = Array.isArray(lodging.highlights) ? lodging.highlights : [];

    return {
      ...lodging,
      key: `${collection.region}-${lodging.id}-${index}`,
      benefit: index % 2 === 0 || !highlights.length ? lodging.benefit : highlights[index % highlights.length],
      originalPrice: hasDiscount && discountRate > 0 ? `${originalPrice.toLocaleString()}원` : "",
      discountRate: hasDiscount && discountRate > 0 ? `${discountRate}%` : "",
    };
  });
}
