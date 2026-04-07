import { readAuthSession } from "../features/auth/authSession";
import { quickThemes } from "../data/homeData";
import { del, get, patch, post, put } from "../lib/appClient";
import { invalidateLodgingsCache } from "./lodgingService";
import { getSellerInquiryRooms } from "./sellerInquiryService";

function formatDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateTimeLabel(value) {
  if (!value) return "아직 제출 전";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return `${numeric.toLocaleString()}원`;
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0%";
  return `${Math.round(numeric * 100)}%`;
}

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return "-";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";
  return `${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(2, "0")} - ${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")}`;
}

function extractRows(response) {
  if (Array.isArray(response)) {
    return response;
  }

  return response?.dtoList ?? [];
}

function mapEnabledStatus(enabled) {
  return enabled === "1" || enabled === "true" || enabled === true ? "ACTIVE" : "BLOCKED";
}

function mapInquiryStatus(status) {
  if (status === "COMPLETED") return "ANSWERED";
  if (status === "DELETE") return "CLOSED";
  return "OPEN";
}

function mapAdminUserDto(dto) {
  return {
    id: dto.userNo,
    name: dto.userName ?? `회원 ${dto.userNo}`,
    role: "ROLE_USER",
    status: mapEnabledStatus(dto.enabled),
    email: dto.email ?? "-",
    phone: dto.phone ?? "-",
    grade: dto.gradeName ?? "-",
    mileage: Number(dto.mileage ?? 0),
  };
}

function mapHostProfileDto(dto) {
  return {
    id: dto.hostNo,
    hostNo: dto.hostNo,
    userNo: dto.userNo,
    business: dto.businessName ?? `호스트 ${dto.hostNo}`,
    owner: dto.ownerName ?? "-",
    status: dto.enabled === "0" ? "SUSPENDED" : dto.approvalStatus ?? "PENDING",
    region: "-",
    businessNo: dto.businessNumber ?? "-",
    account: dto.account ?? "-",
    rejectReason: dto.rejectReason ?? "",
    submittedAt: dto.regDate ?? "",
    updatedAt: dto.updDate ?? "",
  };
}

const EVENT_TARGET_PREFIX = "[[target:";
const DEFAULT_EVENT_TARGET = "theme=deal";
const eventTargetLabelByQuery = new Map([
  [DEFAULT_EVENT_TARGET, "전체 특가"],
  ...quickThemes.map((item) => [String(item.to).replace("/lodgings?", ""), item.label]),
]);

function parseEventContent(rawContent = "") {
  const normalized = typeof rawContent === "string" ? rawContent : "";
  const markerPattern = /^\[\[target:(.+?)\]\]\r?\n?/;
  const match = normalized.match(markerPattern);
  const targetValue = match?.[1]?.trim() || DEFAULT_EVENT_TARGET;
  const content = match ? normalized.replace(markerPattern, "") : normalized;

  return {
    rawContent: normalized,
    content,
    targetValue,
  };
}

function encodeEventContent(content = "", targetValue = DEFAULT_EVENT_TARGET) {
  const query = targetValue?.trim() || DEFAULT_EVENT_TARGET;
  const body = typeof content === "string" ? content : "";
  return `${EVENT_TARGET_PREFIX}${query}]]\n${body}`;
}

function getEventTargetLabel(targetValue) {
  return eventTargetLabelByQuery.get(targetValue?.trim() || DEFAULT_EVENT_TARGET) ?? "이벤트 대상 숙소";
}

function mapEventDto(dto) {
  const status = dto.status ?? "DRAFT";
  const { rawContent, content, targetValue } = parseEventContent(dto.content);

  return {
    id: `event-${dto.eventNo}`,
    entityType: "EVENT",
    entityNo: dto.eventNo,
    title: dto.title ?? `이벤트 ${dto.eventNo}`,
    status,
    statusLabel:
      status === "ONGOING" ? "노출중" :
      status === "HIDDEN" ? "숨김" :
      status === "ENDED" ? "종료" : "초안",
    target: getEventTargetLabel(targetValue),
    targetValue,
    period: formatDateRange(dto.startDate, dto.endDate),
    content,
    rawContent,
    startDate: dto.startDate ?? "",
    endDate: dto.endDate ?? "",
    thumbnailUrl: dto.thumbnailUrl ?? "",
  };
}

