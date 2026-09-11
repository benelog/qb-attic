/*
 * 계산기 - 1993년 QuickBasic(CALCU2.BAS, 정상혁) 원작의 웹 재구현.
 *
 * 원작 요약
 *  - 텍스트 화면 가운데 상자 안에 숫자를 한 줄씩 넣고 + - * / 키로 다음 줄로 넘어간다.
 *    줄 앞의 연산자가 그 줄의 값을 누적 결과에 어떻게 적용할지 정한다. 결과는 상자 아래에 보인다.
 *  - 500줄까지 넣을 수 있고 화면에는 14줄이 보인다. ↑ ↓ 로 줄을 오가며 값을 고칠 수 있다.
 *  - Tab 은 현재 줄의 연산자만 바꾼다. Home, End, Del, Backspace 로 줄 안을 편집한다.
 *  - Enter 는 아무 일도 하지 않는다(원작의 CASE ELSE). 연산자 키나 ↓ 가 다음 줄이다.
 *  - Esc 를 두 번 누르면 끝난다. 값이 1조를 넘거나 결과가 10조를 넘으면 키를 기다렸다가 끝난다.
 *  - 원작은 큰 프로그램의 모듈(CALCU2.OBJ)이라 화면 바탕색을 정하지 않는다.
 *    Esc 취소 처리에서 COLOR 15, 1 로 되돌리는 것을 보고 흰 글자, 파란 바탕을 기본으로 삼았다.
 */
