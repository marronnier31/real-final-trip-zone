import { get, isMockDataSource, post } from "../lib/appClient";
import { readCollection, writeCollection } from "../lib/mockDb";
import {
  couponRows,
  myBookingRows,
  myProfileDetails,
  myProfileSummary,
  paymentHistoryRows,
  wishlistRows,
} from "../data/mypageData";
import {
  createMyInquiryThread,
  deleteMyInquiryThread,
  findMyInquiryThread,
  readMyInquiryThreads,
  updateMyInquiryThread,
} from "../utils/myInquiryCenter";

// Current backend note:
// Booking/payment can adapt to current backend DTOs.
// Inquiry must keep design-doc target shape first:
// InquiryRoom + InquiryMessage, OPEN/ANSWERED/CLOSED/BLOCKED.

const COLLECTION_KEYS = {
  myCoupons: "tripzone-my-coupons",
};

function buildMockHomeResponse() {
  return {
    profileSummary: myProfileSummary,
    overview: {
      upcomingBookingCount: myBookingRows.filter((item) => item.status !== "COMPLETED").length,
      wishlistCount: wishlistRows.length,
      availableCouponCount: couponRows.filter((item) => item.status === "사용 가능").length,
      paidCount: paymentHistoryRows.filter((item) => item.status === "PAID").length,
    },
    menus: [],
  };
}

function buildMockProfileResponse() {
  return {
    summary: myProfileSummary,
    details: myProfileDetails,
  };
}

function buildMockMileageResponse() {
  return {
    summary: {
      balance: 18400,
      earnedThisMonth: 2100,
      usedThisMonth: 8000,
    },
    items: mileageHistoryRows,
  };
}

function buildMockWishlistResponse() {
  return {
    items: wishlistRows,
  };
}

export async function getMyHome() {
  if (isMockDataSource()) {
    return buildMockHomeResponse();
  }

  return get("/api/mypage/home");
}

export async function getMyProfileSummary() {
  if (isMockDataSource()) {
    return myProfileSummary;
  }

  const response = await get("/api/mypage/profile");
  return response.summary;
}

export async function getMyProfileDetails() {
  if (isMockDataSource()) {
    return myProfileDetails;
  }

  const response = await get("/api/mypage/profile");
  return response.details ?? [];
}

export async function getMyBookings() {
  if (isMockDataSource()) {
    return myBookingRows;
  }

  const response = await get("/api/mypage/bookings");
  return response.items ?? [];
}

export async function getMyBookingById(bookingId) {
  const rows = await getMyBookings();
  return rows.find((item) => String(item.bookingId) === String(bookingId)) ?? null;
}

export async function getMyPayments() {
  if (isMockDataSource()) {
    return paymentHistoryRows;
  }

  const response = await get("/api/mypage/payments");
  return response.items ?? [];
}

export async function getMyPaymentByBookingId(bookingId) {
  const rows = await getMyPayments();
  return rows.find((item) => String(item.bookingId) === String(bookingId)) ?? null;
}

export function getMyCoupons() {
  return readCollection(COLLECTION_KEYS.myCoupons, couponRows);
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
  if (isMockDataSource()) {
    return couponRows;
  }

  const rows = await get("/api/coupon/list");
  return rows.map(mapCouponCatalogDto);
}

export async function fetchMyCoupons() {
  if (isMockDataSource()) {
    return getMyCoupons();
  }

  const response = await get("/api/usercoupon/list?page=1&size=100");
  return (response.dtoList ?? []).map(mapUserCouponDto);
}

export async function claimMyCoupon(coupon) {
  if (isMockDataSource()) {
    const rows = getMyCoupons();
    const exists = rows.some((item) => item.id === coupon.id || item.couponName === coupon.couponName);
    if (exists) return { ok: false, reason: "duplicate", rows };

    const nextRows = [{ ...coupon }, ...rows];
    writeCollection(COLLECTION_KEYS.myCoupons, nextRows);
    return { ok: true, rows: nextRows };
  }

  await post("/api/usercoupon", {
    couponNo: coupon.couponNo ?? coupon.id,
    issuedAt: new Date().toISOString(),
  });

  return { ok: true, rows: await fetchMyCoupons() };
}

export function claimMyCouponLegacy(coupon) {
  const rows = getMyCoupons();
  const exists = rows.some((item) => item.id === coupon.id || item.couponName === coupon.couponName);
  if (exists) return { ok: false, reason: "duplicate", rows };

  const nextRows = [{ ...coupon }, ...rows];
  writeCollection(COLLECTION_KEYS.myCoupons, nextRows);
  return { ok: true, rows: nextRows };
}

export async function getMyMileage() {
  if (isMockDataSource()) {
    return buildMockMileageResponse();
  }

  return get("/api/mypage/mileage");
}

export async function getMyWishlist() {
  if (isMockDataSource()) {
    return buildMockWishlistResponse().items;
  }

  const response = await get("/api/mypage/wishlist");
  return response.items ?? [];
}

export function getMyInquiryThreads() {
  return readMyInquiryThreads();
}

export function getMyInquiryThreadById(threadId) {
  return findMyInquiryThread(threadId);
}

export function createInquiryThread(payload) {
  return createMyInquiryThread(payload);
}

export function updateInquiryThread(threadId, payload) {
  return updateMyInquiryThread(threadId, payload);
}

export function removeInquiryThread(threadId) {
  return deleteMyInquiryThread(threadId);
}