function mapCouponDto(dto) {
  const status = dto.status ?? "INACTIVE";
  const discountLabel =
    dto.discountType === "PERCENT"
      ? `${Number(dto.discountValue ?? 0)}% 쿠폰`
      : `${Number(dto.discountValue ?? 0).toLocaleString()}원 쿠폰`;

  return {
    id: `coupon-${dto.couponNo}`,
    entityType: "COUPON",
    entityNo: dto.couponNo,
    title: dto.couponName ?? `쿠폰 ${dto.couponNo}`,
    status,
    statusLabel:
      status === "ACTIVE" ? "노출중" :
      status === "EXPIRED" || status === "USED" ? "종료" : "숨김",
    target: discountLabel,
    period: formatDateRange(dto.startDate, dto.endDate),
    content: "",
    startDate: dto.startDate ?? "",
    endDate: dto.endDate ?? "",
    discountType: dto.discountType ?? "PERCENT",
    discountValue: dto.discountValue ?? 0,
    adminUser: dto.adminUser ?? 1,
  };
}

function mapInquiryDto(dto, comments = []) {
  const orderedComments = [...comments].sort((left, right) => {
    const leftTime = new Date(left.regDate ?? 0).getTime();
    const rightTime = new Date(right.regDate ?? 0).getTime();

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return Number(left.commentNo ?? 0) - Number(right.commentNo ?? 0);
  });

  return {
    id: dto.inquiryNo,
    title: dto.title ?? `문의 ${dto.inquiryNo}`,
    type: dto.inquiryType ?? "SYSTEM",
    status: mapInquiryStatus(dto.status),
    date: formatDateLabel(dto.regDate),
    owner: `회원 ${dto.userNo ?? "-"}`,
    summary: dto.content ?? "",
    messages: [
      {
        id: `inquiry-${dto.inquiryNo}`,
        sender: "회원",
        time: formatDateLabel(dto.regDate),
        body: dto.content ?? "",
      },
      ...orderedComments.map((comment) => ({
        id: `comment-${comment.commentNo}`,
        sender: "운영팀",
        time: "답변 도착",
        body: comment.content ?? "",
      })),
    ],
  };
}

function mapReservationDto(dto) {
  const bookingNo = dto.bookingNo ?? dto.no ?? dto.id;
  const guestName = dto.userName ?? dto.guestName ?? (dto.userNo ? `회원 ${dto.userNo}` : "-");
  const lodgingName = dto.lodgingName ?? dto.accommodationName ?? "숙소 확인";
  const roomName = dto.roomName ?? dto.productName ?? "객실 확인";
  const requestMessage = dto.requestMessage ?? "";

  return {
    id: bookingNo,
    no: bookingNo,
    guest: guestName,
    guestName,
    lodging: lodgingName,
    stay: `${formatDateLabel(dto.checkInDate)} - ${formatDateLabel(dto.checkOutDate)}`,
    status: dto.status ?? "PENDING",
    amount: formatMoney(dto.totalPrice),
    requestMessage,
    detail: `${lodgingName} · ${roomName}`,
  };
}

function mapSellerLodgingDto(dto) {
  const roomCount = dto.rooms?.reduce((sum, room) => sum + Number(room.roomCount ?? 0), 0) ?? 0;

  return {
    id: dto.lodgingNo,
    name: dto.lodgingName ?? `숙소 ${dto.lodgingNo}`,
    type: dto.lodgingType ?? "-",
    region: dto.region ?? "-",
    status: dto.status ?? "INACTIVE",
    roomCount,
    occupancy: "-",
    inquiryCount: 0,
    address: dto.address ?? "",
    detailAddress: dto.detailAddress ?? "",
    zipCode: dto.zipCode ?? "",
    latitude: dto.latitude ?? "",
    longitude: dto.longitude ?? "",
    description: dto.description ?? "",
    checkInTime: dto.checkInTime ?? "15:00",
    checkOutTime: dto.checkOutTime ?? "11:00",
    uploadFileNames: dto.uploadFileNames ?? [],
    rooms: dto.rooms ?? [],
  };
}

function mapSellerLodgingSummaryDto(dto) {
  return {
    id: dto.lodgingNo,
    name: dto.lodgingName ?? `숙소 ${dto.lodgingNo}`,
    type: "-",
    region: dto.region ?? "-",
    status: dto.status ?? "INACTIVE",
    roomCount: Number(dto.roomCount ?? 0),
    occupancy: "-",
    inquiryCount: 0,
  };
}

