// Thin fetch wrappers around the backend API.

// In production (Netlify) the backend lives on another origin (Render). Set
// VITE_API_BASE to the Render URL at build time, e.g. https://app.onrender.com
// Locally it's empty and the Vite dev proxy handles /api + /photos.
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

const TOKEN_KEY = 'bw_admin_token';
const BACKEND_URL = 'http://localhost:5000'; // dev fallback
// Production (Netlify build with VITE_API_BASE set) -> Render URL. Dev -> localhost.
const ORIGIN = API_BASE || BACKEND_URL;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function req(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;

  const res = await fetch(`${ORIGIN}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

// --- Public ---
export const getSections = () => req('/sections');
export const getPhotos = () => req('/photos');
export const makeWish = (messages) =>
  req('/wishes', { method: 'POST', body: { messages } });

// --- Auth ---
export const login = (username, password) =>
  req('/auth/login', { method: 'POST', body: { username, password } });

// --- Admin ---
export const createSection = (data) =>
  req('/sections', { method: 'POST', body: data, auth: true });
export const updateSection = (id, data) =>
  req(`/sections/${id}`, { method: 'PUT', body: data, auth: true });
export const deleteSection = (id) =>
  req(`/sections/${id}`, { method: 'DELETE', auth: true });
export const getWishes = () => req('/wishes', { auth: true });

const baseName = (filename) => filename.replace(/\.[^.]+$/, '');

// Full original (local dev only; not deployed). Prefer mediumUrl for display.
export const photoUrl = (filename) => `${ORIGIN}/photos/${filename}`;

// Small pre-generated thumbnail for the 3D gallery (see server/thumbs.js).
export const thumbUrl = (filename) =>
  `${ORIGIN}/photos/thumbs/${baseName(filename)}.jpg`;

// Medium web-size version (see server/medium.js) — used for wiki polaroids,
// the gate portrait, and the gallery click-to-open view. This is what ships.
export const mediumUrl = (filename) =>
  `${ORIGIN}/photos/medium/${baseName(filename)}.jpg`;
