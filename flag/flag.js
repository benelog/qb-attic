/*
 * 청기백기 (FLAG) - 1995년 QuickBasic(FF4.BAS) 원작의 웹 재구현.
 *
 * 원작 규칙 요약
 *  - 12가지 음성 명령(b1~b12.wav) 중 하나를 무작위로 재생한다.
 *  - A: 청기 올려, Z: 청기 내려, ': 백기 올려, /: 백기 내려
 *  - 명령 1,2 → A / 4,5 → Z / 7,8 → ' / 10,11 → /
 *    명령 3,6,9,12 ("~하지 마") → 아무 키도 누르지 않아야 정답
 *  - 틀린 횟수(wa%)가 4가 되면 게임 종료 (PLAY "ceg>c")
 *  - 정답이면 PLAY "ge"
 */
(() => {
  'use strict';

  // ------------------------------------------------------------------
  // 상수
  // ------------------------------------------------------------------
  const W = 640, H = 480;
  const STORAGE_RANK = 'flag-game.ranking';
  const STORAGE_OPTS = 'flag-game.options';
  const MAX_RANK = 10;
  const MAX_MISS = 4;               // 원작: wa% = 4 이면 게임 오버

  const BASE_WINDOW = 1300;         // 음성이 끝난 뒤 반응 허용 시간(ms)
  const MIN_WINDOW = 500;
  const WINDOW_STEP = 80;           // 5회 맞출 때마다 줄어드는 시간
  const FLAG_HOLD = 280;            // 깃발 스프라이트 유지 시간 (원작 delay/4 + sdelay 20)
  const ROUND_GAP = 550;            // 판정 후 다음 명령까지의 간격

  // 명령표. id는 원작의 s 값(b<s>.wav)과 같다.
  // answer: 'bu'|'bd'|'wu'|'wd'|null(아무 키도 누르지 않음)
  const COMMANDS = [
    { id: 1,  text: '청기 올려!',       answer: 'bu' },
    { id: 2,  text: '청기 올려!',       answer: 'bu' },
    { id: 3,  text: '청기 올리지 마!',  answer: null },
    { id: 4,  text: '청기 내려!',       answer: 'bd' },
    { id: 5,  text: '청기 내려!',       answer: 'bd' },
    { id: 6,  text: '청기 내리지 마!',  answer: null },
    { id: 7,  text: '백기 올려!',       answer: 'wu' },
    { id: 8,  text: '백기 올려!',       answer: 'wu' },
    { id: 9,  text: '백기 올리지 마!',  answer: null },
    { id: 10, text: '백기 내려!',       answer: 'wd' },
    { id: 11, text: '백기 내려!',       answer: 'wd' },
    { id: 12, text: '백기 내리지 마!',  answer: null },
  ];

  const ACTION_LABEL = { bu: '청기 올림', bd: '청기 내림', wu: '백기 올림', wd: '백기 내림' };

  // 원작 BLKPUT 좌표
  const SPRITE_POS = {
    bu: { x: 416, y: 43 },
    bd: { x: 416, y: 109 },
    wu: { x: 545, y: 43 },
    wd: { x: 545, y: 109 },
  };

  // 보드(dgi.gif) 위의 영역들 (픽셀 측정값)
  const TIME_BAR = { x: 134, y: 95, w: 218, h: 6 };
  const MENU_ITEMS = [
    { key: 'start',    label: '경기 시작', x: 456, y: 302, w: 79, h: 27 },
    { key: 'practice', label: '대기실',   x: 456, y: 329, w: 79, h: 24 },
    { key: 'exit',     label: '나가기',   x: 456, y: 354, w: 79, h: 25 },
  ];
  const LAMP = { cx: 591.5, cy: 341.5, r: 22 };
  // 키 설명표의 키 아이콘 셀 (클릭으로도 조작 가능)
  const KEY_CELLS = [
    { action: 'bu', x: 213, y: 312, w: 78, h: 30 },
    { action: 'wu', x: 303, y: 312, w: 78, h: 30 },
    { action: 'bd', x: 213, y: 348, w: 78, h: 30 },
    { action: 'wd', x: 303, y: 348, w: 78, h: 30 },
  ];

  const FONT = '"Nanum Gothic", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

  // ------------------------------------------------------------------
  // DOM
  // ------------------------------------------------------------------
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  const img = {
    board: document.getElementById('img-board'),
    logo: document.getElementById('img-logo'),
    bu: document.getElementById('img-bu'),
    bd: document.getElementById('img-bd'),
    wu: document.getElementById('img-wu'),
    wd: document.getElementById('img-wd'),
  };
  const overlay = document.getElementById('overlay');
  const panelName = document.getElementById('panel-name');
  const panelRank = document.getElementById('panel-rank');
  const nameForm = document.getElementById('name-form');
  const nameInput = document.getElementById('name-input');
  const nameSummary = document.getElementById('name-summary');
  const rankBody = document.querySelector('#rank-table tbody');
  const optCaption = document.getElementById('opt-caption');
  const optSound = document.getElementById('opt-sound');

  // ------------------------------------------------------------------
  // 저장소 (Local Storage)
  // ------------------------------------------------------------------
  function loadJSON(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 사생활 모드 등 */ }
  }

  let ranking = loadJSON(STORAGE_RANK, []);
  if (!Array.isArray(ranking)) ranking = [];
  const options = Object.assign({ caption: true, sound: true }, loadJSON(STORAGE_OPTS, {}));
  optCaption.checked = options.caption;
  optSound.checked = options.sound;
  optCaption.addEventListener('change', () => { options.caption = optCaption.checked; saveJSON(STORAGE_OPTS, options); });
  optSound.addEventListener('change', () => { options.sound = optSound.checked; saveJSON(STORAGE_OPTS, options); });

  const bestScore = () => ranking.reduce((m, r) => Math.max(m, r.score | 0), 0);
  function rankPosition(score) {
    // 이 점수가 들어갈 순위 (0부터). MAX_RANK 이상이면 진입 실패.
    let pos = 0;
    while (pos < ranking.length && ranking[pos].score >= score) pos++;
    return pos;
  }
  function addRank(entry) {
    ranking.push(entry);
    ranking.sort((a, b) => b.score - a.score || b.hits - a.hits || a.date.localeCompare(b.date));
    ranking = ranking.slice(0, MAX_RANK);
    saveJSON(STORAGE_RANK, ranking);
  }

  // ------------------------------------------------------------------
  // 소리
  // ------------------------------------------------------------------
  const voices = {};
  for (const c of COMMANDS) voices[c.id] = new Audio(`assets/snd/b${c.id}.wav`);
  const sndStart = new Audio('assets/snd/start.wav');
  const sndOpening = new Audio('assets/snd/opening.wav');
  for (const a of [...Object.values(voices), sndStart, sndOpening]) a.preload = 'auto';

  let audioCtx = null;
  function beeps(notes) {
    // PC 스피커 PLAY 문 흉내: [[주파수, 길이ms], ...]
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
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.setValueAtTime(0.0001, t + ms / 1000 - 0.01);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + ms / 1000);
        t += ms / 1000;
      }
    } catch { /* 오디오 미지원 */ }
  }
  const NOTE = { C4: 261.6, E4: 329.6, G4: 392.0, C5: 523.3 };
  const beepCorrect = () => beeps([[NOTE.G4, 110], [NOTE.E4, 110]]);            // PLAY "ge"
  const beepGameOver = () => beeps([[NOTE.C4, 160], [NOTE.E4, 160], [NOTE.G4, 160], [NOTE.C5, 320]]); // PLAY "ceg>c"
  const beepWrong = () => beeps([[110, 220]]);

  /** 음성 재생. 끝나면(또는 재생 실패 시 즉시) onEnd 호출. */
  function playVoice(audio, onEnd) {
    let done = false;
    const finish = () => { if (done) return; done = true; audio.removeEventListener('ended', finish); onEnd(); };
    if (!options.sound) { setTimeout(finish, 350); return; }
    audio.addEventListener('ended', finish);
    try { audio.currentTime = 0; } catch { /* 아직 로드 전 */ }
    const p = audio.play();
    if (p && p.catch) p.catch(() => setTimeout(finish, 350));
    // 'ended'가 오지 않는 경우를 대비한 안전장치
    const dur = (isFinite(audio.duration) && audio.duration > 0) ? audio.duration * 1000 : 900;
    setTimeout(finish, dur + 600);
  }

  // ------------------------------------------------------------------
  // 게임 상태
  // ------------------------------------------------------------------
  const S = {
    scene: 'logo',          // logo | menu | game | practice | gameover
    menuIndex: 0,
    flag: { blue: null, white: null, until: 0 },   // 현재 표시 중인 깃발 스프라이트
    game: null,
    caption: '',
    lamp: null,             // 'ok' | 'bad' | null
    lampUntil: 0,
    blink: 0,
  };

  function newGame() {
    return {
      score: 0,
      hits: 0,
      miss: 0,
      round: 0,
      cmd: null,
      phase: 'idle',        // idle | speaking | waiting | resolved
      voiceEnd: 0,          // 음성이 끝난 시각
      deadline: 0,          // 반응 마감 시각
      windowMs: BASE_WINDOW,
      nextAt: 0,
      answered: null,
      result: null,         // 'ok' | 'bad'
      lastPoints: 0,
    };
  }

  const now = () => performance.now();
  const windowFor = (hits) => Math.max(MIN_WINDOW, BASE_WINDOW - Math.floor(hits / 5) * WINDOW_STEP);

  function showFlag(action) {
    const t = now();
    if (action === 'bu' || action === 'bd') S.flag.blue = action;
    if (action === 'wu' || action === 'wd') S.flag.white = action;
    S.flag.until = t + FLAG_HOLD;
  }

  function setLamp(kind, ms) {
    S.lamp = kind;
    S.lampUntil = now() + ms;
  }

  // ---------------- 장면 전환 ----------------
  function stopVoices() {
    for (const a of [...Object.values(voices), sndStart]) { try { a.pause(); } catch { /* ignore */ } }
  }

  function gotoMenu() {
    stopVoices();
    S.scene = 'menu';
    S.game = null;
    S.caption = '';
    S.lamp = null;
    hideOverlay();
  }

  function startGame() {
    S.scene = 'game';
    S.game = newGame();
    S.caption = '준비...';
    S.lamp = null;
    playVoice(sndStart, () => {
      if (S.scene !== 'game') return;
      S.game.nextAt = now() + 400;
    });
  }

  function startPractice() {
    S.scene = 'practice';
    S.game = null;
    S.caption = '대기실: 키를 눌러 연습, Esc로 돌아가기';
  }

  function gotoLogo() {
    stopVoices();
    S.scene = 'logo';
    S.game = null;
    S.caption = '';
    hideOverlay();
  }

  // ---------------- 한 판 진행 ----------------
  function beginRound() {
    const g = S.game;
    g.round++;
    g.cmd = COMMANDS[Math.floor(Math.random() * COMMANDS.length)];
    g.phase = 'speaking';
    g.answered = null;
    g.result = null;
    g.windowMs = windowFor(g.hits);
    g.voiceEnd = 0;
    g.deadline = 0;
    S.caption = g.cmd.text;
    S.lamp = null;
    const thisRound = g.round;
    playVoice(voices[g.cmd.id], () => {
      if (S.scene !== 'game' || S.game !== g || g.round !== thisRound) return;
      g.voiceEnd = now();
      if (g.phase === 'speaking') {
        g.phase = 'waiting';
        g.deadline = g.voiceEnd + g.windowMs;
      } else if (g.phase === 'resolved') {
        // 음성 도중에 이미 답한 경우: 음성이 끝난 뒤 다음 판으로
        g.nextAt = g.voiceEnd + ROUND_GAP;
      }
    });
  }

  function resolve(action) {
    const g = S.game;
    if (!g || (g.phase !== 'speaking' && g.phase !== 'waiting')) return;
    const t = now();
    const correct = action === g.cmd.answer;
    g.answered = action;
    g.phase = 'resolved';
    g.result = correct ? 'ok' : 'bad';

    if (correct) {
      let bonus = 100;
      if (action !== null && g.voiceEnd) {
        const remain = Math.max(0, g.deadline - t);
        bonus = Math.round(100 * remain / g.windowMs);
      } else if (action === null) {
        bonus = 50;
      }
      g.lastPoints = 100 + bonus;
      g.score += g.lastPoints;
      g.hits++;
      beepCorrect();
      setLamp('ok', ROUND_GAP);
    } else {
      g.lastPoints = 0;
      g.miss++;
      beepWrong();
      setLamp('bad', ROUND_GAP);
    }

    if (g.miss >= MAX_MISS) {
      g.phase = 'over';
      setTimeout(() => endGame(), 700);
      return;
    }
    // 음성이 아직 재생 중이면 playVoice 콜백이 nextAt을 정한다.
    g.nextAt = g.voiceEnd ? t + ROUND_GAP : Infinity;
  }

  function endGame() {
    if (S.scene !== 'game') return;
    const g = S.game;
    g.phase = 'idle';
    S.scene = 'gameover';
    S.caption = '';
    beepGameOver();
    setTimeout(() => {
      if (S.scene !== 'gameover') return;
      const pos = rankPosition(g.score);
      if (g.score > 0 && pos < MAX_RANK) showNamePanel(g, pos);
      else showRankPanel(null);
    }, 1200);
  }

  function updateGame() {
    const g = S.game;
    if (!g) return;
    const t = now();
    if (g.phase === 'idle' && g.nextAt && t >= g.nextAt) { beginRound(); return; }
    if (g.phase === 'waiting' && t >= g.deadline) { resolve(null); return; }
    if (g.phase === 'resolved' && t >= g.nextAt) { g.phase = 'idle'; g.nextAt = t; }
  }

  // ------------------------------------------------------------------
  // 입력
  // ------------------------------------------------------------------
  const KEY_ACTION = { KeyA: 'bu', KeyZ: 'bd', Quote: 'wu', Slash: 'wd' };

  function doAction(action) {
    if (overlayVisible()) return;
    switch (S.scene) {
      case 'logo': enterFromLogo(); return;
      case 'practice': showFlag(action); return;
      case 'game':
        if (S.game && (S.game.phase === 'speaking' || S.game.phase === 'waiting')) {
          showFlag(action);
          resolve(action);
        } else if (S.game && S.game.phase === 'resolved') {
          showFlag(action);   // 이미 판정됨. 연출만.
        }
        return;
      default: return;
    }
  }

  function enterFromLogo() {
    if (options.sound) { sndOpening.currentTime = 0; sndOpening.play().catch(() => {}); }
    gotoMenu();
  }

  function activateMenu() {
    const item = MENU_ITEMS[S.menuIndex];
    if (item.key === 'start') startGame();
    else if (item.key === 'practice') startPractice();
    else gotoLogo();
  }

  document.addEventListener('keydown', (e) => {
    if (overlayVisible()) {
      if (e.code === 'Escape' && !panelName.hidden) return; // 이름 입력 중엔 무시
      if (e.code === 'Escape') { hideOverlay(); if (S.scene === 'gameover') gotoMenu(); }
      return;
    }
    const action = KEY_ACTION[e.code];
    if (action) { e.preventDefault(); doAction(action); flashTouchKey(action); return; }

    switch (S.scene) {
      case 'logo':
        if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key !== 'Shift') { e.preventDefault(); enterFromLogo(); }
        break;
      case 'menu':
        if (e.code === 'ArrowUp' || e.code === 'KeyW') { S.menuIndex = (S.menuIndex + MENU_ITEMS.length - 1) % MENU_ITEMS.length; e.preventDefault(); }
        else if (e.code === 'ArrowDown' || e.code === 'KeyS') { S.menuIndex = (S.menuIndex + 1) % MENU_ITEMS.length; e.preventDefault(); }
        else if (e.code === 'Enter' || e.code === 'Space') { activateMenu(); e.preventDefault(); }
        else if (e.code === 'Escape') gotoLogo();
        break;
      case 'practice':
        if (e.code === 'Escape' || e.code === 'KeyE') gotoMenu();
        break;
      case 'game':
        if (e.code === 'Escape' || e.code === 'KeyE') gotoMenu();  // 원작: "e" 키로 종료
        break;
      case 'gameover':
        if (e.code === 'Escape' || e.code === 'Enter') gotoMenu();
        break;
    }
  });

  // 캔버스 클릭 (메뉴, 키 아이콘, 로고)
  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

  canvas.addEventListener('pointerdown', (e) => {
    if (overlayVisible()) return;
    const p = canvasPoint(e);
    if (S.scene === 'logo') { enterFromLogo(); return; }
    if (S.scene === 'menu') {
      const i = MENU_ITEMS.findIndex((m) => inRect(p, m));
      if (i >= 0) { S.menuIndex = i; activateMenu(); }
      return;
    }
    if (S.scene === 'game' || S.scene === 'practice') {
      const cell = KEY_CELLS.find((c) => inRect(p, c));
      if (cell) { doAction(cell.action); flashTouchKey(cell.action); return; }
      const menu = MENU_ITEMS.find((m) => inRect(p, m));
      if (menu && menu.key === 'exit') gotoMenu();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (S.scene !== 'menu') return;
    const p = canvasPoint(e);
    const i = MENU_ITEMS.findIndex((m) => inRect(p, m));
    if (i >= 0) S.menuIndex = i;
  });

  // 터치 버튼
  const touchButtons = [...document.querySelectorAll('#touch-keys button')];
  for (const b of touchButtons) {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); doAction(b.dataset.action); });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  function flashTouchKey(action) {
    const b = touchButtons.find((x) => x.dataset.action === action);
    if (!b) return;
    b.classList.add('pressed');
    setTimeout(() => b.classList.remove('pressed'), 150);
  }

  // ------------------------------------------------------------------
  // 오버레이 (이름 입력 / 순위표)
  // ------------------------------------------------------------------
  const overlayVisible = () => !overlay.hidden;
  function hideOverlay() { overlay.hidden = true; panelName.hidden = true; panelRank.hidden = true; }

  let pendingEntry = null;
  function showNamePanel(g, pos) {
    pendingEntry = { score: g.score, hits: g.hits };
    nameSummary.textContent = `${pos + 1}위! 점수 ${g.score.toLocaleString()}점, ${g.hits}회 맞춤`;
    nameInput.value = loadJSON('flag-game.lastName', '') || '';
    overlay.hidden = false;
    panelName.hidden = false;
    panelRank.hidden = true;
    setTimeout(() => nameInput.focus(), 50);
  }
  nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim().slice(0, 10) || '이름없음';
    saveJSON('flag-game.lastName', name);
    const entry = { name, score: pendingEntry.score, hits: pendingEntry.hits, date: new Date().toISOString() };
    addRank(entry);
    pendingEntry = null;
    showRankPanel(entry);
  });

  function showRankPanel(highlight) {
    rankBody.innerHTML = '';
    if (ranking.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5; td.textContent = '아직 기록이 없습니다.';
      tr.appendChild(td); rankBody.appendChild(tr);
    }
    ranking.forEach((r, i) => {
      const tr = document.createElement('tr');
      if (highlight && r === highlight) tr.className = 'me';
      const d = new Date(r.date);
      const cells = [String(i + 1), r.name, r.score.toLocaleString(), String(r.hits),
        isNaN(d) ? '' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`];
      for (const c of cells) { const td = document.createElement('td'); td.textContent = c; tr.appendChild(td); }
      rankBody.appendChild(tr);
    });
    overlay.hidden = false;
    panelName.hidden = true;
    panelRank.hidden = false;
  }
  document.getElementById('rank-close').addEventListener('click', () => {
    hideOverlay();
    if (S.scene === 'gameover') gotoMenu();
  });
  document.getElementById('rank-clear').addEventListener('click', () => {
    ranking = [];
    saveJSON(STORAGE_RANK, ranking);
    showRankPanel(null);
  });
  document.getElementById('btn-rank').addEventListener('click', () => {
    if (S.scene === 'game') gotoMenu();
    showRankPanel(null);
  });

  // ------------------------------------------------------------------
  // 그리기
  // ------------------------------------------------------------------
  function text(str, x, y, { size = 28, color = '#111', align = 'left', weight = 'bold', stroke = null } = {}) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    if (stroke) { ctx.lineWidth = 4; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function drawLogo(t) {
    ctx.drawImage(img.logo, 0, 0, W, H);
    if (Math.floor(t / 500) % 2 === 0) {
      text('아무 키나 누르거나 클릭하세요', W / 2, 430, { size: 24, color: '#333', align: 'center' });
    }
    text('청기백기 - 1995 QuickBasic 원작 웹 재구현', W / 2, 465, { size: 15, color: '#777', align: 'center', weight: 'normal' });
  }

  function drawBoard(t) {
    ctx.drawImage(img.board, 0, 0);

    // 깃발 스프라이트 (표시 시간이 지나면 기본 자세 = 보드 그림 그대로)
    if (t > S.flag.until) { S.flag.blue = null; S.flag.white = null; }
    for (const a of [S.flag.blue, S.flag.white]) {
      if (!a) continue;
      const p = SPRITE_POS[a];
      ctx.drawImage(img[a], p.x, p.y);
    }

    const g = S.game;
    const best = Math.max(bestScore(), g ? g.score : 0);

    // 점수
    text(g ? g.score.toLocaleString() : '', 195, 197, { size: 30, color: '#1b1bb0' });
    text(best ? best.toLocaleString() : '0', 195, 244, { size: 30, color: '#1b1bb0' });

    // 맞은 횟수 / 남은 기회
    if (g) text(String(g.hits), 250, 440, { size: 30, color: '#111' });
    if (g) {
      const left = MAX_MISS - g.miss;
      text(String(left), 532, 440, { size: 30, color: left <= 1 ? '#c00000' : '#111' });
    }

    // 시간 막대
    if (g && g.phase === 'waiting') {
      const ratio = Math.max(0, (g.deadline - t) / g.windowMs);
      ctx.fillStyle = ratio < 0.3 ? '#e02020' : '#d04010';
      ctx.fillRect(TIME_BAR.x, TIME_BAR.y, Math.round(TIME_BAR.w * ratio), TIME_BAR.h);
    } else if (g && g.phase === 'speaking') {
      ctx.fillStyle = '#e0a020';
      ctx.fillRect(TIME_BAR.x, TIME_BAR.y, TIME_BAR.w, TIME_BAR.h);
    }

    // 메뉴 강조
    if (S.scene === 'menu') {
      const m = MENU_ITEMS[S.menuIndex];
      ctx.strokeStyle = Math.floor(t / 300) % 2 ? '#ffe040' : '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(m.x - 2, m.y - 1, m.w + 4, m.h + 2);
      text('↑↓ 선택, Enter 또는 클릭', 513, 300, { size: 12, color: '#3a2008', align: 'center', weight: 'normal' });
    } else if (S.scene === 'game' || S.scene === 'practice') {
      // 게임 중에는 '나가기'만 유효
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 2;
      const m = MENU_ITEMS[2];
      ctx.strokeRect(m.x - 2, m.y - 1, m.w + 4, m.h + 2);
    }

    // 판정 램프 (원작 보드의 빨간 동그라미 자리)
    if (S.lamp && t < S.lampUntil) {
      if (S.lamp === 'ok') {
        ctx.beginPath();
        ctx.arc(LAMP.cx, LAMP.cy, LAMP.r - 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(60, 220, 90, .85)';
        ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = '#0a7a2a'; ctx.stroke();
      } else {
        ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round';
        const r = LAMP.r + 2;
        ctx.beginPath();
        ctx.moveTo(LAMP.cx - r, LAMP.cy - r); ctx.lineTo(LAMP.cx + r, LAMP.cy + r);
        ctx.moveTo(LAMP.cx + r, LAMP.cy - r); ctx.lineTo(LAMP.cx - r, LAMP.cy + r);
        ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = '#c00000'; ctx.stroke();
      }
    } else {
      S.lamp = null;
    }

    // 자막 (캐릭터 창 위쪽 흰 공간)
    if (S.caption && (options.caption || S.scene === 'practice' || S.caption === '준비...')) {
      const isTrap = g && g.cmd && g.cmd.answer === null && S.scene === 'game' && S.caption === g.cmd.text;
      text(S.caption, 513, 38, { size: S.scene === 'practice' ? 13 : 24, color: isTrap ? '#b00000' : '#102080', align: 'center' });
    }

    // 판정 결과 텍스트
    if (g && g.phase === 'resolved' && g.result) {
      const msg = g.result === 'ok' ? `+${g.lastPoints}` : (g.answered ? `${ACTION_LABEL[g.answered]} ✗` : '가만히 있으면 안 돼요 ✗');
      text(msg, 513, 270, { size: 20, color: g.result === 'ok' ? '#0a7a2a' : '#c00000', align: 'center', stroke: '#fff' });
    }
  }

  function drawGameOver(t) {
    drawBoard(t);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(0, 0, W, H);
    const g = S.game;
    ctx.fillStyle = '#c98a4a';
    ctx.strokeStyle = '#4a2a10';
    ctx.lineWidth = 4;
    ctx.fillRect(140, 150, 360, 170);
    ctx.strokeRect(140, 150, 360, 170);
    text('게임 종료', 320, 200, { size: 36, color: '#3a1a08', align: 'center' });
    text(`점수 ${g.score.toLocaleString()}   맞은 횟수 ${g.hits}`, 320, 245, { size: 22, color: '#1b1bb0', align: 'center' });
    text('4번 틀렸습니다', 320, 280, { size: 18, color: '#7a1010', align: 'center', weight: 'normal' });
    if (!overlayVisible()) text('Enter / Esc: 메뉴로', 320, 305, { size: 14, color: '#3a1a08', align: 'center', weight: 'normal' });
  }

  function frame() {
    const t = now();
    if (S.scene === 'game') updateGame();
    ctx.clearRect(0, 0, W, H);
    if (S.scene === 'logo') drawLogo(t);
    else if (S.scene === 'gameover') drawGameOver(t);
    else drawBoard(t);
    requestAnimationFrame(frame);
  }

  // 이미지 로드 후 시작
  const imgs = Object.values(img);
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
  if (location.hash === '#debug') window.__flag = { S, COMMANDS };  // 테스트용 상태 노출
  boot();
})();
