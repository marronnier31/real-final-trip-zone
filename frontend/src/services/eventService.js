import { get, getApiBaseUrl } from "../lib/appClient";

const EVENT_PROMO_ACCENTS = ["sunset", "peach", "mint", "dusk"];
const EVENT_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
];

function formatEventPeriod(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "이벤트 기간 확인";
  }

  return `${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(2, "0")} - ${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")}`;
}

function buildEventImageUrl(fileName) {
  if (!fileName) return "";
  if (/^https?:\/\//i.test(fileName)) return fileName;
  return `${getApiBaseUrl()}/api/event/view/${encodeURIComponent(fileName)}`;
}

function mapEventDto(dto, index = 0) {
  return {
    id: `event-${dto.eventNo}`,
    entityType: "EVENT",
    eventNo: dto.eventNo,
    title: dto.title,
    subtitle: dto.content,
    action: "이벤트 보기",
    heroTitle: dto.title,
    heroSubtitle: dto.content,
    heroEyebrow: "Live Event",
    heroMeta: formatEventPeriod(dto.startDate, dto.endDate),
    detailTitle: dto.title,
    detailCopy: dto.content,
    href: "/lodgings?theme=deal",
    couponNames: dto.couponNames ?? [],
    status: dto.status,
    accent: EVENT_PROMO_ACCENTS[index % EVENT_PROMO_ACCENTS.length],
    thumbnailUrl: dto.thumbnailUrl ?? "",
    imageUrl: buildEventImageUrl(dto.thumbnailUrl) || EVENT_FALLBACK_IMAGES[index % EVENT_FALLBACK_IMAGES.length],
    periodLabel: formatEventPeriod(dto.startDate, dto.endDate),
  };
}

export async function fetchLiveEvents() {
  const response = await get("/api/event/list?page=1&size=20");
  return (response.dtoList ?? [])
    .filter((dto) => dto.status === "ONGOING")
    .map((dto, index) => mapEventDto(dto, index));
}
