import { clearAuthSession, readAuthSession, writeAuthSession } from "../features/auth/authSession";

function resolveDefaultApiBaseUrl() {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8080";
    }
  }

  return "http://100.96.110.114:8080";
}

function resolveApiBaseUrl() {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8080";
    }
  }

  return import.meta.env.VITE_API_BASE_URL ?? resolveDefaultApiBaseUrl();
}

const API_BASE_URL = resolveApiBaseUrl();
const APP_DATA_SOURCE = "http";
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 10 * 1000;
let refreshRequestPromise = null;

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getAppDataSource() {
  return APP_DATA_SOURCE;
}

export function toUserFacingErrorMessage(error, fallback = "요청을 처리하지 못했습니다.") {
  const rawMessage = String(error?.message ?? "").trim();
  const normalized = rawMessage.toLowerCase();

  if (!rawMessage) {
    return fallback;
  }

  if (
    normalized.includes("403") ||
    normalized.includes("401") ||
    normalized.includes("forbidden") ||
    normalized.includes("unauthorized")
  ) {
    return "권한이 없거나 세션이 만료됐습니다. 다시 로그인해 주세요.";
  }

  if (
    normalized.includes("500") ||
    normalized.includes("502") ||
    normalized.includes("503") ||
    normalized.includes("504") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("network request failed") ||
    normalized.includes("timeout") ||
    normalized.includes("connection")
  ) {
    return "서버 연결이 일시적으로 원활하지 않습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (normalized.startsWith("http ")) {
    return fallback;
  }

  return rawMessage;
}

export function isMockDataSource() {
  return APP_DATA_SOURCE === "mock";
}

export function assertMockDataSource() {
  if (!isMockDataSource()) {
    throw new Error("Mock data source is not configured.");
  }
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getAuthHeaders(headers = {}) {
  const session = readAuthSession();
  const accessToken = session?.accessToken;

  return accessToken
    ? {
        ...headers,
        Authorization: `Bearer ${accessToken}`,
      }
    : headers;
}

function decodeBase64Url(value) {
  if (typeof window === "undefined" || typeof window.atob !== "function") {
    return null;
  }

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return window.atob(padded);
  } catch {
    return null;
  }
}

function getJwtExpiresAt(token) {
  if (typeof token !== "string") {
    return null;
  }

  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  const decoded = decodeBase64Url(payload);
  if (!decoded) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoded);
    const exp = Number(parsed.exp);
    if (!Number.isFinite(exp) || exp <= 0) {
      return null;
    }
    return exp * 1000;
  } catch {
    return null;
  }
}

function shouldRefreshAccessToken(session) {
  const expiresAt = getJwtExpiresAt(session?.accessToken);
  if (!expiresAt) {
    return false;
  }

  return expiresAt - Date.now() <= ACCESS_TOKEN_REFRESH_BUFFER_MS;
}

async function parseResponseError(response) {
  let errorMessage = `HTTP ${response.status}`;

  try {
    const payload = await response.json();
    errorMessage = payload.msg || payload.message || errorMessage;
  } catch {
    // JSON이 아니면 기본 메시지를 유지한다.
  }

  return new Error(errorMessage);
}

async function requestAccessTokenRefresh() {
  if (refreshRequestPromise) {
    return refreshRequestPromise;
  }

  refreshRequestPromise = (async () => {
  const session = readAuthSession();
  if (!session?.refreshToken) {
    clearAuthSession();
    return null;
  }

  const response = await fetch(buildUrl("/api/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: session.refreshToken,
    }),
  });

  if (!response.ok) {
    clearAuthSession();
    return null;
  }

  const payload = await response.json();
  const nextSession = {
    ...session,
    accessToken: payload.accessToken,
    accessTokenExpiresIn: payload.accessTokenExpiresIn,
  };
  writeAuthSession(nextSession);
  return nextSession;
  })().finally(() => {
    refreshRequestPromise = null;
  });

  return refreshRequestPromise;
}

async function request(path, options = {}, retry = true) {
  const isJsonBody = options.body && !(options.body instanceof FormData);
  const session = readAuthSession();
  const hasAuthSession = Boolean(session?.accessToken);

  if (
    retry &&
    hasAuthSession &&
    path !== "/api/auth/refresh" &&
    !path.startsWith("/api/auth/login") &&
    shouldRefreshAccessToken(session)
  ) {
    const refreshedSession = await requestAccessTokenRefresh();
    if (refreshedSession) {
      return request(path, options, false);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers: getAuthHeaders({
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    }),
  });

  const shouldRetryRefresh =
    retry &&
    hasAuthSession &&
    (response.status === 401 || response.status === 403) &&
    path !== "/api/auth/refresh" &&
    !path.startsWith("/api/auth/login");

  if (shouldRetryRefresh) {
    const refreshedSession = await requestAccessTokenRefresh();
    if (refreshedSession) {
      return request(path, options, false);
    }
  }

  if (!response.ok) {
    throw await parseResponseError(response);
  }

  if (response.status === 204) return null;
  const rawText = await response.text();
  if (!rawText) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return JSON.parse(rawText);
  }

  return rawText;
}

export function get(path, options = {}) {
  return request(path, {
    method: "GET",
    ...options,
  });
}

export function post(path, body, options = {}) {
  return request(path, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });
}

export function patch(path, body, options = {}) {
  return request(path, {
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });
}

export function put(path, body, options = {}) {
  return request(path, {
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });
}

export function del(path, options = {}) {
  return request(path, {
    method: "DELETE",
    ...options,
  });
}
