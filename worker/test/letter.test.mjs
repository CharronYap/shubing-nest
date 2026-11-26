// Worker 的測試：不連網路、不花錢。Google 的鑰匙、Claude 的回應、KV 都是假的。
// 跑法：在 worker/ 裡 node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import { handle, readCtx } from '../src/letter.js';
import { DOLLS, TYPES, systemPrompt, userPrompt, tidy } from '../src/voices.js';

const PROJECT = 'shubing-nest', ORIGIN = 'https://charronyap.github.io', NOW = Date.UTC(2026, 10, 26, 4, 0, 0);
const b64u = b => Buffer.from(b).toString('base64url');
const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const other = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'k1', use: 'sig', alg: 'RS256' };

async function token(claims = {}, key = pair.privateKey, head = { alg: 'RS256', kid: 'k1', typ: 'JWT' }) {
  const s = Math.floor(NOW / 1000);
  const body = { iss: 'https://securetoken.google.com/' + PROJECT, aud: PROJECT, sub: 'user-1', iat: s - 60, exp: s + 3000, auth_time: s - 600, ...claims };
  const data = b64u(JSON.stringify(head)) + '.' + b64u(JSON.stringify(body));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(data));
  return data + '.' + b64u(new Uint8Array(sig));
}
function setup({ claude, kv = new Map() } = {}) {
  const calls = [];
  const env = {
    ANTHROPIC_API_KEY: 'test-key', FIREBASE_PROJECT: PROJECT, ALLOWED_ORIGINS: ORIGIN + ',http://localhost:8765', USER_DAILY: '3', GLOBAL_DAILY: '5',
    LIMITS: { get: async k => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } },
  };
  const io = {
    now: () => NOW, random: () => 0,
    fetch: async (url, init) => {
      if (String(url).includes('googleapis.com')) return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'cache-control': 'public, max-age=20000' } });
      calls.push({ url, init, body: JSON.parse(init.body) });
      return claude ? claude() : new Response(JSON.stringify({
        stop_reason: 'end_turn', usage: { input_tokens: 600, output_tokens: 80 },
        content: [{ type: 'thinking', thinking: '', signature: 'x' }, { type: 'text', text: '這幾天小窩很安靜。\n我看了很多雲。\n歡迎回來，我先去躺一' }],
      }));
    },
  };
  return { env, io, calls, kv };
}
const post = async (body, { tok, origin = ORIGIN, method = 'POST' } = {}) => new Request('https://w.example/', {
  method, headers: { origin, 'content-type': 'application/json', ...(tok === null ? {} : { authorization: 'Bearer ' + (tok ?? await token()) }) },
  body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
});
const MISS = { doll: 'sloth', type: 'miss', days: 5, date: '2026-11-26', hour: 21, pals: ['dog', 'dino'], done: ['叫到第三次，薯餅慢慢轉過頭來。'] };

test('登入的玩家拿得到信，Claude 的請求格式正確', async () => {
  const s = setup();
  const r = await handle(await post(MISS), s.env, s.io);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGIN);
  assert.deepEqual(await r.json(), { text: '這幾天小窩很安靜。\n我看了很多雲。\n歡迎回來，我先去躺一' });
  const c = s.calls[0];
  assert.equal(c.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(c.init.headers['x-api-key'], 'test-key');
  assert.equal(c.init.headers['anthropic-version'], '2026-10-21');
  assert.equal(c.body.model, 'claude-haiku-5-5');
  assert.deepEqual(c.body.output_config, { effort: 'low' });
  for (const k of ['temperature', 'top_p', 'top_k', 'thinking']) assert.ok(!(k in c.body), k + ' 不能送');
  assert.equal(c.body.messages.length, 1);   // 不能有 assistant 的開頭（prefill）
  assert.match(c.body.system, /薯餅/);
  assert.match(c.body.messages[0].content, /有 5 天沒來/);
  assert.match(c.body.messages[0].content, /皮蛋、龍龍/);
  assert.equal(s.kv.get('u:2026-11-26:user-1'), '1');
});

test('沒登入、憑證不對都擋掉，而且不會去問 Claude', async () => {
  const bad = [
    null, 'abc', await token({ aud: 'other-project' }), await token({ iss: 'https://securetoken.google.com/other' }),
    await token({ exp: Math.floor(NOW / 1000) - 4000 }), await token({ sub: '' }),
    await token({}, other.privateKey),                                   // 別人的鑰匙簽的
    await token({}, pair.privateKey, { alg: 'RS256', kid: 'nope' }),     // 沒有這把鑰匙
    (await token()).split('.').slice(0, 2).join('.') + '.',              // 沒簽名
    b64u('{"alg":"none"}') + '.' + (await token()).split('.')[1] + '.',  // alg none
  ];
  for (const tok of bad) {
    const s = setup();
    const r = await handle(await post(MISS, { tok }), s.env, s.io);
    assert.equal(r.status, 401, String(tok).slice(0, 30));
    assert.equal(s.calls.length, 0);
    assert.equal(s.kv.size, 0);
  }
});

