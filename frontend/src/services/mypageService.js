import { del, get, patch, post } from "../lib/appClient";
import { readAuthSession } from "../features/auth/authSession";

function isPercentDiscountType(value) {
  return value === "PERCENT" || value === "RATE" || String(value ?? "").toLowerCase() === "percent";
}
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
  if (myHomeMemoryCache) {
    return myHomeMemoryCache;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(MY_HOME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    myHomeMemoryCache = parsed;
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
    // ?¸ì…˜ ?€???¤íŒ¨??ë©”ëª¨ë¦?ìºì‹œë¡??€ì²´í•œ??
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
    // ?¸ì…˜ ?€?¥ì†Œ ?‘ê·¼ ?¤íŒ¨??ë¬´ì‹œ?œë‹¤.
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
  myHomeMemoryCache = response;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(MY_HOME_CACHE_KEY, JSON.stringify(response));
  } catch {
    // ?¸ì…˜ ?€???¤íŒ¨ ??ë©”ëª¨ë¦?ìºì‹œë§??¬ìš©?œë‹¤.
  }
}

export function invalidateMyHomeCache() {
  myHomeMemoryCache = null;
  myHomeRequestPromise = null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(MY_HOME_CACHE_KEY);
  } catch {
    // ?¸ì…˜ ?€?¥ì†Œ ?‘ê·¼ ?¤íŒ¨??ë¬´ì‹œ?œë‹¤.
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
    throw new Error("ë¡œê·¸???•ë³´ê°€ ?†ìŠµ?ˆë‹¤.");
  }

  await patch(`/api/users/${session.userNo}/delete`);
  invalidateMyPageCaches();
  return { ok: true };
}

export async function getMyBookings() {
  const response = await fetchCachedResource(RESOURCE_KEYS.bookings, () => get("/api/mypage/bookings"));
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
  const response = await fetchCachedResource(RESOURCE_KEYS.payments, () => get("/api/mypage/payments"));
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
  if (name.includes("Á¦ÁÖ")) return "Á¦ÁÖ ¼÷¼Ò";
  if (name.includes("µµ½É")) return "µµ½É ¼÷¼Ò";
  if (name.includes("±¹³»")) return "±¹³» ¼÷¼Ò";
  if (name.includes("Ã¹±¸¸Å")) return "Ã¹ ¿¹¾à ¼÷¼Ò";
  return "ÀüÃ¼ ¼÷¼Ò";
}

function toCouponStatusLabel(status) {
  if (status === "ACTIVE") return "»ç¿ë °¡´É";
  if (status === "USED") return "»ç¿ë ¿Ï·á";
  return "¸¸·á ¿¹Á¤";
}

function formatDateValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatExpiryLabel(value, status) {
  if (status === "USED") return "»ç¿ë ¿Ï·á";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ¸¸·á`;
}

function mapUserCouponDto(dto) {
  const coupon = dto.couponDTO ?? {};
  const couponStatus = dto.status ?? "EXPIRING";
  const target = resolveCouponTarget(coupon.couponName);

  return {
    id: dto.userCouponNo ?? dto.couponNo,
    userCouponId: dto.userCouponNo,
    couponName: coupon.couponName,
    name: coupon.couponName,
    couponType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountLabel: isPercentDiscountType(coupon.discountType) ? `${coupon.discountValue}%` : `${Number(coupon.discountValue ?? 0).toLocaleString()}¿ø`,
    status: couponStatus,
    statusLabel: toCouponStatusLabel(couponStatus),
    expire: formatExpiryLabel(coupon.endDate, dto.status),
    expiredAt: coupon.endDate,
    target,
    appliesTo: target,
    isUsable: couponStatus === "ACTIVE",
    issuedAt: formatDateValue(dto.issuedAt),
  };
}

function normalizeCouponStatus(item) {
  if (item?.usable === true || item?.isUsable === true) {
    return "ACTIVE";
  }

  const raw = `${item?.status ?? ""} ${item?.statusLabel ?? ""}`.toUpperCase();
  if (raw.includes("USED") || raw.includes("¿Ï·á")) {
    return "USED";
  }
  if (raw.includes("ACTIVE") || raw.includes("°¡´É")) {
    return "ACTIVE";
  }
  return "EXPIRING";
}

function toCouponStatusDisplay(status) {
  if (status === "ACTIVE") return "»ç¿ë °¡´É";
  if (status === "USED") return "»ç¿ë ¿Ï·á";
  return "¸¸·á ¿¹Á¤";
}

function mapMyCouponItem(item) {
  const normalizedStatus = normalizeCouponStatus(item);
  return {
    id: item.id ?? item.userCouponId,
    userCouponId: item.userCouponId ?? item.id,
    couponName: item.couponName ?? item.name,
    name: item.name ?? item.couponName,
    couponType: item.couponType,
    discountValue: item.discountValue,
    discountLabel:
      item.discountLabel ??
      (isPercentDiscountType(item.couponType)
        ? `${item.discountValue}%`
        : `${Number(item.discountValue ?? 0).toLocaleString()}¿ø`),
    status: normalizedStatus,
    statusLabel: toCouponStatusDisplay(normalizedStatus),
    expire: item.expire ?? "",
    expiredAt: item.expiredAt ?? null,
    target: item.target ?? item.appliesTo ?? resolveCouponTarget(item.couponName ?? item.name),
    appliesTo: item.appliesTo ?? item.target ?? resolveCouponTarget(item.couponName ?? item.name),
    isUsable: normalizedStatus === "ACTIVE",
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
    discountLabel: isPercentDiscountType(dto.discountType) ? `${dto.discountValue}%` : `${Number(dto.discountValue ?? 0).toLocaleString()}¿ø`, 
    status: dto.status ?? "EXPIRING",
    statusLabel: toCouponStatusLabel(dto.status),
    expire: formatExpiryLabel(dto.endDate, dto.status),
    expiredAt: dto.endDate,
    target,
    appliesTo: target,
    isUsable: (dto.status ?? "EXPIRING") === "ACTIVE",
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
      lodging: item.lodging ?? "¿î¿µ ¹®ÀÇ",
      updatedAt: item.updatedAt || "¹æ±Ý Àü",
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
    lodging: thread.lodging ?? "¿î¿µ ¹®ÀÇ",
    updatedAt: thread.updatedAt || "¹æ±Ý Àü",
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














