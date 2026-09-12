export type LocalUser = {
  id: string;
  name: string;
  email: string;
  authMethod?: "email-password";
  avatar?: string;
};

const LOCAL_AUTH_KEY = "skill-matrix:local-user";
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
      authMethod: "email-password",
      ...(user.avatar ? { avatar: user.avatar } : {}),
    };
  } catch {
    storage.removeItem(LOCAL_AUTH_KEY);
    return null;
  }
}

export function signInLocalUser(email?: string, password?: string): LocalUser | null {
  const storage = browserStorage();
  const cleanEmail = email?.trim().toLowerCase() || "local@skill-matrix.local";
  if (!storage) return null;

  const user: LocalUser = {
    id: cleanEmail,
    name: cleanEmail.split("@")[0] || "Local User",
    email: cleanEmail,
    authMethod: "email-password",
  };
  storage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  return user;
}

export function signOutLocalUser() {
  browserStorage()?.removeItem(LOCAL_AUTH_KEY);
}
