/* 娃娃的信：收遊戲送來的資料 → 確認是登入的玩家 → 看今天還有沒有名額 → 請 Claude 寫 → 把信傳回去。
 *
 * Claude 的 API 金鑰只放在 Cloudflare 的密碼欄（ANTHROPIC_API_KEY），不會出現在網頁和這個資料夾裡。
 * 任何一步不對就回錯誤，遊戲那邊收到錯誤會改用原本的範本（js/mail.js 的 MAIL_TPL），玩的人不會看到錯誤。
 */
import { DOLLS, TYPES, systemPrompt, userPrompt, tidy } from './voices.js';

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const SKEW = 300;   // 時鐘差幾分鐘沒關係（秒）

/* ---------- 確認是小窩登入的玩家（Firebase 的登入憑證） ---------- */
let keys = null, keysUntil = 0;
async function googleKeys(io, force) {
  if (!force && keys && io.now() < keysUntil) return keys;
  const r = await io.fetch(JWKS_URL);
  if (!r.ok) throw new Error('keys');
  const age = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
  keys = (await r.json()).keys || [];
  keysUntil = io.now() + Math.min(age ? +age[1] : 3600, 21600) * 1000;
  return keys;
}
const b64 = s => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/'), bin = atob(t + '='.repeat((4 - t.length % 4) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
};
const b64json = s => JSON.parse(new TextDecoder().decode(b64(s)));

// 憑證沒問題就回玩家的 uid，有問題回 null
export async function verifyUser(token, project, io) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3 || token.length > 4096) return null;
    const head = b64json(parts[0]), body = b64json(parts[1]);
    if (head.alg !== 'RS256' || !head.kid) return null;
    const now = Math.floor(io.now() / 1000);
    if (body.aud !== project || body.iss !== 'https://securetoken.google.com/' + project) return null;
    if (typeof body.sub !== 'string' || !body.sub || body.sub.length > 128) return null;
    if (!(body.exp > now - SKEW) || !(body.iat <= now + SKEW) || !(body.auth_time <= now + SKEW)) return null;
    let k = (await googleKeys(io)).find(x => x.kid === head.kid);
    if (!k) k = (await googleKeys(io, true)).find(x => x.kid === head.kid);   // Google 換鑰匙了，重抓一次
    if (!k) return null;
    const key = await crypto.subtle.importKey('jwk', { kty: k.kty, n: k.n, e: k.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
    return ok ? body.sub : null;
  } catch (e) { return null; }
}

/* ---------- 檢查遊戲送來的資料 ---------- */
// 字：拿掉控制字元和角括號，切到 n 個字
const str = (s, n) => Array.from(String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').trim()).slice(0, n).join('');
const int = (v, lo, hi) => { const n = Math.floor(+v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo; };

export function readCtx(b) {
  if (!b || typeof b !== 'object' || !Object.hasOwn(DOLLS, b.doll) || !TYPES.includes(b.type)) return null;
  const m = /^\d{4}-(\d{2})-\d{2}$/.exec(String(b.date || ''));
  const c = {
    doll: b.doll, type: b.type,
    n: int(b.n, 0, 999), y: int(b.y, 0, 99), days: int(b.days, 0, 60),
    room: str(b.room, 6) || '客廳', furn: str(b.furn, 8) || '沙發',
    month: m && +m[1] >= 1 && +m[1] <= 12 ? +m[1] : 0,
    hour: b.hour === undefined ? -1 : int(b.hour, 0, 23),
    pals: [...new Set(Array.isArray(b.pals) ? b.pals : [])].filter(p => Object.hasOwn(DOLLS, p) && p !== b.doll).slice(0, 7),
    done: (Array.isArray(b.done) ? b.done : []).slice(0, 2).map(s => str(s, 40)).filter(Boolean),
    prev: str(b.prev, 80),
  };
  if (c.type === 'cards' && !c.n) return null;
  if (c.type === 'anniv' && !c.y) return null;
  return c;
}

/* ---------- 一天幾封（Cloudflare KV） ---------- */
// 回 '' = 可以寫；'user' = 這個人今天的名額用完；'global' = 全部的人加起來到上限；'store' = 沒接上 KV
export async function takeQuota(env, uid, io) {
  const kv = env.LIMITS;
  if (!kv) return 'store';
  const day = new Date(io.now() + 8 * 3600e3).toISOString().slice(0, 10);   // 台灣時間的日期
  const uk = `u:${day}:${uid}`, gk = `g:${day}`;
  const [u, g] = (await Promise.all([kv.get(uk), kv.get(gk)])).map(v => +v || 0);
  if (u >= int(env.USER_DAILY, 1, 50)) return 'user';
  if (g >= int(env.GLOBAL_DAILY, 1, 5000)) return 'global';
  // 先記再寫：就算 Claude 那邊失敗也算一次，壞掉的時候不會一直重試把額度用完
  await Promise.all([kv.put(uk, String(u + 1), { expirationTtl: 172800 }), kv.put(gk, String(g + 1), { expirationTtl: 172800 })]);
  return '';
}

/* ---------- 請 Claude 寫 ---------- */
export async function writeLetter(c, env, io) {
  const r = await io.fetch(CLAUDE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2026-10-21' },
    body: JSON.stringify({
      model: env.MODEL || 'claude-haiku-5-5',
      max_tokens: 1024,   // Haiku 5.5 會先想一下再寫，想的部分也算在這裡面，所以留寬一點；信本身只有幾十個字
      output_config: { effort: 'low' },
      system: systemPrompt(c.doll),
      messages: [{ role: 'user', content: userPrompt(c, io.random) }],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) { console.log('claude', r.status, (await r.text()).slice(0, 300)); return ''; }
  const j = await r.json();
  if (j.usage) console.log('letter', c.doll, c.type, j.stop_reason, 'in', j.usage.input_tokens, 'out', j.usage.output_tokens);
  if (j.stop_reason !== 'end_turn') return '';   // 被擋下來（refusal）或寫到一半被切掉（max_tokens）都不要
  // 前面可能有 thinking 區塊，只拿 text
  return tidy((j.content || []).filter(x => x.type === 'text').map(x => x.text).join(''), c.doll);
}

/* ---------- 進來的請求 ---------- */
export async function handle(request, env, io) {
  const origin = request.headers.get('origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean).includes(origin);
  const cors = allowed ? {
    'access-control-allow-origin': origin, 'vary': 'origin',
    'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type', 'access-control-max-age': '86400',
  } : {};
  const send = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cors } });

  if (!allowed) return send(403, { error: 'origin' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return send(405, { error: 'method' });
  if (!env.ANTHROPIC_API_KEY) return send(503, { error: 'setup' });

  const raw = await request.text();
  if (raw.length > 2000) return send(413, { error: 'size' });
  let c = null;
  try { c = readCtx(JSON.parse(raw)); } catch (e) {}
  if (!c) return send(400, { error: 'data' });

  const token = (/^Bearer (.+)$/.exec(request.headers.get('authorization') || '') || [])[1];
  const uid = await verifyUser(token, env.FIREBASE_PROJECT, io);
  if (!uid) return send(401, { error: 'login' });

  const q = await takeQuota(env, uid, io);
  if (q === 'store') return send(503, { error: 'setup' });
  if (q) return send(429, { error: q });

  let text = '';
  try { text = await writeLetter(c, env, io); } catch (e) { console.log('claude failed', String(e && e.message || e)); }
  return text ? send(200, { text }) : send(502, { error: 'letter' });
}
