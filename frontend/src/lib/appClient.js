import { clearAuthSession, readAuthSession, writeAuthSession } from "../features/auth/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://100.96.110.114:8080";
const APP_DATA_SOURCE = import.meta.env.VITE_APP_DATA_SOURCE ?? "http";

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getAppDataSource() {
  return APP_DATA_SOURCE;
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
}

async function request(path, options = {}, retry = true) {
  const isJsonBody = options.body && !(options.body instanceof FormData);
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: getAuthHeaders({
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    }),
  });

  if (response.status === 401 && retry && path !== "/api/auth/refresh" && !path.startsWith("/api/auth/login")) {
    const refreshedSession = await requestAccessTokenRefresh();
    if (refreshedSession) {
      return request(path, options, false);
    }
  }

  if (!response.ok) {
    throw await parseResponseError(response);
  }

  if (response.status === 204) return null;
  return response.json();
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

export function del(path, options = {}) {
  return request(path, {
    method: "DELETE",
    ...options,
  });
}
