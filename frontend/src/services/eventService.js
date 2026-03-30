import { get, isMockDataSource } from "../lib/appClient";
import { participationEventBanners } from "../data/homeData";

function formatEventPeriod(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "이벤트 기간 확인";
  }

  return `${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(2, "0")} - ${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")}`;
}

function mapEventDto(dto) {
  return {
    id: `event-${dto.eventNo}`,
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
  };
}

export async function fetchLiveEvents() {
  if (isMockDataSource()) {
    return participationEventBanners;
  }

  const response = await get("/api/event/list?page=1&size=20");
  return (response.dtoList ?? []).map(mapEventDto);
}
