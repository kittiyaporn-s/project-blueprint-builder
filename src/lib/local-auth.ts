export type LocalUser = {
  id: string;
  name: string;
  email: string;
  authMethod?: "email-password";
  avatar?: string;
};

const LOCAL_AUTH_KEY = "skill-matrix:local-user";

export function avatarUrlFromEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return undefined;
  return `https://unavatar.io/${encodeURIComponent(cleanEmail)}`;
}

function browserStorage() {
  if (typeof window === "undefined") return null;
  try {
    const testKey = "skill-matrix:auth-storage-test";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

function readAuthCookie() {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${LOCAL_AUTH_KEY}=`));
  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.split("=").slice(1).join("="));
  } catch {
    return null;
  }
}

function writeAuthCookie(value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCAL_AUTH_KEY}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCAL_AUTH_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

function normalizeUser(stored: string): LocalUser | null {
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;
    const user = parsed as Partial<LocalUser>;
    if (!user.id || !user.name || !user.email) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      authMethod: "email-password",
      avatar: user.avatar || avatarUrlFromEmail(user.email),
    };
  } catch {
    return null;
  }
}

export function getLocalUser(): LocalUser | null {
  const storage = browserStorage();
  const stored = storage?.getItem(LOCAL_AUTH_KEY) ?? readAuthCookie();
  if (!stored) return null;

  const user = normalizeUser(stored);
  if (!user) {
    storage?.removeItem(LOCAL_AUTH_KEY);
    clearAuthCookie();
    return null;
  }

  if (storage && !storage.getItem(LOCAL_AUTH_KEY)) storage.setItem(LOCAL_AUTH_KEY, stored);
  return user;
}

export function signInLocalUser(email?: string, password?: string): LocalUser | null {
  const cleanEmail = email?.trim().toLowerCase() || "local@skill-matrix.local";
  const user: LocalUser = {
    id: cleanEmail,
    name: cleanEmail.split("@")[0] || "Local User",
    email: cleanEmail,
    authMethod: "email-password",
    avatar: avatarUrlFromEmail(cleanEmail),
  };
  const serializedUser = JSON.stringify(user);
  browserStorage()?.setItem(LOCAL_AUTH_KEY, serializedUser);
  writeAuthCookie(serializedUser);
  return user;
}

export function signOutLocalUser() {
  browserStorage()?.removeItem(LOCAL_AUTH_KEY);
  clearAuthCookie();
}
