// Author / Admin Authentication Engine for Static GitHub Pages
// Works entirely client-side without requiring a backend server.

const DEFAULT_HASH_2026 = 'e6a28aa0d8f1f02569ba1d02103d51072e1044f92c08af12b7efc6101bbe705e'; // vishesh2026
const DEFAULT_HASH_SIMPLE = '545cbe37167b037d77ea96e95d8083499bfda62edafce32de8a62801e8141b99'; // vishesh
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

  const envPass = import.meta.env.VITE_ADMIN_PASSWORD;
  const inputHash = await hashPassword(password);

  let isValid = false;

  // 1. Primary check against GitHub Secrets / .env variable
  if (envPass && password === envPass) {
    isValid = true;
  }
  // 2. Fallback check against default hashes (vishesh2026 or vishesh)
  else if (inputHash === DEFAULT_HASH_2026 || inputHash === DEFAULT_HASH_SIMPLE) {
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

