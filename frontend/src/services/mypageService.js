import { del, get, patch, post } from "../lib/appClient";
import { readAuthSession } from "../features/auth/authSession";

let myCouponSnapshot = [];
let myHomeMemoryCache = null;
let myHomeRequestPromise = null;
const MY_HOME_CACHE_KEY = "tripzone-my-home";
const resourceMemoryCache = new Map();
const resourceRequestCache = new Map();
const RESOURCE_KEYS = {
  profile: "tripzone-my-profile",
  bookings: "tripzone-my-bookings",
  payments: "tripzone-my-payments",
  coupons: "tripzone-my-coupons",
  mileage: "tripzone-my-mileage",
  wishlist: "tripzone-my-wishlist",
};

// Current backend note:
// Booking/payment can adapt to current backend DTOs.
// Inquiry must keep design-doc target shape first:
// InquiryRoom + InquiryMessage, OPEN/ANSWERED/CLOSED/BLOCKED.

function readMyHomeCache() {
  const scopedKey = getScopedCacheKey(MY_HOME_CACHE_KEY);
  if (myHomeMemoryCache?.key === scopedKey) {
    return myHomeMemoryCache.value;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(scopedKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    myHomeMemoryCache = { key: scopedKey, value: parsed };
    return parsed;
  } catch {
    return null;
  }
}

function getScopedCacheKey(baseKey) {
  const session = readAuthSession();
  return `${baseKey}:${session?.userNo ?? "guest"}`;
}

function readCachedResource(baseKey) {
  const scopedKey = getScopedCacheKey(baseKey);
  if (resourceMemoryCache.has(scopedKey)) {
    return resourceMemoryCache.get(scopedKey);
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(scopedKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    resourceMemoryCache.set(scopedKey, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedResource(baseKey, value) {
  const scopedKey = getScopedCacheKey(baseKey);
  resourceMemoryCache.set(scopedKey, value);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(scopedKey, JSON.stringify(value));
  } catch {
    // 세션 저장 실패는 메모리 캐시로 대체한다.
  }
}

function invalidateCachedResource(baseKey) {
  const scopedKey = getScopedCacheKey(baseKey);
  resourceMemoryCache.delete(scopedKey);
  resourceRequestCache.delete(scopedKey);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(scopedKey);
  } catch {
    // 세션 저장소 접근 실패는 무시한다.
  }
}

async function fetchCachedResource(baseKey, fetcher, options = {}) {
  const cached = readCachedResource(baseKey);
  if (cached !== null && !options.force) {
    return cached;
  }

  const scopedKey = getScopedCacheKey(baseKey);
  if (!resourceRequestCache.has(scopedKey)) {
    resourceRequestCache.set(
      scopedKey,
      fetcher()
        .then((response) => {
          writeCachedResource(baseKey, response);
          return response;
        })
        .finally(() => {
          resourceRequestCache.delete(scopedKey);
        }),
    );
  }

  return resourceRequestCache.get(scopedKey);
}

function writeMyHomeCache(response) {
  const scopedKey = getScopedCacheKey(MY_HOME_CACHE_KEY);
  myHomeMemoryCache = { key: scopedKey, value: response };

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(scopedKey, JSON.stringify(response));
  } catch {
    // 세션 저장 실패 시 메모리 캐시만 사용한다.
  }
}

export function invalidateMyHomeCache() {
  myHomeMemoryCache = null;
  myHomeRequestPromise = null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(getScopedCacheKey(MY_HOME_CACHE_KEY));
  } catch {
    // 세션 저장소 접근 실패는 무시한다.
  }
}

export function invalidateMyPageCaches() {
  invalidateMyHomeCache();
  Object.values(RESOURCE_KEYS).forEach(invalidateCachedResource);
  myCouponSnapshot = [];
}

export function getCachedMyHomeSnapshot() {
  return readMyHomeCache();
}

export async function getMyHome(options = {}) {
  const cached = readMyHomeCache();
  if (cached && !options.force) {
    return cached;
  }

  if (!myHomeRequestPromise) {
    myHomeRequestPromise = get("/api/mypage/home")
      .then((response) => {
        writeMyHomeCache(response);
        return response;
      })
      .finally(() => {
        myHomeRequestPromise = null;
      });
  }

  return myHomeRequestPromise;
}

export async function getMyProfileSummary() {
  const response = await fetchCachedResource(RESOURCE_KEYS.profile, () => get("/api/mypage/profile"));
  return response.summary;
}

export async function getMyProfileDetails() {
  const response = await fetchCachedResource(RESOURCE_KEYS.profile, () => get("/api/mypage/profile"));
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
  invalidateMyPageCaches();
  return { ok: true };
}

export async function getMyBookings(options = {}) {
  const response = await fetchCachedResource(RESOURCE_KEYS.bookings, () => get("/api/mypage/bookings"), options);
  return response.items ?? [];
}

function normalizeBookingKey(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.replace(/^B-/, "");
}

export async function getMyBookingById(bookingId, options = {}) {
  const rows = await getMyBookings(options);
  return rows.find((item) =>
    normalizeBookingKey(item.bookingId) === normalizeBookingKey(bookingId) ||
    normalizeBookingKey(item.bookingNo) === normalizeBookingKey(bookingId)
  ) ?? null;
}

export async function cancelMyBooking(bookingId) {
  await del(`/api/booking/${normalizeBookingKey(bookingId)}`);
  invalidateMyPageCaches();
  return { ok: true };
}

export async function getMyPayments(options = {}) {
  const response = await fetchCachedResource(RESOURCE_KEYS.payments, () => get("/api/mypage/payments"), options);
  return response.items ?? [];
}

export async function getMyPaymentByBookingId(bookingId, options = {}) {
  const rows = await getMyPayments(options);
  return rows.find((item) =>
    normalizeBookingKey(item.bookingId) === normalizeBookingKey(bookingId) ||
    normalizeBookingKey(item.bookingNo) === normalizeBookingKey(bookingId)
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

function mapMyCouponItem(item) {
  return {
    id: item.id ?? item.userCouponId,
    userCouponId: item.userCouponId ?? item.id,
    couponName: item.couponName ?? item.name,
    name: item.name ?? item.couponName,
    couponType: item.couponType,
    discountValue: item.discountValue,
    discountLabel:
      item.discountLabel ??
      (item.couponType === "RATE"
        ? `${item.discountValue}%`
        : `${Number(item.discountValue ?? 0).toLocaleString()}원`),
    status: item.status ?? item.statusLabel,
    statusLabel: item.statusLabel ?? item.status,
    expire: item.expire ?? "",
    expiredAt: item.expiredAt ?? null,
    target: item.target ?? item.appliesTo ?? resolveCouponTarget(item.couponName ?? item.name),
    appliesTo: item.appliesTo ?? item.target ?? resolveCouponTarget(item.couponName ?? item.name),
    isUsable: item.usable ?? item.status === "사용 가능",
    issuedAt: item.issuedAt ?? "",
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
  const response = await fetchCachedResource(RESOURCE_KEYS.coupons, () => get("/api/mypage/coupons"));
  const rows = (response.items ?? []).map(mapMyCouponItem);
  myCouponSnapshot = rows;
  return rows;
}

export async function deleteMyCoupon(userCouponId) {
  await del(`/api/usercoupon/${userCouponId}`);
  invalidateMyHomeCache();
  invalidateCachedResource(RESOURCE_KEYS.coupons);
  return fetchMyCoupons();
}

export function getMyCoupons() {
  return myCouponSnapshot;
}

export async function claimMyCoupon(coupon) {
  await post("/api/usercoupon", {
    couponNo: coupon.couponNo ?? coupon.id,
    issuedAt: new Date().toISOString(),
  });

  invalidateMyHomeCache();
  invalidateCachedResource(RESOURCE_KEYS.coupons);
  return { ok: true, rows: await fetchMyCoupons() };
}

export async function getMyMileage() {
  return fetchCachedResource(RESOURCE_KEYS.mileage, () => get("/api/mypage/mileage"));
}

export async function getMyWishlist() {
  const response = await fetchCachedResource(RESOURCE_KEYS.wishlist, () => get("/api/mypage/wishlist"));
  return response.items ?? [];
}

export async function toggleMyWishlist(lodgingId) {
  await post("/api/wishList", {
    lodgingNo: Number(lodgingId),
  });

  invalidateMyHomeCache();
  invalidateCachedResource(RESOURCE_KEYS.wishlist);
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