function mapSellerRoomDto(room, lodging) {
  return {
    id: room.roomNo,
    roomNo: room.roomNo,
    lodgingId: room.lodgingNo ?? lodging?.id ?? null,
    name: room.roomName ?? `객실 ${room.roomNo}`,
    type: room.roomType ?? "-",
    lodging: lodging?.name ?? "-",
    status: room.status ?? "UNAVAILABLE",
    capacity: room.maxGuestCount ? `${room.maxGuestCount}인` : "-",
    price: formatMoney(room.pricePerNight),
    description: room.roomDescription ?? "",
    maxGuestCount: Number(room.maxGuestCount ?? 0),
    pricePerNight: Number(room.pricePerNight ?? 0),
    roomCount: Number(room.roomCount ?? 1),
    imageUrls: room.imageUrls ?? [],
  };
}

function mapSellerAssetRows(lodging) {
  const images = lodging.uploadFileNames?.length ? lodging.uploadFileNames : [];
  if (!images.length) {
    return [
      {
        id: `${lodging.id}-placeholder`,
        lodgingId: lodging.id,
        lodging: lodging.name,
        type: "대표 이미지",
        order: "1",
        status: "미등록",
        fileName: null,
        isExternal: false,
      },
    ];
  }

  return images.map((fileName, index) => ({
    id: `${lodging.id}-${index + 1}-${fileName}`,
    lodgingId: lodging.id,
    lodging: lodging.name,
    type: index === 0 ? "대표 이미지" : "일반 이미지",
    order: String(index + 1),
    status: index === 0 ? "대표 노출" : "일반 노출",
    fileName,
    isExternal: /^https?:\/\//i.test(fileName),
  }));
}

async function getCurrentHostProfile() {
  const session = readAuthSession();
  if (!session?.userNo) return null;

  try {
    return await get("/api/mypage/host-profile");
  } catch (error) {
    if (error.message?.includes("HTTP 403")) {
      return null;
    }

    if (error.message?.includes("호스트 신청 정보가 없습니다.")) {
      return null;
    }

    if (error.message?.includes("HTTP 404")) {
      try {
        const response = await get("/api/hosts?page=1&size=100");
        const hostRows = extractRows(response);
        return hostRows.find((item) => Number(item.userNo) === Number(session.userNo)) ?? null;
      } catch {
        return null;
      }
    }
    throw error;
  }
}

async function requireCurrentHostProfile() {
  const host = await getCurrentHostProfile();
  if (!host) {
    throw new Error("판매자 프로필을 찾을 수 없습니다.");
  }
  return host;
}

export function getDashboardDataSource() {
  return "http";
}

export function getAdminTasks() {
  return [];
}

export function getSellerTasks() {
  return [];
}

export async function getAdminUsers() {
  const response = await get("/api/admin/admin/userlist?page=1&size=100");
  return extractRows(response).map(mapAdminUserDto);
}

export async function getAdminUserDetail(userNo) {
  const response = await get(`/api/admin/admin/${userNo}/detail`);
  return mapAdminUserDto(response);
}

export async function updateAdminUserStatus(userNo, nextStatus) {
  const response = await patch(`/api/admin/users/${userNo}/status`, {
    status: nextStatus,
  });
  return mapAdminUserDto(response);
}

export async function getAdminSellers() {
  const response = await get("/api/hosts?page=1&size=100");
  return extractRows(response).map(mapHostProfileDto);
}

export async function updateAdminSellerStatus(hostNo, nextStatus) {
  if (nextStatus === "APPROVED") {
    await patch(`/api/admin/${hostNo}/approve`, {});
  } else if (nextStatus === "REJECTED") {
    await patch(`/api/admin/${hostNo}/reject`, { rejectReason: "관리자 반려 처리" });
  } else if (nextStatus === "SUSPENDED") {
    await put(`/api/hosts/${hostNo}/delete`, {});
  } else if (nextStatus === "ACTIVE") {
    await put(`/api/hosts/${hostNo}/restore`, {});
  } else {
    throw new Error("지원하지 않는 판매자 상태입니다.");
  }

  return getAdminSellers();
}

export async function deleteAdminSeller(hostNo) {
  await del(`/api/hosts/${hostNo}`);
  return getAdminSellers();
}

export async function getAdminEvents() {
  const [eventResponse, couponRows] = await Promise.all([
    get("/api/event/list?page=1&size=100"),
    get("/api/coupon/list").catch(() => []),
  ]);

  return [
    ...extractRows(eventResponse).map(mapEventDto),
    ...couponRows.map(mapCouponDto),
  ];
}

