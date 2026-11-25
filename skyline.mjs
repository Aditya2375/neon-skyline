// New York night skyline from a GitHub contribution calendar.
// Each tower is one week. Its seven window columns are the days of that week, and the lit windows
// in a column rise with that day's commits. One landmark layer sits behind the data towers.
// Usage: GITHUB_TOKEN=... node skyline.mjs <login> [out.svg]     (or CALENDAR_JSON=file.json)
import { writeFileSync, readFileSync } from 'node:fs';

const login = process.argv[2];
const out = process.argv[3] || 'skyline.svg';
if (!login) { console.error('usage: node skyline.mjs <login> [out.svg]'); process.exit(1); }

async function fetchCalendar() {
  if (process.env.CALENDAR_JSON) return JSON.parse(readFileSync(process.env.CALENDAR_JSON, 'utf8'));
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `query($l:String!){user(login:$l){name contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount weekday}}}}}}`, variables: { l: login } }),
  });
  if (!res.ok) throw new Error('GitHub API ' + res.status);
  const j = await res.json();
  if (!j.data || !j.data.user) throw new Error('user not found');
  return j;
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rng = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const f1 = (n) => n.toFixed(1);

const data = (await fetchCalendar()).data.user;
const cal = data.contributionsCollection.contributionCalendar;
const weeks = cal.weeks.map((w) => { const d = new Array(7).fill(0); const days = w.contributionDays; const off = days.length < 7 && days[0].weekday !== undefined ? days[0].weekday : (days.length < 7 && w === cal.weeks[0] ? 7 - days.length : 0); days.forEach((x, i) => { d[(x.weekday !== undefined ? x.weekday : off + i)] = x.contributionCount; }); return { d, total: d.reduce((a, b) => a + b, 0), from: days[0].date, to: days[days.length - 1].date }; });
const name = (data.name || login).toUpperCase();
const W = 1400, H = 540, base = 420, shore = 436, L = 28, Rr = 28;
const bw = (W - L - Rr) / weeks.length;
const maxWeek = Math.max(...weeks.map((w) => w.total), 1);
const maxDay = Math.max(...weeks.flatMap((w) => w.d), 1);
const R = rng(11);
const n1 = (v) => Math.round(v * 10) / 10;

// ---------- sky
let stars = '';
for (let i = 0; i < 130; i++) stars += `<circle cx="${f1(R() * W)}" cy="${f1(R() * 250)}" r="${(R() * 1.0 + 0.25).toFixed(2)}" class="st" style="animation-delay:${(R() * 5).toFixed(2)}s"/>`;
const clouds = `<g class="cl"><ellipse cx="260" cy="130" rx="190" ry="9"/><ellipse cx="330" cy="142" rx="120" ry="6"/><ellipse cx="900" cy="95" rx="230" ry="8"/><ellipse cx="980" cy="108" rx="140" ry="5"/><ellipse cx="620" cy="190" rx="170" ry="7"/></g>`;

// ---------- depth layers: far and mid city as lit silhouettes
function hazeLayer(seed, cls, minH, maxH, winP, gap) {
  const r = rng(seed); let x = -10, out = '', win = '';
  while (x < W + 10) {
    const w = 12 + r() * 30, h = minH + r() * (maxH - minH), y = base - h;
    out += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}"/>`;
    if (r() < 0.35) out += `<rect x="${f1(x + w * 0.25)}" y="${f1(y - 8 - r() * 8)}" width="${f1(w * 0.5)}" height="${f1(12)}"/>`;
    if (r() < 0.18) out += `<rect x="${f1(x + w / 2 - 0.5)}" y="${f1(y - 24)}" width="1" height="24"/>`;
    for (let yy = y + 6; yy < base - 4; yy += 6) for (let xx = x + 3; xx < x + w - 3; xx += 4.5) if (r() < winP) win += `<rect x="${f1(xx)}" y="${f1(yy)}" width="1.6" height="2"/>`;
    x += w + r() * gap;
  }
  return `<g class="${cls}">${out}</g><g class="${cls}w">${win}</g>`;
}
const far = hazeLayer(3, 'far', 60, 190, 0.05, 3);
const mid = hazeLayer(9, 'mid', 80, 230, 0.11, 6);

// ---------- facade helpers (landmarks)
const dots = (w, top, bot, seed, p = 0.3, x0 = null) => { const r = rng(seed); let o = ''; for (let y = top; y < bot; y += 6) for (let x = (x0 === null ? -w + 3 : x0); x <= w - 4; x += 4.6) if (r() < p) o += `<rect class="lw" x="${f1(x)}" y="${-y}" width="1.8" height="2.6"/>`; return o; };
const lm = (cx, parts) => `<g transform="translate(${cx} ${base})">${parts}</g>`;
const solid = (d, tex, op = 0.6) => `<path class="lm" d="${d}"/><path d="${d}" fill="url(#${tex})" opacity="${op}"/><path d="${d}" fill="url(#shadeH)" opacity=".85"/><path d="${d}" fill="url(#glowV)" opacity=".7"/>`;
const strip = (x0, x1, y0, y1, cls) => `<rect class="${cls}" x="${x0}" y="${y1}" width="${x1 - x0}" height="${y0 - y1}"/>`;

