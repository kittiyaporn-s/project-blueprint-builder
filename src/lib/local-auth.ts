export type LocalUser = {
  id: string;
  name: string;
  email: string;
  authMethod?: "email-password";
  avatar?: string;
  token?: string;
};

type AuthAction = "login" | "register";

type AuthPayload = {
  email: string;
  password: string;
  name?: string;
};

type N8nAuthResponse = {
  ok?: boolean;
  success?: boolean;
  message?: string;
  error?: string;
  token?: string;
  accessToken?: string;
  user?: Partial<LocalUser> & { token?: string; accessToken?: string };
};

type UnknownRecord = Record<string, unknown>;

export type AuthResult =
  | { ok: true; user: LocalUser }
  | { ok: false; message: string };

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
      token: user.token,
    };
  } catch {
    return null;
  }
}

function storeLocalUser(user: LocalUser) {
  const serializedUser = JSON.stringify(user);
  browserStorage()?.setItem(LOCAL_AUTH_KEY, serializedUser);
  writeAuthCookie(serializedUser);
}

function isRecord(value: unknown): value is UnknownRecord {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function normalizeN8nResponse(value: unknown): N8nAuthResponse {
  const data = Array.isArray(value) ? value[0] : value;
  if (!isRecord(data)) {
    return typeof data === "string" ? { message: data } : {};
  }

  return data as N8nAuthResponse;
}

function getResponseMessage(data: N8nAuthResponse, fallback: string) {
  const message = data.message || data.error;
  if (message === "No item to return was found") {
    return "n8n ไม่พบข้อมูลที่จะส่งกลับ ตรวจสอบ workflow สมัครสมาชิกให้สร้างผู้ใช้และตอบกลับข้อมูล user";
  }

  return message || fallback;
}

function toLocalUser(data: N8nAuthResponse, payload: AuthPayload): LocalUser | null {
  const responseUser = data.user ?? {};
  const cleanEmail = (responseUser.email || payload.email).trim().toLowerCase();
  if (!cleanEmail) return null;

  const name = responseUser.name || payload.name || cleanEmail.split("@")[0] || "User";
  return {
    id: responseUser.id || cleanEmail,
    name,
    email: cleanEmail,
    authMethod: "email-password",
    avatar: responseUser.avatar || avatarUrlFromEmail(cleanEmail),
    token: responseUser.token || responseUser.accessToken || data.token || data.accessToken,
  };
}

async function sendN8nAuth(action: AuthAction, payload: AuthPayload): Promise<AuthResult> {
  try {
    const response = await fetch("/api/n8n-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        ...payload,
        requested_at: new Date().toISOString(),
      }),
    });

    const rawData = await response.json().catch(() => ({}));
    const data = normalizeN8nResponse(rawData);
    const isSuccess = response.ok && data.ok !== false && data.success !== false;
    if (!isSuccess) {
      return { ok: false, message: getResponseMessage(data, "ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง") };
    }

    const user = toLocalUser(data, payload);
    if (!user) return { ok: false, message: "ข้อมูลผู้ใช้งานจาก n8n ไม่ถูกต้อง" };

    storeLocalUser(user);
    return { ok: true, user };
  } catch {
    return { ok: false, message: "ไม่สามารถเชื่อมต่อ n8n ได้ กรุณาตรวจสอบ Webhook" };
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
  storeLocalUser(user);
  return user;
}

export function signInWithN8n(email: string, password: string) {
  return sendN8nAuth("login", { email: email.trim().toLowerCase(), password });
}

export function registerWithN8n(name: string, email: string, password: string) {
  return sendN8nAuth("register", { name: name.trim(), email: email.trim().toLowerCase(), password });
}

export function signOutLocalUser() {
  browserStorage()?.removeItem(LOCAL_AUTH_KEY);
  clearAuthCookie();
}
