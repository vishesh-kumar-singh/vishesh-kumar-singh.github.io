// Author / Admin Authentication Engine for Static GitHub Pages
// Works entirely client-side without requiring a backend server.

const SESSION_KEY = 'vishesh_author_session';

export async function hashPassword(str) {
  if (!str) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isAuthorLoggedIn() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
  );
}

export async function loginAuthor(password, rememberMe = true) {
  if (!password) return { success: false, error: 'Password cannot be empty.' };

  const targetHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH;
  const inputHash = await hashPassword(password);

  let isValid = false;

  // 1. Primary check: compare SHA-256 hash against injected secret hash
  if (targetHash && inputHash === targetHash) {
    isValid = true;
  }
  // 2. Dev mode direct match fallback
  else if (import.meta.env.VITE_ADMIN_PASSWORD && password === import.meta.env.VITE_ADMIN_PASSWORD) {
    isValid = true;
  }

  if (isValid) {
    const token = `author_verified_${Date.now()}`;
    sessionStorage.setItem(SESSION_KEY, token);
    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, token);
    }
    window.dispatchEvent(new Event('author-auth-change'));
    return { success: true };
  }

  return { success: false, error: 'Incorrect author password.' };
}

export function logoutAuthor() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('author-auth-change'));
}

