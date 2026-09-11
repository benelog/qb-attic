/*
 * 3D 별 여행 - 1995년 QuickBasic(3D.BAS) 원작의 웹 재구현.
 *
 * 원작 요약
 *  - SCREEN 12(640×480, 16색)에 WINDOW SCREEN (-40,30)-(40,-30) 좌표계를 깔고 별을 그린다.
 *  - 별은 앞 거리 1600, 옆 거리 ±800, 위아래 ±600 에서 태어나 매 프레임 15씩 다가온다.
 *    화면 위치는 80 × 옆거리 / 앞거리 (원근 투영). 거리 600 안으로 들어오면 밝은 색이 된다.
 *  - 시점은 좌우(VectorX)와 상하(VectorY)로 천천히 흔들린다.
 *    목표값(HandleX)이 400, 0, -400 중 하나로 가끔 바뀌고, 각도는 그쪽으로 1씩 움직인다.
 *  - 이전 위치에서 새 위치로 선을 긋고, 다음 프레임에 그 선을 지운다. 그래서 별이 짧은 꼬리를 남긴다.
 *  - 명령행 인자로 별 개수를 받는다(기본 20). 아무 키나 누르면 끝난다.
 *  - 원작은 프레임 제한이 없어 CPU 속도대로 돌아갔다. 웹 버전은 초당 프레임 수를 고를 수 있다.
 */
