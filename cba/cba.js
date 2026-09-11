/*
 * Code can be an art - 2007년 QBasic(CBA2.BAS, 정상혁) 원작의 웹 재구현.
 * 원작은 블로그 글 https://blog.benelog.net/1230429 에 있다.
 *
 * 원작 요약
 *  - SCREEN 2(640×200 흑백)에서 " Code can be an art! " 를 한 글자씩 보여 준다.
 *  - 글자마다 PLAY 로 음 하나를 연주한 뒤(PLAY 는 끝날 때까지 기다린다) 화면을 지우고
 *    글자를 (1,1)에 찍은 다음 POINT 로 8×8 점을 읽어 큰 네모(61×31)로 다시 그린다.
 *    그리고 (1,1)의 작은 글자는 공백으로 지운다.
 *  - 음은 게임 Loom 의 주제곡을 기억으로 옮긴 것이다. 옥타브 1이라 낮게 울린다.
 *  - 마지막 글자 뒤에는 SCREEN 0 으로 돌아가 프로그램이 끝난다.
 */
(() => {
  'use strict';

  const LG = ' Code can be an art! ';
  const DATA = ['t90O1p4', 'e8', 'a8', 'b8', '>c+8', 'g8', 'f8', '<a8',
    '>d8', 'c+8', '<e2', 'e8', 'a4', 'b8', '>c+4', '<b8', 'a2', 'e2', 'p4', 'p4', 'p4', 'p4'];

  // IBM PC BIOS 8×8 글꼴(CP437) 중 이 프로그램이 쓰는 글자
  const FONT8 = {
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    '!': [0x30, 0x78, 0x78, 0x30, 0x30, 0x00, 0x30, 0x00],
    'C': [0x3C, 0x66, 0xC0, 0xC0, 0xC0, 0x66, 0x3C, 0x00],
    'a': [0x00, 0x00, 0x78, 0x0C, 0x7C, 0xCC, 0x76, 0x00],
    'b': [0xE0, 0x60, 0x60, 0x7C, 0x66, 0x66, 0xDC, 0x00],
    'c': [0x00, 0x00, 0x78, 0xCC, 0xC0, 0xCC, 0x78, 0x00],
    'd': [0x1C, 0x0C, 0x0C, 0x7C, 0xCC, 0xCC, 0x76, 0x00],
    'e': [0x00, 0x00, 0x78, 0xCC, 0xFC, 0xC0, 0x78, 0x00],
    'n': [0x00, 0x00, 0xF8, 0xCC, 0xCC, 0xCC, 0xCC, 0x00],
    'o': [0x00, 0x00, 0x78, 0xCC, 0xCC, 0xCC, 0x78, 0x00],
    'r': [0x00, 0x00, 0xDC, 0x76, 0x66, 0x60, 0xF0, 0x00],
    't': [0x10, 0x30, 0x7C, 0x30, 0x30, 0x34, 0x18, 0x00],
  };

  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  const btnRun = document.getElementById('btn-run');
  const optSound = document.getElementById('opt-sound');
  const status = document.getElementById('status');

  // ------------------------------------------------------------------
  // PLAY 문자열 해석 (QB 의 T, O, L, <, >, N, P, 음표, #/+/-, 점, MN/ML/MS)
  // 상태(템포, 옥타브, 길이)는 PLAY 문 사이에 이어진다.
  // ------------------------------------------------------------------
  const play = { tempo: 120, octave: 4, length: 4, mode: 7 / 8 };
  const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const freqOf = (octave, semi) => 261.63 * 2 ** (octave - 3 + semi / 12);   // 옥타브 3 이 가운데 C

  function parsePlay(str) {
    const out = [];
    const s = str.replace(/\s+/g, '').toLowerCase();
    let i = 0;
    const num = () => { let t = ''; while (i < s.length && /\d/.test(s[i])) t += s[i++]; return t === '' ? null : parseInt(t, 10); };
    const dots = () => { let n = 0; while (s[i] === '.') { n++; i++; } return n; };
    const dur = (len, nd) => { let d = (4 / len) * (60 / play.tempo); let add = d; for (let k = 0; k < nd; k++) { add /= 2; d += add; } return d; };
    while (i < s.length) {
      const ch = s[i++];
      if (ch === 't') play.tempo = num() ?? play.tempo;
      else if (ch === 'o') play.octave = num() ?? play.octave;
      else if (ch === 'l') play.length = num() ?? play.length;
      else if (ch === '<') play.octave = Math.max(0, play.octave - 1);
      else if (ch === '>') play.octave = Math.min(6, play.octave + 1);
      else if (ch === 'm') { const m = s[i++]; if (m === 'n') play.mode = 7 / 8; else if (m === 'l') play.mode = 1; else if (m === 's') play.mode = 3 / 4; }
      else if (ch === 'p') { const n = num() ?? play.length; out.push({ freq: 0, dur: dur(n, dots()), on: 1 }); }
      else if (ch === 'n') {
        const n = num() ?? 0; const nd = dots();
        out.push({ freq: n === 0 ? 0 : freqOf(Math.floor((n - 1) / 12), (n - 1) % 12), dur: dur(play.length, nd), on: play.mode });
      } else if (ch in SEMI) {
        let semi = SEMI[ch];
        if (s[i] === '#' || s[i] === '+') { semi++; i++; } else if (s[i] === '-') { semi--; i++; }
        const n = num() ?? play.length; const nd = dots();
        out.push({ freq: freqOf(play.octave, semi), dur: dur(n, nd), on: play.mode });
      }
    }
    return out;
  }

  // ------------------------------------------------------------------
  // 화면
  // ------------------------------------------------------------------
  function screen0(prompt) {
    canvas.width = 640; canvas.height = 400;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 400);
    ctx.fillStyle = '#aaa';
    ctx.font = '16px "D2Coding", "Nanum Gothic Coding", "Courier New", monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(prompt, 0, 2);
    ctx.fillRect(prompt.length * 8, 15, 8, 2);      // 커서
  }
  function screen2(ch) {
    canvas.width = 640; canvas.height = 200;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 200);
    const glyph = FONT8[ch] || FONT8[' '];
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (glyph[i] & (0x80 >> j)) ctx.fillRect(j * 60 + 80, i * 25 + 10, 61, 31);
      }
    }
  }

  // ------------------------------------------------------------------
  // 실행: 음을 미리 모두 예약하고, 음이 끝나는 시각에 글자를 바꾼다
  // ------------------------------------------------------------------
  let audio = null;
  let running = false;
  let gen = 0;

  async function run() {
    if (running) return;
    running = true;
    gen++;
    const my = gen;
    btnRun.disabled = true;
    Object.assign(play, { tempo: 120, octave: 4, length: 4, mode: 7 / 8 });

    let useSound = optSound.checked;
    if (useSound) {
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state === 'suspended') await audio.resume();
      } catch { useSound = false; }
    }
    const t0 = useSound ? audio.currentTime + 0.15 : performance.now() / 1000 + 0.15;
    const now = () => (useSound ? audio.currentTime : performance.now() / 1000);

    // 글자 i 는 DATA i 를 연주한 뒤에 나온다
    const steps = [];
    let t = t0;
    for (let i = 0; i < LG.length; i++) {
      const notes = parsePlay(DATA[i]);
      for (const n of notes) {
        if (useSound && n.freq > 0) {
          const o = audio.createOscillator(), g = audio.createGain();
          o.type = 'square'; o.frequency.value = n.freq;
          g.gain.value = 0.12;
          o.connect(g).connect(audio.destination);
          o.start(t); o.stop(t + n.dur * n.on);
        }
        t += n.dur;
      }
      steps.push({ at: t, ch: LG[i] });
    }
    const end = t;

    screen2(' ');
    let k = 0;
    await new Promise((resolve) => {
      const tick = () => {
        if (my !== gen) return resolve();
        const c = now();
        while (k < steps.length && c >= steps[k].at) { screen2(steps[k].ch); status.textContent = `"${LG.slice(0, k + 1)}"`; k++; }
        if (c >= end) return resolve();
        requestAnimationFrame(tick);
      };
      tick();
    });
    if (my !== gen) return;
    screen0('C:\\>');
    status.textContent = '';
    running = false;
    btnRun.disabled = false;
  }

  btnRun.addEventListener('click', run);
  canvas.addEventListener('pointerdown', run);
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'BUTTON')) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
  });

  screen0('C:\\>qbasic /run cba2.bas');
  if (location.hash === '#debug') window.__cba = { run, screen2, screen0, parsePlay, play, LG, DATA };
})();
