export type LocalUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

const LOCAL_AUTH_KEY = "skill-matrix:local-user";

const DEFAULT_LOCAL_USER: LocalUser = {
  id: "local-user",
  name: "Local User",
  email: "local@skill-matrix.local",
};

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

export function getLocalUser(): LocalUser | null {
  const storage = browserStorage();
  if (!storage) return null;

  const stored = storage.getItem(LOCAL_AUTH_KEY);
  if (!stored) return null;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;
    const user = parsed as Partial<LocalUser>;
    if (!user.id || !user.name || !user.email) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      ...(user.avatar ? { avatar: user.avatar } : {}),
    };
  } catch {
    storage.removeItem(LOCAL_AUTH_KEY);
    return null;
  }
}

export function signInLocalUser(email?: string): LocalUser {
  const storage = browserStorage();
  const cleanEmail = email?.trim();
  const user = cleanEmail
    ? {
        id: cleanEmail.toLowerCase(),
        name: cleanEmail.split("@")[0] || DEFAULT_LOCAL_USER.name,
        email: cleanEmail,
      }
    : (getLocalUser() ?? DEFAULT_LOCAL_USER);
  if (storage) storage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  return user;
}

export function signOutLocalUser() {
  browserStorage()?.removeItem(LOCAL_AUTH_KEY);
}