export async function createAdminEvent(draft, imageFile) {
  const session = readAuthSession();
  const formData = new FormData();
  formData.append("adminUser", String(session?.userNo ?? 1));
  formData.append("title", draft.title);
  formData.append("content", encodeEventContent(draft.content ?? "", draft.targetValue));
  formData.append("startDate", draft.startDate);
  formData.append("endDate", draft.endDate);
  formData.append("status", draft.status ?? "DRAFT");
  if (imageFile) {
    formData.append("file", imageFile);
  }

  const response = await post("/api/event", formData);
  const refreshed = await get(`/api/event/${response.eventNo}`);
  return mapEventDto(refreshed);
}

export async function deleteAdminEvent(eventNo) {
  await del(`/api/event/${eventNo}`);
}

export async function createAdminCoupon(payload) {
  const session = readAuthSession();
  const response = await post("/api/coupon", {
    adminUser: Number(session?.userNo ?? 1),
    couponName: payload.title,
    discountType: payload.discountType ?? "AMOUNT",
    discountValue: Number(payload.discountValue),
    startDate: payload.startDate,
    endDate: payload.endDate,
    status: payload.status ?? "INACTIVE",
  });
  const refreshed = await get("/api/coupon/list");
  return refreshed.map(mapCouponDto).find((item) => item.entityNo === response.couponNo) ?? null;
}

export async function deleteAdminCoupon(couponNo) {
  await del(`/api/coupon/${couponNo}`);
}

export async function updateAdminEventStatus(currentEvent, nextStatus) {
  if (currentEvent.entityType === "COUPON") {
    await patch(`/api/coupon/${currentEvent.entityNo}`, {
      adminUser: currentEvent.adminUser,
      couponName: currentEvent.title,
      discountType: currentEvent.discountType,
      discountValue: currentEvent.discountValue,
      startDate: currentEvent.startDate,
      endDate: currentEvent.endDate,
      status: nextStatus === "ONGOING" ? "ACTIVE" : "INACTIVE",
    });

    const refreshed = await get("/api/coupon/list");
    return refreshed.map(mapCouponDto).find((item) => item.id === currentEvent.id) ?? null;
  }

  const formData = new FormData();
  formData.append("title", currentEvent.title);
  formData.append("content", currentEvent.rawContent ?? encodeEventContent(currentEvent.content ?? "", currentEvent.targetValue));
  formData.append("startDate", currentEvent.startDate);
  formData.append("endDate", currentEvent.endDate);
  formData.append("status", nextStatus);
  if (currentEvent.thumbnailUrl) {
    formData.append("thumbnailUrl", currentEvent.thumbnailUrl);
  }

  await put(`/api/event/${currentEvent.entityNo}`, formData);
  const refreshed = await get(`/api/event/${currentEvent.entityNo}`);
  return mapEventDto(refreshed);
}

export async function saveAdminEvent(eventId, draft, currentEvent, imageFile = null) {
  if (currentEvent.entityType === "COUPON") {
    await patch(`/api/coupon/${currentEvent.entityNo}`, {
      adminUser: currentEvent.adminUser,
      couponName: draft.title,
      discountType: draft.discountType ?? currentEvent.discountType ?? "AMOUNT",
      discountValue: Number(draft.discountValue),
      startDate: draft.startDate,
      endDate: draft.endDate,
      status: currentEvent.status ?? "INACTIVE",
    });

    const refreshed = await get("/api/coupon/list");
    return refreshed.map(mapCouponDto).find((item) => item.id === currentEvent.id) ?? null;
  }

  const formData = new FormData();
  formData.append("title", draft.title);
  formData.append("content", encodeEventContent(draft.content ?? currentEvent.content ?? "", draft.targetValue ?? currentEvent.targetValue));
  formData.append("startDate", draft.startDate);
  formData.append("endDate", draft.endDate);
  formData.append("status", currentEvent.status ?? "DRAFT");
  if (currentEvent.thumbnailUrl) {
    formData.append("thumbnailUrl", currentEvent.thumbnailUrl);
  }
  if (imageFile) {
    formData.append("file", imageFile);
  }

  await put(`/api/event/${currentEvent.entityNo}`, formData);
  const refreshed = await get(`/api/event/${currentEvent.entityNo}`);
  return mapEventDto(refreshed);
}

