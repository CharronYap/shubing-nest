/* 帽子和衣服的圖、戴在哪裡：從薯餅蛋蛋島 js/cosmetics.js 複製過來（2026-11-25 那一版，commit 5b53aff）
   複製的段落：畫 SVG 的小工具、GRAD、TOY_FACE、ACCESSORY_PLACE、ACCESSORY_TUNING、accTune、ACCESSORY_SVG、HELM、OUTFITS、OUTFIT_FIT、outfitSvg
   改的地方：拿掉 export，整段包起來（蛋蛋島的小工具叫 S，跟小窩的存檔 S 同名）；TOY_FACE 加龍龍（dino）
   蛋蛋島那邊調了位置，要同步時整段重新複製，再把下面「小窩加的」補回去 */
const LOOKS = (() => {
// ---------- 畫 SVG 的小工具（新配件、玩偶造型、外圈、圖示共用）----------
const S = (d, f, s, w) => `<path d="${d}" fill="${f}" stroke="${s}" stroke-width="${w || 1.6}" stroke-linejoin="round" stroke-linecap="round"/>`;
const L = (d, s, w, o) => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" opacity="${o == null ? 1 : o}"/>`;
const C = (cx, cy, r, f, s, w) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${s ? ` stroke="${s}" stroke-width="${w || 1.4}"` : ''}/>`;
function star(cx, cy, r, f, s, w) {
  let p = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2) + ' '; }
  return S(p + 'Z', f, s || 'none', w || 0);
}
// 五瓣小花
function flower(cx, cy, r, petal, mid, edge) {
  let o = '';
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; o += C((cx + r * 0.62 * Math.cos(a)).toFixed(2), (cy + r * 0.62 * Math.sin(a)).toFixed(2), (r * 0.5).toFixed(2), petal, edge, r * 0.16); }
  return o + C(cx, cy, (r * 0.38).toFixed(2), mid);
}
// 六角雪花
function flake(cx, cy, r, col, w) {
  let d = '';
  for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3, dx = r * Math.cos(a), dy = r * Math.sin(a); d += `M${(cx - dx).toFixed(2)} ${(cy - dy).toFixed(2)} L${(cx + dx).toFixed(2)} ${(cy + dy).toFixed(2)} `; }
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, bx = cx + r * 0.6 * Math.cos(a), by = cy + r * 0.6 * Math.sin(a);
    for (const s of [-1, 1]) { const b = a + s * 0.7; d += `M${bx.toFixed(2)} ${by.toFixed(2)} L${(bx + r * 0.32 * Math.cos(b)).toFixed(2)} ${(by + r * 0.32 * Math.sin(b)).toFixed(2)} `; }
  }
  return L(d, col, w);
}
// 齒輪外形
function gearPath(cx, cy, R, r, n) {
  let p = '';
  for (let i = 0; i < n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2 - Math.PI / 2, rr = (i % 4 === 1 || i % 4 === 2) ? R : r;
    p += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2) + ' ';
  }
  return p + 'Z';
}
const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
// 造型、外圈共用的漸層（每張 SVG 自己帶一份，畫成圖片時不會互相影響）
const GRAD = '<defs>' + [
  lg('gW', [[0, '#ffffff'], [0.55, '#f3f0fa'], [1, '#cfc8e2']]),
  lg('gB', [[0, '#d6e8ff'], [0.45, '#5b8ef0'], [1, '#2c55b8']]),
  lg('gR', [[0, '#ffd2cf'], [0.45, '#ff5a5a'], [1, '#c42a2a']]),
  lg('gP', [[0, '#ead8ff'], [0.45, '#9a5cf0'], [1, '#5b2bb0']]),
  lg('gY', [[0, '#fff8c4'], [0.45, '#ffd23c'], [1, '#e48a00']]),
  lg('gK', [[0, '#ffd0e6'], [0.45, '#ff86bd'], [1, '#f0468f']]),
  lg('gN', [[0, '#f3d9b5'], [0.45, '#b9814a'], [1, '#7a4a1f']]),
  lg('gG', [[0, '#d9ffc8'], [0.45, '#63c94f'], [1, '#2f8a2a']]),
  lg('gO', [[0, '#ffe0b0'], [0.45, '#ff9a2e'], [1, '#c85a00']]),
  lg('gD', [[0, '#6a5e9a'], [0.5, '#2c2648'], [1, '#141024']]),
  lg('gC', [[0, '#fffdf5'], [0.6, '#fbf0d6'], [1, '#e6d2a6']]),
  '<radialGradient id="gGlass" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#e8f6ff" stop-opacity=".08"/><stop offset=".75" stop-color="#bfe0ff" stop-opacity=".22"/><stop offset="1" stop-color="#8ec4ff" stop-opacity=".5"/></radialGradient>',
  lg('gRain', [[0, '#ff6f9f'], [0.25, '#ffc21a'], [0.5, '#63c94f'], [0.75, '#5b8ef0'], [1, '#9a5cf0']], 1, 1),
].join('') + '</defs>';
const WS = '#8b86a6';

// ---------- 配件戴在哪裡 ----------
// 每隻玩偶的臉在照片裡的位置（0–1，照「照片裡玩偶不透明部分的外框」量）：
//   x 臉的中心（左右）、top 頭頂、eyes 眼睛那一排、cheeks 臉頰、w 臉有多寬（佔玩偶寬度的比例）
const TOY_FACE = {
  dog:     { x: 0.5,  top: 0.03, eyes: 0.55, cheeks: 0.7,  w: 0.72 },
  sloth:   { x: 0.5,  top: 0.02, eyes: 0.33, cheeks: 0.44, w: 0.4 },
  egg:     { x: 0.5,  top: 0.02, eyes: 0.27, cheeks: 0.37, w: 0.72 },
  piggy:   { x: 0.3,  top: 0.26, eyes: 0.4,  cheeks: 0.6,  w: 0.5 },   // 火腿（存錢豬）：頭在照片左邊
  nyanko:  { x: 0.48, top: 0.08, eyes: 0.53, cheeks: 0.62, w: 0.8 },   // 3D 掃描，使用者取景（11/25 工作單32）：俯角 36°、拉近，臉在中間偏下
  moodeng: { x: 0.5,  top: 0.05, eyes: 0.3,  cheeks: 0.62, w: 0.86 },
  snoopy:  { x: 0.46, top: 0.04, eyes: 0.5,  cheeks: 0.64, w: 0.72 },
};
// 每種配件的基本位置：anchor = 對齊臉的哪一條線；size = 寬度（臉寬的幾倍）；ay = 配件圖的哪個高度對齊那條線（0 上緣、1 下緣）；
// dx = 往右挪（臉寬的幾倍）
const ACCESSORY_PLACE = {
  crown:  { anchor: 'top',    size: 0.92, ay: 0.72, dx: 0 },
  chef:   { anchor: 'top',    size: 1.0,  ay: 0.78, dx: 0 },
  halo:   { anchor: 'top',    size: 1.05, ay: 0.95, dx: 0 },
  bow:    { anchor: 'top',    size: 0.66, ay: 0.4,  dx: 0.36 },
  shades: { anchor: 'eyes',   size: 1.05, ay: 0.45, dx: 0 },
  blush:  { anchor: 'cheeks', size: 1.08, ay: 0.5,  dx: 0 },
  clip:         { anchor: 'top',  size: 0.5,  ay: 0.45, dx: 0.34 },
  bunny:        { anchor: 'top',  size: 0.95, ay: 0.88, dx: 0 },
  beret:        { anchor: 'top',  size: 0.95, ay: 0.7,  dx: 0.05 },
  heartglasses: { anchor: 'eyes', size: 1.05, ay: 0.45, dx: 0 },
  tophat:       { anchor: 'top',  size: 0.72, ay: 0.86, dx: 0 },
  flowers:      { anchor: 'top',  size: 1.05, ay: 0.62, dx: 0 },
  eggshell:     { anchor: 'top',  size: 0.95, ay: 0.78, dx: 0 },
  santa:        { anchor: 'top',  size: 1.0,  ay: 0.8,  dx: 0 },
};
// ★ 微調設定檔：某隻玩偶戴某個配件時，位置 / 大小不對就改這裡 ★
//   offsetX / offsetY：往右 / 往下挪多少（玩偶寬 / 高的比例，例如 0.05 = 挪 5%；負數 = 往左 / 往上）
//   scale：大小（1 = 原本，1.2 = 大 20%）
//   rot：轉幾度（順時針為正，負數往左轉；以配件正中間為中心，跟飾品對齊台一樣）
const ACCESSORY_TUNING = {
  dog:     { crown: { offsetX: -0.198, offsetY: 0.116, scale: 0.9, rot: -5 },
             chef: { offsetX: -0.205, offsetY: 0.143, scale: 0.82, rot: 0 },
             halo: { offsetX: -0.16, offsetY: 0.093, scale: 1, rot: 0 },
             bow: { offsetX: -0.477, offsetY: 0.2, scale: 1, rot: 0 },
             shades: { offsetX: -0.221, offsetY: -0.017, scale: 0.88, rot: 0 },
             blush: { offsetX: -0.247, offsetY: 0.055, scale: 1, rot: 0 },
             clip: { offsetX: -0.451, offsetY: 0.105, scale: 1, rot: 0 },
             eggshell: { offsetX: -0.181, offsetY: 0.23, scale: 0.82, rot: 0 } },
  sloth:   { crown: { offsetX: -0.094, offsetY: -0.022, scale: 1.2, rot: -10 },
             chef: { offsetX: -0.088, offsetY: 0.007, scale: 1.15, rot: -10 },
             halo: { offsetX: -0.089, offsetY: 0.021, scale: 1.2, rot: -10 },
             bow: { offsetX: -0.162, offsetY: 0.517, scale: 1.15, rot: -5 },
             shades: { offsetX: -0.034, offsetY: -0.061, scale: 1.1, rot: -10 },
             blush: { offsetX: -0.021, offsetY: -0.073, scale: 1.12, rot: -10 },
             bunny: { offsetX: -0.058, offsetY: 0.034, scale: 1.2, rot: -5 },
             clip: { offsetX: -0.199, offsetY: -0.073, scale: 1.15, rot: -5 },
             beret: { offsetX: -0.096, offsetY: 0.027, scale: 1.2, rot: -10 },
             tophat: { offsetX: -0.079, offsetY: 0.053, scale: 1.2, rot: -10 },
             flowers: { offsetX: -0.062, offsetY: 0.046, scale: 1.2, rot: -10 },
             eggshell: { offsetX: -0.066, offsetY: 0.069, scale: 1.15, rot: -10 },
             santa: { offsetX: -0.081, offsetY: 0.049, scale: 1.15, rot: -10 } },
  egg:     { crown: { offsetX: 0.019, offsetY: -0.032, scale: 1, rot: 0 },
             chef: { offsetX: 0.021, offsetY: -0.037, scale: 0.88, rot: 0 },
             halo: { offsetX: 0.025, offsetY: -0.01, scale: 1, rot: 0 },
             bow: { offsetX: -0.272, offsetY: 0.511, scale: 1, rot: 0 },
             shades: { offsetX: 0.015, offsetY: -0.091, scale: 0.8, rot: 0 },
             blush: { offsetX: 0.008, offsetY: -0.099, scale: 1, rot: 0 },
             clip: { offsetX: -0.233, offsetY: -0.088, scale: 1, rot: 0 },
             beret: { offsetX: -0.024, offsetY: 0.033, scale: 1, rot: 0 },
             tophat: { offsetX: 0.017, offsetY: 0.057, scale: 1, rot: 0 },
             flowers: { offsetX: 0.01, offsetY: 0.032, scale: 1, rot: 0 },
             eggshell: { offsetX: 0.026, offsetY: 0.069, scale: 0.88, rot: 0 },
             santa: { offsetX: 0.033, offsetY: 0.058, scale: 0.88, rot: 0 } },
  piggy:   { crown: { offsetX: -0.065, offsetY: -0.034, scale: 0.9, rot: -10 },
             chef: { offsetX: -0.095, offsetY: -0.006, scale: 1, rot: -10 },
             halo: { offsetX: -0.095, offsetY: 0.009, scale: 1, rot: -15 },
             bow: { offsetX: -0.045, offsetY: 0.041, scale: 1, rot: 15 },
             shades: { offsetX: -0.053, offsetY: -0.018, scale: 1, rot: -10 },
             blush: { offsetX: -0.055, offsetY: -0.129, scale: 1, rot: -15 },
             clip: { offsetX: -0.266, offsetY: -0.062, scale: 1, rot: -15 },
             beret: { offsetX: -0.095, offsetY: 0.018, scale: 0.9, rot: -15 },
             eggshell: { offsetX: -0.056, offsetY: 0.033, scale: 1, rot: -10 } },
  nyanko:  { crown: { offsetX: 0, offsetY: 0.015, scale: 0.75, rot: 0 },
             chef: { offsetX: 0, offsetY: 0.01, scale: 0.75, rot: 0 },
             halo: { offsetX: 0, offsetY: 0, scale: 0.8, rot: 0 },
             bow: { offsetX: -0.28, offsetY: 0.636, scale: 0.6, rot: 0 },
             shades: { offsetX: 0, offsetY: 0, scale: 0.85, rot: 0 },
             blush: { offsetX: 0, offsetY: 0, scale: 0.85, rot: 0 },
             clip: { offsetX: -0.285, offsetY: -0.096, scale: 1, rot: 0 },
             bunny: { offsetX: 0, offsetY: 0, scale: 0.8, rot: 0 },
             beret: { offsetX: -0.048, offsetY: -0.004, scale: 0.75, rot: 0 },
             heartglasses: { offsetX: -0.009, offsetY: 0, scale: 0.85, rot: 0 },
             tophat: { offsetX: 0, offsetY: 0, scale: 0.75, rot: 0 },
             flowers: { offsetX: 0, offsetY: 0, scale: 0.8, rot: 0 },
             eggshell: { offsetX: 0, offsetY: 0, scale: 0.8, rot: 0 },
             santa: { offsetX: 0, offsetY: 0, scale: 0.8, rot: 0 } },   // 使用者取景（11/25 工作單32）；bow、clip、beret、heartglasses 使用者在對齊台調（工作單33）
  moodeng: { crown: { offsetX: 0.025, offsetY: -0.106, scale: 0.72, rot: 0 },
             chef: { offsetX: 0.031, offsetY: -0.115, scale: 0.68, rot: 0 },
             halo: { offsetX: 0, offsetY: 0, scale: 0.9, rot: 0 },
             bow: { offsetX: -0.304, offsetY: 0.984, scale: 0.9, rot: 0 },
             shades: { offsetX: 0.012, offsetY: 0.038, scale: 0.88, rot: 0 },
             blush: { offsetX: 0, offsetY: 0, scale: 1, rot: 0 },
             clip: { offsetX: -0.268, offsetY: -0.193, scale: 0.9, rot: 0 },
             beret: { offsetX: -0.013, offsetY: 0.026, scale: 0.72, rot: 0 },
             tophat: { offsetX: 0.009, offsetY: 0.042, scale: 0.72, rot: 0 },
             flowers: { offsetX: 0.019, offsetY: 0, scale: 0.72, rot: 0 },
             eggshell: { offsetX: 0.015, offsetY: 0.058, scale: 0.68, rot: 0 },
             santa: { offsetX: 0.013, offsetY: 0.049, scale: 0.68, rot: 0 } },
  snoopy:  { crown: { offsetX: -0.037, offsetY: -0.017, scale: 0.94, rot: 0 },
             chef: { offsetX: -0.046, offsetY: -0.048, scale: 0.92, rot: 0 },
             halo: { offsetX: -0.031, offsetY: 0.042, scale: 1, rot: 0 },
             bow: { offsetX: -0.047, offsetY: 0.056, scale: 1, rot: 0 },
             shades: { offsetX: 0, offsetY: 0, scale: 1, rot: 0 },
             blush: { offsetX: 0, offsetY: 0, scale: 1, rot: 0 },
             clip: { offsetX: -0.285, offsetY: -0.071, scale: 1, rot: 0 },
             tophat: { offsetX: -0.039, offsetY: 0.067, scale: 0.94, rot: 0 },
             flowers: { offsetX: -0.038, offsetY: 0.081, scale: 0.94, rot: 0 },
             eggshell: { offsetX: -0.017, offsetY: 0.065, scale: 0.92, rot: 0 },
             santa: { offsetX: 0.007, offsetY: 0.087, scale: 0.92, rot: 0 } },
};
// 新配件沒有自己的微調時，照戴法最像的舊配件微調（例如貝雷帽跟皇冠一樣戴在頭頂）
const TUNE_LIKE = { clip: 'bow', heartglasses: 'shades', bunny: 'crown', beret: 'crown', tophat: 'crown', flowers: 'crown', eggshell: 'chef', santa: 'chef' };
function accTune(toy, name) {
  const t = ACCESSORY_TUNING[toy] || {};
  return Object.assign({ offsetX: 0, offsetY: 0, scale: 1, rot: 0 }, t[name] || t[TUNE_LIKE[name]]);
}

// ---------- 配件的圖（SVG，透明背景；renderer 先畫成小圖再疊到玩偶上）----------
const ACCESSORY_SVG = {
  crown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 88"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8c4"/><stop offset=".45" stop-color="#ffd23c"/><stop offset="1" stop-color="#e48a00"/></linearGradient></defs><path d="M12 72 L8 26 L35 47 L60 12 L85 47 L112 26 L108 72 Z" fill="url(#g)" stroke="#9a5200" stroke-width="5" stroke-linejoin="round"/><rect x="10" y="64" width="100" height="17" rx="8" fill="url(#g)" stroke="#9a5200" stroke-width="5"/><circle cx="8" cy="24" r="6.5" fill="#fff3a0" stroke="#9a5200" stroke-width="3.5"/><circle cx="60" cy="10" r="7" fill="#fff3a0" stroke="#9a5200" stroke-width="3.5"/><circle cx="112" cy="24" r="6.5" fill="#fff3a0" stroke="#9a5200" stroke-width="3.5"/><circle cx="60" cy="72" r="6.5" fill="#ff5fa2" stroke="#9a1f5a" stroke-width="2.5"/><circle cx="33" cy="72" r="4.8" fill="#5fd0ff" stroke="#1d6f9a" stroke-width="2.2"/><circle cx="87" cy="72" r="4.8" fill="#5fd0ff" stroke="#1d6f9a" stroke-width="2.2"/><path d="M20 36 L23 60" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".75"/><circle cx="57" cy="7" r="2.2" fill="#fff"/></svg>`,
  shades: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 54"><defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a3f7a"/><stop offset=".5" stop-color="#1c1830"/><stop offset="1" stop-color="#0c0a16"/></linearGradient></defs><rect x="3" y="7" width="134" height="8" rx="4" fill="#1c1830"/><path d="M7 11 H62 Q67 11 66 17 L61 37 Q58 48 44 48 H25 Q10 48 8 35 Z" fill="url(#l)" stroke="#000" stroke-width="3" stroke-linejoin="round"/><path d="M133 11 H78 Q73 11 74 17 L79 37 Q82 48 96 48 H115 Q130 48 132 35 Z" fill="url(#l)" stroke="#000" stroke-width="3" stroke-linejoin="round"/><path d="M62 17 Q70 10 78 17" fill="none" stroke="#1c1830" stroke-width="5" stroke-linecap="round"/><path d="M16 17 L32 17 L21 38 Z" fill="#fff" opacity=".55"/><path d="M86 17 L102 17 L91 38 Z" fill="#fff" opacity=".55"/><circle cx="52" cy="19" r="2.5" fill="#fff" opacity=".8"/><circle cx="122" cy="19" r="2.5" fill="#fff" opacity=".8"/></svg>`,
  bow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 74"><defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd0e6"/><stop offset=".5" stop-color="#ff86bd"/><stop offset="1" stop-color="#f0468f"/></linearGradient></defs><path d="M50 42 L38 70 L48 65 L54 72 Z" fill="url(#p)" stroke="#b8155a" stroke-width="4" stroke-linejoin="round"/><path d="M60 42 L72 70 L62 65 L56 72 Z" fill="url(#p)" stroke="#b8155a" stroke-width="4" stroke-linejoin="round"/><path d="M55 36 C40 10 7 4 5 23 C3 42 30 54 55 36 Z" fill="url(#p)" stroke="#b8155a" stroke-width="4.5" stroke-linejoin="round"/><path d="M55 36 C70 10 103 4 105 23 C107 42 80 54 55 36 Z" fill="url(#p)" stroke="#b8155a" stroke-width="4.5" stroke-linejoin="round"/><rect x="45" y="26" width="20" height="20" rx="8" fill="#ff7fb5" stroke="#b8155a" stroke-width="4.5"/><path d="M15 20 Q23 13 33 19" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".85"/><path d="M77 19 Q86 13 94 19" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/><circle cx="51" cy="31" r="2.6" fill="#fff" opacity=".9"/></svg>`,
  halo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50"><defs><radialGradient id="h"><stop offset=".5" stop-color="#fff6a8" stop-opacity="0"/><stop offset=".74" stop-color="#fff3a8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe066" stop-opacity="0"/></radialGradient></defs><ellipse cx="60" cy="25" rx="52" ry="18" fill="url(#h)" opacity=".5"/><ellipse cx="60" cy="25" rx="44" ry="13" fill="none" stroke="#f5b800" stroke-width="10"/><ellipse cx="60" cy="25" rx="44" ry="13" fill="none" stroke="#ffe36e" stroke-width="6"/><ellipse cx="60" cy="25" rx="44" ry="13" fill="none" stroke="#fffbe6" stroke-width="2.4"/><circle cx="30" cy="16" r="2.6" fill="#fff"/></svg>`,
  blush: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 42"><defs><radialGradient id="b"><stop offset="0" stop-color="#ff5f92" stop-opacity=".9"/><stop offset=".65" stop-color="#ff86ad" stop-opacity=".6"/><stop offset="1" stop-color="#ff9fbf" stop-opacity="0"/></radialGradient></defs><ellipse cx="22" cy="21" rx="21" ry="15" fill="url(#b)"/><ellipse cx="118" cy="21" rx="21" ry="15" fill="url(#b)"/><g stroke="#ff3f7a" stroke-width="2.8" stroke-linecap="round" opacity=".85"><path d="M12 26 L17 16 M20 27 L25 17 M28 26 L33 16"/><path d="M108 26 L113 16 M116 27 L121 17 M124 26 L129 16"/></g></svg>`,
  chef: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 98"><path d="M23 62 C3 60 1 30 23 28 C25 7 51 1 59 18 C69 1 101 5 96 30 C114 33 110 62 89 62 Z" fill="#fff" stroke="#a9a2bf" stroke-width="4.5" stroke-linejoin="round"/><path d="M33 44 C35 33 45 29 52 35 M70 30 C77 24 87 27 88 36" stroke="#ebe6f6" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="23" y="58" width="66" height="32" rx="7" fill="#fff" stroke="#a9a2bf" stroke-width="4.5"/><path d="M41 63 V86 M56 63 V86 M71 63 V86" stroke="#e3dff0" stroke-width="3.5" stroke-linecap="round"/><rect x="23" y="58" width="66" height="8" rx="4" fill="#ffd8ea" opacity=".9"/></svg>`,
  // 新配件（畫法跟上面一樣：粗描邊、上亮下深的漸層、一兩道白色反光）
  clip: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 74">${GRAD}${S('M14 58 L66 58 Q70 58 70 63 Q70 68 66 68 L14 68 Q10 68 10 63 Q10 58 14 58 Z', 'url(#gK)', '#b8155a', 3.5)}${star(40, 33, 30, 'url(#gY)', '#9a5200', 4)}${L('M27 24 Q30 17 36 15', '#fff', 4, 0.85)}${C(48, 36, 3, '#ff86bd')}${C(32, 36, 3, '#ff86bd')}</svg>`,
  bunny: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100">${GRAD}${S('M36 86 C20 62 16 16 31 6 C46 -2 54 40 53 86 Z', 'url(#gW)', '#a9a2bf', 4)}${S('M38 78 C29 60 26 24 33 15 C42 10 46 44 46 78 Z', '#ffc1d9', 'none', 0)}${S('M84 86 C100 62 104 16 89 6 C74 -2 66 40 67 86 Z', 'url(#gW)', '#a9a2bf', 4)}${S('M82 78 C91 60 94 24 87 15 C78 10 74 44 74 78 Z', '#ffc1d9', 'none', 0)}${L('M8 94 Q60 72 112 94', '#b8155a', 11)}${L('M8 94 Q60 72 112 94', '#ff86bd', 7)}${L('M24 30 Q24 18 30 12', '#fff', 3.5, 0.9)}</svg>`,
  beret: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72">${GRAD}${L('M62 14 L64 3', '#8f1d1d', 6)}${S('M8 48 C2 24 40 8 70 11 C102 14 120 28 113 46 C104 60 22 64 8 48 Z', 'url(#gR)', '#8f1d1d', 4.5)}${S('M18 50 Q60 64 104 50 L104 57 Q60 70 18 57 Z', '#c42a2a', '#8f1d1d', 3.5)}${L('M26 30 Q40 18 58 17', '#fff', 4.5, 0.8)}</svg>`,
  heartglasses: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 56"><defs><linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb3d6"/><stop offset="1" stop-color="#ff3f8e"/></linearGradient></defs>${L('M12 16 L2 10 M128 16 L138 10', '#b8155a', 5)}${S('M34 52 C12 40 4 27 8 16 C12 5 28 4 34 15 C40 4 56 5 60 16 C64 27 56 40 34 52 Z', 'url(#k)', '#b8155a', 4.5)}${S('M106 52 C84 40 76 27 80 16 C84 5 100 4 106 15 C112 4 128 5 132 16 C136 27 128 40 106 52 Z', 'url(#k)', '#b8155a', 4.5)}${L('M59 19 Q70 11 81 19', '#b8155a', 5)}${L('M16 18 Q20 11 27 12', '#fff', 4, 0.9)}${L('M88 18 Q92 11 99 12', '#fff', 4, 0.9)}</svg>`,
  tophat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 92">${GRAD}${S('M24 74 L27 12 Q50 4 73 12 L76 74 Z', 'url(#gD)', '#000', 4)}${S('M25.5 52 L74.5 52 L75.3 66 L24.7 66 Z', 'url(#gK)', '#b8155a', 3)}<ellipse cx="50" cy="76" rx="46" ry="10" fill="url(#gD)" stroke="#000" stroke-width="4"/>${L('M34 18 L33 46', '#fff', 4, 0.5)}${star(64, 59, 5, '#fff6a8')}</svg>`,
  flowers: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 62">${GRAD}<ellipse cx="65" cy="32" rx="57" ry="15" fill="none" stroke="#2f8a2a" stroke-width="7"/><ellipse cx="65" cy="32" rx="57" ry="15" fill="none" stroke="#63c94f" stroke-width="4"/>${[[18, 26], [40, 19], [90, 19], [112, 26]].map(([x, y]) => S(`M${x - 6} ${y} Q${x} ${y - 7} ${x + 6} ${y} Q${x} ${y + 4} ${x - 6} ${y} Z`, '#63c94f', '#2f8a2a', 1.6)).join('')}${flower(12, 36, 9, '#ffd0e6', '#ffd23c', '#f0468f')}${flower(34, 44, 10, '#fff', '#ffd23c', '#a9a2bf')}${flower(57, 48, 10.5, '#ffe36e', '#ff86bd', '#e48a00')}${flower(80, 47, 10.5, '#ffd0e6', '#ffd23c', '#f0468f')}${flower(101, 43, 10, '#fff', '#ff86bd', '#a9a2bf')}${flower(119, 35, 9, '#cfe2ff', '#ffd23c', '#5b8ef0')}</svg>`,
  eggshell: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 70">${GRAD}${S('M8 62 C8 22 32 4 55 4 C78 4 102 22 102 62 L92 51 L82 62 L72 51 L62 62 L55 53 L48 62 L38 51 L28 62 L18 51 Z', 'url(#gC)', '#b39a6a', 4)}${C(70, 22, 4, '#f1dfb6')}${C(82, 36, 3, '#f1dfb6')}${C(40, 18, 2.6, '#f1dfb6')}${L('M22 34 Q26 18 40 11', '#fff', 5, 0.9)}</svg>`,
  santa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 100">${GRAD}${S('M14 72 C20 42 46 12 76 10 C92 9 101 20 98 34 C88 30 82 42 80 72 Z', 'url(#gR)', '#8f1d1d', 4.5)}${L('M36 34 Q50 18 68 14', '#fff', 4, 0.55)}<rect x="6" y="64" width="98" height="22" rx="11" fill="url(#gW)" stroke="${WS}" stroke-width="4"/>${C(98, 37, 10, 'url(#gW)', WS, 4)}${L('M18 70 Q30 67 40 69', '#fff', 3, 0.9)}</svg>`,
};

// ---------- 玩偶造型（畫在地圖左下角頭像、衣櫃預覽、陪玩）----------
// 座標：0–100 對齊薯餅照片的方框；back 畫在薯餅後面（披風），front 畫在前面。SVG 的 viewBox 是 -6 -6 112 112，比方框大一點，裝飾可以稍微超出去
// 太空頭盔（11/24 換新）：帽子（兜帽＋面罩＋耳罩＋天線）和胸前面板分開畫，對位時兩塊各自移動
const HELM = {
  hood: S('M23.5 41 Q20 3.5 50 3.5 Q80 3.5 76.5 41 L69.5 41 Q71 22.5 50 22 Q29 22.5 30.5 41 Z', 'url(#gW)', WS, 1.6) + L('M27 36 Q26 26 29 19', '#5b8ef0', 2.2, 0.85) + L('M73 36 Q74 26 71 19', '#5b8ef0', 2.2, 0.85),
  visor: S('M29.5 21.5 Q30 9 50 8.5 Q70 9 70.5 21.5 Q50 15.5 29.5 21.5 Z', 'url(#gV)', '#3d7fc4', 1.3) + L('M35 15 Q40 11.6 47 11', '#fff', 1.6, 0.9) + C(61, 12.5, 1, '#fff').replace('/>', ' opacity=".8"/>'),
  ears: [24.5, 75.5].map(x => C(x, 35, 5.6, 'url(#gB)', '#2c55b8', 1.3) + C(x, 35, 2.8, '#e6f1ff', '#2c55b8', 0.7)).join(''),
  ant: L('M68 12 L74.5 4', '#8b86a6', 1.6) + C(75, 3.3, 2.4, 'url(#gR)', '#8f1d1d', 1) + C(74.3, 2.5, 0.7, '#fff'),
  panel: S('M38.5 57 Q38.5 53.5 42 53.5 L58 53.5 Q61.5 53.5 61.5 57 L61.5 66.5 Q61.5 70 58 70 L42 70 Q38.5 70 38.5 66.5 Z', 'url(#gW)', WS, 1.4) + C(44, 59, 2, 'url(#gR)', '#8f1d1d', 0.7) + C(50, 59, 2, 'url(#gY)', '#9a5200', 0.7) + C(56, 59, 2, 'url(#gB)', '#1d3c80', 0.7) + L('M43 65 L57 65', '#8b86a6', 1.8, 0.6),
};
const OUTFITS = {
  none: { back: '', front: '' },
  sailor: { back: '', front: S('M33 21 Q33 7 50 7 Q67 7 67 21 Z', 'url(#gW)', WS) + L('M34 18 Q50 12 66 18', '#2c55b8', 2.6) + S('M27 22 Q50 14 73 22 Q74 27.5 50 24.5 Q26 27.5 27 22 Z', 'url(#gW)', WS) + L('M39 11 Q43 9 47 9', '#fff', 1.6, 0.9) + S('M34 50.5 Q50 56 66 50.5 L52 69 Q50 71 48 69 Z', 'url(#gB)', '#1d3c80') + L('M38.5 53.5 Q50 58.5 61.5 53.5', '#fff', 1.3, 0.9) + C(50, 56.5, 3.3, 'url(#gR)', '#8f1d1d', 1.2) },
  snow: { back: '', front: S('M30 24 Q30 6 50 6 Q70 6 70 24 Z', 'url(#gR)', '#8f1d1d') + L('M40 9 L39 20 M50 7 L50 20 M60 9 L61 20', '#fff', 1.2, 0.45) + S('M28.5 19 L71.5 19 Q73 22.7 71.5 26.5 L28.5 26.5 Q27 22.7 28.5 19 Z', 'url(#gW)', WS, 1.5) + C(50, 5.2, 5, 'url(#gW)', WS, 1.5) + S('M29 49 Q50 58 71 49 L72 56 Q50 66 28 56 Z', 'url(#gR)', '#8f1d1d') + L('M36 53 L37 59.5 M46 55.5 L46.5 62 M56 55.3 L56 61.7 M64 52.5 L64.5 58.7', '#fff', 2, 0.85) + S('M59 57 L67 74 L60 76 L54 59 Z', 'url(#gR)', '#8f1d1d') + L('M60.5 76 L60 79 M63.3 75.2 L63.3 78.2 M66 74.2 L66.6 77', '#8f1d1d', 1.2) },
  night: { back: '', front: S('M31 23 Q32 5 55 6 Q75 7 85 24 Q76 17 68 15 Q70 19 69 23 Z', 'url(#gB)', '#1d3c80') + star(45, 13, 2.6, '#fff6a8') + star(58, 10, 2, '#fff6a8') + star(73, 15, 1.8, '#fff6a8') + star(62, 19, 1.5, '#fff6a8') + S('M29 21 Q50 15 71 21 L71 27 Q50 21 29 27 Z', 'url(#gW)', WS, 1.5) + C(86, 26, 4.5, 'url(#gY)', '#9a5200', 1.4) + '<text x="17" y="17" font-size="9" font-weight="900" fill="#5b8ef0" stroke="#fff" stroke-width="2" paint-order="stroke" font-family="GenSenRounded,PingFang TC,Noto Sans TC,sans-serif">z</text><text x="10" y="9" font-size="6.5" font-weight="900" fill="#5b8ef0" stroke="#fff" stroke-width="1.6" paint-order="stroke" font-family="GenSenRounded,PingFang TC,Noto Sans TC,sans-serif">z</text>' },
  party: { back: '', front: S('M39 21 L50 2 L61 21 Q50 24 39 21 Z', 'url(#gK)', '#b8155a') + L('M45.5 12 L53.5 9.5 M42 18.5 L57.5 14', '#fff', 2, 0.8) + C(47, 16.5, 1.3, '#ffd23c') + C(54, 18.6, 1.3, '#5b8ef0') + C(51, 11.5, 1.1, '#63c94f') + C(50, 3, 3.5, 'url(#gY)', '#9a5200', 1.3) + S('M50 54 L38.5 48.5 Q36.5 54 38.5 59.5 Z', 'url(#gB)', '#1d3c80') + S('M50 54 L61.5 48.5 Q63.5 54 61.5 59.5 Z', 'url(#gB)', '#1d3c80') + C(50, 54, 3, 'url(#gB)', '#1d3c80', 1.4) + C(42, 52, 1.1, '#fff') + C(58.5, 56, 1.1, '#fff') + C(41.5, 56.5, 1, '#fff') + C(58, 51.5, 1, '#fff') },
  berry: { back: '', front: S('M29 24 Q28 5 50 5 Q72 5 71 24 Q50 19 29 24 Z', 'url(#gR)', '#8f1d1d') + [[38, 13], [46, 10], [55, 10.5], [63, 14], [42, 18.5], [51, 16], [59, 19], [34, 19.5], [66, 20]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.1" ry="1.6" fill="#ffe27a"/>`).join('') + S('M37 8.5 L42.5 2.5 L46.5 7 L50 0.8 L53.5 7 L57.5 2.5 L63 8.5 Q50 12.5 37 8.5 Z', 'url(#gG)', '#1f6a1f', 1.4) + L('M35 12 Q38 9 41 9', '#fff', 1.5, 0.7) },
  space: { back: '', front: '', head: HELM.hood + HELM.visor + HELM.ears + HELM.ant, body: HELM.panel, defs: '<defs>' + lg('gV', [[0, '#d9f3ff'], [0.5, '#8fd0f7'], [1, '#4b97d6']]) + '</defs>' },   // 帽子、胸前面板分開對位
  detective: { back: '', front: S('M31 22 Q31 7 50 7 Q69 7 69 22 Z', 'url(#gN)', '#5a3412') + L('M40 9 L40 21 M50 7 L50 21 M60 9 L60 21 M32 14 L68 14', '#5a3412', 1, 0.35) + S('M29 21 Q50 16.5 71 21 Q67 27.5 50 26 Q33 27.5 29 21 Z', 'url(#gN)', '#5a3412') + C(50, 7.2, 1.8, '#7a4a1f') + L('M13 65 L20 75', '#7a4a1f', 3.2) + C(9.5, 58.5, 7, 'url(#gGlass)', '#e4a400', 2.6) + L('M6 55 Q8 53 10.5 53', '#fff', 1.4, 0.9) },
  chef: { back: '', front: S('M37 58.5 Q50 55.5 63 58.5 L66 85 Q50 90.5 34 85 Z', 'url(#gW)', '#a9a2bf') + L('M38.5 58.8 L36.5 51.5 M61.5 58.8 L63.5 51.5', '#a9a2bf', 1.6) + S('M50 76 Q44 71 46 68 Q48 66 50 68.5 Q52 66 54 68 Q56 71 50 76 Z', 'url(#gK)', '#b8155a', 1.2) + S('M35.5 22 L36.5 15 Q50 13 63.5 15 L64.5 22 Q50 24 35.5 22 Z', 'url(#gW)', '#a9a2bf') + S('M36.5 16 Q28 10.5 34 4.5 Q38.5 -0.5 45 2.3 Q50 -1.8 55.5 2.3 Q62 -0.5 66 4.5 Q72 10.5 63.5 16 Z', 'url(#gW)', '#a9a2bf') + L('M40 8 Q42 5 45 5', '#fff', 1.6, 0.9) },
  wizard: { back: '', front: '<ellipse cx="50" cy="21" rx="26" ry="5.5" fill="url(#gP)" stroke="#3e1a80" stroke-width="1.6"/>' + S('M36 20 Q42 10 47 3 Q53 -1.5 58.5 4 Q55 5.5 55.5 9 Q60 15 64 20 Q50 23 36 20 Z', 'url(#gP)', '#3e1a80') + L('M37.5 17.5 Q50 21 62.5 17.5', '#ffd23c', 2.6) + star(51, 11, 3.4, '#ffe36e', '#9a5200', 0.8) + L('M86 72 L94 51', '#7a4a1f', 2.6) + star(94.5, 47, 5.5, 'url(#gY)', '#9a5200', 1.3) + C(86, 44, 1, '#fff') + C(98, 57, 0.9, '#fff') },
  king: {
    back: S('M24 46 Q50 38 76 46 L92 90 Q50 99 8 90 Z', 'url(#gR)', '#8f1d1d', 1.8) + L('M30 52 L18 86', '#fff', 1.6, 0.35),
    front: S('M28 48 Q50 58 72 48 Q74 56 50 64 Q26 56 28 48 Z', 'url(#gW)', '#a9a2bf') + [[36, 54], [44, 58], [56, 58], [64, 54], [50, 60.5]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1" ry="1.6" fill="#3a2440"/>`).join('') + S('M35 21 L33 8 L42 14 L50 3 L58 14 L67 8 L65 21 Z', 'url(#gY)', '#9a5200') + C(50, 16, 2.3, 'url(#gR)', '#8f1d1d', 0.9) + C(41, 17.5, 1.5, '#5b8ef0') + C(59, 17.5, 1.5, '#63c94f') + L('M37 18 L36 11', '#fff', 1.6, 0.75),
  },
  pumpkin: { back: '', front: S('M30 23 Q28 6 50 6 Q72 6 70 23 Q50 18 30 23 Z', 'url(#gO)', '#8a3a00') + L('M40 8 Q36.5 15 38.5 21 M50 6.5 L50 19 M60 8 Q63.5 15 61.5 21', '#c85a00', 1.3, 0.75) + S('M48 7 Q47 1 52 -1 L54 1 Q51 3 52 7 Z', 'url(#gN)', '#5a3412', 1.2) + S('M53 3 Q60 -3.5 66 1.5 Q60 7 53 3 Z', 'url(#gG)', '#1f6a1f', 1.2) + L('M35 14 Q38 9 43 8', '#fff', 1.5, 0.7) + S('M39 52 Q50 57 61 52 L57 60 Q50 63 43 60 Z', 'url(#gO)', '#8a3a00', 1.3) + star(50, 57.5, 2.2, '#fff6a8') },
  dino: { back: '', front: S('M35 10 L37 0.5 L43 6 Z', 'url(#gY)', '#9a5200', 1.2) + S('M45 5 L50 -4 L55 5 Z', 'url(#gY)', '#9a5200', 1.2) + S('M57 6 L63 0.5 L65 10 Z', 'url(#gY)', '#9a5200', 1.2) + S('M27 26 Q26 4 50 4 Q74 4 73 26 Q50 20 27 26 Z', 'url(#gG)', '#1f6a1f') + C(41, 11, 1.6, '#1f6a1f') + C(59, 11, 1.6, '#1f6a1f') + L('M33 14 Q36 8 42 7', '#fff', 1.5, 0.7) + [33, 39, 45, 55, 61, 67].map(x => S(`M${x - 2.4} ${x < 50 ? 23.6 + (50 - x) * 0.04 : 23.6 + (x - 50) * 0.04} L${x} 28 L${x + 2.4} ${x < 50 ? 23.2 + (50 - x) * 0.04 : 23.2 + (x - 50) * 0.04} Z`, '#fff', '#1f6a1f', 0.9)).join('') },
  painter: { back: '', front: L('M50 6 L51 1.5', '#8f1d1d', 2.6) + S('M28 20 Q24 8 46 6 Q70 5 74 15 Q74 22 62 22 Q45 25 28 20 Z', 'url(#gR)', '#8f1d1d') + L('M33 13 Q38 8 46 8', '#fff', 1.5, 0.75) + S('M4 64 Q3 55 13.5 55 Q24 55 24 63 Q24 68 19 67 Q15 66 15 70 Q15 74 10 73 Q4 71 4 64 Z', '#f3d9b5', '#7a4a1f', 1.4) + C(8.5, 61, 1.9, '#ff5a5a') + C(13.5, 58.5, 1.9, '#ffd23c') + C(19, 60, 1.9, '#5b8ef0') + C(9.5, 67, 1.9, '#63c94f') + L('M22 76 L31.5 61', '#7a4a1f', 2.2) + S('M30.6 62.4 L33.8 56.5 L34.6 60.6 Z', '#ff86bd', '#b8155a', 0.9) },
};
// ---------- 角色對位表：別隻玩偶穿薯餅的造型 ----------
// 造型是照薯餅畫的。穿在玩偶身上時，y < split 的部分（帽子）和下面的部分（領子、披風、道具）各自位移縮放，
// 對到那隻玩偶的頭頂和身體。head、body 可以是 transform 字串，或 { x, y, s, r, w }（造型對齊台存下來的數值）：
//   以帽子中心 (50, 24)、衣服中心 (50, 60) 為準，往右 x、往下 y、放大 s 倍、轉 r 度、寬度再乘 w。
// 沒寫 head 也沒寫 body 的造型照原圖畫。per 裡個別調；all = 整套用同一個 transform（不切上下）。
// 帽子和衣服分開畫的造型（OUTFITS 裡有 head、body，例如太空頭盔）不切上下，兩塊各自套 head、body。
// skip：怎麼調都怪、先不穿的造型（衣櫃預覽會出「蛋黃哥這套還在做」）
const OUTFIT_FIT = {
  sloth: {
    split: 36,
    per: {   // 造型對齊台（11/24）的數值；沒寫的那一半照原圖
      sailor: { head: { x: 3, y: -8.5, s: 1, r: -5 }, body: { x: 6.5, y: -2.5, s: 1, r: -5 } },
      night: { head: { x: 3, y: -7.5, s: 1, r: -5 } },
      party: { head: { x: 1, y: -6.5, s: 0.88, r: -10 }, body: { x: 7.5, y: -0.5, s: 1, r: -10 } },
      berry: { head: { x: 2.5, y: -4.5, s: 1, r: -5 } },
      snow: { head: { x: 3, y: -6, s: 1, r: -5 }, body: { x: 7.5, y: 1, s: 1, r: -5 } },
      space: { head: { x: 3.5, y: -4, s: 1, r: -5, w: 1.08 }, body: { x: 6.5, y: 0, s: 1, r: -5 } },
      detective: { head: { x: 3, y: -2, s: 1, r: -10 }, body: { x: 1, y: -0.5, s: 1, r: 0 } },
      chef: { head: { x: 1.5, y: -6, s: 0.92, r: -10 }, body: { x: 6, y: -3, s: 1.02, r: -5 } },
      pumpkin: { head: { x: 2, y: -4.5, s: 1, r: -10 }, body: { x: 7, y: -1, s: 1, r: -5 } },
      wizard: { head: { x: 1.5, y: -7, s: 0.9, r: -10 }, body: { x: 3, y: 4, s: 1, r: 0 } },
      king: { head: { x: 0, y: -4.5, s: 1, r: -10 }, body: { x: 7.5, y: -1, s: 1, r: -5 } },
      dino: { head: { x: 3, y: 0, s: 1, r: -10 } },   // 恐龍下半身沒有圖，衣服的值不套
      painter: { head: { x: 2, y: 3, s: 1, r: -10 } },
    },
    skip: [],
  },
  egg: {
    split: 36,
    head: 'translate(50 21) scale(1.12) translate(-50 -24)',
    body: 'translate(0 -2)',
    per: {   // 造型對齊台（11/24）的數值；沒寫 body 的照上面的 body（往上 2）
      sailor: { head: { x: 8.5, y: -18, s: 0.66, r: 0 }, body: { x: 6, y: 0, s: 1, r: 0 } },
      night: { head: { x: 8, y: -13, s: 0.82, r: 0 } },
      party: { head: { x: -5.5, y: -14.5, s: 0.62, r: -30 }, body: { x: 6.5, y: -2, s: 1, r: 0 } },   // 蝴蝶結移到正中間（11/25 使用者選 A）
      berry: { head: { x: 8.5, y: -12.5, s: 0.7, r: 0 } },
      snow: { head: { x: 7, y: -14, s: 0.6, r: 0 }, body: { x: 8, y: -2, s: 1, r: 0 } },
      space: { head: { x: 7, y: -13.5, s: 0.7, r: 0, w: 1.7 }, body: { x: 6.5, y: 6.5, s: 1.1, r: 0 } },
      detective: { head: { x: 8, y: -18.5, s: 0.61, r: 0 }, body: { x: 8, y: -16.5, s: 1, r: 0 } },
      chef: { head: { x: 7.5, y: -14, s: 0.63, r: 0 }, body: { x: 8, y: -6, s: 1.45, r: 0 } },
      pumpkin: { head: { x: 7.5, y: -17, s: 0.55, r: 0 }, body: { x: 7, y: 1.5, s: 1, r: 0 } },
      wizard: { head: { x: 7, y: -18, s: 0.5, r: 0 } },
      king: { head: { x: 6.5, y: -17, s: 0.55, r: 0 }, body: { x: 6, y: 1, s: 1, r: 0 } },
      dino: { head: { x: 29, y: -13.5, s: 0.5, r: 39 } },   // 恐龍下半身沒有圖，衣服的值不套
      painter: { head: { x: 7, y: -15.5, s: 0.5, r: 0 } },
    },
    skip: [],
  },
};
const outfitKey = id => String(id || '').replace(/^outfit\./, '');
const outfitSkipped = (id, who) => { const f = OUTFIT_FIT[who]; return !!(f && f.skip.includes(outfitKey(id))); };
const r2 = n => Math.round(n * 100) / 100;
// 對齊台的換算：translate(50+x, 中心+y) rotate(r) scale(s*w, s) translate(-50, -中心)
function fitTf(v, py) {
  if (typeof v === 'string') return v;
  const s = v.s == null ? 1 : v.s, w = v.w == null ? 1 : v.w;
  return `translate(${r2(50 + (v.x || 0))} ${r2(py + (v.y || 0))})${v.r ? ` rotate(${r2(v.r)})` : ''} scale(${r2(s * w)} ${r2(s)}) translate(-50 -${py})`;
}
const wrap = (v, py, inner) => v ? `<g transform="${fitTf(v, py)}">${inner}</g>` : inner;
function fitBody(body, k, who) {
  const f = OUTFIT_FIT[who];
  if (!f) return body;
  const p = Object.assign({ head: f.head, body: f.body }, f.per[k]);
  if (p.all) return wrap(p.all, 35, body);
  if (!p.head && !p.body) return body;
  const sp = p.split || f.split;
  return `<clipPath id="fu"><rect x="-60" y="-60" width="220" height="${sp + 60}"/></clipPath><clipPath id="fd"><rect x="-60" y="${sp}" width="220" height="${160 - sp}"/></clipPath>`
    + wrap(p.head, 24, `<g clip-path="url(#fu)">${body}</g>`) + wrap(p.body, 60, `<g clip-path="url(#fd)">${body}</g>`);
}
// 帽子、衣服分開畫的造型：front 畫兩塊（各自對位），back 照常
function fitParts(o, k, who) {
  const f = OUTFIT_FIT[who], p = (f && f.per[k]) || {};
  return wrap(p.head, 24, o.head || '') + wrap(p.body, 60, o.body || '');
}
// who：'sloth'（預設）或 'egg'；SVG 各自是一張圖，clipPath 的 id 不會跟別張撞
function outfitSvg(id, layer, who = 'sloth') {
  const k = outfitKey(id), o = OUTFITS[k];
  if (!o || outfitSkipped(k, who)) return '';
  if (layer === 'front' && (o.head || o.body)) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 112 112">${GRAD}${o.defs || ''}${fitParts(o, k, who)}</svg>`;
  const body = o[layer];
  if (!body) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 112 112">${GRAD}${o.defs || ''}${fitBody(body, k, who)}</svg>`;
}

// ---------- 小窩加的 ----------
// 龍龍：蛋蛋島沒有這隻，照小窩的 img/dino.png 量（2026-11-28 換成 3D 掃描的新圖後重量；臉偏左，因為取景是 3/4 側面）
TOY_FACE.dino = { x: 0.39, top: 0.08, eyes: 0.6, cheeks: 0.7, w: 0.5 };
// 龍龍沒有脖子，圍巾照原本的大小會橫過整個身體，像腰帶：縮小，只圍在嘴巴下面（圍巾在 js/season.js）
ACCESSORY_TUNING.dino = { scarf: { offsetX: 0, offsetY: 0, scale: 0.75, rot: 0 } };
// 彈跳豬：小窩的圖只有頭，蝴蝶結照蛋蛋島會掉到下巴外面，改戴在右耳旁邊
ACCESSORY_TUNING.moodeng.bow = { offsetX: 0.02, offsetY: 0.06, scale: 0.78, rot: 18 };
return { TOY_FACE, ACCESSORY_PLACE, ACCESSORY_TUNING, accTune, ACCESSORY_SVG, OUTFITS, OUTFIT_FIT, outfitSvg, outfitSkipped };
})();