test('一個人一天 3 封，全部的人加起來到上限也停', async () => {
  const s = setup();
  for (let i = 0; i < 3; i++) assert.equal((await handle(await post(MISS), s.env, s.io)).status, 200);
  const r = await handle(await post(MISS), s.env, s.io);
  assert.equal(r.status, 429); assert.deepEqual(await r.json(), { error: 'user' });
  assert.equal(s.calls.length, 3);
  // 換別人：全部上限是 5，已經 3 封，再 2 封就滿
  for (let i = 0; i < 2; i++) assert.equal((await handle(await post(MISS, { tok: await token({ sub: 'u' + i }) }), s.env, s.io)).status, 200);
  const g = await handle(await post(MISS, { tok: await token({ sub: 'u9' }) }), s.env, s.io);
  assert.equal(g.status, 429); assert.deepEqual(await g.json(), { error: 'global' });
  assert.equal(s.calls.length, 5);
});

test('別的網站、資料不對、沒設定好都不寫', async () => {
  const s = setup();
  assert.equal((await handle(await post(MISS, { origin: 'https://evil.example' }), s.env, s.io)).status, 403);
  assert.equal((await handle(await post(null, { method: 'GET' }), s.env, s.io)).status, 405);
  const pre = await handle(await post(null, { method: 'OPTIONS', tok: null }), s.env, s.io);
  assert.equal(pre.status, 204); assert.match(pre.headers.get('access-control-allow-headers'), /authorization/);
  for (const b of [{ doll: 'cat', type: 'miss' }, { doll: 'sloth', type: 'gift' }, { doll: 'sloth', type: 'cards' }, { doll: '__proto__', type: 'miss' }, 'not json', 'x'.repeat(2100)])
    assert.ok([400, 413].includes((await handle(await post(b), s.env, s.io)).status));
  assert.equal((await handle(await post(MISS), { ...s.env, ANTHROPIC_API_KEY: '' }, s.io)).status, 503);
  assert.equal((await handle(await post(MISS), { ...s.env, LIMITS: undefined }, s.io)).status, 503);
  assert.equal(s.calls.length, 0);
});

test('Claude 出錯、被擋、寫太長：回 502，遊戲會改用範本', async () => {
  const cases = [
    () => new Response('{"error":{"type":"overloaded_error"}}', { status: 529 }),
    () => new Response(JSON.stringify({ stop_reason: 'refusal', content: [] })),
    () => new Response(JSON.stringify({ stop_reason: 'max_tokens', content: [{ type: 'thinking', thinking: '' }] })),
    () => new Response(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: '字'.repeat(300) }] })),
    () => { throw new Error('network'); },
  ];
  for (const claude of cases) {
    const s = setup({ claude });
    const r = await handle(await post(MISS), s.env, s.io);
    assert.equal(r.status, 502); assert.deepEqual(await r.json(), { error: 'letter' });
  }
});

test('資料會被整理：數字有範圍、字會切短、不認得的娃娃拿掉', () => {
  const c = readCtx({ doll: 'piggy', type: 'cards', n: 1e9, days: -3, room: '<b>客廳</b>很長很長很長', furn: '沙\n發', pals: ['dog', 'dog', 'piggy', 'ghost'], done: ['a', 'b', 'c'], prev: 'x'.repeat(500), date: '2026-13-40', hour: 99 });
  assert.equal(c.n, 999); assert.equal(c.days, 0); assert.ok(!/[<>\n]/.test(c.room + c.furn)); assert.ok([...c.room].length <= 6);
  assert.deepEqual(c.pals, ['dog']); assert.equal(c.done.length, 2); assert.equal(c.prev.length, 80); assert.equal(c.month, 0); assert.equal(c.hour, 23);
});

test('八隻娃娃、四種信都組得出提示詞', () => {
  for (const d of Object.keys(DOLLS)) {
    assert.match(systemPrompt(d), new RegExp(DOLLS[d].name));
    for (const type of TYPES) {
      const c = readCtx({ doll: d, type, n: 10, y: 2, days: 4, room: '臥室', furn: '檯燈', pals: ['sloth', 'egg'], date: '2026-07-01', hour: 9 });
      const u = userPrompt(c, () => 0.99);
      assert.ok(u.length > 40 && u.length < 600, d + type);
      if (type === 'cards') assert.match(u, /10 件/);
      if (type === 'anniv') assert.match(u, /滿 2 年/);
      if (d === 'piggy') assert.match(u, /臥室的檯燈/);
      assert.match(u, /夏天，早上/);
    }
  }
});

test('整理 Claude 寫的字', () => {
  assert.equal(tidy('「汪！\n我藏了拖鞋。」', 'dog'), '汪！\n我藏了拖鞋。');
  assert.equal(tidy('汪！\n\n  [拖鞋]  \n<b>汪</b> & **汪**', 'dog'), '汪！\n[拖鞋]\nb汪/b  汪');
  assert.equal(tidy('', 'egg'), '');
  assert.equal(tidy('一\n二\n三\n四\n五\n六', 'egg'), '');     // 太多行
  assert.equal(tidy('懶'.repeat(60), 'egg'), '');               // 太長
});