const ESB = lm(540, `
${solid('M-64 0V-22H-56V-30H-44V-126H-37V-160H-29V-190H-21V-214H-14V-232H-8V-246H-3V-282H3V-246H8V-232H14V-214H21V-190H29V-160H37V-126H44V-30H56V-22H64V0Z', 'tLime', .8)}
<path d="M-44 -30V-126M-37 -126V-160M-29 -160V-190" class="pil"/>
<path class="pil2" d="M-40 -30V-126M-30 -30V-126M-20 -30V-126M-10 -30V-126M0 -30V-246M10 -30V-126M20 -30V-126M30 -30V-126M40 -30V-126M-33 -126V-160M-22 -126V-160M-11 -126V-160M11 -126V-160M22 -126V-160M33 -126V-160M-25 -160V-190M-12 -160V-190M12 -160V-190M25 -160V-190"/>
${dots(42, 31, 122, 21, .42)}${dots(34, 128, 158, 31, .32)}${dots(27, 162, 188, 32, .26)}
<rect x="-14" y="-246" width="28" height="32" fill="url(#flood)" opacity=".32"/><rect x="-8" y="-246" width="16" height="14" fill="url(#flood)" opacity=".45"/>
<path class="stripe" d="M-44 -126H44M-37 -160H37M-29 -190H29M-21 -214H21"/>
<rect x="-1" y="-318" width="2" height="38" fill="#cfd6ee"/><rect x="-3" y="-296" width="6" height="2" fill="#ff5a4d" opacity=".8"/><circle class="beaconlamp" cx="0" cy="-306" r="3"/>`);
const CHR = lm(405, `
${solid('M-31 0V-176H-27V-196H-23V-212H-19V-226H-12C-14 -240 -10 -258 0 -290C10 -258 14 -240 12 -226H19V-212H23V-196H27V-176H31V0Z', 'tBrick', .55)}
<path class="band" d="M-31 -60H31M-31 -120H31M-31 -150H31"/><path class="pil2" d="M-24 0V-176M-16 0V-176M-8 0V-176M0 0V-176M8 0V-176M16 0V-176M24 0V-176"/>
${dots(28, 8, 172, 22, .34)}
<g class="steel"><path d="M-17 -226C-14 -244 -8 -262 0 -282C8 -262 14 -244 17 -226" fill="none"/><path d="M-12 -226C-10 -240 -5 -254 0 -268C5 -254 10 -240 12 -226" fill="none"/><path d="M-8 -226C-6 -236 -3 -246 0 -256C3 -246 6 -236 8 -226" fill="none"/><path d="M-4 -226C-3 -232 -1 -238 0 -244C1 -238 3 -232 4 -226" fill="none"/></g>
<g class="arcw"><path d="M-15 -228C-12 -244 -7 -260 0 -278C7 -260 12 -244 15 -228" fill="none"/><path d="M-10 -228C-8 -240 -4 -252 0 -264C4 -252 8 -240 10 -228" fill="none"/><path d="M-6 -228C-4 -236 -2 -243 0 -250C2 -243 4 -236 6 -228" fill="none"/></g>
<path class="steel" d="M-19 -212H19M-23 -196H23M-27 -176H27" fill="none"/>
<path class="eagle" d="M-27 -197l-7 -3l5 -5zM27 -197l7 -3l-5 -5zM-23 -213l-6 -1l5 -5zM23 -213l6 -1l-5 -5z"/>
<path class="steel" d="M0 -290V-316" fill="none"/>`);
const facets = (xs, y0, y1, a, b) => xs.slice(0, -1).map((x, i) => strip(x, xs[i + 1], y0, y1, i % 2 ? a : b)).join('');
const WTC = lm(930, `
${solid('M-37 0V-242L-31 -262H31L37 -242V0Z', 'tGlass', .7)}
${facets([-37, -18.5, 0, 18.5, 37], 0, -242, 'fa', 'fb')}
<path class="lm" d="M-31 -262L-12 -258L0 -262L12 -258L31 -262L25 -268H-25Z" opacity=".8"/>
<path class="lm" d="M-3.5 -268L0 -356L3.5 -268Z"/>
<path class="band" d="M-37 -120H37M-37 -60H37M-37 -180H37"/>
${dots(35, 8, 236, 23, .36)}
<circle class="beaconlamp" cx="0" cy="-352" r="2.8"/>`);
const WOOL = lm(800, `
${solid('M-46 0V-72H-42V-80H-24V-168H-20V-176H-17V-186H-14V-200H-8V-216L0 -246L8 -216V-200H14V-186H17V-176H20V-168H24V-80H42V-72H46V0Z', 'tLime', .8)}
<path class="pil2" d="M-20 -80V-170M-12 -80V-186M-4 -80V-200M4 -80V-200M12 -80V-186M20 -80V-170M-40 0V-72M-30 0V-72M-20 0V-72M20 0V-72M30 0V-72M40 0V-72"/>
<path class="cu" d="M-8 -216L0 -246L8 -216Z"/><path class="cu" d="M-26 -168l3 -16l3 16zM20 -168l3 -16l3 16z"/><path class="steel" d="M0 -246V-264" fill="none"/>
<path class="gr" d="M-24 -168H24M-24 -130H24M-24 -100H24"/>${dots(22, 84, 164, 24, .34)}${dots(40, 6, 68, 25, .3)}`);
const CITI = lm(150, `
<rect class="leg" x="-24" y="-30" width="5" height="30"/><rect class="leg" x="19" y="-30" width="5" height="30"/><rect class="leg" x="-2.5" y="-30" width="5" height="30"/>
${solid('M-31 -30V-215L31 -242V-30Z', 'tGlass', .8)}<path class="pil2" d="M-24 -30V-218M-16 -30V-220M-8 -30V-224M0 -30V-227M8 -30V-229M16 -30V-233M24 -30V-237"/>
${dots(29, 34, 210, 25, .32)}<path class="lm" d="M-31 -215L31 -242L31 -246L-31 -219Z" opacity=".7"/>`);
const FLAT = lm(62, `
<path class="lm" d="M-8 0V-104L-3 -110H8L12 -104V0Z"/><path d="M-8 0V-104L-3 -110H8L12 -104V0Z" fill="url(#tLime)" opacity=".8"/>
<path class="lm2" d="M12 0V-104L44 -92V0Z"/><path d="M12 0V-104L44 -92V0Z" fill="url(#tLime)" opacity=".5"/>
<rect class="cor" x="-11" y="-113" width="26" height="3"/><path class="band" d="M-8 -32H12M-8 -64H12M-8 -90H12M12 -30H44M12 -62H44"/>
${dots(10, 6, 100, 26, .36, -6)}<g transform="translate(12 0) skewY(14)">${dots(32, 6, 80, 27, .3, 2)}</g>`);
const PARK = lm(690, `
${solid('M-11 0V-322H11V0Z', 'tSq', 1)}<rect class="void" x="-11" y="-82" width="22" height="5"/><rect class="void" x="-11" y="-162" width="22" height="5"/><rect class="void" x="-11" y="-242" width="22" height="5"/>
${dots(9, 6, 316, 27, .25, -9)}<circle class="beaconlamp" cx="0" cy="-326" r="1.8"/>`);
const BOA = lm(1085, `
${solid('M-28 0V-214L-22 -226L-16 -238L-10 -252L-4 -266L0 -308L4 -266L10 -252L16 -238L22 -226L28 -214V0Z', 'tGlass', .8)}
${facets([-28, -14, 0, 14, 28], 0, -214, 'fa', 'fb')}
<path class="steel" d="M0 -308V-330" fill="none"/>${dots(25, 8, 210, 28, .34)}<path class="band" d="M-28 -214H28M-22 -226H22M-16 -238H16"/>`);
const ROCK = lm(630, `
${solid('M-32 0V-176H-27V-202H-22V-224H-16V-238H16V-224H22V-202H27V-176H32V0Z', 'tLime', .8)}
<path class="pil2" d="M-28 0V-176M-20 0V-176M-12 0V-176M-4 0V-176M4 0V-176M12 0V-176M20 0V-176M28 0V-176M-20 -176V-224M-10 -176V-238M0 -176V-238M10 -176V-238M20 -176V-224"/>
${dots(30, 8, 172, 34, .36)}${dots(24, 178, 224, 35, .3)}<rect x="-16" y="-238" width="32" height="3" class="cor"/><rect x="-14" y="-246" width="28" height="8" class="lm"/><rect x="-12" y="-250" width="24" height="3" fill="#ffcf9a" opacity=".7"/>`);
const VAND = lm(1010, `
${solid('M-20 0V-250L-14 -268L-8 -284L-3 -300L0 -330L3 -300L8 -284L14 -268L20 -250V0Z', 'tGlass', .8)}
${facets([-20, -10, 0, 10, 20], 0, -250, 'fa', 'fb')}${dots(18, 8, 246, 36, .34)}<circle class="beaconlamp" cx="0" cy="-326" r="1.8"/>`);
const UN = lm(1190, `
${solid('M-36 0V-150H36V0Z', 'tGreen', .9)}<rect class="mar" x="36" y="-150" width="9" height="150"/>
<path class="band" d="M-36 -30H36M-36 -60H36M-36 -90H36M-36 -120H36"/>${dots(34, 8, 146, 29, .3)}
<path class="lm" d="M-100 0V-18Q-100 -34 -76 -34Q-52 -34 -52 -18V0Z"/><path d="M-100 0V-18Q-100 -34 -76 -34Q-52 -34 -52 -18V0Z" fill="url(#tLime)" opacity=".6"/>`);
const PAN = lm(1290, `
${solid('M-28 0V-172L-18 -184H18L28 -172V0Z', 'tGlass', .8)}${dots(25, 8, 168, 30, .3)}<path class="steel" d="M0 -184V-198" fill="none"/>`);
const LIB = (() => { // Statue of Liberty on the water, small
  return `<g class="lib" transform="translate(1350 ${shore + 4}) scale(.55)"><path d="M-14 0H14L11 -14H-11Z" fill="#0e1330"/><path d="M-9 -14H9V-28H-9Z" fill="#1a2152"/><path d="M-5 -28H5L4 -50 L7 -62 L0 -66 L-7 -62 L-4 -50Z" fill="#2f8f7d"/><path d="M5 -50L12 -66L14 -50Z" fill="#2f8f7d"/><path d="M12 -66l1.5 -9l1.5 9z" fill="#ffd98a"/><path d="M-6 -66L-9 -74M-3 -67L-4 -76M0 -68V-77M3 -67L4 -76M6 -66L9 -74" stroke="#2f8f7d" stroke-width="1.6"/></g>`;
})();