export async function getAdminInquiries() {
  const [inquiryResponse, commentResponse] = await Promise.all([
    get("/api/inquiry/list?page=1&size=100"),
    get("/api/comment/list?page=1&size=200").catch(() => ({ dtoList: [] })),
  ]);
  const comments = commentResponse.dtoList ?? [];
  return (inquiryResponse.dtoList ?? []).map((dto) =>
    mapInquiryDto(
      dto,
      comments.filter((comment) => Number(comment.inquiryNo) === Number(dto.inquiryNo)),
    ),
  );
}

export async function getAdminDashboardInquiries() {
  const inquiryResponse = await get("/api/inquiry/list?page=1&size=100");
  return (inquiryResponse.dtoList ?? []).map((dto) => mapInquiryDto(dto));
}

export async function updateAdminInquiryStatus(inquiryNo, nextStatus) {
  const response = await patch(`/api/admin/inquiries/${inquiryNo}/status`, {
    status: nextStatus,
  });
  return mapInquiryDto(response);
}

export async function replyAdminInquiry(inquiryNo, content) {
  const session = readAuthSession();
  if (!session?.userNo) {
    throw new Error("로그인 정보가 없습니다.");
  }
  const body = content?.trim();
  if (!body) {
    throw new Error("답변 내용을 입력해 주세요.");
  }

  await post("/api/comment", {
    inquiryNo: Number(inquiryNo),
    userNo: Number(session.userNo),
    content: body,
  });

  await patch(`/api/admin/inquiries/${inquiryNo}/status`, {
    status: "ANSWERED",
  });

  const rows = await getAdminInquiries();
  return rows.find((row) => Number(row.id) === Number(inquiryNo)) ?? null;
}

export async function getAdminReviews() {
  const rows = await get("/api/reviews/admin");
  return rows.map((review) => ({
    id: review.reviewNo,
    lodging: review.lodgingName ?? `숙소 ${review.lodgingNo}`,
    author: review.userName ?? `회원 ${review.userNo ?? "-"}`,
    score: Number(review.rating ?? 0).toFixed(1),
    status: review.status ?? "VISIBLE",
    report: "0건",
    summary: review.content ?? "",
  }));
}

export async function updateAdminReviewStatus(reviewNo, nextStatus) {
  const response = await patch(`/api/reviews/${reviewNo}/visibility`, {
    status: nextStatus,
  });
  return {
    id: response.reviewNo,
    lodging: response.lodgingName ?? `숙소 ${response.lodgingNo}`,
    author: response.userName ?? `회원 ${response.userNo ?? "-"}`,
    score: Number(response.rating ?? 0).toFixed(1),
    status: response.status ?? nextStatus,
    report: "0건",
    summary: response.content ?? "",
  };
}

export function getAdminAuditLogs() {
  return [];
}

export async function getSellerLodgings() {
  try {
    const lodgings = await get("/api/seller/lodgings");
    return lodgings.map(mapSellerLodgingDto);
  } catch (error) {
    if (!error.message?.includes("HTTP 404")) {
      throw error;
    }

    const host = await requireCurrentHostProfile();
    const lodgings = await get("/api/lodgings/list");
    const hostLodgings = lodgings.filter((item) => Number(item.hostNo) === Number(host.hostNo));
    const detailedLodgings = await Promise.all(
      hostLodgings.map(async (item) => {
        try {
          return await get(`/api/lodgings/${item.lodgingNo}/detail`);
        } catch {
          return item;
        }
      }),
    );
    return detailedLodgings.map(mapSellerLodgingDto);
  }
}

export async function getSellerDashboardLodgings() {
  try {
    const lodgings = await get("/api/seller/lodgings/summary");
    return lodgings.map(mapSellerLodgingSummaryDto);
  } catch (error) {
    if (!error.message?.includes("HTTP 404")) {
      throw error;
    }

    const lodgings = await getSellerLodgings();
    return lodgings.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      region: item.region,
      status: item.status,
      roomCount: item.roomCount,
      occupancy: item.occupancy,
      inquiryCount: item.inquiryCount,
    }));
  }
}

