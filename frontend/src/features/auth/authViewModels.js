import { authProviders } from "../../data/authData";
import { post } from "../../lib/appClient";
import { clearAuthSession, readAuthSession, writeAuthSession } from "./authSession";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID ?? "bccf0774846b742756b3ff66558e4269";
const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID ?? "PqkeWT1NEiTtIXw12Rc4";
const LOCAL_SOCIAL_ORIGIN = "http://localhost:5173";

function resolveAppOrigin() {
  if (import.meta.env.VITE_APP_ORIGIN) {
    return import.meta.env.VITE_APP_ORIGIN;
  }

  if (typeof window === "undefined") {
    return LOCAL_SOCIAL_ORIGIN;
  }

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_SOCIAL_ORIGIN;
  }

  return window.location.origin;
}

const APP_ORIGIN = resolveAppOrigin();
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI ?? `${APP_ORIGIN}/auth/kakao/callback`;
const NAVER_REDIRECT_URI = import.meta.env.VITE_NAVER_REDIRECT_URI ?? `${APP_ORIGIN}/auth/naver/callback`;

function getLandingPath(roleNames = []) {
  if (roleNames.includes("ROLE_ADMIN")) return "/admin";
  if (roleNames.includes("ROLE_HOST")) return "/seller";
  return "/";
}

export function getSelectedAuthProvider(providerKey) {
  return authProviders.find((provider) => provider.key === providerKey) ?? authProviders[0];
}

export function isGoogleLoginAvailable() {
  return Boolean(GOOGLE_CLIENT_ID);
}

export function createAuthSessionPayloadFromResponse(response, email, provider = "LOCAL") {
  const roleNames = response.roleNames ?? [];
  return {
    userNo: response.userNo,
    name: response.userName,
    email,
    loginId: response.loginId,
    provider,
    role: roleNames[0] ?? "ROLE_USER",
    roleNames,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    accessTokenExpiresIn: response.accessTokenExpiresIn,
    refreshTokenExpiresIn: response.refreshTokenExpiresIn,
    landingTo: getLandingPath(roleNames),
    reviewEligibleLodgingIds: [1, 2, 3],
  };
}

export function loginWithSessionPayload(payload) {
  writeAuthSession(payload);
  return payload.landingTo ?? "/";
}

export async function loginWithCredentials(form) {
  const response = await post("/api/auth/login", {
    loginId: form.email.trim(),
    password: form.password,
  });

  return createAuthSessionPayloadFromResponse(response, form.email.trim(), "LOCAL");
}

export async function signupWithCredentials(form) {
  await post("/api/auth/register", {
    loginId: form.email.trim(),
    password: form.password,
    userName: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
  });
}

export function getKakaoAuthUrl() {
  return `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(KAKAO_CLIENT_ID)}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code`;
}

export function getNaverAuthUrl() {
  const state = crypto.randomUUID();
  window.sessionStorage.setItem("tripzone-naver-state", state);
  return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${encodeURIComponent(NAVER_CLIENT_ID)}&redirect_uri=${encodeURIComponent(NAVER_REDIRECT_URI)}&state=${encodeURIComponent(state)}`;
}

export async function loginWithSocialCode(provider, code, state) {
  const endpoint = provider === "KAKAO" ? "/api/auth/kakao" : "/api/auth/naver";
  const payload =
    provider === "NAVER"
      ? { code, state }
      : { code, redirectUri: KAKAO_REDIRECT_URI };
  const response = await post(endpoint, payload);
  return createAuthSessionPayloadFromResponse(response, `${provider.toLowerCase()}@tripzone.social`, provider);
}

export async function loginWithGoogleIdToken(idToken) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("구글 로그인 설정이 아직 연결되지 않았습니다.");
  }
  const response = await post("/api/auth/google", { idToken });
  return createAuthSessionPayloadFromResponse(response, "google@tripzone.social", "GOOGLE");
}

export function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existing = document.querySelector('script[data-google-identity="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function logoutCurrentSession() {
  const session = readAuthSession();

  if (!session?.refreshToken) {
    clearAuthSession();
    return;
  }

  try {
    await post("/api/auth/logout", {
      refreshToken: session.refreshToken,
    });
  } finally {
    clearAuthSession();
  }
}

export function getMembershipLabel(session) {
  if (session?.role === "ROLE_ADMIN") return "관리자";
  if (session?.role === "ROLE_HOST") return "판매자";
  if (session?.provider === "KAKAO") return "Kakao";
  if (session?.provider === "NAVER") return "Naver";
  if (session?.provider === "GOOGLE") return "Google";
  return "Basic";
}

export function getHeaderRoleLinks(session) {
  if (session?.role === "ROLE_ADMIN") {
    return [
      { to: "/admin", label: "관리자 대시보드" },
      { to: "/admin/users", label: "회원 관리" },
      { to: "/admin/sellers", label: "판매자 관리" },
      { to: "/admin/events", label: "이벤트 · 쿠폰" },
      { to: "/admin/inquiries", label: "문의 모니터링" },
    ];
  }

  if (session?.role === "ROLE_HOST") {
    return [
      { to: "/seller", label: "판매자 대시보드" },
      { to: "/seller/lodgings", label: "숙소 관리" },
      { to: "/seller/rooms", label: "객실 관리" },
      { to: "/seller/reservations", label: "예약 관리" },
      { to: "/seller/inquiries", label: "문의 관리" },
    ];
  }

  return [
    { to: "/my", label: "마이페이지" },
    { to: "/my/bookings", label: "예약 내역" },
    { to: "/my/wishlist", label: "찜 목록" },
    { to: "/my/mileage", label: "마일리지" },
    { to: "/my/coupons", label: "쿠폰" },
    { to: "/my/profile", label: "내 정보 관리" },
    { to: "/my/seller-apply", label: "판매자 신청" },
    { to: "/my/payments", label: "결제 내역" },
    { to: "/my/inquiries", label: "문의센터" },
  ];
}

export function getAuthProviderMark(providerKey) {
  if (providerKey === "KAKAO") return "K";
  if (providerKey === "NAVER") return "N";
  return "G";
}
