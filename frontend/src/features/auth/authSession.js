const AUTH_SESSION_KEY = "tripzone-auth-session";

function removeLegacyPersistentSession() {
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

export function readAuthSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_KEY);

    // Clear old persistent sessions so a browser restart starts logged out.
    if (!raw) {
      removeLegacyPersistentSession();
    }

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeAuthSession(session) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  removeLegacyPersistentSession();
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  removeLegacyPersistentSession();
}

export { AUTH_SESSION_KEY };
