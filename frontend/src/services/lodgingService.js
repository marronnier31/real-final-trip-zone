import { lodgingReviews } from "../data/lodgingDetailData";
import { get } from "../lib/appClient";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80";
const FALLBACK_COORDS = {
  latitude: 37.5665,
  longitude: 126.978,
};

function formatCurrency(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "문의 필요";
  return `${numeric.toLocaleString()}원`;
}

function buildDistrict(address, region) {
  const cleaned = String(address ?? "").trim();
  if (!cleaned) return region || "위치 확인 필요";

  const parts = cleaned.split(/\s+/).filter(Boolean);
  return parts[1] ?? parts[0] ?? region ?? "위치 확인 필요";
}

function buildHighlights(dto) {
  const items = [
    dto.status === "ACTIVE" ? "즉시 예약 가능" : "운영 상태 확인 필요",
    dto.checkInTime ? `체크인 ${dto.checkInTime}` : null,
    dto.checkOutTime ? `체크아웃 ${dto.checkOutTime}` : null,
  ].filter(Boolean);

  return items.length ? items : ["숙소 상세 정보 확인", "객실 옵션 확인", "위치 정보 확인"];
}

function buildImageUrl(fileName) {
  if (!fileName) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(fileName)) return fileName;
  return `http://100.96.110.114:8080/api/lodgings/view/${encodeURIComponent(fileName)}`;
}

function mapRoom(roomDTO, lodgingDTO) {
  return {
    roomId: roomDTO.roomNo,
    lodgingId: roomDTO.lodgingNo ?? lodgingDTO.lodgingNo,
    name: roomDTO.roomName,
    type: roomDTO.roomType ?? "객실",
    description: roomDTO.roomDescription ?? "객실 설명 준비 중",
    maxGuestCount: roomDTO.maxGuestCount ?? 2,
    pricePerNight: roomDTO.pricePerNight ?? 0,
    price: formatCurrency(roomDTO.pricePerNight),
    roomCount: roomDTO.roomCount ?? 1,
    status: roomDTO.status,
    imageUrls: roomDTO.imageUrls?.length ? roomDTO.imageUrls : [buildImageUrl(lodgingDTO.uploadFileNames?.[0])],
  };
}

function mapLodging(dto) {
  const rooms = (dto.rooms ?? []).map((roomDTO) => mapRoom(roomDTO, dto));
  const firstRoom = rooms[0] ?? null;
  const image = buildImageUrl(dto.uploadFileNames?.[0]);
  const district = buildDistrict(dto.address, dto.region);

  return {
    id: dto.lodgingNo,
    lodgingId: dto.lodgingNo,
    hostId: dto.hostNo,
    name: dto.lodgingName,
    type: dto.lodgingType,
    region: dto.region,
    district,
    address: dto.address,
    detailAddress: dto.detailAddress ?? "",
    zipCode: dto.zipCode ?? "",
    latitude: dto.latitude ?? FALLBACK_COORDS.latitude,
    longitude: dto.longitude ?? FALLBACK_COORDS.longitude,
    intro: dto.description ?? "숙소 소개 준비 중입니다.",
    description: dto.description ?? "숙소 소개 준비 중입니다.",
    summary: `${dto.checkInTime ?? "체크인 확인"} · ${dto.checkOutTime ?? "체크아웃 확인"} · ${dto.status ?? "상태 확인"}`,
    image,
    galleryImages: dto.uploadFileNames?.length ? dto.uploadFileNames.map(buildImageUrl) : [image],
    checkInTime: dto.checkInTime ?? "15:00",
    checkOutTime: dto.checkOutTime ?? "11:00",
    status: dto.status,
    highlights: buildHighlights(dto),
    rating: "4.8",
    reviewCount: "후기 준비 중",
    benefit: firstRoom ? `${firstRoom.name} 예약 가능` : "객실 옵션 확인 가능",
    review: "실제 후기 연동 전입니다.",
    cancellation: "취소 규정은 예약 단계에서 확인해 주세요.",
    room: firstRoom ? `${firstRoom.name} · 최대 ${firstRoom.maxGuestCount}인` : "객실 정보 확인 필요",
    price: firstRoom ? formatCurrency(firstRoom.pricePerNight) : "문의 필요",
    rooms,
  };
}

function buildCollection(ids, title, region, rows) {
  const existingIds = ids.filter((id) => rows.some((item) => item.id === id));
  if (!existingIds.length) return null;

  return {
    title,
    region,
    ids: existingIds,
  };
}

export async function getLodgings() {
  const rows = await get("/api/lodgings/list");
  return rows.map(mapLodging);
}

export async function getLodgingById(lodgingId) {
  const row = await get(`/api/lodgings/${lodgingId}`);
  return mapLodging(row);
}

export async function getLodgingDetailById(lodgingId) {
  const row = await get(`/api/lodgings/${lodgingId}/detail`);
  return mapLodging(row);
}

export async function getLodgingCollections() {
  const rows = await getLodgings();

  return [
    buildCollection(
      rows.filter((item) => item.region === "부산").map((item) => item.id).slice(0, 4),
      "이번 주말 예약 가능한 부산 숙소",
      "부산",
      rows,
    ),
    buildCollection(
      rows.filter((item) => item.region === "제주").map((item) => item.id).slice(0, 4),
      "제주 감도 높은 스테이",
      "제주",
      rows,
    ),
    buildCollection(rows.map((item) => item.id).slice(0, 4), "지금 둘러보기 좋은 숙소", rows[0]?.region ?? "국내", rows),
  ].filter(Boolean);
}

export async function getSearchSuggestionItems() {
  const rows = await getLodgings();
  const unique = new Map();

  rows.forEach((lodging) => {
    [
      { label: lodging.name, subtitle: `${lodging.type}, ${lodging.region} ${lodging.district}`, type: "hotel" },
      { label: lodging.region, subtitle: `${lodging.region} 인기 숙소`, type: "region" },
      { label: lodging.district, subtitle: `${lodging.region} ${lodging.district}`, type: "region" },
    ].forEach((item) => {
      const key = `${item.type}-${item.label}-${item.subtitle}`;
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });
  });

  return Array.from(unique.values());
}

export function getLodgingReviews() {
  return lodgingReviews;
}
