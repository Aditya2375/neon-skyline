// Generates an animated night-city SVG from a GitHub contribution calendar.
// Usage: GITHUB_TOKEN=... node skyline.mjs <login> [out.svg]
import { writeFileSync } from 'node:fs';

const login = process.argv[2];
const out = process.argv[3] || 'skyline.svg';
if (!login) { console.error('usage: node skyline.mjs <login> [out.svg]'); process.exit(1); }

async function fetchCalendar() {
  if (process.env.CALENDAR_JSON) return JSON.parse((await import('node:fs')).readFileSync(process.env.CALENDAR_JSON, 'utf8'));
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `query($l:String!){user(login:$l){name contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`, variables: { l: login } }),
  });
  if (!res.ok) throw new Error('GitHub API ' + res.status);
  return res.json();
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// small deterministic generator so the image is stable between runs
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const data = (await fetchCalendar()).data.user;
const cal = data.contributionsCollection.contributionCalendar;
const weeks = cal.weeks.map((w) => w.contributionDays.reduce((a, d) => a + d.contributionCount, 0));
const name = (data.name || login).toUpperCase();
const W = 1000, H = 360, base = 330, left = 24, right = 24;
const bw = (W - left - right) / weeks.length;
const max = Math.max(...weeks, 1);
const R = rng(7);

let stars = '';
for (let i = 0; i < 70; i++) {
  stars += `<circle cx="${(R() * W).toFixed(1)}" cy="${(R() * 170).toFixed(1)}" r="${(R() * 1.1 + 0.3).toFixed(2)}" class="st" style="animation-delay:${(R() * 4).toFixed(2)}s"/>`;
}
const hues = ['#ff3cac', '#38e8ff', '#ffb14a', '#8b7bff'];
let towers = '';
weeks.forEach((v, i) => {
  const h = v === 0 ? 8 : 18 + Math.sqrt(v / max) * 150;
  const x = left + i * bw;
  const col = hues[i % hues.length];
  const delay = (i * 0.035).toFixed(2);
  let win = '';
  if (v > 0) {
    const rows = Math.floor((h - 8) / 9), cols = 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (R() < 0.45) win += `<rect x="${(x + 3 + c * ((bw - 6) / cols)).toFixed(1)}" y="${(base - h + 6 + r * 9).toFixed(1)}" width="${((bw - 6) / cols - 2).toFixed(1)}" height="4" class="wn" style="animation-delay:${(R() * 5).toFixed(2)}s"/>`;
    }
  }
  towers += `<g class="tw" style="animation-delay:${delay}s"><rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${h.toFixed(1)}" fill="#12131f" stroke="${col}" stroke-opacity=".55" stroke-width="1"/><rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="2" fill="${col}"/>${win}<title>Week ${i + 1}: ${v} contributions</title></g>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name)}: ${cal.totalContributions} contributions in the last year, one tower per week">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05050d"/><stop offset=".7" stop-color="#171031"/><stop offset="1" stop-color="#2b1445"/></linearGradient>
<filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<style>
.st{fill:#fff;opacity:.2;animation:tw 4s ease-in-out infinite}
@keyframes tw{50%{opacity:.9}}
.tw{transform-box:fill-box;transform-origin:50% 100%;animation:rise .9s cubic-bezier(.2,.8,.2,1) both}
@keyframes rise{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}
.wn{fill:#ffd98a;opacity:.85;animation:fl 6s ease-in-out infinite}
@keyframes fl{0%,100%{opacity:.85}45%{opacity:.85}50%{opacity:.15}55%{opacity:.85}}
.sign{font:700 44px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:6px;fill:#ffe6fb;animation:pulse 3.2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}92%{opacity:1}94%{opacity:.55}96%{opacity:1}}
.sub{font:500 14px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:4px;fill:#38e8ff}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars}
<circle cx="880" cy="70" r="26" fill="#f4eee0" opacity=".9"/><circle cx="892" cy="62" r="24" fill="#171031"/>
<g filter="url(#glow)"><text class="sign" x="${W / 2}" y="108" text-anchor="middle" style="stroke:#ff3cac;stroke-width:1px">${esc(name)}</text></g>
<text class="sub" x="${W / 2}" y="138" text-anchor="middle">${cal.totalContributions} CONTRIBUTIONS · ONE TOWER PER WEEK</text>
${towers}
<rect x="0" y="${base}" width="${W}" height="${H - base}" fill="#07070f"/>
<rect x="0" y="${base}" width="${W}" height="1.5" fill="#ff3cac" opacity=".7"/>
</svg>`;
writeFileSync(out, svg);
console.log('wrote', out, weeks.length, 'weeks, max', max);
