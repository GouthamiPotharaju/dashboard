import Cookies from "js-cookie";

export const API_BASE = "https://v9fes04dwf.execute-api.eu-north-1.amazonaws.com/api";
export const TOKEN_COOKIE = "jwt_token";

export function getToken() {
  return Cookies.get(TOKEN_COOKIE);
}

export function setToken(token: string) {
  Cookies.set(TOKEN_COOKIE, token, { expires: 7, sameSite: "lax" });
}

export function clearToken() {
  Cookies.remove(TOKEN_COOKIE);
}

export interface Metric {
  id?: string;
  label: string;
  value: string | number;
}

export interface ServiceSummary {
  service: string;
  yourReferrals: string | number;
  activeReferrals: string | number;
  totalRefEarnings: string | number;
}

export interface ReferralShare {
  link: string;
  code: string;
}

export interface ReferralRow {
  id: number | string;
  name: string;
  serviceName: string;
  date: string; // ISO YYYY-MM-DD
  profit: number;
}

export interface DashboardData {
  metrics: Metric[];
  serviceSummary: ServiceSummary;
  referral: ReferralShare;
  referrals: ReferralRow[];
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || "Invalid email or password");
  }
  const token = json?.data?.token;
  if (!token) throw new Error("Invalid email or password");
  return token as string;
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function unwrap<T>(json: any): T {
  // payload may be at json.data or directly on json
  const root = json?.data ?? json;
  return root as T;
}

export async function fetchReferrals(params: {
  search?: string;
  sort?: "asc" | "desc";
}): Promise<DashboardData> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.sort) qs.set("sort", params.sort);
  const url = `${API_BASE}/referrals${qs.toString() ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: { ...authHeaders() } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || "Failed to load referrals";
    throw new Error(`${msg} (${res.status})`);
  }
  return unwrap<DashboardData>(json);
}

export async function fetchReferralById(id: string): Promise<ReferralRow | null> {
  // The API doesn't expose a single-referral endpoint, so fetch the full
  // list and pick the matching row. This guarantees the detail page sees
  // the same data shape as the dashboard (no NaN / missing fields).
  const data = await fetchReferrals({});
  const match = (data.referrals ?? []).find(
    (r) => String(r.id) === String(id),
  );
  return match ?? null;
}

export function formatDate(iso: string) {
  if (!iso) return "";
  return iso.replaceAll("-", "/");
}

export function formatProfit(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}