// ---------- Brooklyn Bridge, behind the data towers
const bridge = (() => {
  const cx1 = 235, cx2 = 345, y0 = base, deck = base - 34;
  const tower = (cx) => `<path class="bt" d="M${cx - 16} ${y0}V${base - 120}L${cx - 16} ${base - 130}L${cx - 7} ${base - 142}L${cx} ${base - 150}L${cx + 7} ${base - 142}L${cx + 16} ${base - 130}V${y0}Z"/><path d="M${cx - 16} ${y0}V${base - 150}H${cx + 16}V${y0}Z" fill="url(#tLime)" opacity=".5"/><path class="arc" d="M${cx - 10} ${y0}V${base - 84}Q${cx - 10} ${base - 102} ${cx} ${base - 106}Q${cx + 10} ${base - 102} ${cx + 10} ${base - 84}V${y0}M${cx - 10} ${base - 122}V${base - 132}Q${cx - 10} ${base - 138} ${cx} ${base - 140}Q${cx + 10} ${base - 138} ${cx + 10} ${base - 132}V${base - 122}Z"/><path class="band" d="M${cx - 16} ${base - 118}H${cx + 16}M${cx - 16} ${base - 40}H${cx + 16}"/>`;
  let stays = '', lamps = '';
  for (let i = 1; i <= 18; i++) { const t = i / 19; for (const [a, b] of [[cx1, cx1 - 150], [cx2, cx2 + 150]]) { const sx = a + (b - a) * t; stays += `M${f1(a)} ${base - 140}L${f1(sx)} ${deck - 1}`; } }
  let hang = ''; for (let x = cx1 + 8; x < cx2 - 8; x += 6) { const t = (x - cx1) / (cx2 - cx1), cy = base - 140 + 4 * 55 * t * (1 - t) * 1.0; hang += `M${x} ${f1(cy + 4)}V${deck}`; }
  for (let x = cx1 - 150; x <= cx2 + 150; x += 8) lamps += `<circle cx="${x}" cy="${deck - 2}" r=".9"/>`;
  return `<g class="br">${tower(cx1)}${tower(cx2)}<rect x="${cx1 - 150}" y="${deck}" width="${cx2 - cx1 + 300}" height="3.5"/><path class="truss" d="M${cx1 - 150} ${deck + 3}H${cx2 + 150}"/>
  <path class="cab" d="M${cx1 - 150} ${deck}Q${cx1 - 72} ${base - 128} ${cx1} ${base - 140}Q${(cx1 + cx2) / 2} ${base - 90} ${cx2} ${base - 140}Q${cx2 + 72} ${base - 128} ${cx2 + 150} ${deck}"/>
  <path class="stay" d="${stays}"/><path class="stay" d="${hang}"/><g class="blamp">${lamps}</g></g>`;
})();

