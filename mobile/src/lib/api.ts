import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { logger } from './logger';

const TOKEN_KEY = 'lexforge.authToken';
const BASE_URL_KEY = 'lexforge.apiBaseUrl';

/**
 * Best-effort guess at the backend's LAN address: when running via
 * `expo start`, Metro's own host IP is exposed on hostUri (e.g.
 * "192.168.1.23:8081"). The Next.js dev server is almost always the same
 * machine on port 3000, so this saves the common case from needing to type
 * an IP by hand. Always overridable from Settings.
 */
export function guessDefaultApiBaseUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')?.[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3000`;
  }
  return '';
}

let cachedBaseUrl: string | null = null;
let cachedToken: string | null | undefined = undefined; // undefined = not loaded yet

export async function getApiBaseUrl(): Promise<string> {
  if (cachedBaseUrl !== null) return cachedBaseUrl;
  const stored = await SecureStore.getItemAsync(BASE_URL_KEY);
  cachedBaseUrl = stored || guessDefaultApiBaseUrl();
  return cachedBaseUrl;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, '');
  cachedBaseUrl = trimmed;
  await SecureStore.setItemAsync(BASE_URL_KEY, trimmed);
}

export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfter?: number;
  constructor(message: string, status: number, code?: string, retryAfter?: number) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/** Thrown when no server URL has been configured yet — callers should route to Settings. */
export class NoServerConfiguredError extends Error {
  constructor() { super('No server URL configured yet.'); }
}

type FetchOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
};