(() => {
  'use strict';

  const W = 640, H = 480;
  const PALETTE = [
    [0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170], [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
    [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255], [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255],
  ];
  const canvas = document.getElementById('screen');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const buf = new Uint8Array(W * H);

  const countInput = document.getElementById('opt-count');
  const fpsSelect = document.getElementById('opt-fps');
  const btnPause = document.getElementById('btn-pause');
  const btnRestart = document.getElementById('btn-restart');
  const status = document.getElementById('status');

  // QB 의 CINT: 반올림, .5 는 짝수로
  function cint(x) {
    const f = Math.floor(x), diff = x - f;
    if (diff > 0.5) return f + 1;
    if (diff < 0.5) return f;
    return f % 2 === 0 ? f : f + 1;
  }
  // WINDOW SCREEN (-40,30)-(40,-30) → 픽셀.
  // SCREEN 을 붙이면 y 는 아래로 갈수록 커지므로 작은 y(-30)가 위다. 원작이 30을 먼저 썼어도 QB 는 이렇게 해석한다.
  const px = (x) => cint((x + 40) * (W - 1) / 80);
  const py = (y) => cint((y + 30) * (H - 1) / 60);

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

  // ------------------------------------------------------------------
  // 원작 상태
  // ------------------------------------------------------------------
  const G = { stars: [], max: 20, sin1: 0, sin2: 0, cos1: 1, cos2: 1, handleX: 0, handleY: 0, vectorX: 0, vectorY: 0, frames: 0 };

  function init(count) {
    G.max = count;
    G.stars = Array.from({ length: count }, () => ({ x1: 0, y1: 0, x2: 0, y2: 0, front: 0, sx: 0, sy: 0, color: 0 }));
    G.sin1 = G.sin2 = Math.sin(0); G.cos1 = G.cos2 = Math.cos(0);
    G.handleX = G.handleY = G.vectorX = G.vectorY = 0;
    G.frames = 0;
    buf.fill(0);
  }

  function steer(axis) {
    const h = axis === 'X' ? 'handleX' : 'handleY', v = axis === 'X' ? 'vectorX' : 'vectorY';
    if (G[v] === G[h]) {
      switch (Math.floor(Math.random() * 400)) {
        case 100: G[h] = 400; break;
        case 200: G[h] = 0; break;
        case 300: G[h] = -400; break;
      }
    } else {
      switch (G[h]) {
        case 400: G[v] += 1; break;
        case 0: G[v] -= Math.sign(G[v]); break;
        case -400: G[v] -= 1; break;
      }
      const a = (3.14 / 180) * (G[v] / 1500);
      if (axis === 'X') { G.sin1 = Math.sin(a); G.cos1 = Math.cos(a); }
      else { G.sin2 = Math.sin(a); G.cos2 = Math.cos(a); }
    }
  }

  function frame() {
    steer('X');
    steer('Y');
    for (const s of G.stars) {
      if (s.color === 0) {
        s.color = Math.floor(Math.random() * 7);
        s.front = 1600;
        s.sx = Math.floor(Math.random() * 1600 - 800);
        s.sy = Math.floor(Math.random() * 1200 - 600);
        const vx = 80 * s.sx / s.front, vy = 80 * s.sy / s.front;
        pset(px(vx), py(vy), s.color);
        s.x1 = s.x2 = vx; s.y1 = s.y2 = vy;
      } else {
        line(px(s.x1), py(s.y1), px(s.x2), py(s.y2), 0);
        s.front -= 15;
        if (s.front < 600 && s.color < 8) s.color += 8;
        const x = s.sx * G.cos2 + s.sy * G.sin1 * G.sin2 - s.front * G.cos1 * G.sin2;
        const y = s.sy * G.cos1 + s.front * G.sin1;
        const z = s.sx * G.sin1 - s.sy * G.sin1 * G.cos2 + s.front * G.cos1 * G.cos2;
        s.sx = x; s.sy = y; s.front = z;
        if (s.front > 0) {
          const vx = 80 * s.sx / s.front, vy = 80 * s.sy / s.front;
          if (vx >= -40 && vx <= 40 && vy >= -30 && vy <= 30) {
            line(px(vx), py(vy), px(s.x1), py(s.y1), s.color);
            s.x2 = s.x1; s.y2 = s.y1;
            s.x1 = vx; s.y1 = vy;
          } else {
            s.color = 0;
          }
        } else {
          s.color = 0;
        }
      }
    }
    G.frames++;
  }

  function render() {
    const d = img.data;
    for (let i = 0, j = 0; i < buf.length; i++, j += 4) {
      const c = PALETTE[buf[i]];
      d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // ------------------------------------------------------------------
  // 웹 쪽: 프레임 속도, 일시 정지, 별 개수
  // ------------------------------------------------------------------
  const STORAGE = 'stars.options';
  let options = { fps: 60, count: 20 };
  try { Object.assign(options, JSON.parse(localStorage.getItem(STORAGE) || '{}')); } catch { /* ignore */ }
  const urlCount = parseInt(new URLSearchParams(location.search).get('n'), 10);
  if (urlCount > 0) options.count = urlCount;
  options.count = Math.min(500, Math.max(1, options.count | 0 || 20));
  countInput.value = options.count;
  fpsSelect.value = String(options.fps);
  const save = () => { try { localStorage.setItem(STORAGE, JSON.stringify(options)); } catch { /* ignore */ } };

  let paused = false;
  let acc = 0, last = 0;
  function loop(t) {
    if (!paused) {
      const step = 1000 / options.fps;
      if (!last) last = t;
      acc += Math.min(200, t - last);
      last = t;
      let n = 0;
      while (acc >= step && n < 8) { frame(); acc -= step; n++; }
      if (n) render();
    } else {
      last = 0;
    }
    status.textContent = `별 ${G.max}개 · ${G.frames}프레임 · 시점 X ${G.vectorX} Y ${G.vectorY}${paused ? ' · 멈춤' : ''}`;
    requestAnimationFrame(loop);
  }

  function setPaused(p) {
    paused = p;
    btnPause.textContent = paused ? '계속' : '멈춤';
    btnPause.setAttribute('aria-pressed', String(paused));
  }
  btnPause.addEventListener('click', () => setPaused(!paused));
  btnRestart.addEventListener('click', () => { init(options.count); render(); setPaused(false); });
  canvas.addEventListener('pointerdown', () => setPaused(!paused));
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'BUTTON')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setPaused(!paused); }
  });
  countInput.addEventListener('change', () => {
    options.count = Math.min(500, Math.max(1, parseInt(countInput.value, 10) || 20));
    countInput.value = options.count;
    save();
    init(options.count); render(); setPaused(false);
  });
  fpsSelect.addEventListener('change', () => { options.fps = parseInt(fpsSelect.value, 10) || 60; save(); });

  init(options.count);
  render();
  requestAnimationFrame(loop);

  if (location.hash === '#debug') window.__stars = { G, frame, render, buf, setPaused, init };
})();