// ---------- data towers: material, setbacks, crowns, ornament
const mats = [
  { tint: '#0e1633', tex: 'tGlass', op: 0.55, fe: false },
  { tint: '#241830', tex: 'tBrick', op: 0.6, fe: true },
  { tint: '#1a2040', tex: 'tLime', op: 0.55, fe: false },
  { tint: '#10172e', tex: 'tPier', op: 0.8, fe: false },
  { tint: '#121c3e', tex: 'tSq', op: 0.6, fe: false },
];
let towers = '', bloomWin = '', signs = '';
const tallRank = [...weeks.keys()].sort((a, b) => weeks[b].total - weeks[a].total).slice(0, 3);
weeks.forEach((w, i) => {
  const x = L + i * bw, wd = bw - 3.2, r = rng(100 + i), cx = x + wd / 2;
  const h = w.total === 0 ? 10 : 26 + Math.sqrt(w.total / maxWeek) * 220;
  const y = base - h, style = r(), mat = mats[Math.floor(r() * mats.length)];
  const setback = h > 70 && r() < 0.55, inset = wd * 0.16, setY = base - h * (0.52 + r() * 0.12);
  const rowsAll = Math.max(1, Math.floor((h - 6) / 4.4));
  const outline = setback ? `M${f1(x)} ${base}V${f1(setY)}H${f1(x + inset)}V${f1(y)}H${f1(x + wd - inset)}V${f1(setY)}H${f1(x + wd)}V${base}Z` : `M${f1(x)} ${base}V${f1(y)}H${f1(x + wd)}V${base}Z`;
  let roof = '', extra = '';
  if (w.total > 0) {
    const tx0 = setback ? x + inset : x, twd = setback ? wd - 2 * inset : wd, tcx = cx;
    const stepH = Math.min(24, h * 0.16);
    const vsel = (Math.floor(style * 1000) + i * 7) % 9;
    if (vsel === 0) roof = `<rect class="tw" x="${f1(tx0 + twd * 0.18)}" y="${f1(y - stepH)}" width="${f1(twd * 0.64)}" height="${f1(stepH)}"/><rect class="cor" x="${f1(tx0 + twd * 0.14)}" y="${f1(y - stepH - 1)}" width="${f1(twd * 0.72)}" height="1.6"/><path class="dent" d="M${f1(tx0)} ${f1(y + 1.6)}h${f1(twd)}"/>`;
    else if (vsel === 1) roof = `<g class="tw"><rect x="${f1(tcx - 3.8)}" y="${f1(y - 10)}" width="7.6" height="7"/><path d="M${f1(tcx - 4.6)} ${f1(y - 10)}L${f1(tcx)} ${f1(y - 15)}L${f1(tcx + 4.6)} ${f1(y - 10)}Z"/><path d="M${f1(tcx - 3)} ${f1(y - 3)}V${f1(y)}M${f1(tcx + 3)} ${f1(y - 3)}V${f1(y)}M${f1(tcx - 3.8)} ${f1(y - 7)}H${f1(tcx + 3.8)}" stroke="#2a3470" stroke-width=".7"/></g><rect class="cor" x="${f1(tx0)}" y="${f1(y - 0.6)}" width="${f1(twd)}" height="1.6"/>`;
    else if (vsel === 2) roof = `<rect class="tw" x="${f1(tx0 + twd * 0.14)}" y="${f1(y - 7)}" width="${f1(twd * 0.72)}" height="7"/><rect class="tw" x="${f1(tx0 + twd * 0.28)}" y="${f1(y - 14)}" width="${f1(twd * 0.44)}" height="7"/><rect class="tw" x="${f1(tx0 + twd * 0.4)}" y="${f1(y - 20)}" width="${f1(twd * 0.2)}" height="6"/><rect class="ant" x="${f1(tcx - 0.4)}" y="${f1(y - 30)}" width=".8" height="10"/>`;
    else if (vsel === 3) roof = `<path class="tw" d="M${f1(tx0 + twd * 0.08)} ${f1(y)}L${f1(tcx)} ${f1(y - 13)}L${f1(tx0 + twd * 0.92)} ${f1(y)}Z"/><path class="cu" d="M${f1(tcx - 1.5)} ${f1(y - 13)}L${f1(tcx)} ${f1(y - 18)}L${f1(tcx + 1.5)} ${f1(y - 13)}Z"/>`;
    else if (vsel === 4) roof = `<rect class="tw" x="${f1(tx0 + 1)}" y="${f1(y - 4)}" width="${f1(twd - 2)}" height="4"/><rect class="tw" x="${f1(tx0 + twd * 0.2)}" y="${f1(y - 9)}" width="${f1(twd * 0.25)}" height="5"/><rect class="tw" x="${f1(tx0 + twd * 0.55)}" y="${f1(y - 7)}" width="${f1(twd * 0.2)}" height="3"/>`;
    else if (vsel === 6) roof = `<path class="tw" d="M${f1(tx0)} ${f1(y)}V${f1(y - 3)}L${f1(tx0 + twd)} ${f1(y - 12)}V${f1(y)}Z"/><path class="cor" d="M${f1(tx0)} ${f1(y - 3)}L${f1(tx0 + twd)} ${f1(y - 12)}" stroke="#ffe0a0" stroke-width=".8" fill="none" opacity=".8"/>`;
    else if (vsel === 7) roof = `<rect class="tw" x="${f1(tx0 + twd * 0.1)}" y="${f1(y - 5)}" width="${f1(twd * 0.8)}" height="5"/><path class="tw" d="M${f1(tx0 + twd * 0.1)} ${f1(y - 5)}L${f1(tx0 + twd * 0.25)} ${f1(y - 17)}L${f1(tx0 + twd * 0.4)} ${f1(y - 5)}ZM${f1(tx0 + twd * 0.6)} ${f1(y - 5)}L${f1(tx0 + twd * 0.75)} ${f1(y - 17)}L${f1(tx0 + twd * 0.9)} ${f1(y - 5)}Z"/><path class="steel" d="M${f1(tx0 + twd * 0.25)} ${f1(y - 17)}V${f1(y - 24)}M${f1(tx0 + twd * 0.75)} ${f1(y - 17)}V${f1(y - 22)}"/>`;
    else if (vsel === 8) roof = `<rect class="tw" x="${f1(tx0 + twd * 0.12)}" y="${f1(y - 9)}" width="${f1(twd * 0.76)}" height="9"/><rect x="${f1(tx0 + twd * 0.12)}" y="${f1(y - 9)}" width="${f1(twd * 0.76)}" height="2.2" fill="#ffd98a" opacity=".75"/><rect class="tw" x="${f1(tx0 + twd * 0.3)}" y="${f1(y - 14)}" width="${f1(twd * 0.4)}" height="5"/><rect x="${f1(tx0 + twd * 0.3)}" y="${f1(y - 14)}" width="${f1(twd * 0.4)}" height="1.4" fill="#ffd98a" opacity=".6"/>`;
    else roof = `<path class="tw" d="M${f1(tx0)} ${f1(y)}V${f1(y - 6)}L${f1(tx0 + twd * 0.5)} ${f1(y - 11)}L${f1(tx0 + twd)} ${f1(y - 6)}V${f1(y)}Z"/>`;
    if (style > 0.5 && style < 0.92) extra += `<rect class="ant" x="${f1(tcx - 0.5)}" y="${f1(y - 26 - r() * 14)}" width="1" height="${f1(26)}"/>`;
    if (tallRank.includes(i)) extra += `<circle class="beaconlamp" cx="${f1(tcx)}" cy="${f1(y - 30)}" r="1.8" style="animation-delay:${i % 5 * 0.4}s"/>`;
    if (mat.fe) { let fe = ''; for (let k = 2; k < Math.min(rowsAll, 40); k += 4) { const yy = base - 5 - k * 4.4; fe += `M${f1(x + 1)} ${f1(yy)}l${f1(wd * 0.3)} -4.4l${f1(-wd * 0.3)} 0`; } extra += `<path class="fe" d="${fe}"/>`; }
  }
  const colPitchFull = wd / 7;
  let win = '', mul = '', floors = '';
  for (let k = 0; k < rowsAll; k += 3) floors += `M${f1(x)} ${f1(base - 5 - k * 4.4 - 4.4)}h${f1(wd)}`;
  for (let c = 0; c < 7; c++) {
    const lit = w.d[c] === 0 ? 0 : Math.max(1, Math.round((w.d[c] / maxDay) * rowsAll));
    for (let k = 0; k < rowsAll; k++) {
      const wy = base - 5 - k * 4.4 - 2.4, up = setback && wy < setY;
      const x0 = up ? x + inset : x, tw = up ? wd - 2 * inset : wd, pitch = tw / 7, ww = Math.max(1.1, pitch * 0.58);
      const wx = x0 + c * pitch + (pitch - ww) / 2;
      if (k < lit) { const warm = (c * 7 + k + i) % 5 === 0 ? 'w2' : (c * 3 + k) % 11 === 0 ? 'w3' : 'w1'; const tl = (c * 13 + k * 7 + i) % 9 === 0 ? ' tl' : ''; if ((c * 5 + k * 3 + i) % 4 === 0) win += `<rect class="bl" x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="${(0.7 + ((c + k) % 3) * 0.35).toFixed(2)}"/>`; if (!tl && warm !== 'w2' && (c + k + i) % 2 === 0) bloomWin += `<rect x="${f1(wx - 0.4)}" y="${f1(wy - 0.4)}" width="${f1(ww + 0.8)}" height="3.2"/>`; win += `<rect class="${warm}${tl}" x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="2.4"${tl ? ` style="animation-delay:${((c + k + i) % 7) * 0.7}s"` : ''}/>`; if (ww > 1.9) mul += `M${f1(wx + ww / 2)} ${f1(wy)}v2.4`; }
      else if ((c + k + i) % 3 === 0) win += `<rect class="off" x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="2.4"/>`;
    }
  }
  const topW = setback ? wd - 2 * inset : wd, topX = setback ? x + inset : x;
  const side = w.total > 0 ? `<path class="side" d="M${f1(x + wd)} ${base}V${f1(setback ? setY : y)}L${f1(x + wd + 2.6)} ${f1((setback ? setY : y) + 1.8)}V${base}Z"/>${setback ? `<path class="side" d="M${f1(topX + topW)} ${f1(setY)}V${f1(y)}L${f1(topX + topW + 2)} ${f1(y + 1.4)}V${f1(setY + 1.4)}Z"/>` : ''}` : '';
  let belt = ''; if (w.total > 0 && h > 60) { for (let k = 11; k < rowsAll - 2; k += 12) { const yy = base - 5 - k * 4.4; belt += `<rect class="mech" x="${f1(x + 0.6)}" y="${f1(yy)}" width="${f1(wd - 1.2)}" height="2.6"/>`; } }
  if (w.total > 0 && h > 190 && r() < 0.5) signs += `<rect class="sgn" x="${f1(cx - wd * 0.3)}" y="${f1(y + 6)}" width="${f1(wd * 0.6)}" height="1.6"/>`;
  const shop = w.total > 0 ? `<rect class="awn" x="${f1(x + 0.8)}" y="${base - 5.6}" width="${f1(wd - 1.6)}" height="1.6" fill="${['#a4423a', '#2d6a5e', '#7a5a2a', '#3a4f8f'][i % 4]}"/><rect class="shop" x="${f1(x + 0.8)}" y="${base - 3.2}" width="${f1(wd - 1.6)}" height="2.2"/>` : '';
  const label = `${w.from} to ${w.to}: ${w.total} contribution${w.total === 1 ? '' : 's'}`;
  towers += `<g class="tower"><title>${esc(label)}</title><path class="body" d="${outline}" fill="${mat.tint}"/><path d="${outline}" fill="url(#${mat.tex})" opacity="${Math.min(1, mat.op * 1.35).toFixed(2)}"/><path class="fln" d="${floors}"/><rect class="pl" x="${f1(x + 0.5)}" y="${f1(y)}" width=".8" height="${f1(h)}"/><rect class="pl" x="${f1(x + wd - 1.3)}" y="${f1(y)}" width=".8" height="${f1(h)}"/><path d="${outline}" fill="url(#shadeH)"/><path d="${outline}" fill="url(#glowV)"/>${side}${belt}${roof}${extra}${win}<path class="mul" d="${mul}"/>${shop}<rect class="rim" x="${f1(setback ? x + inset : x)}" y="${f1(y)}" width="${f1(setback ? wd - 2 * inset : wd)}" height="1"/></g>`;
});

