import { del, get, patch, post } from "../lib/appClient";
import { readAuthSession } from "../features/auth/authSession";

let myCouponSnapshot = [];

// Current backend note:
// Booking/payment can adapt to current backend DTOs.
// Inquiry must keep design-doc target shape first:
// InquiryRoom + InquiryMessage, OPEN/ANSWERED/CLOSED/BLOCKED.

export async function getMyHome() {
  return get("/api/mypage/home");
}

export async function getMyProfileSummary() {
  const response = await get("/api/mypage/profile");
  return response.summary;
}

export async function getMyProfileDetails() {
  const response = await get("/api/mypage/profile");
  return response.details ?? [];
}

export async function changeMyPassword(nextPassword, confirmPassword) {
  await patch("/api/auth/password", {
    newPassword: nextPassword,
    newPasswordConfirm: confirmPassword,
  });

  return { ok: true };
}

export async function withdrawMyAccount() {
  const session = readAuthSession();
  if (!session?.userNo) {
    throw new Error("로그인 정보가 없습니다.");
  }

  await patch(`/api/users/${session.userNo}/delete`);
  return { ok: true };
}

export async function getMyBookings() {
  const response = await get("/api/mypage/bookings");
  return response.items ?? [];
}

export async function getMyBookingById(bookingId) {
  const rows = await getMyBookings();
  return rows.find((item) =>
    String(item.bookingId) === String(bookingId) ||
    String(item.bookingNo) === String(bookingId)
  ) ?? null;
}

export async function getMyPayments() {
  const response = await get("/api/mypage/payments");
  return response.items ?? [];
}

export async function getMyPaymentByBookingId(bookingId) {
  const rows = await getMyPayments();
  return rows.find((item) =>
    String(item.bookingId) === String(bookingId) ||
    String(item.bookingNo) === String(bookingId)
  ) ?? null;
}

function resolveCouponTarget(name = "") {
  if (name.includes("제주")) return "제주 숙소";
  if (name.includes("서울")) return "서울 숙소";
  if (name.includes("국내")) return "국내 숙소";
  if (name.includes("첫구매")) return "첫 예약 숙소";
  return "전 숙소";
}

function toCouponStatusLabel(status) {
  if (status === "ACTIVE") return "사용 가능";
  if (status === "USED") return "사용 완료";
  return "만료 예정";
}

function formatDateValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatExpiryLabel(value, status) {
  if (status === "USED") return "사용 완료";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} 만료`;
}

function mapUserCouponDto(dto) {
  const coupon = dto.couponDTO ?? {};
  const couponStatus = toCouponStatusLabel(dto.status);
  const target = resolveCouponTarget(coupon.couponName);

  return {
    id: dto.userCouponNo ?? dto.couponNo,
    userCouponId: dto.userCouponNo,
    couponName: coupon.couponName,
    name: coupon.couponName,
    couponType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountLabel: coupon.discountType === "RATE" ? `${coupon.discountValue}%` : `${Number(coupon.discountValue ?? 0).toLocaleString()}원`,
    status: couponStatus,
    statusLabel: couponStatus,
    expire: formatExpiryLabel(coupon.endDate, dto.status),
    expiredAt: coupon.endDate,
    target,
    appliesTo: target,
    isUsable: dto.status === "ACTIVE",
    issuedAt: formatDateValue(dto.issuedAt),
  };
}

function mapCouponCatalogDto(dto) {
  const target = resolveCouponTarget(dto.couponName);

  return {
    couponNo: dto.couponNo,
    couponName: dto.couponName,
    name: dto.couponName,
    couponType: dto.discountType,
    discountValue: dto.discountValue,
    discountLabel: dto.discountType === "RATE" ? `${dto.discountValue}%` : `${Number(dto.discountValue ?? 0).toLocaleString()}원`,
    status: toCouponStatusLabel(dto.status),
    statusLabel: toCouponStatusLabel(dto.status),
    expire: formatExpiryLabel(dto.endDate, dto.status),
    expiredAt: dto.endDate,
    target,
    appliesTo: target,
    isUsable: dto.status === "ACTIVE",
    issuedAt: formatDateValue(dto.regDate),
  };
}

export async function fetchCouponCatalog() {
  const rows = await get("/api/coupon/list");
  return rows.map(mapCouponCatalogDto);
}

export async function fetchMyCoupons() {
  const response = await get("/api/usercoupon/list?page=1&size=100");
  const rows = (response.dtoList ?? []).map(mapUserCouponDto);
  myCouponSnapshot = rows;
  return rows;
}

export function getMyCoupons() {
  return myCouponSnapshot;
}

export async function claimMyCoupon(coupon) {
  await post("/api/usercoupon", {
    couponNo: coupon.couponNo ?? coupon.id,
    issuedAt: new Date().toISOString(),
  });

  return { ok: true, rows: await fetchMyCoupons() };
}

export async function getMyMileage() {
  return get("/api/mypage/mileage");
}

export async function getMyWishlist() {
  const response = await get("/api/mypage/wishlist");
  return response.items ?? [];
}

export async function toggleMyWishlist(lodgingId) {
  await post("/api/wishList", {
    lodgingNo: Number(lodgingId),
  });

  const items = await getMyWishlist();
  return {
    items,
    wished: items.some((item) => Number(item.lodgingId) === Number(lodgingId)),
  };
}

export function getMyInquiryThreads() {
  return get("/api/mypage/inquiries").then((response) =>
    (response.items ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      bookingNo: item.bookingNo ?? "-",
      lodging: item.lodging ?? "운영 문의",
      updatedAt: item.updatedAt || "방금 전",
      body: item.preview ?? "",
    })),
  );
}

export function getMyInquiryThreadById(threadId) {
  return get(`/api/mypage/inquiries/${threadId}`).then((thread) => ({
    id: thread.id,
    title: thread.title,
    type: thread.type,
    status: thread.status,
    bookingNo: thread.bookingNo ?? "-",
    lodging: thread.lodging ?? "운영 문의",
    updatedAt: thread.updatedAt || "방금 전",
    body: thread.body ?? "",
    messages: thread.messages ?? [],
  }));
}

export function createInquiryThread(payload) {
  const session = readAuthSession();
  return post("/api/inquiry", {
    userNo: session?.userNo,
    title: payload.title,
    inquiryType: payload.type,
    content: payload.body,
    bookingNo: payload.bookingNo?.trim() || null,
    lodging: payload.lodging?.trim() || null,
  });
}

export function updateInquiryThread(threadId, payload) {
  return patch(`/api/inquiry/${threadId}`, {
    title: payload.title,
    inquiryType: payload.type,
    content: payload.body,
    bookingNo: payload.bookingNo?.trim() || null,
    lodging: payload.lodging?.trim() || null,
  });
}

export function removeInquiryThread(threadId) {
  return del(`/api/inquiry/${threadId}`);
}
