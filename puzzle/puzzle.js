/*
 * 퍼즐 그림 맞추기 - 1995년 QuickBasic(PUZZLE.BAS) 원작의 웹 재구현.
 *
 * 원작 요약
 *  - m3.GIF 화면의 (199,19)-(467,389) 영역을 89x123 조각 8개로 잘라 3x3 슬라이딩 퍼즐을 만든다.
 *  - 빈 칸은 board.spr, 조각 위치는 cx = 109 + 90*x, cy = 124*y - 105 (x,y = 1..3).
 *  - 화살표 키 = 조각이 움직이는 방향. 예) ↑ 는 빈 칸 아래의 조각을 위로 민다.
 *  - 시작 배치는 고정: 8 3 5 / 2 1 6 / 4 7 _
 *  - 1..8 순서가 되면 완성 (m3.gif 전체 화면을 보여 준다). Q 키는 포기.
 *  - 15초 제한시간 코드가 있지만 GOTO 로 건너뛰어 실제로는 동작하지 않았다.
 */
(() => {
  'use strict';

  const W = 640, H = 480;
  const N = 3;
  const TILE_W = 89, TILE_H = 123;
  const STORAGE_RANK = 'puzzle-game.ranking';
  const STORAGE_OPTS = 'puzzle-game.options';
  const MAX_RANK = 10;
  const SLIDE_MS = 90;

  // 원작 좌표
  const cellX = (x) => 109 + 90 * x;        // x = 1..3
  const cellY = (y) => 124 * y - 105;       // y = 1..3
  const ORIGINAL_LAYOUT = [[8, 3, 5], [2, 1, 6], [4, 7, 0]];   // [row][col]
  const CLOCK = { cx: 85, cy: 297, r: 46 };
  const FONT = '"Nanum Gothic", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

  // ------------------------------------------------------------------
  // DOM
  // ------------------------------------------------------------------
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  const imgScreen = document.getElementById('img-screen');
  const imgBlank = document.getElementById('img-blank');
  const overlay = document.getElementById('overlay');
  const panelName = document.getElementById('panel-name');
  const panelRank = document.getElementById('panel-rank');
  const nameForm = document.getElementById('name-form');
  const nameInput = document.getElementById('name-input');
  const nameSummary = document.getElementById('name-summary');
  const rankBody = document.querySelector('#rank-table tbody');
  const optLayout = document.getElementById('opt-layout');
  const optSound = document.getElementById('opt-sound');

  // ------------------------------------------------------------------
  // 저장소
  // ------------------------------------------------------------------
  function loadJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }
  let ranking = loadJSON(STORAGE_RANK, []);
  if (!Array.isArray(ranking)) ranking = [];
  const options = Object.assign({ layout: 'random', sound: true }, loadJSON(STORAGE_OPTS, {}));
  optLayout.value = options.layout;
  optSound.checked = options.sound;
  optLayout.addEventListener('change', () => { options.layout = optLayout.value; saveJSON(STORAGE_OPTS, options); });
  optSound.addEventListener('change', () => { options.sound = optSound.checked; saveJSON(STORAGE_OPTS, options); });

  const better = (a, b) => a.seconds - b.seconds || a.moves - b.moves || a.date.localeCompare(b.date);
  function rankPosition(entry) {
    let pos = 0;
    while (pos < ranking.length && better(ranking[pos], entry) <= 0) pos++;
    return pos;
  }
  function addRank(entry) {
    ranking.push(entry);
    ranking.sort(better);
    ranking = ranking.slice(0, MAX_RANK);
    saveJSON(STORAGE_RANK, ranking);
  }
  const fmtTime = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  // ------------------------------------------------------------------
  // 소리 (PC 스피커 흉내)
  // ------------------------------------------------------------------
  let audioCtx = null;
  function beeps(notes) {
    if (!options.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      let t = audioCtx.currentTime;
      for (const [freq, ms] of notes) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.setValueAtTime(0.0001, t + ms / 1000 - 0.01);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t); osc.stop(t + ms / 1000);
        t += ms / 1000;
      }
    } catch { /* ignore */ }
  }
  const beepSlide = () => beeps([[880, 35]]);
  const beepBlocked = () => beeps([[110, 120]]);
  const beepWin = () => beeps([[523, 120], [659, 120], [784, 120], [1047, 300]]);
  const beepFail = () => beeps([[330, 200], [262, 350]]);

  // ------------------------------------------------------------------
  // 상태
  // ------------------------------------------------------------------
  const S = {
    scene: 'preview',       // preview | play | won | failed
    grid: null,             // grid[row][col] = 1..8, 0 = 빈 칸
    blank: { r: 2, c: 2 },
    moves: 0,
    startedAt: 0,
    elapsed: 0,             // 초
    finalSeconds: 0,
    layout: 'random',
    anim: null,             // { tile, fromR, fromC, toR, toC, start }
    lastKeyBlocked: 0,
  };

  const now = () => performance.now();

  function solvedGrid() {
    const g = [];
    for (let r = 0; r < N; r++) { g.push([]); for (let c = 0; c < N; c++) g[r].push(r * N + c + 1); }
    g[N - 1][N - 1] = 0;
    return g;
  }
  function isSolved(g) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const want = (r === N - 1 && c === N - 1) ? 0 : r * N + c + 1;
      if (g[r][c] !== want) return false;
    }
    return true;
  }
  function randomGrid() {
    // 완성 상태에서 무작위로 합법 이동을 반복 → 항상 풀 수 있는 배치
    const g = solvedGrid();
    let br = N - 1, bc = N - 1, last = null;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let steps = 0;
    while (steps < 120 || isSolved(g)) {
      const cand = dirs.filter(([dr, dc]) => {
        const r = br + dr, c = bc + dc;
        return r >= 0 && r < N && c >= 0 && c < N && !(last && last[0] === -dr && last[1] === -dc);
      });
      const [dr, dc] = cand[Math.floor(Math.random() * cand.length)];
      g[br][bc] = g[br + dr][bc + dc];
      g[br + dr][bc + dc] = 0;
      br += dr; bc += dc; last = [dr, dc];
      steps++;
    }
    return g;
  }

  function newGame() {
    S.layout = options.layout;
    S.grid = S.layout === 'original' ? ORIGINAL_LAYOUT.map((r) => r.slice()) : randomGrid();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (S.grid[r][c] === 0) S.blank = { r, c };
    S.moves = 0;
    S.elapsed = 0;
    S.startedAt = now();
    S.anim = null;
    S.scene = 'play';
    hideOverlay();
  }

  function showPreview() {
    S.scene = 'preview';
    S.grid = null;
    hideOverlay();
  }

  /** dir: 조각이 움직이는 방향 ('up'|'down'|'left'|'right') */
  function slide(dir) {
    if (S.scene !== 'play' || S.anim) return false;
    // 조각이 dir 방향으로 움직이려면 빈 칸의 반대쪽에 있어야 한다.
    const from = { up: [1, 0], down: [-1, 0], left: [0, 1], right: [0, -1] }[dir];
    const r = S.blank.r + from[0], c = S.blank.c + from[1];
    if (r < 0 || r >= N || c < 0 || c >= N) { beepBlocked(); return false; }
    return slideCell(r, c);
  }

  /** 칸 (r,c)의 조각을 빈 칸으로 민다 */
  function slideCell(r, c) {
    if (S.scene !== 'play' || S.anim) return false;
    if (Math.abs(r - S.blank.r) + Math.abs(c - S.blank.c) !== 1) { beepBlocked(); return false; }
    const tile = S.grid[r][c];
    S.anim = { tile, fromR: r, fromC: c, toR: S.blank.r, toC: S.blank.c, start: now() };
    S.grid[S.blank.r][S.blank.c] = tile;
    S.grid[r][c] = 0;
    S.blank = { r, c };
    S.moves++;
    beepSlide();
    return true;
  }

  function finishAnim() {
    S.anim = null;
    if (isSolved(S.grid)) win();
  }

  function win() {
    S.finalSeconds = Math.floor((now() - S.startedAt) / 1000);
    S.scene = 'won';
    beepWin();
    const entry = { seconds: S.finalSeconds, moves: S.moves };
    const pos = rankPosition({ ...entry, date: '9999' });
    setTimeout(() => {
      if (S.scene !== 'won') return;
      if (pos < MAX_RANK) showNamePanel(entry, pos);
      else showRankPanel(null);
    }, 1500);
  }

  function giveUp() {
    if (S.scene !== 'play') return;
    S.finalSeconds = Math.floor((now() - S.startedAt) / 1000);
    S.scene = 'failed';
    beepFail();
  }

  // ------------------------------------------------------------------
  // 입력
  // ------------------------------------------------------------------
  const KEY_DIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };

  document.addEventListener('keydown', (e) => {
    if (overlayVisible()) {
      if (e.code === 'Escape' && panelName.hidden) { hideOverlay(); if (S.scene === 'won') showPreview(); }
      return;
    }
    const dir = KEY_DIR[e.code];
    if (S.scene === 'play') {
      if (dir) { e.preventDefault(); slide(dir); flashDpad(dir); }
      else if (e.code === 'KeyQ') giveUp();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Shift') return;
    if (S.scene === 'preview') { e.preventDefault(); newGame(); }
    else if (S.scene === 'failed' || S.scene === 'won') { e.preventDefault(); showPreview(); }
  });

  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (overlayVisible()) return;
    if (S.scene === 'preview') { newGame(); return; }
    if (S.scene === 'failed' || S.scene === 'won') { showPreview(); return; }
    const p = canvasPoint(e);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const x = cellX(c + 1), y = cellY(r + 1);
      if (p.x >= x && p.x < x + TILE_W && p.y >= y && p.y < y + TILE_H && S.grid[r][c] !== 0) { slideCell(r, c); return; }
    }
  });

  const dpadButtons = [...document.querySelectorAll('#dpad button')];
  for (const b of dpadButtons) {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (S.scene === 'preview') newGame(); else slide(b.dataset.dir); });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  function flashDpad(dir) {
    const b = dpadButtons.find((x) => x.dataset.dir === dir);
    if (!b) return;
    b.classList.add('pressed');
    setTimeout(() => b.classList.remove('pressed'), 120);
  }
  document.getElementById('btn-new').addEventListener('click', () => newGame());
  document.getElementById('btn-giveup').addEventListener('click', () => giveUp());
  document.getElementById('btn-rank').addEventListener('click', () => showRankPanel(null));

  // ------------------------------------------------------------------
  // 오버레이
  // ------------------------------------------------------------------
  const overlayVisible = () => !overlay.hidden;
  function hideOverlay() { overlay.hidden = true; panelName.hidden = true; panelRank.hidden = true; }

  let pendingEntry = null;
  function showNamePanel(entry, pos) {
    pendingEntry = entry;
    nameSummary.textContent = `${pos + 1}위! ${fmtTime(entry.seconds)}, ${entry.moves}회 이동`;
    nameInput.value = loadJSON('flag-game.lastName', '') || '';
    overlay.hidden = false; panelName.hidden = false; panelRank.hidden = true;
    setTimeout(() => nameInput.focus(), 50);
  }
  nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!pendingEntry) return;
    const name = nameInput.value.trim().slice(0, 10) || '이름없음';
    saveJSON('flag-game.lastName', name);
    const entry = { name, seconds: pendingEntry.seconds, moves: pendingEntry.moves, layout: S.layout, date: new Date().toISOString() };
    addRank(entry);
    pendingEntry = null;
    showRankPanel(entry);
  });

  function showRankPanel(highlight) {
    rankBody.innerHTML = '';
    if (ranking.length === 0) {
      const tr = document.createElement('tr'); const td = document.createElement('td');
      td.colSpan = 6; td.textContent = '아직 기록이 없습니다.'; tr.appendChild(td); rankBody.appendChild(tr);
    }
    ranking.forEach((r, i) => {
      const tr = document.createElement('tr');
      if (highlight && r === highlight) tr.className = 'me';
      const d = new Date(r.date);
      const cells = [String(i + 1), r.name, fmtTime(r.seconds), String(r.moves), r.layout === 'original' ? '원작' : '무작위',
        isNaN(d) ? '' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`];
      for (const c of cells) { const td = document.createElement('td'); td.textContent = c; tr.appendChild(td); }
      rankBody.appendChild(tr);
    });
    overlay.hidden = false; panelName.hidden = true; panelRank.hidden = false;
  }
  document.getElementById('rank-close').addEventListener('click', () => { hideOverlay(); if (S.scene === 'won') showPreview(); });
  document.getElementById('rank-clear').addEventListener('click', () => { ranking = []; saveJSON(STORAGE_RANK, ranking); showRankPanel(null); });

  // ------------------------------------------------------------------
  // 그리기
  // ------------------------------------------------------------------
  function text(str, x, y, { size = 20, color = '#111', align = 'left', weight = 'bold', stroke = null } = {}) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    if (stroke) { ctx.lineWidth = 4; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
    ctx.fillStyle = color; ctx.fillText(str, x, y);
  }

  /** 조각 n(1..8)을 (x,y)에 그린다. 원본 그림의 해당 위치에서 잘라 온다. */
  function drawTile(n, x, y) {
    if (n === 0) { ctx.drawImage(imgBlank, x, y); return; }
    const sr = Math.floor((n - 1) / N), sc = (n - 1) % N;
    ctx.drawImage(imgScreen, cellX(sc + 1), cellY(sr + 1), TILE_W, TILE_H, x, y, TILE_W, TILE_H);
  }

  function drawClock(t) {
    // 원작 화면의 시계 위에 초침을 돌린다.
    const sec = S.scene === 'play' ? (t - S.startedAt) / 1000 : (S.scene === 'won' || S.scene === 'failed' ? S.finalSeconds : 0);
    const a = (sec % 60) / 60 * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#c00000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(CLOCK.cx - Math.cos(a) * 8, CLOCK.cy - Math.sin(a) * 8);
    ctx.lineTo(CLOCK.cx + Math.cos(a) * CLOCK.r, CLOCK.cy + Math.sin(a) * CLOCK.r); ctx.stroke();
    ctx.fillStyle = '#c00000'; ctx.beginPath(); ctx.arc(CLOCK.cx, CLOCK.cy, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawStatus(t) {
    const sec = S.scene === 'play' ? Math.floor((t - S.startedAt) / 1000) : S.finalSeconds;
    const shown = (S.scene === 'play' || S.scene === 'won' || S.scene === 'failed');
    // 원작이 시간을 표시하려던 자리 (drwstring ... 28, 370) 근처
    text(shown ? `시간 ${fmtTime(sec)}` : '시간 --:--', 85, 388, { size: 17, color: '#2a1608', align: 'center' });
    text(shown ? `이동 ${S.moves}회` : '이동 --회', 85, 408, { size: 17, color: '#2a1608', align: 'center' });
  }

  function drawFrames() {
    // 원작 drwbox 1,1,108+90j,124i-106,198+90j,18+124i (색 1 = 짙은 파랑)
    ctx.strokeStyle = '#00006c'; ctx.lineWidth = 1;
    for (let r = 1; r <= N; r++) for (let c = 1; c <= N; c++) ctx.strokeRect(108 + 90 * c + 0.5, 124 * r - 106 + 0.5, 90, 124);
  }

  function drawPlay(t) {
    ctx.drawImage(imgScreen, 0, 0);
    drawFrames();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const n = S.grid[r][c];
      if (S.anim && r === S.anim.toR && c === S.anim.toC) continue;   // 움직이는 조각은 나중에
      drawTile(n, cellX(c + 1), cellY(r + 1));
    }
    if (S.anim) {
      const a = S.anim;
      const k = Math.min(1, (t - a.start) / SLIDE_MS);
      drawTile(0, cellX(a.toC + 1), cellY(a.toR + 1));
      const x = cellX(a.fromC + 1) + (cellX(a.toC + 1) - cellX(a.fromC + 1)) * k;
      const y = cellY(a.fromR + 1) + (cellY(a.toR + 1) - cellY(a.fromR + 1)) * k;
      drawTile(a.tile, Math.round(x), Math.round(y));
      if (k >= 1) finishAnim();
    }
    drawClock(t); drawStatus(t);
  }

  function drawPreview(t) {
    ctx.drawImage(imgScreen, 0, 0);
    drawClock(t); drawStatus(t);
    text('그림을 잘 봐 두세요', 333, 348, { size: 17, color: '#fff', align: 'center', stroke: '#3a1a08' });
    if (Math.floor(t / 500) % 2 === 0) {
      text('아무 키나 누르면 조각이 섞입니다', 333, 372, { size: 15, color: '#ffe040', align: 'center', stroke: '#3a1a08' });
    }
  }

  function drawWon(t) {
    ctx.drawImage(imgScreen, 0, 0);   // 원작: 완성하면 m3.gif 전체를 보여 준다
    drawClock(t); drawStatus(t);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(199, 150, 269, 110);
    text('완성!', 333, 195, { size: 40, color: '#ffe040', align: 'center', stroke: '#3a1a08' });
    text(`${fmtTime(S.finalSeconds)}  ·  ${S.moves}회 이동`, 333, 228, { size: 18, color: '#fff', align: 'center', stroke: '#3a1a08' });
    if (!overlayVisible()) text('아무 키나 누르세요', 333, 250, { size: 13, color: '#fff', align: 'center', weight: 'normal', stroke: '#3a1a08' });
  }

  function drawFailed(t) {
    drawPlay(t);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H);
    // 원작 메시지 그대로
    text('You are Failed... Time Over...', 320, 200, { size: 26, color: '#fff', align: 'center' });
    text('Press AnyKey.......', 320, 240, { size: 20, color: '#ddd', align: 'center', weight: 'normal' });
    text(`${fmtTime(S.finalSeconds)} 동안 ${S.moves}회 이동했습니다`, 320, 280, { size: 15, color: '#bbb', align: 'center', weight: 'normal' });
  }

  function frame() {
    const t = now();
    ctx.clearRect(0, 0, W, H);
    if (S.scene === 'play') drawPlay(t);
    else if (S.scene === 'preview') drawPreview(t);
    else if (S.scene === 'won') drawWon(t);
    else drawFailed(t);
    requestAnimationFrame(frame);
  }

  const imgs = [imgScreen, imgBlank];
  function boot() {
    const pending = imgs.filter((i) => !(i.complete && i.naturalWidth > 0));
    if (pending.length === 0) { frame(); return; }
    let n = 0;
    const done = () => { if (++n === pending.length) frame(); };
    for (const i of pending) {
      i.addEventListener('load', done, { once: true });
      i.addEventListener('error', () => { console.error('이미지 로드 실패', i.src); done(); }, { once: true });
    }
  }
  if (location.hash === '#debug') window.__puzzle = { S, slide, slideCell, newGame };   // 테스트용
  boot();
})();