export async function getSellerSalesSummary() {
  const response = await get("/api/seller/sales-summary");
  return {
    totalSalesAmount: Number(response?.totalSalesAmount ?? 0),
    totalBookingCount: Number(response?.totalBookingCount ?? 0),
    canceledRatio: Number(response?.canceledRatio ?? 0),
    lodgingTypeRatios: (response?.lodgingTypeRatios ?? []).map((item) => ({
      lodgingType: item.lodgingType ?? "-",
      lodgingCount: Number(item.lodgingCount ?? 0),
    })),
    lodgingTypeSales: (response?.lodgingTypeSales ?? []).map((item) => ({
      lodgingType: item.lodgingType ?? "-",
      salesAmount: Number(item.salesAmount ?? 0),
      bookingCount: Number(item.bookingCount ?? 0),
    })),
    monthlySales: (response?.monthlySales ?? []).map((item) => ({
      monthLabel: item.monthLabel ?? "-",
      salesAmount: Number(item.salesAmount ?? 0),
    })),
    summaryCards: [
      { label: "총판매액", value: formatMoney(response?.totalSalesAmount ?? 0) },
      { label: "총예약수", value: `${Number(response?.totalBookingCount ?? 0)}건` },
      { label: "취소비율", value: formatPercent(response?.canceledRatio ?? 0) },
    ],
  };
}

export async function createSellerLodging(payload) {
  const formData = new FormData();
  formData.append("lodgingName", payload.name.trim());
  formData.append("lodgingType", payload.type);
  formData.append("region", payload.region.trim());
  formData.append("address", payload.address.trim());
  formData.append("detailAddress", payload.detailAddress.trim());
  formData.append("zipCode", payload.zipCode.trim());
  formData.append("latitude", String(Number(payload.latitude)));
  formData.append("longitude", String(Number(payload.longitude)));
  formData.append("description", payload.description.trim());
  formData.append("checkInTime", payload.checkInTime);
  formData.append("checkOutTime", payload.checkOutTime);
  formData.append("status", payload.status ?? "ACTIVE");
  (payload.files ?? []).forEach((file) => {
    formData.append("files", file);
  });

  const response = await post("/api/lodgings/", formData);
  invalidateLodgingsCache();
  return mapSellerLodgingDto(response);
}

export async function updateSellerLodgingStatus(lodgingId, nextStatus) {
  const formData = new FormData();
  formData.append("status", nextStatus);
  const response = await patch(`/api/lodgings/${lodgingId}`, formData);
  invalidateLodgingsCache();
  return mapSellerLodgingDto(response);
}

export async function updateSellerLodging(lodgingId, payload) {
  const formData = new FormData();
  formData.append("lodgingName", payload.name.trim());
  formData.append("lodgingType", payload.type);
  formData.append("region", payload.region.trim());
  formData.append("address", payload.address.trim());
  formData.append("detailAddress", payload.detailAddress.trim());
  formData.append("zipCode", payload.zipCode.trim());
  formData.append("latitude", String(Number(payload.latitude)));
  formData.append("longitude", String(Number(payload.longitude)));
  formData.append("description", payload.description.trim());
  formData.append("checkInTime", payload.checkInTime);
  formData.append("checkOutTime", payload.checkOutTime);
  formData.append("status", payload.status ?? "ACTIVE");
  (payload.uploadFileNames ?? []).forEach((fileName) => {
    formData.append("uploadFileNames", fileName);
  });
  (payload.files ?? []).forEach((file) => {
    formData.append("files", file);
  });

  const response = await patch(`/api/lodgings/${lodgingId}`, formData);
  invalidateLodgingsCache();
  return mapSellerLodgingDto(response);
}

export async function deleteSellerLodging(lodgingId) {
  await del(`/api/lodgings/${lodgingId}`);
  invalidateLodgingsCache();
}

export async function getSellerReservations() {
  const response = await get("/api/seller/bookings?page=1&size=100");
  return extractRows(response).map(mapReservationDto);
}

export async function updateSellerReservationStatus(bookingNo, nextStatus) {
  const response = await patch(`/api/seller/bookings/${bookingNo}/status`, {
    status: nextStatus,
  });
  return mapReservationDto(response);
}

export async function getSellerRooms() {
  const lodgings = await getSellerLodgings();
  return lodgings.flatMap((lodging) =>
    (lodging.rooms ?? []).map((room) => mapSellerRoomDto(room, lodging)),
  );
}

export async function updateSellerRoomStatus(roomId, nextStatus, lodgingName) {
  const response = await patch(`/api/rooms/${roomId}`, {
    status: nextStatus,
  });
  invalidateLodgingsCache();
  return mapSellerRoomDto(response, { name: lodgingName, id: response.lodgingNo ?? null });
}

export async function createSellerRoom(payload) {
  const response = await post("/api/rooms", {
    lodgingNo: Number(payload.lodgingId),
    roomName: payload.name.trim(),
    roomType: payload.type.trim(),
    roomDescription: payload.description.trim(),
    maxGuestCount: Number(payload.maxGuestCount),
    pricePerNight: Number(payload.pricePerNight),
    roomCount: Number(payload.roomCount),
    status: payload.status ?? "AVAILABLE",
  });
  invalidateLodgingsCache();
  return mapSellerRoomDto(response, { name: payload.lodgingName, id: Number(payload.lodgingId) });
}