// ---------- street, water, boats
let lamps = '';
for (let x = 20; x < W; x += 16) lamps += `<circle cx="${x}" cy="${base + 7}" r="1.1"/>`;
const car = (y, cls, dir, dur) => `<line class="${cls}" x1="0" x2="${W}" y1="${y}" y2="${y}" style="animation-duration:${dur}s;animation-direction:${dir}"/>`;
let ripples = '';
{ const r = rng(5); for (let i = 0; i < 70; i++) { const y = shore + 6 + r() * (H - shore - 16), x = r() * W, w = 10 + r() * 70; ripples += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="0.8" class="rp" style="animation-delay:${(r() * 6).toFixed(1)}s"/>`; } }
const ferry = `<g class="boat" style="animation-duration:70s"><path d="M0 0H44L40 -7H8Z" fill="#1a2152"/><rect x="10" y="-13" width="26" height="6" fill="#222a63"/><rect x="14" y="-11" width="3" height="2" class="w1"/><rect x="20" y="-11" width="3" height="2" class="w1"/><rect x="26" y="-11" width="3" height="2" class="w1"/><rect x="31" y="-11" width="3" height="2" class="w1"/><circle cx="23" cy="-17" r="1.2" fill="#ffffff"/><circle cx="3" cy="-3" r="1.4" fill="#ff5a4d"/><circle cx="41" cy="-3" r="1.4" fill="#4cff9a"/></g>`;
const tug = `<g class="boat2" style="animation-duration:95s"><path d="M0 0H22L19 -5H4Z" fill="#1a2152"/><rect x="7" y="-9" width="9" height="4" fill="#222a63"/><circle cx="11" cy="-12" r="1" fill="#fff"/><circle cx="2" cy="-2" r="1" fill="#ff5a4d"/></g>`;
const plane = `<g class="plane"><circle r="1.4" fill="#fff"/><circle cx="-4" r="1" fill="#ff5a4d" class="beaconlamp"/></g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name)}: ${cal.totalContributions} contributions in the last ${weeks.length} weeks, drawn as a New York night skyline with landmarks and the Brooklyn Bridge. One tower per week, seven window columns per tower, one per weekday.">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050818"/><stop offset=".45" stop-color="#161a48"/><stop offset=".78" stop-color="#5d3a74"/><stop offset="1" stop-color="#f0985c"/></linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a5c"/><stop offset=".4" stop-color="#171a45"/><stop offset="1" stop-color="#050713"/></linearGradient>
<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0985c" stop-opacity="0"/><stop offset="1" stop-color="#f6b87e" stop-opacity=".42"/></linearGradient>
<linearGradient id="lmg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2460"/><stop offset=".7" stop-color="#2e2c6a"/><stop offset="1" stop-color="#60427e"/></linearGradient>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="rm"><rect x="0" y="${shore}" width="${W}" height="${H - shore}" fill="url(#fade)"/></mask>
<radialGradient id="moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6dd"/><stop offset="1" stop-color="#fff6dd" stop-opacity="0"/></radialGradient>
<pattern id="tGlass" width="4" height="4.6" patternUnits="userSpaceOnUse"><rect width="4" height="4.6" fill="none"/><path d="M0 .2H4M.2 0V4.6" stroke="#a9bcff" stroke-width=".4" opacity=".28"/><rect x="1" y="1.2" width="2" height="2.4" fill="#0a1030" opacity=".35"/></pattern>
<pattern id="tLime" width="8" height="3.4" patternUnits="userSpaceOnUse"><path d="M0 3.3H8M3 0V1.7M7 1.7V3.4" stroke="#efdfc4" stroke-width=".4" opacity=".26"/></pattern>
<pattern id="tBrick" width="6" height="3" patternUnits="userSpaceOnUse"><path d="M0 .1H6M0 1.6H6M2 .1V1.6M5 1.6V3.1" stroke="#ff9f80" stroke-width=".4" opacity=".26"/></pattern>
<pattern id="tPier" width="3.4" height="6" patternUnits="userSpaceOnUse"><path d="M.3 0V6" stroke="#d6dcff" stroke-width=".5" opacity=".2"/></pattern>
<pattern id="tSq" width="3.8" height="3.8" patternUnits="userSpaceOnUse"><rect x=".5" y=".5" width="2.8" height="2.8" fill="#080c24" opacity=".5" stroke="#e6e9ff" stroke-width=".3" stroke-opacity=".3"/></pattern>
<pattern id="tGreen" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="3" fill="#2a8a7c" opacity=".45"/><path d="M0 .2H4M.2 0V3" stroke="#b8f0e0" stroke-width=".4" opacity=".3"/></pattern>
<linearGradient id="flood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff77b8"/><stop offset=".5" stop-color="#ffe0a0"/><stop offset="1" stop-color="#6fd6ff"/></linearGradient>
<linearGradient id="shadeH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fa0ff" stop-opacity=".16"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>
<linearGradient id="glowV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050818" stop-opacity=".35"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#ff9a55" stop-opacity=".38"/></linearGradient>
<filter id="bloom" x="-2%" y="-2%" width="104%" height="104%"><feGaussianBlur stdDeviation="1.5"/></filter>
<filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.4"/></filter>
<g id="sk">${bridge}${CITI}${FLAT}${CHR}${ESB}${ROCK}${PARK}${WOOL}${WTC}${VAND}${BOA}${UN}${PAN}${towers}<g class="bloom" filter="url(#bloom)">${bloomWin}</g>${signs}</g>
</defs>
<style>
.st{fill:#fff;opacity:.7;animation:tw 4s ease-in-out infinite}
.cl ellipse{fill:#b9a7e6;opacity:.07}.cl{animation:drift 90s linear infinite alternate}
.far{fill:#3a2b62;opacity:.5}.farw{fill:#ffd98a;opacity:.3}
.mid{fill:#261f55;opacity:.85}.midw{fill:#ffd98a;opacity:.5}
.lm{fill:url(#lmg);stroke:#9a7a9c;stroke-width:.7;stroke-opacity:.55}
.pil2{stroke:#efe2c8;stroke-width:.45;opacity:.2;fill:none}.stripe{stroke:#fff3d0;stroke-width:.8;opacity:.28;fill:none}.band{stroke:#e8d9c0;stroke-width:.7;opacity:.3;fill:none}
.arcw{stroke:#ffeab0;stroke-width:1.1;fill:none;stroke-dasharray:1.3 1.9;opacity:.9}.eagle{fill:#dfe6f5;opacity:.85}
.fa{fill:#fff;opacity:.10}.fb{fill:#000;opacity:.18}.cu{fill:#3fa58a;stroke:#2a7d68;stroke-width:.4}.leg{fill:#12173c}.void{fill:#070a20;opacity:.85}.mar{fill:#e9e2f3;opacity:.7}
.lm2{fill:#2a2a66;stroke:#9a7a9c;stroke-width:.6;stroke-opacity:.5}.truss{stroke:#6a5a90;stroke-width:.8;stroke-dasharray:2 1.2}
.dent{stroke:#4a5498;stroke-width:1.4;stroke-dasharray:1.2 1.2;fill:none}.fe{stroke:#06081c;stroke-width:.6;fill:none;opacity:.8}.mul{stroke:#0b1236;stroke-width:.35;opacity:.55;fill:none}.shop{fill:#ffcf8a;opacity:.7;stroke-dasharray:3 1}
.lw{fill:#ffd98a;opacity:.6}
.pil{stroke:#9a8fd0;stroke-width:.6;opacity:.28;fill:none}.gr{stroke:#9a8fd0;stroke-width:.6;opacity:.35;fill:none}
.fl{fill:#ffcf9a;opacity:.16}.fl2{fill:#ffd9a8;opacity:.34}
.steel{stroke:#dfe6f5;stroke-width:1;fill:none;opacity:.85}.tri{fill:#f6f2ff;opacity:.8}
.beacon{fill:#f2d9a0;opacity:.5}.beaconlamp{fill:#ff5a4d;animation:bk 2.4s steps(1) infinite}
.br .bt{fill:#17143c;stroke:#6a5a90;stroke-width:.6}.br .arc{fill:none;stroke:#0b0a22;stroke-width:1.4}
.br rect{fill:#1a1646}.cab{fill:none;stroke:#8f84c4;stroke-width:1.2;opacity:.8}.stay{stroke:#8f84c4;stroke-width:.4;opacity:.45;fill:none}.blamp circle{fill:#ffe6a8;opacity:.8}
.body{stroke:#222c64;stroke-width:.6}.rim{fill:#4a5498;opacity:.6}.fln{stroke:#2a3470;stroke-width:.4;opacity:.7;fill:none}.pl{fill:#2f3a7c;opacity:.5}
.tw{fill:#0e1633;stroke:#222c64;stroke-width:.5}.cor{fill:#4a5498;opacity:.7}.ant{fill:#2f3a7c}
.w1{fill:#ffd98a}.w2{fill:#9fe0ff}.w3{fill:#ffb27a}.off{fill:#171f4a}
.tl{animation:tw 3.4s ease-in-out infinite}
.bl{fill:#2a2150;opacity:.75}.side{fill:#05081c;opacity:.7}.mech{fill:#05081c;opacity:.5}.sgn{fill:#ff6f9a;opacity:.85}.bloom{fill:#ffcf8a;opacity:.34}
.fog{fill:url(#fog)}
.street{fill:#0a0c22}.lamp circle{fill:#ffcf8a;opacity:.85}
.cw,.cr{stroke-width:1.6;stroke-dasharray:2 22 6 30 3 40;animation:run 7s linear infinite}.cw{stroke:#fff1c0}.cr{stroke:#ff5a4d}
.rp{fill:#f6b87e;opacity:.22;animation:rp 6s ease-in-out infinite}
.rf{opacity:.62}
.boat{animation:sail linear infinite}.boat2{animation:sail2 linear infinite}.plane{animation:fly 40s linear infinite}
.cap{font:600 14px 'Helvetica Neue',Arial,sans-serif;letter-spacing:.3em;fill:#f3e6d2}.sub{font:12px 'Helvetica Neue',Arial,sans-serif;letter-spacing:.12em;fill:#c9b8a8}
@keyframes tw{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes bk{0%{opacity:1}60%{opacity:.15}}
@keyframes rp{0%,100%{opacity:.08;transform:translateX(0)}50%{opacity:.3;transform:translateX(5px)}}
@keyframes run{to{stroke-dashoffset:-101}}
@keyframes drift{to{transform:translateX(60px)}}
@keyframes sail{from{transform:translate(1420px,496px)}to{transform:translate(-80px,496px)}}
@keyframes sail2{from{transform:translate(-60px,516px)}to{transform:translate(1440px,516px)}}
@keyframes fly{from{transform:translate(-20px,60px)}to{transform:translate(1420px,40px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars}${clouds}
<circle cx="1180" cy="96" r="52" fill="url(#moon)"/><circle cx="1180" cy="96" r="15" fill="#fff6dd"/><circle cx="1175" cy="92" r="3" fill="#eadcb8" opacity=".6"/><circle cx="1185" cy="101" r="2" fill="#eadcb8" opacity=".5"/>
${plane}
${far}
<rect class="fog" x="0" y="${base - 180}" width="${W}" height="180"/>
${mid}
<use href="#sk"/>
<rect class="street" x="0" y="${base}" width="${W}" height="${shore - base}"/>
<g class="lamp">${lamps}</g>
${car(base + 10, 'cw', 'normal', 9)}${car(base + 13.5, 'cr', 'reverse', 11)}
<rect x="0" y="${shore}" width="${W}" height="${H - shore}" fill="url(#water)"/>
<g class="rf" mask="url(#rm)"><g filter="url(#soft)"><use href="#sk" transform="translate(0 ${2 * shore}) scale(1 -1)"/></g></g>
${ripples}
${LIB}${ferry}${tug}
<text class="cap" x="${L + 6}" y="${H - 38}">${esc(name)}</text>
<text class="sub" x="${L + 6}" y="${H - 18}">${cal.totalContributions} CONTRIBUTIONS · LAST ${weeks.length} WEEKS · ONE TOWER A WEEK · SEVEN WINDOW COLUMNS, ONE PER WEEKDAY</text>
</svg>
`;
writeFileSync(out, svg);
console.log('wrote', out, svg.length, 'bytes,', weeks.length, 'weeks, max week', maxWeek, 'max day', maxDay);
