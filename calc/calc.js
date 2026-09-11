/*
 * 계산 연습 - QuickBasic 원작 세 개(CP.BAS, RANDOM.BAS, MULTI.BAS, 정상혁)의 웹 재구현.
 *
 * 원작 요약
 *  - CP.BAS (1996, "Calculation Practice Trainer" Version 1.0)
 *    항 개수(XX+XX+XX...), 자릿수(XXXX...), 문제 수, 문제당 시간을 입력받아 " + 12 - 5 + 7" 같은 문제를 낸다.
 *    항마다 부호가 무작위라 첫 항도 음수일 수 있다. 끝나면 맞힌 개수와 백분율을 보여 주고 처음부터 반복한다.
 *    문제당 시간(tm)은 입력만 받고 코드 어디에서도 쓰지 않는다. 웹 버전은 옵션으로 제한시간을 걸 수 있다.
 *  - RANDOM.BAS (1994): 0~99 두 수의 덧셈 또는 뺄셈 20문제.
 *  - MULTI.BAS (1994): 0~99 × 0~9 곱셈 20문제.
 *  - 세 프로그램 모두 SCREEN 0 텍스트 화면에서 PRINT와 INPUT만 쓴다.
 */
(() => {
  'use strict';

  const { TextScreen, fmt, str$ } = QB;
  const scr = new TextScreen(document.getElementById('screen'));

  const STORAGE_RANK = 'calc-game.ranking';
  const STORAGE_OPTS = 'calc-game.options';
  const STORAGE_NAME = 'flag-game.lastName';
  const MAX_RANK = 10;
  const PROGRAMS = {
    cp: { title: 'CP.EXE', desc: 'Calculation Practice Trainer (1996)' },
    random: { title: 'RANDOM.EXE', desc: '덧셈·뺄셈 20문제 (1994)' },
    multi: { title: 'MULTI.EXE', desc: '곱셈 20문제 (1994)' },
  };

  // ------------------------------------------------------------------
  // DOM
  // ------------------------------------------------------------------
  const tabs = [...document.querySelectorAll('.prog-tabs [data-prog]')];
  const status = document.getElementById('status');
  const optLimit = document.getElementById('opt-limit');
  const overlay = document.getElementById('overlay');
  const panelName = document.getElementById('panel-name');
  const panelRank = document.getElementById('panel-rank');
  const nameForm = document.getElementById('name-form');
  const nameInput = document.getElementById('name-input');
  const nameSummary = document.getElementById('name-summary');
  const rankBody = document.querySelector('#rank-table tbody');
  const rankTitle = document.getElementById('rank-title');
  const rankTabs = [...document.querySelectorAll('#panel-rank [data-rank]')];

  // ------------------------------------------------------------------
  // 저장소
  // ------------------------------------------------------------------
  function loadJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }
  let ranking = loadJSON(STORAGE_RANK, {});
  if (!ranking || typeof ranking !== 'object' || Array.isArray(ranking)) ranking = {};
  for (const k of ['random', 'multi']) if (!Array.isArray(ranking[k])) ranking[k] = [];
  const options = Object.assign({ limit: false }, loadJSON(STORAGE_OPTS, {}));
  optLimit.checked = options.limit;
  optLimit.addEventListener('change', () => { options.limit = optLimit.checked; saveJSON(STORAGE_OPTS, options); scr.focus(); });

  const better = (a, b) => b.correct - a.correct || a.seconds - b.seconds || a.date.localeCompare(b.date);
  const rankPosition = (list, entry) => { let p = 0; while (p < list.length && better(list[p], entry) <= 0) p++; return p; };
  const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  // ------------------------------------------------------------------
  // 상태 표시줄
  // ------------------------------------------------------------------
  const run = { prog: null, startedAt: 0, elapsed: 0, done: 0, correct: 0, total: 0 };
  function updateStatus() {
    if (!run.prog) { status.textContent = ''; return; }
    const sec = run.startedAt ? Math.floor((Date.now() - run.startedAt) / 1000) : run.elapsed;
    const p = PROGRAMS[run.prog];
    status.textContent = run.total
      ? `${p.title} · ${run.done}/${run.total}문제 · 맞힘 ${run.correct} · 경과 ${fmtTime(sec)}`
      : `${p.title} 실행 중`;
  }
  setInterval(updateStatus, 500);

  function stopClock() {
    if (run.startedAt) run.elapsed = Math.round((Date.now() - run.startedAt) / 1000);
    run.startedAt = 0;
    updateStatus();
    return run.elapsed;
  }

  // QB 런타임 오류를 흉내 내고 프로그램을 끝낸다.
  class RuntimeError extends Error {}

  // ------------------------------------------------------------------
  // CP.BAS
  // ------------------------------------------------------------------
  async function cp() {
    scr.cls();
    scr.println('                   ****** Calculation Practice Trainer *****');
    scr.println();
    scr.println('                                          Programmed by Jung-Sang-Hyuk');
    scr.println('                                                Version 1.0');
    for (;;) {
      const hs = await scr.input('XX+XX+XX ...', { sep: ',' });
      const js = await scr.input('XXXX........', { sep: ',' });
      const mh = await scr.input('How many problems do you want to solve?', { sep: ',' });
      const tm = await scr.input('How long do you take to solve a problem?', { sep: ',' });
      if (hs < 0 || mh < 0 || hs > 16383 || mh > 16383) throw new RuntimeError('Subscript out of range');
      const cas = [], mj = [];
      for (let j = 1; j <= mh; j++) {
        cas[j] = 0; mj[j] = '';
        for (let i = 1; i <= hs; i++) {
          const pb = Math.floor(Math.random() * 10 ** js);
          const minus = Math.random() < 0.5 ? 0 : 1;
          cas[j] += minus ? -pb : pb;
          mj[j] += ' ' + (minus ? '-' : '+') + str$(pb);
        }
      }
      let cr = 0;
      Object.assign(run, { startedAt: Date.now(), elapsed: 0, done: 0, correct: 0, total: Math.floor(mh) });
      const limitMs = options.limit && tm > 0 ? tm * 1000 : 0;
      for (let i = 1; i <= mh; i++) {
        scr.print(mj[i] + '  ');
        const a = await scr.input('', { timeout: limitMs, maxLen: 20 });
        if (a === null) scr.println('time over');
        if (a === cas[i]) { scr.println('OK'); cr++; }
        else scr.println('no, correct answer is' + fmt(cas[i]));
        run.done = i; run.correct = cr;
      }
      scr.println('your correc answer is' + fmt(cr) + 'of' + fmt(mh) + 'problems');
      if (mh === 0) throw new RuntimeError('Division by zero');
      scr.println(fmt((cr / mh) * 100) + '%');
      scr.println('Press Any Key...');
      stopClock();
      const k = await scr.getKey();
      if (k === '\x1b') return;           // 웹 버전: Esc는 메뉴로
    }
  }

  // ------------------------------------------------------------------
  // RANDOM.BAS / MULTI.BAS
  // ------------------------------------------------------------------
  async function quiz(kind) {
    scr.cls();
    let s = 0;
    Object.assign(run, { startedAt: Date.now(), elapsed: 0, done: 0, correct: 0, total: 20 });
    for (let i = 1; i <= 20; i++) {
      const a = Math.floor(Math.random() * 100);
      let ca;
      if (kind === 'multi') {
        const b = Math.floor(Math.random() * 10);
        scr.print(a, 'X', b, '=');
        ca = a * b;
      } else {
        const b = Math.floor(Math.random() * 100);
        if (Math.random() < 0.5) { scr.print(a, '+', b, '='); ca = a + b; }
        else { scr.print(a, '-', b, '='); ca = a - b; }
      }
      const c = await scr.input('');
      if (c === ca) { scr.println('Ok'); s++; }
      if (ca !== c) scr.println('no,correct answer is ' + fmt(ca));
      run.done = i; run.correct = s;
    }
    scr.println('Total Correct answer is ' + fmt(s));
    const seconds = stopClock();
    await maybeRecord(kind, s, seconds);
  }

  // ------------------------------------------------------------------
  // 순위
  // ------------------------------------------------------------------
  function showPanel(panel) {
    overlay.hidden = false;
    for (const p of [panelName, panelRank]) p.hidden = p !== panel;
  }
  function hideOverlay() { overlay.hidden = true; scr.focus(); }

  function maybeRecord(kind, correct, seconds) {
    const list = ranking[kind];
    const entry = { name: '', correct, seconds, date: new Date().toISOString().slice(0, 10) };
    const pos = rankPosition(list, entry);
    if (pos >= MAX_RANK || correct === 0) return Promise.resolve();
    return new Promise((resolve) => {
      nameSummary.textContent = `${PROGRAMS[kind].desc}: 20문제 중 ${correct}개, ${fmtTime(seconds)} — ${pos + 1}위`;
      nameInput.value = loadJSON(STORAGE_NAME, '') || '';
      showPanel(panelName);
      setTimeout(() => nameInput.focus(), 50);
      nameForm.onsubmit = (e) => {
        e.preventDefault();
        entry.name = nameInput.value.trim().slice(0, 10) || '이름없음';
        saveJSON(STORAGE_NAME, entry.name);
        list.push(entry);
        list.sort(better);
        ranking[kind] = list.slice(0, MAX_RANK);
        saveJSON(STORAGE_RANK, ranking);
        nameForm.onsubmit = null;
        showRank(kind, entry);
        document.getElementById('rank-close').onclick = () => { hideOverlay(); resolve(); };
      };
    });
  }

  let rankKind = 'random';
  function showRank(kind = rankKind, highlight = null) {
    rankKind = kind;
    rankTitle.textContent = PROGRAMS[kind].desc;
    for (const t of rankTabs) t.setAttribute('aria-pressed', String(t.dataset.rank === kind));
    rankBody.innerHTML = '';
    const list = ranking[kind];
    if (!list.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5">아직 기록이 없습니다.</td>';
      rankBody.appendChild(tr);
    }
    list.forEach((r, i) => {
      const tr = document.createElement('tr');
      if (r === highlight) tr.className = 'me';
      for (const v of [i + 1, r.name, `${r.correct}/20`, fmtTime(r.seconds), r.date]) {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      }
      rankBody.appendChild(tr);
    });
    showPanel(panelRank);
  }
  for (const t of rankTabs) t.addEventListener('click', () => showRank(t.dataset.rank));
  document.getElementById('btn-rank').addEventListener('click', () => {
    showRank();
    document.getElementById('rank-close').onclick = hideOverlay;
  });
  document.getElementById('rank-clear').addEventListener('click', () => {
    ranking[rankKind] = [];
    saveJSON(STORAGE_RANK, ranking);
    showRank(rankKind);
  });

  // ------------------------------------------------------------------
  // 메뉴와 실행
  // ------------------------------------------------------------------
  async function menu() {
    run.prog = null;
    updateStatus();
    for (const t of tabs) t.setAttribute('aria-pressed', 'false');
    scr.color(7, 0);
    scr.cls();
    scr.println('C:\\QB>MENU');
    scr.println();
    scr.color(15, 1);
    scr.locate(4, 20); scr.print('                                        ');
    scr.locate(5, 20); scr.print('       계 산  연 습  모 음              ');
    scr.locate(6, 20); scr.print('                                        ');
    scr.color(7, 0);
    scr.locate(9, 12); scr.print('1. CP.EXE      Calculation Practice Trainer  (1996)');
    scr.locate(10, 27); scr.print('항 개수, 자릿수, 문제 수를 정해 암산');
    scr.locate(12, 12); scr.print('2. RANDOM.EXE  두 자리 수 덧셈·뺄셈 20문제     (1994)');
    scr.locate(14, 12); scr.print('3. MULTI.EXE   두 자리 × 한 자리 곱셈 20문제   (1994)');
    scr.locate(18, 12); scr.print('번호를 누르세요.');
    scr.color(8, 0);
    scr.locate(22, 12); scr.print('Programmed by Jung-Sang-Hyuk');
    scr.color(7, 0);
    for (;;) {
      const k = await scr.getKey();
      if (k === '1') return 'cp';
      if (k === '2') return 'random';
      if (k === '3') return 'multi';
    }
  }

  async function runProgram(prog) {
    run.prog = prog;
    Object.assign(run, { startedAt: 0, elapsed: 0, done: 0, correct: 0, total: 0 });
    for (const t of tabs) t.setAttribute('aria-pressed', String(t.dataset.prog === prog));
    scr.color(7, 0);
    try {
      if (prog === 'cp') await cp();
      else await quiz(prog);
    } catch (e) {
      if (!(e instanceof RuntimeError)) throw e;
      scr.println(e.message);
    }
    stopClock();
    scr.locate(25, 1);
    scr.print('Press any key to continue');
    await scr.getKey();
  }

  async function program(first) {
    let prog = first;
    for (;;) {
      if (!prog) prog = await menu();
      await runProgram(prog);
      prog = null;
    }
  }
  function start(prog) {
    scr.abort();
    overlay.hidden = true;
    program(prog).catch((e) => { if (!TextScreen.isAbort(e)) console.error(e); });
  }

  for (const t of tabs) t.addEventListener('click', () => { start(t.dataset.prog); scr.focus(); });
  document.getElementById('btn-menu').addEventListener('click', () => { start(null); scr.focus(); });

  if (location.hash === '#debug') window.__calc = { scr, run, ranking };
  const initial = new URLSearchParams(location.search).get('p');
  start(PROGRAMS[initial] ? initial : null);
})();
