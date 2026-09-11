/*
 * QuickBasic SCREEN 0 (80x25 텍스트 모드) 흉내.
 * 바이오리듬(bio/)과 계산 연습(calc/)이 함께 쓴다.
 *
 *  - 한 칸은 9x16 픽셀(VGA 텍스트 모드)이고 화면은 720x400이다. CSS가 4:3 모니터 비율로 늘린다.
 *  - 한글과 박스 문자(U+2500~U+259F)는 한글 DOS처럼 두 칸을 차지한다.
 *  - PRINT, LOCATE, COLOR, CLS, INPUT, INKEY$의 동작을 원작 코드를 옮기기 쉬운 모양으로 제공한다.
 *  - 키 입력은 숨긴 <input>으로 받는다. 모바일 가상 키보드와 한글 IME도 이 요소를 거친다.
 */
(() => {
  'use strict';

  const COLS = 80, ROWS = 25, SCROLL_BOTTOM = 24;
  const CW = 9, CH = 16;
  const SCALE = 2;
  const PALETTE = [
    '#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
    '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff',
  ];
  const FONT = '"D2Coding", "Nanum Gothic Coding", "NanumGothicCoding", "Noto Sans Mono CJK KR", "Malgun Gothic", "Apple SD Gothic Neo", monospace';

  class Abort extends Error {}

  const isWide = (ch) => {
    const c = ch.codePointAt(0);
    return (c >= 0x1100 && c <= 0x115f) || (c >= 0x2500 && c <= 0x259f) || (c >= 0x2e80 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xff00 && c <= 0xff60) || (c >= 0xffe0 && c <= 0xffe6);
  };
  const strWidth = (s) => { let w = 0; for (const ch of s) w += isWide(ch) ? 2 : 1; return w; };

  // QB 숫자 출력: 양수는 앞에 공백, 뒤에는 늘 공백 하나. 소수는 단정도처럼 유효숫자 7자리.
  function numStr(n) {
    const a = Math.abs(n);
    let s;
    if (Number.isInteger(a) && a < 1e15) s = String(a);
    else if (a !== 0 && (a >= 1e7 || a < 1e-7)) s = a.toExponential(6).replace(/\.?0+e/, 'e').replace('e', 'E').replace(/E([+-])(\d)$/, 'E$10$2');
    else s = String(parseFloat(a.toPrecision(7)));
    if (s.startsWith('0.')) s = s.slice(1);
    return (n < 0 ? '-' : ' ') + s;
  }
  const fmt = (n) => numStr(n) + ' ';
  const str$ = numStr;

  // 박스 문자를 선분으로 그린다. 좌표 기호: L/R/T/B = 가장자리, c = 가운데, a/b = 가운데에서 -d/+d.
  const BOX = {
    '═': ['LaRa', 'LbRb'], '║': ['aTaB', 'bTbB'],
    '╔': ['aBaa', 'aaRa', 'bBbb', 'bbRb'], '╗': ['Laba', 'babB', 'Lbab', 'abaB'],
    '╚': ['aTab', 'abRb', 'bTba', 'baRa'], '╝': ['Lbbb', 'bbbT', 'Laaa', 'aaaT'],
    '╬': ['Laaa', 'aaaT', 'bTba', 'baRa', 'Lbab', 'abaB', 'bBbb', 'bbRb'],
    '╠': ['aTaB', 'bTba', 'baRa', 'bBbb', 'bbRb'], '╣': ['bTbB', 'aTaa', 'Laaa', 'aBab', 'Lbab'],
    '╦': ['LaRa', 'Lbab', 'abaB', 'Rbbb', 'bbbB'], '╩': ['LbRb', 'Laaa', 'aaaT', 'Raba', 'babT'],
    '─': ['LcRc'], '│': ['cTcB'], '┌': ['cBcc', 'ccRc'], '┐': ['Lccc', 'cccB'], '└': ['cTcc', 'ccRc'],
    '┘': ['Lccc', 'cccT'], '┼': ['LcRc', 'cTcB'], '├': ['cTcB', 'ccRc'], '┤': ['cTcB', 'Lccc'],
    '┬': ['LcRc', 'cccB'], '┴': ['LcRc', 'cccT'],
  };

  class TextScreen {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      canvas.width = COLS * CW * SCALE;
      canvas.height = ROWS * CH * SCALE;
      this.ctx = canvas.getContext('2d');
      this.cells = [];
      for (let r = 0; r < ROWS; r++) this.cells.push(this._blankRow(0));
      this.row = 1; this.col = 1;
      this.fg = 7; this.bg = 0;
      this.dirty = true;
      this.cursorOn = false;       // INPUT 중에만 커서를 보인다
      this.keys = [];
      this.waiter = null;          // { resolve, reject } 키 대기
      this.line = null;            // INPUT 줄 편집 상태
      this.gen = 0;
      this.onKey = opts.onKey || null;

      this.kbd = document.createElement('input');
      Object.assign(this.kbd, { type: 'text', autocomplete: 'off', spellcheck: false });
      this.kbd.setAttribute('autocapitalize', 'off');
      this.kbd.setAttribute('autocorrect', 'off');
      this.kbd.setAttribute('aria-label', '키보드 입력');
      this.kbd.className = 'kbd-sink';
      canvas.parentElement.appendChild(this.kbd);
      canvas.addEventListener('pointerdown', () => this.focus());
      this.kbd.addEventListener('keydown', (e) => this._keydown(e));
      this.kbd.addEventListener('input', () => this._input());
      window.addEventListener('keydown', (e) => {
        const t = e.target;
        if (t === this.kbd || (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.tagName === 'BUTTON'))) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        this.focus();
        this._keydown(e);
      });

      const loop = (t) => {
        const blink = Math.floor(t / 270) % 2 === 0;
        if (this.cursorOn && blink !== this._blink) { this._blink = blink; this.dirty = true; }
        if (this.dirty) this.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    _blankRow(bg) {
      return Array.from({ length: COLS }, () => ({ ch: ' ', fg: 7, bg, part: 0 }));
    }

    focus() { if (document.activeElement !== this.kbd) this.kbd.focus({ preventScroll: true }); }

    // 실행 중인 프로그램을 끊는다. 대기 중인 INPUT/키 대기는 Abort를 던진다.
    abort() {
      this.gen++;
      this.keys = [];
      this.cursorOn = false;
      if (this.line) { const l = this.line; this.line = null; clearTimeout(l.timer); l.reject(new Abort()); }
      if (this.waiter) { const w = this.waiter; this.waiter = null; w.reject(new Abort()); }
    }
    static isAbort(e) { return e instanceof Abort; }
    _check(gen) { if (gen !== this.gen) throw new Abort(); }

    // ---------------------------------------------------------------
    // 출력
    // ---------------------------------------------------------------
    cls() {
      for (let r = 0; r < ROWS; r++) this.cells[r] = this._blankRow(this.bg);
      this.row = 1; this.col = 1;
      this.dirty = true;
    }
    locate(row, col) {
      if (row != null) this.row = Math.min(ROWS, Math.max(1, cint(row)));
      if (col != null) this.col = Math.min(COLS, Math.max(1, cint(col)));
    }
    color(fg, bg) {
      if (fg != null) this.fg = fg;
      if (bg != null) this.bg = bg;
    }
    _put(r, c, cell) {
      const row = this.cells[r - 1];
      const old = row[c - 1];
      if (old.part === 2 && c > 1) row[c - 2] = { ...row[c - 2], ch: ' ', part: 0 };
      if (old.part === 1 && c < COLS) row[c] = { ...row[c], ch: ' ', part: 0 };
      row[c - 1] = cell;
    }
    newline() {
      this.col = 1;
      if (this.row >= SCROLL_BOTTOM) {
        this.cells.splice(0, 1);
        this.cells.splice(SCROLL_BOTTOM - 1, 0, this._blankRow(this.bg));
        this.row = SCROLL_BOTTOM;
      } else {
        this.row++;
      }
      this.dirty = true;
    }
    // PRINT x; 와 같다 (줄을 바꾸지 않는다).
    print(...parts) {
      for (const p of parts) {
        const s = typeof p === 'number' ? fmt(p) : String(p);
        for (const ch of s) {
          if (ch === '\n') { this.newline(); continue; }
          const w = isWide(ch) ? 2 : 1;
          if (this.col + w - 1 > COLS) this.newline();
          const cell = { ch, fg: this.fg, bg: this.bg, part: w === 2 ? 1 : 0 };
          if (w === 2) {
            this._put(this.row, this.col + 1, { ch: '', fg: this.fg, bg: this.bg, part: 0 });
            this._put(this.row, this.col, cell);
            this.cells[this.row - 1][this.col].part = 2;
          } else {
            this._put(this.row, this.col, cell);
          }
          this.col += w;
          if (this.col > COLS) this.newline();
        }
      }
      this.dirty = true;
    }
    // PRINT x (줄을 바꾼다)
    println(...parts) {
      this.print(...parts);
      this.newline();
    }

    // ---------------------------------------------------------------
    // 입력
    // ---------------------------------------------------------------
    // INPUT "prompt"; v  -> sep ';' (물음표를 붙인다), INPUT "prompt", v -> sep ','
    async input(prompt = '', opts = {}) {
      const { sep = ';', numeric = true, timeout = 0, maxLen = 60 } = opts;
      const gen = this.gen;
      for (;;) {
        this.print(prompt + (sep === ';' ? '? ' : ''));
        const text = await this._readLine(gen, maxLen, timeout);
        this.newline();
        if (text === null) return null;           // 제한시간 초과
        if (!numeric) return text.trim();
        const t = text.trim();
        if (t === '') return 0;
        if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) return Number(t);
        this.println('?Redo from start');
      }
    }
    _readLine(gen, maxLen, timeout) {
      this._check(gen);
      this.kbd.value = '';
      return new Promise((resolve, reject) => {
        const room = COLS - this.col;
        this.line = { resolve, reject, row: this.row, col: this.col, text: '', max: Math.max(1, Math.min(maxLen, room)), timer: 0 };
        if (timeout > 0) {
          this.line.timer = setTimeout(() => {
            if (!this.line) return;
            this._finishLine(null);
          }, timeout);
        }
        this.cursorOn = true;
        this._drawLine();
        this.focus();
      });
    }
    _drawLine() {
      const l = this.line;
      if (!l) return;
      this.row = l.row; this.col = l.col;
      this.print(' '.repeat(l.max));
      this.row = l.row; this.col = l.col;
      this.print(l.text);
      this.cursorRow = this.row; this.cursorCol = this.col;
    }
    _finishLine(text) {
      const l = this.line;
      this.line = null;
      clearTimeout(l.timer);
      this.cursorOn = false;
      this.kbd.value = '';
      this.dirty = true;
      l.resolve(text === null ? null : l.text);
    }
    _input() {
      if (this.line) {
        let v = this.kbd.value.replace(/[\r\n]/g, '');
        while (strWidth(v) > this.line.max) v = [...v].slice(0, -1).join('');
        this.line.text = v;
        this._drawLine();
        return;
      }
      // 모바일 가상 키보드: keydown 대신 input 이벤트로 글자가 들어온다.
      const v = this.kbd.value;
      this.kbd.value = '';
      for (const ch of v) this._pushKey(ch);
    }
    _keydown(e) {
      if (this.line) {
        if (e.isComposing) return;
        if (e.key === 'Enter') { e.preventDefault(); this._finishLine(this.line.text); }
        else if (e.key === 'Escape') { e.preventDefault(); this.kbd.value = ''; this._input(); }
        return;
      }
      let key = e.key;
      if (key === 'Unidentified' || key === 'Process' || e.isComposing || e.keyCode === 229) {
        // 한글 IME가 켜져 있으면 물리 키 위치로 알파벳/숫자를 되찾는다.
        const m = /^(?:Key([A-Z])|Digit(\d))$/.exec(e.code || '');
        if (!m) return;
        key = (m[1] || m[2]).toLowerCase();
      } else if (/^[ㄱ-ㅣ]$/.test(key)) {
        const m = /^Key([A-Z])$/.exec(e.code || '');
        if (m) key = m[1].toLowerCase();
      }
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(key)) return;
      e.preventDefault();
      this._pushKey(key === 'Enter' ? '\r' : key === 'Escape' ? '\x1b' : key === 'Backspace' ? '\b' : key);
    }
    _pushKey(k) {
      if (this.onKey && this.onKey(k) === false) return;
      if (this.waiter) { const w = this.waiter; this.waiter = null; w.resolve(k); }
      else { this.keys.push(k); if (this.keys.length > 16) this.keys.shift(); }
    }
    // INKEY$ (기다리지 않는다)
    inkey() { return this.keys.length ? this.keys.shift() : ''; }
    // WHILE INKEY$ = "": WEND  (키를 기다린다)
    getKey() {
      const gen = this.gen;
      this._check(gen);
      if (this.keys.length) return Promise.resolve(this.keys.shift());
      this.focus();
      return new Promise((resolve, reject) => { this.waiter = { resolve, reject }; });
    }
    clearKeys() { this.keys = []; }
    sleep(ms) {
      const gen = this.gen;
      return new Promise((resolve, reject) => setTimeout(() => (gen === this.gen ? resolve() : reject(new Abort())), ms));
    }

    // ---------------------------------------------------------------
    // 그리기
    // ---------------------------------------------------------------
    render() {
      this.dirty = false;
      const ctx = this.ctx;
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      ctx.fillStyle = PALETTE[0];
      ctx.fillRect(0, 0, COLS * CW, ROWS * CH);
      ctx.font = `15px ${FONT}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      for (let r = 0; r < ROWS; r++) {
        const row = this.cells[r];
        for (let c = 0; c < COLS; c++) {
          const cell = row[c];
          if (cell.part === 2) continue;
          const w = cell.part === 1 ? 2 : 1;
          const x = c * CW, y = r * CH;
          if (cell.bg) { ctx.fillStyle = PALETTE[cell.bg]; ctx.fillRect(x, y, CW * w, CH); }
          if (cell.ch === ' ' || cell.ch === '') continue;
          ctx.fillStyle = PALETTE[cell.fg];
          ctx.strokeStyle = PALETTE[cell.fg];
          if (BOX[cell.ch]) this._box(cell.ch, x, y, CW * w, CH);
          else if (cell.ch === '█') ctx.fillRect(x, y, CW * w, CH);
          else ctx.fillText(cell.ch, x + (CW * w) / 2, y + CH / 2 + 1);
        }
      }
      if (this.cursorOn && this._blink && this.line) {
        ctx.fillStyle = PALETTE[7];
        ctx.fillRect((this.cursorCol - 1) * CW, (this.cursorRow - 1) * CH + CH - 3, CW, 2);
      }
    }
    _box(ch, x, y, w, h) {
      const ctx = this.ctx;
      const cx = x + w / 2, cy = y + h / 2, d = 2;
      const X = { L: x, R: x + w, c: cx, a: cx - d, b: cx + d };
      const Y = { T: y, B: y + h, c: cy, a: cy - d, b: cy + d };
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const s of BOX[ch]) {
        ctx.moveTo(X[s[0]], Y[s[1]]);
        ctx.lineTo(X[s[2]], Y[s[3]]);
      }
      ctx.stroke();
    }
  }

  // QB가 실수를 정수로 바꿀 때처럼 반올림한다 (0.5는 짝수 쪽으로).
  function cint(x) {
    const f = Math.floor(x), diff = x - f;
    if (diff > 0.5) return f + 1;
    if (diff < 0.5) return f;
    return f % 2 === 0 ? f : f + 1;
  }

  // LPRINT 흉내: TAB(n)과 ; 를 원작처럼 처리해 인쇄 결과를 문자열로 만든다.
  class LinePrinter {
    constructor() { this.lines = []; this.cur = ''; }
    get col() { return strWidth(this.cur) + 1; }
    tab(n) {
      if (this.col > n) this.newline();
      this.cur += ' '.repeat(n - this.col);
      return this;
    }
    print(...parts) {
      for (const p of parts) this.cur += typeof p === 'number' ? fmt(p) : String(p);
      return this;
    }
    newline() { this.lines.push(this.cur.replace(/\s+$/, '')); this.cur = ''; return this; }
    text() { return this.lines.concat(this.cur ? [this.cur] : []).join('\n'); }
  }

  window.QB = { TextScreen, LinePrinter, fmt, str$, cint, strWidth, PALETTE };
})();
