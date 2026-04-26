import { createPortal } from "react-dom";

export const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function parseISO(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function isBeforeDate(left, right) {
  return startOfDay(left).getTime() < startOfDay(right).getTime();
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

export function formatDateSummary(checkIn, checkOut) {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (!start || !end) return "날짜를 선택해 주세요.";
  const nights = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
  return `${start.getMonth() + 1}.${start.getDate()} ${WEEK_DAYS[start.getDay()]} - ${end.getMonth() + 1}.${end.getDate()} ${WEEK_DAYS[end.getDay()]} · ${nights}박`;
}

export function formatBookingDate(value) {
  return new Date(value).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export { createPortal };
