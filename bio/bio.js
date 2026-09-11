/*
 * 바이오리듬 - 1993년 QuickBasic(BIO.BAS, Designed by 정상혁) 원작의 웹 재구현.
 *
 * 원작 요약
 *  - 메뉴: 1. 화면 출력  2. 인쇄 용지  3. 프로그램 끝  4. MS-DOS 복귀
 *  - 생년월일과 오늘 날짜로 살아온 날 T를 구하고, 건강 23일, 감성 28일, 지성 33일 주기의 사인 곡선을
 *    텍스트 화면에 $, O, # 문자로 그린다. 한 칸이 반나절이고 오늘 앞 5일부터 뒤 30일까지 보인다.
 *  - 인쇄 용지는 원하는 해의 여러 달치 표를 LPRINT로 프린터에 찍는다. 웹에서는 화면 아래에 용지를 보여 준다.
 *  - 원작은 두 자리 연도(1900년대)만 받는다. 2000년 이후에는 살아온 날이 음수가 된다.
 *    웹 버전은 네 자리 연도를 받고 실제 달력으로 날짜 차이를 계산한다.
 */
(() => {
  'use strict';

  const { TextScreen, LinePrinter, fmt, cint } = QB;
  const scr = new TextScreen(document.getElementById('screen'));
  const paperWrap = document.getElementById('paper-wrap');
  const paper = document.getElementById('paper');
  const summary = document.getElementById('summary');

  const YEAR_MIN = 1900, YEAR_MAX = 2099;
  const TWO_PI = 6.2832;              // 원작이 쓴 근삿값
  const CYCLES = [
    { mark: '$', name: '건 강', days: 23, label: '건강(신체)' },
    { mark: 'O', name: '감 성', days: 28, label: '감성' },
    { mark: '#', name: '지 성', days: 33, label: '지성' },
  ];

  const dayNumber = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 86400000);
  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

  const S = { birth: null, today: null, T: 0 };

  // ------------------------------------------------------------------
  // 메뉴
  // ------------------------------------------------------------------
  async function menu() {
    scr.color(7, 0);
    scr.cls();
    summary.textContent = '';
    scr.color(0, 7);
    scr.locate(5, 25); scr.print('        B I O R Y T H M         ');
    scr.color(7, 0);
    scr.locate(9, 31); scr.print('   Designed by 정 상 혁');
    scr.color(0, 7);
    scr.locate(12, 30); scr.print('  1.  화 면 출 력    ');
    scr.locate(14, 30); scr.print('  2.  인 쇄 용 지    ');
    scr.locate(16, 30); scr.print('  3.  프로그램 끝    ');
    scr.locate(18, 30); scr.print('  4.  MS-DOS 복귀    ');
    scr.color(7, 0);
    scr.locate(22, 30); scr.print('무엇을 원하나요 ?');
    for (;;) {
      const a = parseInt(await scr.getKey(), 10);
      if (a >= 1 && a <= 4) return a;
    }
  }

  // ------------------------------------------------------------------
  // 800 입력 / 900 계산
  // ------------------------------------------------------------------
  async function inputDate(y1) {
    scr.println(QB.str$(y1) + ` 년부터 ${YEAR_MAX}년 사이의 년도를 입력하시오.`);
    scr.println();
    let y, m, d;
    for (;;) {
      y = await scr.input('몇 년');
      if (y >= y1 && y <= YEAR_MAX && Number.isInteger(y)) break;
      scr.println('입력이 틀렸습니다.');
    }
    for (;;) {
      m = await scr.input('몇 월');
      if (m >= 1 && m <= 12 && Number.isInteger(m)) break;
      scr.println('입력이 틀렸습니다.');
    }
    for (;;) {
      d = await scr.input('몇 일');
      if (d >= 1 && d <= daysInMonth(y, m) && Number.isInteger(d)) break;
      scr.println('입력이 틀렸습니다.');
    }
    return { y, m, d };
  }

  // ------------------------------------------------------------------
  // 300 주 모듈
  // ------------------------------------------------------------------
  async function main(a) {
    scr.cls();
    scr.locate(4, 20); scr.println('╔══════════════╗');
    scr.locate(5, 20); scr.println('║      바 이 오 리 듬        ║');
    scr.locate(6, 20); scr.println('╚══════════════╝');
    scr.println(); scr.println(); scr.println('당신의 생년월일'); scr.println();
    const birth = await inputDate(YEAR_MIN);
    S.birth = birth;
    const T1 = dayNumber(birth.y, birth.m, birth.d);
    if (a === 2) return printPaper(birth, T1);

    const now = new Date();
    let today = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
    scr.println(); scr.println();
    scr.print('오늘이', today.y, '년 ', today.m, '월', today.d, '일이면 아무 키나 누르시고,');
    scr.newline();
    scr.println('아니면 N키를 누르시오'); scr.println();
    const k = await scr.getKey();
    if (k === 'n' || k === 'N') today = await inputDate(birth.y);
    S.today = today;
    S.T = dayNumber(today.y, today.m, today.d) - T1;
    await graph(S.T);
  }

  // ------------------------------------------------------------------
  // 500 화면 그래픽 / 700 SIGN 그래프
  // ------------------------------------------------------------------
  async function graph(T) {
    scr.cls();
    scr.color(0, 7);
    scr.locate(1, 30); scr.println('     바 이 오 리 듬     ');
    scr.color(7, 0);
    scr.locate(3, 25); scr.println('당신이 오늘 까지 살아온 날 = ' + fmt(T + 1));
    for (let i = 5; i <= 23; i++) { scr.locate(i, 11); scr.println('║'); }
    for (let i = 1; i <= 8; i++) {
      scr.locate(14, 10 * i - 9); scr.println('╬════');
      scr.locate(15, 10 * i - 9); scr.println(fmt(5 * i - 10));
    }
    scr.locate(15, 74); scr.println('일후');
    scr.locate(23, 10); scr.println('오늘');
    for (const c of CYCLES) {
      const q = c.days;
      const K = T - q * Math.floor(T / q);
      for (let i = -10; i <= 60; i++) {
        const y = 14 - 8 * Math.sin(TWO_PI * (K + 0.5 * i) / q);
        scr.locate(cint(y), i + 11);
        scr.print(c.mark);
      }
      scr.println(c.name);
    }
    showSummary(T);
    await scr.getKey();
  }

  function showSummary(T) {
    const { y, m, d } = S.today;
    const parts = CYCLES.map((c) => {
      const v = Math.round(Math.sin((2 * Math.PI * T) / c.days) * 100);
      return `${c.label} ${v > 0 ? '+' : ''}${v}%`;
    });
    summary.textContent = `${y}년 ${m}월 ${d}일 (살아온 날 ${(T + 1).toLocaleString()}일): ${parts.join(' · ')}. 아무 키나 누르면 메뉴로 돌아갑니다.`;
  }

  // ------------------------------------------------------------------
  // 1000 바이오 리듬 인쇄
  // ------------------------------------------------------------------
  async function printPaper(birth, T1) {
    scr.println(); scr.println();
    const name = await scr.input('이름은', { numeric: false, maxLen: 20 });
    let y;
    for (;;) {
      y = await scr.input('인쇄를 원하는 해는 ');
      if (y >= YEAR_MIN && y <= YEAR_MAX && Number.isInteger(y)) break;
      scr.println(`${YEAR_MIN}~${YEAR_MAX} 사이의 네 자리로 입력하세요.`);
    }
    let m;
    for (;;) {
      m = await scr.input('원하는 처음 달은');
      if (m >= 1 && m <= 12 && Number.isInteger(m)) break;
    }
    let T = dayNumber(y, m, 1) - T1;
    let l;
    for (;;) {
      l = await scr.input('원하는 마지막 달은');
      if (l >= m && l <= 12 && Number.isInteger(l)) break;
    }

    // 1100 인쇄
    const p = new LinePrinter();
    p.tab(22).print('**********************************').newline();
    p.tab(22).print('***                            ***').newline();
    p.tab(22).print('       바 이 오 리 듬  달 력').newline();
    p.tab(22).print('***                            ***').newline();
    p.tab(22).print('**********************************').newline();
    p.newline().newline().tab(29).print('Designed by Jung Sang Hyuk').newline().newline().newline();
    p.tab(3).print('성    명  =  ', name).newline();
    p.tab(3).print('생년월일  = ', birth.y, '.', birth.m, '.', birth.d).newline();
    p.tab(60).print('건 강 = $$$$$$$$$$').newline();
    p.tab(60).print('감 성 = OOOOOOOOOO').newline();
    p.tab(60).print('지 성 = ##########').newline();
    p.newline().newline();
    p.print('  월    일   살아온 날').tab(44).print('C O N D I T I O N').newline().newline();
    for (let i = -5; i <= 5; i++) p.tab(5 * i + 51).print(20 * i);
    const rule = () => {
      for (let x = 27; x <= 72; x += 5) p.tab(x).print('+----');
      p.print('+').newline();
    };
    rule();
    const G = new Array(52).fill(' ');
    const row = (i, j) => {
      p.tab(2).print(i).tab(8).print(j).tab(15).print(T + 1).tab(26).print('I');
      G[26] = 'I';
      G[Math.floor(25 * Math.sin(TWO_PI * T / 23) + 26)] = '$';
      G[Math.floor(25 * Math.sin(TWO_PI * T / 28) + 26)] = 'O';
      G[Math.floor(25 * Math.sin(TWO_PI * T / 33) + 26)] = '#';
      for (let k = 1; k <= 51; k++) { p.tab(k + 26).print(G[k]); G[k] = ' '; }
      p.tab(78).print('I').newline();
      if (j === 15) rule();
      T++;
    };
    for (let i = m; i <= l; i++) {
      const days = i === 2 ? 28 : daysInMonth(y, i);
      for (let j = 1; j <= days; j++) row(i, j);
      if (isLeap(y) && i === 2) row(i, 29);
      rule();
    }

    paper.textContent = p.text();
    paperWrap.hidden = false;
    scr.println();
    scr.println('인쇄 용지가 화면 아래에 나왔습니다. 아무 키나 누르면 메뉴로 돌아갑니다.');
    paperWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    await scr.getKey();
  }

  // ------------------------------------------------------------------
  // 실행
  // ------------------------------------------------------------------
  async function program() {
    for (;;) {
      const a = await menu();
      if (a >= 3) { location.href = '../index.html'; return; }
      await main(a);
    }
  }
  function run() {
    scr.abort();
    program().catch((e) => { if (!TextScreen.isAbort(e)) console.error(e); });
  }

  document.getElementById('btn-restart').addEventListener('click', () => { run(); scr.focus(); });
  document.getElementById('btn-print').addEventListener('click', () => window.print());
  document.getElementById('btn-paper-close').addEventListener('click', () => { paperWrap.hidden = true; scr.focus(); });

  if (location.hash === '#debug') window.__bio = { scr, S };
  run();
})();