export async function updateSellerRoom(roomId, payload) {
  const response = await patch(`/api/rooms/${roomId}`, {
    lodgingNo: Number(payload.lodgingId),
    roomName: payload.name.trim(),
    roomType: payload.type.trim(),
    roomDescription: payload.description.trim(),
    maxGuestCount: Number(payload.maxGuestCount),
    pricePerNight: Number(payload.pricePerNight),
    roomCount: Number(payload.roomCount),
    status: payload.status,
  });
  invalidateLodgingsCache();
  return mapSellerRoomDto(response, { name: payload.lodgingName, id: Number(payload.lodgingId) });
}

export async function deleteSellerRoom(roomId) {
  await del(`/api/rooms/${roomId}`);
  invalidateLodgingsCache();
  return { id: roomId };
}

export async function getSellerAssets() {
  const lodgings = await getSellerLodgings();
  return lodgings
    .filter((lodging) => lodging.status === "ACTIVE")
    .flatMap(mapSellerAssetRows);
}

export async function updateSellerAsset(assetId, patchData) {
  const currentAssets = await getSellerAssets();
  const target = currentAssets.find((item) => item.id === assetId);

  if (!target?.fileName) {
    throw new Error("조정할 이미지가 없습니다.");
  }
  if (target.isExternal) {
    throw new Error("외부 URL 이미지는 이 화면에서 직접 수정할 수 없습니다.");
  }

  const lodging = await get(`/api/lodgings/${target.lodgingId}`);
  const uploadFileNames = [...(lodging.uploadFileNames ?? [])];
  const currentIndex = uploadFileNames.indexOf(target.fileName);

  if (currentIndex < 0) {
    throw new Error("이미지 파일 정보를 찾을 수 없습니다.");
  }

  uploadFileNames.splice(currentIndex, 1);

  if (patchData.mode === "PRIMARY") {
    uploadFileNames.unshift(target.fileName);
  } else if (patchData.mode === "LAST") {
    uploadFileNames.push(target.fileName);
  } else {
    throw new Error("지원하지 않는 이미지 작업입니다.");
  }

  await patch(`/api/lodgings/${target.lodgingId}`, (() => {
    const formData = new FormData();
    uploadFileNames.forEach((fileName) => formData.append("uploadFileNames", fileName));
    return formData;
  })());
  invalidateLodgingsCache();

  const refreshedAssets = await getSellerAssets();
  return refreshedAssets.find((item) => item.fileName === target.fileName && item.lodgingId === target.lodgingId) ?? null;
}

export async function uploadSellerAsset(lodgingId, files) {
  if (!lodgingId) {
    throw new Error("이미지를 추가할 숙소를 선택해 주세요.");
  }

  const lodging = await get(`/api/lodgings/${lodgingId}`);
  const formData = new FormData();
  (lodging.uploadFileNames ?? []).forEach((fileName) => {
    formData.append("uploadFileNames", fileName);
  });
  Array.from(files ?? []).forEach((file) => {
    formData.append("files", file);
  });

  await patch(`/api/lodgings/${lodgingId}`, formData);
  invalidateLodgingsCache();
  return getSellerAssets();
}

export async function deleteSellerAsset(assetId) {
  const currentAssets = await getSellerAssets();
  const target = currentAssets.find((item) => item.id === assetId);

  if (!target?.fileName) {
    throw new Error("삭제할 이미지가 없습니다.");
  }
  if (target.isExternal) {
    throw new Error("외부 URL 이미지는 이 화면에서 직접 삭제할 수 없습니다.");
  }

  const lodging = await get(`/api/lodgings/${target.lodgingId}`);
  const uploadFileNames = (lodging.uploadFileNames ?? []).filter((fileName) => fileName !== target.fileName);
  const formData = new FormData();
  uploadFileNames.forEach((fileName) => {
    formData.append("uploadFileNames", fileName);
  });

  await patch(`/api/lodgings/${target.lodgingId}`, formData);
  invalidateLodgingsCache();
  return getSellerAssets();
}

export function getSellerApplicationTemplate() {
  return [
    { label: "현재 상태", value: "READY", display: "신청 전", tone: "sand" },
    { label: "서류 접수", value: "READY", display: "신청서 제출 가능", tone: "mint" },
    { label: "정산 계좌", value: "INFO", display: "승인 후 별도 관리", tone: "blue" },
  ];
}