async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const base = await getApiBaseUrl();
  if (!base) throw new NoServerConfiguredError();

  let url = `${base}${path}`;
  if (opts.query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== '') params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  logger.log('[api]', opts.method || 'GET', path);

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method || 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    throw new ApiError('Could not reach the server. Check the server URL in Settings and your Wi-Fi connection.', 0);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status}).`;
    const retryAfter = res.status === 429 ? Number(res.headers.get('retry-after')) || data?.retryAfter : undefined;
    throw new ApiError(message, res.status, data?.code, retryAfter);
  }

  return data as T;
}

// ───────────────────────── Auth ─────────────────────────

export type MobileUser = { id: string; email: string; name: string | null; tier: 'free' | 'pro' };

export async function apiLogin(email: string, password: string) {
  return apiFetch<{ token: string; user: MobileUser }>('/api/auth/mobile-login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function apiRegister(name: string, email: string, password: string) {
  return apiFetch<{ id: string; email: string; name: string }>('/api/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

export async function apiForgotPassword(email: string) {
  return apiFetch<{ ok: boolean; message: string; resetLink?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function apiResetPassword(token: string, email: string, password: string) {
  return apiFetch<{ ok: boolean; message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: { token, email, password },
  });
}

export type MeResponse = {
  authenticated: boolean;
  email: string;
  name: string | null;
  isAdmin: boolean;
  isPro: boolean;
  tier: 'admin' | 'pro' | 'free';
  freeDocsLimit: number;
};

export async function apiGetMe() {
  return apiFetch<MeResponse>('/api/me');
}

// ───────────────────────── Drafts ─────────────────────────

export type Draft = {
  id: string;
  title: string;
  content: string;
  documentType: string;
  status: string;
  caseStatus: string;
  court: string | null;
  language: string;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function apiListDrafts(q?: string) {
  return apiFetch<{ drafts: Draft[] }>('/api/drafts', { query: { q } });
}

export async function apiGetDraft(id: string) {
  return apiFetch<Draft>(`/api/drafts/${id}`);
}

export async function apiCreateDraft(input: {
  documentType: string;
  templateData: Record<string, string>;
  court?: string;
  language?: string;
  intakeMethod?: string;
}) {
  return apiFetch<Draft & { autoClientAction?: string; followUpSaved?: boolean }>('/api/drafts', {
    method: 'POST',
    body: input,
  });
}

export async function apiUpdateDraft(id: string, patch: Partial<Pick<Draft, 'title' | 'content' | 'status' | 'caseStatus' | 'clientId'>>) {
  return apiFetch<{ success: true }>(`/api/drafts/${id}`, { method: 'PATCH', body: patch });
}

export async function apiDeleteDraft(id: string) {
  return apiFetch<{ success: true }>(`/api/drafts/${id}`, { method: 'DELETE' });
}

export async function apiListDraftVersions(id: string) {
  return apiFetch<{ versions: { id: string; version: number; changeNote: string | null; createdAt: string }[] }>(`/api/drafts/${id}/versions`);
}

// ───────────────────────── Clients ─────────────────────────

export type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  notes: string | null;
  _count?: { drafts: number; attachments: number; payments: number };
};

export async function apiListClients(q?: string) {
  return apiFetch<{ clients: Client[] }>('/api/clients', { query: { q } });
}

export async function apiGetClient(id: string) {
  return apiFetch<{ client: Client & { drafts: Draft[]; payments: { id: string; amount: number; date: string; description: string | null }[] }; totalPaid: number }>(`/api/clients/${id}`);
}

export async function apiCreateClient(input: Partial<Client> & { name: string }) {
  return apiFetch<{ client: Client }>('/api/clients', { method: 'POST', body: input });
}

export async function apiUpdateClient(id: string, patch: Partial<Client>) {
  return apiFetch<{ client: Client }>(`/api/clients/${id}`, { method: 'PUT', body: patch });
}

export async function apiDeleteClient(id: string) {
  return apiFetch<{ success: true }>(`/api/clients/${id}`, { method: 'DELETE' });
}

// ───────────────────────── Court dates ─────────────────────────

export type CourtDate = {
  id: string;
  title: string;
  date: string;
  type: string;
  caseNumber: string | null;
  notes: string | null;
  completed: boolean;
  draft?: { id: string; title: string } | null;
  client?: { id: string; name: string } | null;
};

export async function apiListCourtDates(opts?: { upcoming?: boolean; completed?: boolean }) {
  return apiFetch<{ courtDates: CourtDate[] }>('/api/court-dates', {
    query: { upcoming: opts?.upcoming ? '1' : undefined, completed: opts?.completed ? '1' : undefined },
  });
}

export async function apiCreateCourtDate(input: { title: string; date: string; type?: string; caseNumber?: string; notes?: string }) {
  return apiFetch<{ courtDate: CourtDate }>('/api/court-dates', { method: 'POST', body: input });
}

export async function apiUpdateCourtDate(id: string, patch: Partial<CourtDate>) {
  return apiFetch<{ courtDate: CourtDate }>(`/api/court-dates/${id}`, { method: 'PATCH', body: patch });
}

export async function apiDeleteCourtDate(id: string) {
  return apiFetch<{ ok: true }>(`/api/court-dates/${id}`, { method: 'DELETE' });
}

// ───────────────────────── Assistant ─────────────────────────

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function apiAssistantChat(messages: ChatMessage[], draftId?: string) {
  return apiFetch<{ reply: string }>('/api/assistant', { method: 'POST', body: { messages, draftId } });
}

// ───────────────────────── Study / Future Lawyer ─────────────────────────

export async function apiStudyQuiz(mode: 'mcq' | 'flashcards', topic?: string, count = 5) {
  return apiFetch<{ type: string; items: any[] }>('/api/study/quiz', { method: 'POST', body: { mode, topic, count } });
}

export async function apiMootMemorial(problem: string, side: 'petitioner' | 'respondent' | 'prosecution', moot?: string) {
  return apiFetch<{ memorial: string }>('/api/future-lawyer/moot', { method: 'POST', body: { problem, side, moot } });
}

// ───────────────────────── Legal Tools (analyze/*) ─────────────────────────

const ANALYZE_TOOLS: Record<string, { endpoint: string; field: string }> = {
  amendment: { endpoint: '/api/analyze/amendment', field: 'originalContent' },
  appeal: { endpoint: '/api/analyze/appeal', field: 'judgmentText' },
  compliance: { endpoint: '/api/analyze/compliance', field: 'orderText' },
  counter: { endpoint: '/api/analyze/counter', field: 'oppositePartyDoc' },
  fresh: { endpoint: '/api/analyze/fresh', field: 'rejectionOrderText' },
  order: { endpoint: '/api/analyze/order', field: 'orderText' },
  positive: { endpoint: '/api/analyze/positive', field: 'caseDetails' },
};

// `order` returns a structured breakdown object, not a plain string — format it into readable text.
function formatOrderAnalysis(a: any): string {
  if (!a || typeof a === 'string') return a || '';
  const lines: string[] = [];
  if (a.summary) lines.push(a.summary, '');
  const section = (label: string, items?: string[]) => {
    if (items?.length) lines.push(label.toUpperCase(), ...items.map((i) => `- ${i}`), '');
  };
  section('Directions', a.directions);
  if (a.nextDate) lines.push(`Next date: ${a.nextDate}${a.nextDateNote ? ` (${a.nextDateNote})` : ''}`, '');
  section('Immediate actions', a.immediateActions);
  section('Documents needed', a.documentsNeeded);
  section('Favorable points', a.favorablePoints);
  section('Points needing attention', a.adversePoints);
  return lines.join('\n').trim();
}

export async function apiAnalyzeTool(toolId: string, text: string) {
  const tool = ANALYZE_TOOLS[toolId];
  if (!tool) throw new ApiError(`Unknown tool: ${toolId}`, 400);
  const res = await apiFetch<{ content?: string; analysis?: any; draft?: Draft }>(tool.endpoint, {
    method: 'POST',
    body: { [tool.field]: text },
  });
  // `amendment`/`appeal`/`counter`/`fresh`/`compliance` return { content: string };
  // `positive` returns { analysis: string }; `order` returns { analysis: <structured object> }.
  const content = res.content ?? (toolId === 'order' ? formatOrderAnalysis(res.analysis) : res.analysis) ?? '';
  return { content, draft: res.draft };
}

// ───────────────────────── Admin ─────────────────────────

export async function apiAdminStats() {
  return apiFetch<{ stats: Record<string, number> }>('/api/admin/stats');
}

export async function apiAdminUsers() {
  return apiFetch<{ users: { id: string; email: string; name: string | null; tier: string; suspended: boolean; _count: { drafts: number; clients: number; courtDates: number } }[] }>('/api/admin/users');
}
