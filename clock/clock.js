/*
 * 아날로그 시계 - 1995년 QuickBasic(CLOCK.BAS) 원작의 웹 재구현.
 *
 * 원작 요약 (SCREEN 12, 640x480 16색)
 *  - 무작위 색 점 19800개를 찍고 (360,250)을 중심으로 반지름 220, 200 원을 그린다.
 *  - 눈금은 DRAW "c0 BM360,250 TAi BU120 u5" (6도마다), 30도마다 "bu110 u10".
 *  - 매초 시·분·초침을 검은색(c0)으로 그리고, 초가 바뀌면 같은 자리를 흰색(c15)으로 다시 그려 지운다.
 *    그래서 지나간 초침이 6도 간격의 흰 선으로 쌓여 1분이면 햇살 무늬가 한 바퀴를 채운다.
 *    지금 바늘은 검은색이라 흰 선 사이의 검은 틈으로만 보인다.
 *  - 시침 각도는 계산해 둔 d = INT(c*30 + b/10) 대신 c(= -시)를 그대로 써서 거의 12시 쪽을 가리킨다.
 *    또 시침은 매초 같은 자리에 다시 검게 그려지므로 흰 궤적이 남지 않는다.
 *  - E 키를 누르면 끝난다.
 */
(() => {
  'use strict';

  const W = 640, H = 480;
  const CX = 360, CY = 250;
  const PALETTE = [
    [0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170], [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
    [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255], [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255],
  ];
  const STORAGE_OPTS = 'clock.options';

  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  const optHour = document.getElementById('opt-hour');
  const info = document.getElementById('info');
  const img = ctx.createImageData(W, H);
  const buf = new Uint8Array(W * H);

  function loadJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }
  const options = Object.assign({ hour: 'original' }, loadJSON(STORAGE_OPTS, {}));
  optHour.value = options.hour;

  // ------------------------------------------------------------------
  // SCREEN 12 그래픽 명령
  // ------------------------------------------------------------------
  function pset(x, y, c) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    buf[y * W + x] = c;
  }
  function line(x0, y0, x1, y1, c) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      pset(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function circle(cx, cy, r, c) {
    let x = r, y = 0, err = 1 - r;
    while (x >= y) {
      for (const [px, py] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) pset(cx + px, cy + py, c);
      y++;
      if (err < 0) err += 2 * y + 1;
      else { x--; err += 2 * (y - x) + 1; }
    }
  }

  // DRAW 문자열 중 원작이 쓰는 명령만: C n, BM x,y, TA n, B 접두어, U/D/L/R n
  const pen = { x: CX, y: CY, c: 15, ta: 0 };
  function draw(cmd) {
    const s = cmd.toUpperCase().replace(/\s+/g, '');
    let i = 0, blank = false;
    const num = () => {
      const m = /^[+-]?\d+/.exec(s.slice(i));
      if (!m) return null;
      i += m[0].length;
      return parseInt(m[0], 10);
    };
    while (i < s.length) {
      const op = s[i++];
      if (op === 'B') { blank = true; continue; }
      if (op === 'C') pen.c = num();
      else if (op === 'T' && s[i] === 'A') { i++; pen.ta = num(); }
      else if (op === 'M') {
        const x = num(); i++; const y = num();
        if (!blank) line(pen.x, pen.y, x, y, pen.c);
        pen.x = x; pen.y = y;
      } else if ('UDLR'.includes(op)) {
        const n = num() ?? 1;
        const [dx, dy] = { U: [0, -n], D: [0, n], L: [-n, 0], R: [n, 0] }[op];
        const t = (pen.ta * Math.PI) / 180;
        const x = Math.round(pen.x + dx * Math.cos(t) + dy * Math.sin(t));
        const y = Math.round(pen.y - dx * Math.sin(t) + dy * Math.cos(t));
        if (!blank) line(pen.x, pen.y, x, y, pen.c);
        pen.x = x; pen.y = y;
      }
      blank = false;
    }
  }

  function present() {
    const d = img.data;
    for (let p = 0, q = 0; p < buf.length; p++, q += 4) {
      const rgb = PALETTE[buf[p]];
      d[q] = rgb[0]; d[q + 1] = rgb[1]; d[q + 2] = rgb[2]; d[q + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // ------------------------------------------------------------------
  // CLOCK.BAS
  // ------------------------------------------------------------------
  const S = { running: false, last: '', hands: null, ended: false };

  function setup() {
    buf.fill(0);
    for (let i = 1; i <= 19800; i++) {
      pset(Math.floor(Math.random() * 640), Math.floor(Math.random() * 480), Math.floor(Math.random() * 16));
    }
    circle(CX, CY, 220, 15);
    circle(CX, CY, 200, 15);
    for (let i = 0; i <= 360; i += 6) {
      draw(`c0 BM360,250 TA${i} BU120 u5`);
      if (i === 0 || i % 30 === 0) draw(`c0 bm360,250 ta${i}bu110 u10`);
    }
    S.last = '';
    S.hands = null;
    S.ended = false;
    S.running = true;
    present();
  }

  const time$ = (d) => [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, '0')).join(':');

  function handAngles(now) {
    const h = now.getHours(), m = now.getMinutes(), sec = now.getSeconds();
    const a = sec * 6 * -1;
    const b = Math.floor(m * 6 + sec / 10) * -1;
    let c = h * -1;
    if (c > 12) c -= 12;                  // 원작 그대로 (c가 음수라 늘 거짓)
    if (options.hour === 'fixed') c = -Math.floor((h % 12) * 30 + m / 2);
    return { a, b, c };
  }
  function drawHands(hd, color) {
    draw(`c${color} bm360,250 ta${hd.a}u100`);
    draw(`c${color} bm360,250 ta${hd.b}u120`);
    draw(`c${color} bm360,250 ta${hd.c}u70`);
  }

  function tick() {
    if (!S.running) return;
    const now = new Date();
    const t = time$(now);
    if (t === S.last) return;
    if (S.hands) drawHands(S.hands, 15);   // 1초 전 바늘을 흰색으로 "지운다"
    S.hands = handAngles(now);
    drawHands(S.hands, 0);
    S.last = t;
    present();
    info.textContent = `TIME$ = "${t}"`;
  }

  function end() {
    S.running = false;
    S.ended = true;
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('Press any key to continue', 0, 464);
    info.textContent = 'E 키로 끝났습니다. 아무 키나 누르면 다시 시작합니다.';
  }

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.tagName === 'SELECT') return;
    if (S.ended) { e.preventDefault(); setup(); tick(); return; }
    if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') { e.preventDefault(); end(); }
  });
  canvas.addEventListener('click', () => { if (S.ended) { setup(); tick(); } });
  document.getElementById('btn-restart').addEventListener('click', () => { setup(); tick(); });
  document.getElementById('btn-end').addEventListener('click', () => { if (!S.ended) end(); });
  optHour.addEventListener('change', () => {
    options.hour = optHour.value;
    saveJSON(STORAGE_OPTS, options);
    optHour.blur();
  });

  // 캔버스가 원본보다 작게 보이면 1픽셀 선이 빠지지 않도록 부드럽게 줄인다.
  const fitRendering = () => { canvas.style.imageRendering = canvas.getBoundingClientRect().width >= W ? 'pixelated' : 'auto'; };
  window.addEventListener('resize', fitRendering);
  fitRendering();

  if (location.hash === '#debug') window.__clock = { S, buf, draw, setup, tick };
  setup();
  tick();
  setInterval(tick, 50);
})();