export function getSellerApplicationSteps() {
  return [
    "사업자 정보 등록",
    "대표 숙소 기본 정보 입력",
    "운영 정책과 취소 규정 확인",
    "승인 결과는 판매자센터에서 확인",
  ];
}

export async function getSellerApplicationDraft() {
  const host = await getCurrentHostProfile();
  const submittedAtSource = host?.updDate ?? host?.regDate ?? null;
  const status = host?.enabled === "0" ? "SUSPENDED" : host?.approvalStatus ?? "READY";
  return {
    status,
    businessNo: host?.businessNumber ?? "",
    businessName: host?.businessName ?? "",
    owner: host?.ownerName ?? "",
    account: host?.account ?? "",
    submittedAt: submittedAtSource ? formatDateTimeLabel(submittedAtSource) : null,
  };
}

export async function submitSellerApplication(form) {
  const session = readAuthSession();
  if (!session?.userNo) {
    throw new Error("로그인 정보가 없습니다.");
  }

  const payload = {
    userNo: session.userNo,
    businessNumber: form.businessNo.trim(),
    businessName: form.businessName.trim(),
    ownerName: form.owner.trim(),
    account: form.account.trim(),
  };

  const host = await getCurrentHostProfile();

  if (!host) {
    await post("/api/hosts/register", payload);
  } else if (host.approvalStatus === "REJECTED") {
    await patch(`/api/hosts/${host.hostNo}`, payload);
  } else if (host.enabled === "0") {
    throw new Error("중지된 호스트 계정입니다. 관리자에게 문의해 주세요.");
  } else if (host.approvalStatus === "PENDING") {
    throw new Error("이미 승인 대기 중인 신청서가 있습니다.");
  } else if (host.approvalStatus === "APPROVED") {
    throw new Error("이미 승인된 호스트 계정입니다.");
  } else {
    throw new Error("현재 상태에서는 신청서를 다시 제출할 수 없습니다.");
  }

  return getSellerApplicationDraft();
}

export async function getSellerMetrics(prefetched = {}) {
  const lodgings = prefetched.lodgings ?? await getSellerDashboardLodgings();
  const reservations = prefetched.reservations ?? await getSellerReservations();
  const inquiries = prefetched.inquiries ?? await getSellerInquiryRooms();

  return [
    { label: "오늘 체크인", value: String(reservations.filter((item) => item.status === "CONFIRMED").length).padStart(2, "0") },
    { label: "답변 대기 문의", value: String(inquiries.filter((item) => item.status === "OPEN").length).padStart(2, "0") },
    { label: "운영 숙소", value: String(lodgings.filter((item) => item.status === "ACTIVE").length).padStart(2, "0") },
    { label: "가동 객실", value: String(lodgings.reduce((sum, item) => sum + Number(item.roomCount ?? 0), 0)).padStart(2, "0") },
  ];
}

export async function getAdminDashboardSnapshot() {
  const [users, sellers, adminInquiries] = await Promise.all([
    getAdminUsers().catch(() => []),
    getAdminSellers().catch(() => []),
    getAdminDashboardInquiries().catch(() => []),
  ]);

  return {
    adminTasks: [],
    adminInquiries,
    auditLogs: [],
    sellers,
    users,
  };
}

export async function getSellerDashboardSnapshot() {
  const lodgingsPromise = getSellerDashboardLodgings();
  const reservationsPromise = getSellerReservations();
  const inquiriesPromise = getSellerInquiryRooms().catch(() => []);
  const salesSummaryPromise = getSellerSalesSummary().catch(() => ({
    totalSalesAmount: 0,
    totalBookingCount: 0,
    canceledRatio: 0,
    lodgingTypeRatios: [],
    lodgingTypeSales: [],
    monthlySales: [],
    summaryCards: [
      { label: "총판매액", value: "-" },
      { label: "총예약수", value: "0건" },
      { label: "취소비율", value: "0%" },
    ],
  }));

  const [lodgings, reservations, inquiries, salesSummary] = await Promise.all([
    lodgingsPromise,
    reservationsPromise,
    inquiriesPromise,
    salesSummaryPromise,
  ]);
  const metrics = await getSellerMetrics({ lodgings, reservations, inquiries });

  return {
    sellerTasks: [],
    metrics,
    lodgings,
    reservations,
    inquiries,
    salesSummary,
  };
}