(() => {
  'use strict';

  const { TextScreen } = QB;
  const scr = new TextScreen(document.getElementById('screen'), { captureTab: true });
  const status = document.getElementById('status');

  const N = 500;
  const OPS = ['+', '-', '*', '/'];
  const isOp = (s) => s.length === 1 && OPS.includes(s);

  class RuntimeError extends Error {}

  // ------------------------------------------------------------------
  // QB 흉내: PRINT USING, STR$, VAL, BEEP
  // ------------------------------------------------------------------
  // PRINT USING "###,###,###,###" 류. 정수 자리만, 천 단위 쉼표, 오른쪽 정렬. 넘치면 % 를 앞에 붙인다.
  function using(width, n, comma = true) {
    const v = Math.sign(n) * Math.round(Math.abs(n));
    const digits = comma ? Math.abs(v).toLocaleString('en-US') : String(Math.abs(v));
    const t = (v < 0 ? '-' : '') + digits;
    return t.length > width ? '%' + t : t.padStart(width);
  }
  // STR$ (DOUBLE)
  function strD(n) {
    let s;
    if (Number.isInteger(n) && Math.abs(n) < 1e16) s = String(Math.abs(n));
    else {
      s = String(Math.abs(parseFloat(Math.abs(n).toPrecision(16))));
      if (s.startsWith('0.')) s = s.slice(1);
    }
    return (n < 0 ? '-' : ' ') + s;
  }
  // VAL: 공백을 모두 지우고 앞에서부터 숫자로 읽을 수 있는 만큼 읽는다.
  function val(s) {
    const t = s.replace(/\s+/g, '');
    const m = /^[+-]?(\d+\.?\d*|\.\d+)([eEdD][+-]?\d+)?/.exec(t);
    return m ? Number(m[0].replace(/[dD]/, 'e')) : 0;
  }
  let audio = null;
  function beep() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'square'; o.frequency.value = 800;
      g.gain.value = 0.08;
      o.connect(g).connect(audio.destination);
      o.start(); o.stop(audio.currentTime + 0.1);
    } catch { /* ignore */ }
  }
  const screenChar = (r, c) => scr.cells[r - 1][c - 1].ch || ' ';

  // ------------------------------------------------------------------
  // 원작 SUB 들
  // ------------------------------------------------------------------
  function clscreen(xn1, yn1, xn2, yn2) {
    const w = xn2 - xn1 + 1;
    for (let one = yn1; one <= yn2; one++) { scr.locate(one, xn1); scr.print(' '.repeat(w)); }
  }

  function makebox(x1, y1, x2, y2) {
    scr.color(2, 1);
    for (let a = x1 + 2; a <= x2 - 2; a += 2) {
      scr.locate(y1, a); scr.print('─');
      scr.locate(y2, a); scr.print('━');
    }
    scr.locate(y1, x1); scr.print('┌');
    scr.locate(y1, x2); scr.print('┒');
    scr.locate(y2, x1); scr.print('┕');
    scr.locate(y2, x2); scr.print('┛');
    for (let b = y1 + 1; b <= y2 - 1; b++) {
      scr.locate(b, x1); scr.print('│');
      scr.locate(b, x2); scr.print('┃');
    }
    scr.color(15, 1);          // 원작은 COLOR 0, 1
  }

  // 편집 상태 (원작의 SHARED 변수)
  const S = { caldat: '', caldatbak: '', resultsu: [], resu: [], clm: 5, z: 1, choo: 1, total: 0 };

  // 한 줄 편집. xj 열부터 clmnum 칸. 돌아갈 때 S.caldat 에 읽은 문자열, S.caldatbak 에 누른 키의 뜻을 남긴다.
  async function caledit(xj, yj, clmnum) {
    S.caldatbak = S.caldat;
    S.caldat = '';
    let column = xj;
    let row = yj;
    let jam = '';
    const grab = (to) => { let t = ''; for (let i = xj; i <= to; i++) t += screenChar(row, i); return t; };
    const leave = (what, to) => { S.caldat = grab(to); S.caldatbak = what; scr.hideCursor(); };
    for (;;) {
      if (column < xj) column = xj; else if (column > xj + clmnum) column = xj + clmnum;
      if (row < 5) row = 5; else if (row > 18) row = 18;
      scr.showCursor(row, column);
      const k = await scr.getKey();
      if (k.length === 1 && k.charCodeAt(0) > 58) { beep(); continue; }   // 숫자와 기호만 받는다
      switch (k) {
        case 'Tab':
          leave('Tab', xj + 15);
          return;
        case '+': case '-': case '*': case '/':
          leave(k, column - 1);
          return;
        case 'ArrowUp': case 'ArrowDown':
          if (column === 35) column = clmnum + xj + 1;
          leave(k === 'ArrowUp' ? 'scroup' : 'scrodn', column - 1);
          return;
        case 'Home':
          column = xj;
          break;
        case 'End':
          column = xj + clmnum - 1;
          break;
        case 'Delete': {
          for (let d = column; d <= clmnum + xj; d++) jam += screenChar(row, d);
          const n = clmnum + xj - column;
          scr.locate(row, column); scr.print(n > 0 ? jam.slice(jam.length - n) : '');
          break;
        }
        case '\x1b': {
          S.caldat = grab(column - xj);          // 원작 그대로 (범위가 비어 있어 아무것도 읽지 않는다)
          scr.color(7, 0); scr.locate(24, 32); scr.print(' 끝낼까요? [끝은 Esc] '); scr.color(15, 1);
          scr.showCursor(24, 49);
          const e = await scr.getKey();
          if (e === '\x1b') { S.caldatbak = '99999'; scr.hideCursor(); return; }
          break;
        }
        case '\b':
          column--;
          if (column <= xj) column = xj;
          if (column >= xj + clmnum - 1) { scr.locate(row, column + 1); scr.print(' '); }
          scr.locate(row, column); scr.print(' ');
          break;
        default:
          if (k.length === 1 && k.charCodeAt(0) > 31) {
            scr.locate(row, column); scr.print(k);
            if (column < xj + clmnum - 1) column++;
          }
      }
    }
  }

  function showRecalc() {
    const recalc = strD(S.resultsu[S.choo]).slice(0, 15);
    scr.locate(S.clm, 34); scr.print(recalc + ' '.repeat(16 - recalc.length));
  }

  async function calcu() {
    S.resultsu = new Array(N + 1).fill(0);
    S.resu = new Array(N + 1).fill('');
    S.total = 0;
    clscreen(30, 4, 54, 25);
    makebox(30, 4, 54, 22);
    makebox(30, 23, 54, 25);
    for (let a = 32; a <= 52; a += 2) { scr.locate(19, a); scr.print('━'); }
    scr.locate(20, 32); scr.print('결과:');
    scr.locate(21, 34); scr.print(using(4, 0, false) + '  번째 계산');
    S.caldat = ''; S.caldatbak = '';
    S.clm = 5; S.z = 1; S.choo = 1;
    let calda;
    for (;;) {
      switch (S.caldatbak) {
        case 'Tab': {
          let intab;
          for (;;) {
            scr.showCursor(S.clm, 33);
            intab = await scr.getKey();
            if (isOp(intab)) break;
          }
          scr.hideCursor();
          scr.locate(S.clm, 33); scr.print(intab);
          S.resu[S.choo] = intab;
          showRecalc();
          break;
        }
        case 'scroup':
          if (S.choo < 15) S.clm--;
          S.z--; if (S.z < 1) S.z = 1;
          S.choo--;
          if (S.clm < 5) S.clm = 5;
          if (S.choo < 1) S.choo = 1;
          showRecalc();
          break;
        case 'scrodn':
          S.clm++; S.choo++;
          if (S.choo > 14) S.z++;
          if (S.clm > 18) S.clm = 18;
          if (S.choo > N) S.choo = N;
          showRecalc();
          break;
        case '+': case '-': case '*': case '/':
          S.clm++; if (S.clm > 18) S.clm = 18;
          S.choo++; if (S.choo > N) S.choo = N;
          if (S.choo > 14) S.z++;
          break;
        case '99999':
          clscreen(30, 4, 55, 25);
          return;
      }
      if (isOp(S.caldatbak)) S.resu[S.choo] = S.caldatbak;

      let resulthap = 0;
      for (let cc = 1; cc <= S.choo - 1; cc++) {
        const v = S.resultsu[cc];
        switch (S.resu[cc]) {
          case '': resulthap = S.choo <= 2 ? v : resulthap + v; break;
          case '+': resulthap += v; break;
          case '-': resulthap -= v; break;
          case '/': if (v === 0) throw new RuntimeError('Division by zero'); resulthap /= v; break;
          case '*': resulthap *= v; break;
        }
      }
      if (Math.abs(resulthap) > 1e13) { setStatus('결과가 10조를 넘어 원작처럼 끝냅니다. 아무 키나 누르세요.'); await scr.getKey(); break; }
      S.total = resulthap;
      scr.locate(20, 37); scr.print(using(17, resulthap));
      scr.locate(21, 32); scr.print(using(4, S.choo - 1, false) + '  째자료 까지 계산');
      if (isOp(S.caldatbak)) { scr.locate(S.clm, 33); scr.print(S.caldatbak); }
      for (let sd = S.choo; sd <= S.choo + 13; sd++) {
        const r = sd - S.choo + 5, idx = sd - S.choo + S.z;
        scr.locate(r, 33); scr.print(' ');
        scr.locate(r, 33); scr.print(S.resu[idx] ?? '');
        if (r === S.clm) continue;
        scr.locate(r, 35); scr.print(using(15, S.resultsu[idx] ?? 0));
      }
      updateStatus();
      await caledit(35, S.clm, 15);
      calda = S.caldat.slice(0, 15).replace(/,/g, '');
      S.resultsu[S.choo] = val(calda);
      if (Math.abs(S.resultsu[S.choo]) > 1e12) { setStatus('값이 1조를 넘어 원작처럼 끝냅니다. 아무 키나 누르세요.'); await scr.getKey(); break; }
      scr.locate(S.clm, 35); scr.print(using(15, S.resultsu[S.choo]));
    }
    clscreen(30, 4, 55, 25);
  }

  // ------------------------------------------------------------------
  // 웹 쪽
  // ------------------------------------------------------------------
  function setStatus(t) { status.textContent = t; }
  function updateStatus() {
    setStatus(`${S.choo}번째 줄 · 지금까지 ${S.choo - 1}줄 · 결과 ${S.total.toLocaleString('ko-KR')}`);
  }

  async function program() {
    for (;;) {
      scr.color(15, 1);
      scr.cls();
      try {
        await calcu();
      } catch (e) {
        if (!(e instanceof RuntimeError)) throw e;
        scr.color(7, 0);
        scr.locate(25, 1); scr.print(e.message);
        setStatus(`QB 실행 오류 "${e.message}". 0으로 나누면 원작도 여기서 멈춥니다.`);
        await scr.getKey();
      }
      scr.color(7, 0);
      scr.locate(25, 1);
      scr.print('Press any key to continue');
      await scr.getKey();
      setStatus('');
    }
  }
  function start() {
    scr.abort();
    setStatus('');
    program().catch((e) => { if (!TextScreen.isAbort(e)) console.error(e); });
  }

  for (const b of document.querySelectorAll('#keys [data-key]')) {
    b.addEventListener('click', () => { scr.pushKey(b.dataset.key); scr.focus(); });
  }
  document.getElementById('btn-restart').addEventListener('click', () => { start(); scr.focus(); });

  if (location.hash === '#debug') window.__calcu = { scr, S };
  start();
})();
