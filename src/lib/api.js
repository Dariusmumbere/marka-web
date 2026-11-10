export const API = (import.meta.env?.VITE_API_URL || "https://marka-9fte.onrender.com").replace(/\/$/, "");

export async function api(path, opts = {}) {
  const r = await fetch(API + path, opts);
  if (!r.ok) {
    let m = r.statusText;
    try { const j = await r.json(); m = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail); } catch {}
    throw new Error(m);
  }
  return r.json();
}
export const send = (method, body) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export const r1 = (n) => Math.round((n ?? 0) * 10) / 10;
export const confClass = (c) => (c >= 0.8 ? "ok" : c >= 0.6 ? "mid" : "low");

export const confirm_ = (m) => window.confirm(m);
