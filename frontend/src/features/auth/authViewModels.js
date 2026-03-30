import { authProviders, demoLoginAccounts } from "../../data/authData";
import { post } from "../../lib/appClient";
import { clearAuthSession, readAuthSession, writeAuthSession } from "./authSession";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID ?? "";
const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID ?? "";
const APP_ORIGIN = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

export function getSelectedAuthProvider(providerKey) {
  return authProviders.find((provider) => provider.key === providerKey) ?? authProviders[0];
}

export function findDemoLoginAccount(email, password) {
  return demoLoginAccounts.find((account) => account.email === email.trim() && account.password === password);
}

function getLandingPath(roleNames = []) {
  if (roleNames.includes("ROLE_ADMIN")) return "/admin";
  if (roleNames.includes("ROLE_HOST")) return "/seller";
  return "/";
}

export function createAuthSessionPayload({ name, email, provider, role, landingTo }) {
  return {
    name,
    email,
    provider,
    role,
    landingTo,
    reviewEligibleLodgingIds: [1, 2, 3],
  };
}

export function createAuthSessionPayloadFromResponse(response, fallbackEmail, provider = "LOCAL") {
  const roleNames = response.roleNames ?? [];

  return {
    userNo: response.userNo,
    name: response.userName,
    email: fallbackEmail,
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
  return post("/api/auth/register", {
    loginId: form.email.trim(),
    password: form.password,
    userName: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
  });
}

export function createSocialSession(provider) {
  return createAuthSessionPayload({
    name: `${provider.label} 회원`,
    email: `${provider.key.toLowerCase()}@tripzone.social`,
    provider: provider.key,
    role: "ROLE_USER",
    landingTo: "/",
  });
}

export function getKakaoAuthUrl() {
  if (!KAKAO_CLIENT_ID) {
    throw new Error("Kakao client id is not configured.");
  }

  const redirectUri = `${APP_ORIGIN}/auth/kakao/callback`;
  return `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(KAKAO_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
}

export function getNaverAuthUrl() {
  if (!NAVER_CLIENT_ID) {
    throw new Error("Naver client id is not configured.");
  }

  const redirectUri = `${APP_ORIGIN}/auth/naver/callback`;
  const state = crypto.randomUUID();
  window.sessionStorage.setItem("tripzone-naver-state", state);
  return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${encodeURIComponent(NAVER_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
}

export async function loginWithSocialCode(provider, code, state) {
  const endpoint = provider === "KAKAO" ? "/api/auth/kakao" : "/api/auth/naver";
  const payload = provider === "NAVER" ? { code, state } : { code };
  const response = await post(endpoint, payload);
  return createAuthSessionPayloadFromResponse(response, `${provider.toLowerCase()}@tripzone.social`, provider);
}

export async function loginWithGoogleIdToken(idToken) {
  const response = await post("/api/auth/google", { idToken });
  return createAuthSessionPayloadFromResponse(response, "google@tripzone.social", "GOOGLE");
}

export function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error("Google client id is not configured."));
      return;
    }

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
    script.onerror = () => reject(new Error("Google login script could not be loaded."));
    document.head.appendChild(script);
  });
}

export async function loginWithGooglePopup() {
  const google = await loadGoogleScript();

  return new Promise((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const session = await loginWithGoogleIdToken(response.credential);
          resolve(session);
        } catch (error) {
          reject(error);
        }
      },
    });

    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        reject(new Error("Google login could not be started."));
      }
    });
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

export function createDefaultLocalSession(form) {
  return createAuthSessionPayload({
    name: form.email.split("@")[0] || "tripzone",
    email: form.email,
    provider: form.provider,
    role: "ROLE_USER",
    landingTo: "/",
  });
}

export function createDemoAccountSession(account, providerKey) {
  return createAuthSessionPayload({
    name: account.name,
    email: account.email,
    provider: providerKey,
    role: account.role,
    landingTo: account.landingTo,
  });
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
      { to: "/admin/audit-logs", label: "운영 로그" },
    ];
  }

  if (session?.role === "ROLE_HOST") {
    return [
      { to: "/seller", label: "판매자 대시보드" },
      { to: "/seller/lodgings", label: "숙소 관리" },
      { to: "/seller/rooms", label: "객실 관리" },
      { to: "/seller/reservations", label: "예약 관리" },
      { to: "/seller/inquiries", label: "문의 관리" },
      { to: "/seller/apply", label: "호스트 신청" },
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
