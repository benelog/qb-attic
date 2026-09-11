/*
 * 그림판 - 1992년 QuickBasic(D2.BAS, 정상혁) 원작의 웹 재구현.
 *
 * 원작 요약
 *  - SCREEN 3 (허큘리스 720x348 흑백, MSHERC.COM 필요)에서 동작한다.
 *  - 메뉴는 FILE, TOOLS, EDIT, OPTION 네 개다. 72픽셀 간격으로 놓이고 항목은 14픽셀 줄마다 하나씩이다.
 *    ←/→로 메뉴를 바꾸고 ↑/↓로 항목을 고르면 GET/PUT PRESET으로 선택 항목을 반전한다.
 *  - 원작은 메뉴 이동까지만 만들어져 있고 항목을 골라도 아무 일도 하지 않는다(미완성).
 *    그림 불러오기(readpic: .pic 압축 형식)와 BSAVE/BLOAD 저장 루틴(SBSAVE, sbload)만 SUB로 들어 있다.
 *  - 웹 버전은 메뉴 이름에 맞춰 도구와 편집 기능을 새로 구현했다.
 *    Pen은 원작 메뉴에 없는 항목이다(자유 그리기가 없으면 쓰기 어려워 추가했다).
 *    "|" 표시가 붙은 항목(Erase, Inverse, Change, Spray)은 OPTION Part 영역을 따르는 기능으로 해석했다.
 */
(() => {
  'use strict';

  const W = 720, H = 348, BPR = W / 8;
  const ROW = 14, COLW = 72;                 // 원작 메뉴 격자
  const ZOOM = 8, ZW = W / ZOOM, ZH = Math.floor(H / ZOOM);
  const ASPECT = (H * 4) / (W * 3);          // 허큘리스 픽셀의 가로:세로 보정 (4:3 모니터)
  const STEPS = [1, 2, 4, 8, 16];
  const MAX_UNDO = 30;
  const STORAGE_FILES = 'paint.files';
  const STORAGE_CURRENT = 'paint.current';
  const STORAGE_PART = 'paint.part';
  const STORAGE_OPTS = 'paint.options';
  const PHOSPHOR = {
    green: [[0, 12, 0], [60, 255, 110], [0, 70, 20]],
    amber: [[14, 7, 0], [255, 180, 0], [90, 55, 0]],
    white: [[0, 0, 0], [235, 235, 235], [70, 70, 70]],
  };
  // 원작 DATA 문 그대로 (Pen만 추가)
  const MENUS = [
    { title: 'FILE', items: ['Load', 'Save', 'Load(Dr)', 'Kill', 'Rename', 'Exit'] },
    { title: 'TOOLS', items: ['Pen', 'Glasses', 'Paint', 'Line', 'Box', 'Circle', 'write', 'Spray  |'] },
    { title: 'EDIT', items: ['Erase  |', 'Inverse|', 'Change↑|', 'Change→|', 'Copy', 'Move', 'P-Save', 'P-Load'] },
    { title: 'OPTION', items: ['White', 'Part', 'Pattern', 'Step'] },
  ];
  // PAINT 타일 무늬 (8x8, 한 줄에 한 바이트). 1번은 원작 MAIN.BAS가 쓴 CHR$(&HAA)+CHR$(&H55)다.
  const PATTERNS = [
    [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
    [0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55],
    [0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00],
    [0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa],
    [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80],
    [0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01],
    [0x88, 0x00, 0x22, 0x00, 0x88, 0x00, 0x22, 0x00],
    [0xff, 0x80, 0x80, 0x80, 0xff, 0x08, 0x08, 0x08],
  ];
  const FONT = '"D2Coding", "Nanum Gothic Coding", "Noto Sans Mono CJK KR", "Malgun Gothic", "Apple SD Gothic Neo", monospace';

  // ------------------------------------------------------------------
  // DOM
  // ------------------------------------------------------------------
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const statusEl = document.getElementById('status');
  const hintEl = document.getElementById('hint');
  const overlay = document.getElementById('overlay');
  const panels = [...overlay.querySelectorAll('.panel')];
  const textSink = document.getElementById('text-sink');
  const fileInput = document.getElementById('file-input');
  const optColor = document.getElementById('opt-color');

  // ------------------------------------------------------------------
  // 저장소
  // ------------------------------------------------------------------
  function loadJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  }
  const options = Object.assign({ phosphor: 'green' }, loadJSON(STORAGE_OPTS, {}));
  if (!PHOSPHOR[options.phosphor]) options.phosphor = 'green';
  optColor.value = options.phosphor;

  // ------------------------------------------------------------------
  // 상태
  // ------------------------------------------------------------------
  const pic = new Uint8Array(W * H);
  const S = {
    tool: 'Pen', color: 1, pattern: 0, step: 4,
    partOn: false, part: null,               // {x0,y0,x1,y1}
    cx: W / 2, cy: H / 2,
    penDown: false, spraying: false,
    anchor: null,                            // 선/상자/원/영역 선택의 시작점
    select: null,                            // 'copy' | 'move' | 'psave' | 'part'
    stamp: null,                             // { w, h, bits, once }
    text: null,                              // { x, y, str }
    menu: null,                              // { mx, my } (원작처럼 1부터)
    ym: [1, 1, 1, 1],
    zoom: false, vx: 0, vy: 0,
    name: '', dirty: false,
    undo: [],
    drag: null,                              // 포인터로 그리는 중 { lastX, lastY, moved }
    message: '', messageAt: 0,
  };

  // ------------------------------------------------------------------
  // 비트맵 기본 연산
  // ------------------------------------------------------------------
  const clip = () => (S.partOn && S.part ? S.part : { x0: 0, y0: 0, x1: W - 1, y1: H - 1 });
  function plot(x, y, c = S.color) {
    const r = clip();
    if (x < r.x0 || y < r.y0 || x > r.x1 || y > r.y1) return;
    pic[y * W + x] = c;
  }
  function lineTo(x0, y0, x1, y1, fn) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      fn(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  const shapes = {
    Line: (a, b, fn) => lineTo(a.x, a.y, b.x, b.y, fn),
    Box: (a, b, fn) => {
      lineTo(a.x, a.y, b.x, a.y, fn); lineTo(b.x, a.y, b.x, b.y, fn);
      lineTo(b.x, b.y, a.x, b.y, fn); lineTo(a.x, b.y, a.x, a.y, fn);
    },
    Circle: (a, b, fn) => {
      const rx = Math.hypot(b.x - a.x, (b.y - a.y) / ASPECT);
      const ry = rx * ASPECT;
      const n = Math.max(24, Math.ceil(rx * 2));
      let px = a.x + rx, py = a.y;
      for (let i = 1; i <= n; i++) {
        const t = (i / n) * Math.PI * 2;
        const x = a.x + rx * Math.cos(t), y = a.y - ry * Math.sin(t);
        lineTo(px, py, x, y, fn);
        px = x; py = y;
      }
    },
  };
  const normRect = (a, b) => ({
    x0: Math.max(0, Math.min(a.x, b.x)), y0: Math.max(0, Math.min(a.y, b.y)),
    x1: Math.min(W - 1, Math.max(a.x, b.x)), y1: Math.min(H - 1, Math.max(a.y, b.y)),
  });
  function grab(r) {
    const w = r.x1 - r.x0 + 1, h = r.y1 - r.y0 + 1;
    const bits = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) bits.set(pic.subarray((r.y0 + y) * W + r.x0, (r.y0 + y) * W + r.x0 + w), y * w);
    return { w, h, bits };
  }
  function stampAt(st, x, y) {
    for (let j = 0; j < st.h; j++) {
      for (let i = 0; i < st.w; i++) {
        const px = x + i, py = y + j;
        if (px < 0 || py < 0 || px >= W || py >= H) continue;
        plot(px, py, st.bits[j * st.w + i]);
      }
    }
  }
  function floodFill(x, y) {
    const target = pic[y * W + x];
    const r = clip();
    if (x < r.x0 || y < r.y0 || x > r.x1 || y > r.y1) return;
    const seen = new Uint8Array(W * H);
    const tile = PATTERNS[S.pattern];
    const stack = [x, y];
    while (stack.length) {
      const py = stack.pop(), px = stack.pop();
      if (px < r.x0 || py < r.y0 || px > r.x1 || py > r.y1) continue;
      const i = py * W + px;
      if (seen[i] || pic[i] !== target) continue;
      seen[i] = 1;
      const on = (tile[py & 7] >> (7 - (px & 7))) & 1;
      pic[i] = on ? S.color : 1 - S.color;
      stack.push(px + 1, py, px - 1, py, px, py + 1, px, py - 1);
    }
  }
  function spray(x, y) {
    for (let k = 0; k < 14; k++) {
      const t = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random());
      plot(Math.round(x + Math.cos(t) * d * 18), Math.round(y + Math.sin(t) * d * 18 * ASPECT));
    }
  }
  function editArea(fn) {
    pushUndo();
    const r = clip();
    fn(r);
    changed();
  }

  // ------------------------------------------------------------------
  // 글자 (write 도구, 메뉴) - 캔버스 글꼴을 흑백으로 잘라 쓴다.
  // ------------------------------------------------------------------
  const glyphCache = new Map();
  const glyphCanvas = document.createElement('canvas');
  glyphCanvas.width = 18; glyphCanvas.height = ROW;
  const gctx = glyphCanvas.getContext('2d', { willReadFrequently: true });
  const isWide = (ch) => { const c = ch.codePointAt(0); return (c >= 0x1100 && c <= 0x11ff) || (c >= 0x3130 && c <= 0x318f) || (c >= 0xac00 && c <= 0xd7a3) || (c >= 0x4e00 && c <= 0x9fff); };
  function glyph(ch) {
    if (glyphCache.has(ch)) return glyphCache.get(ch);
    const w = isWide(ch) ? 18 : 9;
    gctx.clearRect(0, 0, 18, ROW);
    gctx.fillStyle = '#fff';
    gctx.textBaseline = 'alphabetic';
    gctx.textAlign = 'center';
    gctx.font = w === 18 ? `12px ${FONT}` : `bold 12px ${FONT}`;
    gctx.fillText(ch, w / 2, 11);
    const data = gctx.getImageData(0, 0, w, ROW).data;
    const bits = new Uint8Array(w * ROW);
    for (let i = 0; i < bits.length; i++) bits[i] = data[i * 4 + 3] > 110 ? 1 : 0;
    const g = { w, bits };
    glyphCache.set(ch, g);
    return g;
  }
  function textBits(str, fn, x, y) {
    let cx = x;
    for (const ch of str) {
      const g = glyph(ch);
      for (let j = 0; j < ROW; j++) for (let i = 0; i < g.w; i++) if (g.bits[j * g.w + i]) fn(cx + i, y + j);
      cx += g.w;
    }
    return cx - x;
  }

  // ------------------------------------------------------------------
  // 되돌리기, 변경 표시, 자동 저장
  // ------------------------------------------------------------------
  function pushUndo() {
    S.undo.push(pic.slice());
    if (S.undo.length > MAX_UNDO) S.undo.shift();
  }
  function undo() {
    if (!S.undo.length) { say('더 되돌릴 것이 없습니다.'); return; }
    pic.set(S.undo.pop());
    changed();
  }
  let autosaveTimer = 0;
  function changed() {
    S.dirty = true;
    render();
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => saveJSON(STORAGE_CURRENT, { name: S.name, data: packBase64(), dirty: S.dirty }), 400);
  }

  // 한 줄 90바이트로 비트를 묶어 base64로 (브라우저 저장용)
  function packBase64() {
    const bytes = new Uint8Array(BPR * H);
    for (let i = 0; i < W * H; i++) if (pic[i]) bytes[i >> 3] |= 0x80 >> (i & 7);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unpackBase64(b64) {
    const s = atob(b64);
    for (let i = 0; i < W * H; i++) pic[i] = (s.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  }

  // ------------------------------------------------------------------
  // 원작 파일 형식: 허큘리스 화면 메모리 (B000:0000, 4뱅크 인터리브)
  // ------------------------------------------------------------------
  const hercOffset = (y) => 0x2000 * (y & 3) + BPR * (y >> 2);
  function picToMem() {
    const mem = new Uint8Array(0x8000);
    for (let y = 0; y < H; y++) {
      const base = hercOffset(y);
      for (let x = 0; x < W; x++) if (pic[y * W + x]) mem[base + (x >> 3)] |= 0x80 >> (x & 7);
    }
    return mem;
  }
  function memToPic(mem) {
    for (let y = 0; y < H; y++) {
      const base = hercOffset(y);
      for (let x = 0; x < W; x++) pic[y * W + x] = ((mem[base + (x >> 3)] ?? 0) >> (7 - (x & 7))) & 1;
    }
  }
  // BSAVE 형식 (SBSAVE: DEF SEG=&HB000 : BSAVE f$, 0, &H8000)
  function encodeBsave() {
    const out = new Uint8Array(7 + 0x8000);
    out.set([0xfd, 0x00, 0xb0, 0x00, 0x00, 0x00, 0x80]);
    out.set(picToMem(), 7);
    return out;
  }
  // READPIC.BAS가 읽는 .pic 형식
  //  - 512바이트 블록 단위. 첫 블록은 "AH" 머리(0,1번 바이트)와 7번 바이트 = 7, 데이터는 10번 바이트부터.
  //  - 표지 바이트: &H80 = 다음 블록으로, 0 = 끝, 최상위 비트 0 = 뒤따르는 n바이트를 그대로,
  //    최상위 비트 1 = 다음 한 바이트를 n번 반복 (그 바이트가 0이면 n바이트 건너뜀).
  function decodePic(bytes) {
    if (bytes[0] !== 0x41 || bytes[1] !== 0x48 || bytes[7] !== 7) throw new Error('.pic 머리("AH")가 아닙니다.');
    const mem = new Uint8Array(0x8000);
    let block = 0, count = 10, pos = 0;
    const at = (i) => bytes[block * 512 + i] ?? 0;
    for (let guard = 0; guard < 200000; guard++) {
      if (count >= 512) break;
      const flag = at(count++);
      if (flag === 0x80) { block++; count = 0; continue; }
      if (flag === 0) break;
      const n = flag & 0x7f;
      if (!(flag & 0x80)) {
        for (let k = 0; k < n; k++) mem[pos++] = at(count++);
      } else {
        const v = at(count++);
        if (v) for (let k = 0; k < n; k++) mem[pos++] = v;
        else pos += n;
      }
      if (pos >= 0x8000) break;
    }
    memToPic(mem);
  }
  function encodePic() {
    const mem = picToMem();
    let end = mem.length;
    while (end > 0 && mem[end - 1] === 0) end--;
    const blocks = [];
    let blk = new Uint8Array(512), count = 10;
    blk.set([0x41, 0x48]); blk[7] = 7;
    const emit = (arr) => {
      if (count + arr.length > 511) { blk[count] = 0x80; blocks.push(blk); blk = new Uint8Array(512); count = 0; }
      blk.set(arr, count); count += arr.length;
    };
    const runAt = (i, max) => { let r = 1; while (i + r < end && mem[i + r] === mem[i] && r < max) r++; return r; };
    let i = 0;
    while (i < end) {
      const r = runAt(i, 127);
      if (r >= 3 || (r >= 2 && mem[i] === 0)) { emit([0x80 | r, mem[i]]); i += r; continue; }
      const lit = [];
      while (i < end && lit.length < 127 && runAt(i, 3) < 3) lit.push(mem[i++]);
      emit([lit.length, ...lit]);
    }
    emit([0]);
    blocks.push(blk);
    const out = new Uint8Array(blocks.length * 512);
    blocks.forEach((b, k) => out.set(b, k * 512));
    return out;
  }
  function importImage(file) {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const s = Math.min(W / im.width, H / (im.height * ASPECT));
      const dw = im.width * s, dh = im.height * s * ASPECT;
      g.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
      const d = g.getImageData(0, 0, W, H).data;
      const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      pushUndo();
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const q = (y * W + x) * 4;
          const lum = (d[q] * 0.3 + d[q + 1] * 0.59 + d[q + 2] * 0.11) / 255;
          pic[y * W + x] = lum * 16 > bayer[(y & 3) * 4 + (x & 3)] + 0.5 ? 1 : 0;
        }
      }
      URL.revokeObjectURL(url);
      loaded(file.name.replace(/\.[^.]+$/, ''));
    };
    im.onerror = () => { URL.revokeObjectURL(url); say('그림 파일을 읽지 못했습니다.'); };
    im.src = url;
  }
  function download(name, bytes, type) {
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function loaded(name) {
    S.name = name;
    S.dirty = false;
    S.stamp = null; S.select = null; S.anchor = null;
    changed();
    S.dirty = false;
    say(`"${name}"을(를) 불러왔습니다.`);
  }

  // ------------------------------------------------------------------
  // 브라우저 파일 (Load, Save, Kill, Rename)
  // ------------------------------------------------------------------
  const files = () => { const f = loadJSON(STORAGE_FILES, {}); return f && typeof f === 'object' && !Array.isArray(f) ? f : {}; };
  function showPanel(id) {
    overlay.hidden = false;
    for (const p of panels) p.hidden = p.id !== id;
  }
  function hidePanel() { overlay.hidden = true; render(); }
  function fileList(mode) {
    const list = document.getElementById('file-list');
    const title = { load: '📂 불러오기 (Load)', kill: '🗑️지우기 (Kill)', rename: '✏️ 이름 바꾸기 (Rename)' }[mode];
    document.getElementById('files-title').textContent = title;
    list.innerHTML = '';
    const f = files();
    const names = Object.keys(f).sort((a, b) => (f[b].date || '').localeCompare(f[a].date || ''));
    if (!names.length) {
      const li = document.createElement('li');
      li.textContent = '저장된 그림이 없습니다.';
      list.appendChild(li);
    }
    for (const name of names) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = name;
      const small = document.createElement('small');
      small.textContent = (f[name].date || '').slice(0, 16).replace('T', ' ');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = { load: '불러오기', kill: '지우기', rename: '바꾸기' }[mode];
      if (mode === 'kill') btn.className = 'danger';
      btn.addEventListener('click', () => {
        const all = files();
        if (mode === 'load') {
          pushUndo();
          unpackBase64(all[name].data);
          hidePanel();
          loaded(name);
        } else if (mode === 'kill') {
          delete all[name];
          saveJSON(STORAGE_FILES, all);
          fileList(mode);
        } else {
          const input = document.createElement('input');
          input.type = 'text'; input.value = name; input.maxLength = 20;
          const ok = document.createElement('button');
          ok.type = 'button'; ok.textContent = '확인';
          ok.addEventListener('click', () => {
            const nn = input.value.trim();
            if (!nn || nn === name) { fileList(mode); return; }
            const cur = files();
            if (cur[nn]) { say(`"${nn}" 이름이 이미 있습니다.`); return; }
            cur[nn] = cur[name]; delete cur[name];
            saveJSON(STORAGE_FILES, cur);
            if (S.name === name) S.name = nn;
            fileList(mode);
            updateStatus();
          });
          li.replaceChildren(input, ok);
          input.focus(); input.select();
        }
      });
      li.append(span, small, btn);
      list.appendChild(li);
    }
    showPanel('panel-files');
  }
  function saveToBrowser(name) {
    const all = files();
    all[name] = { date: new Date().toISOString(), data: packBase64() };
    if (!saveJSON(STORAGE_FILES, all)) { say('브라우저 저장 공간이 부족합니다. 파일로 내려받아 주세요.'); return false; }
    S.name = name;
    S.dirty = false;
    saveJSON(STORAGE_CURRENT, { name: S.name, data: packBase64(), dirty: false });
    say(`"${name}"(으)로 저장했습니다.`);
    return true;
  }

  // ------------------------------------------------------------------
  // 메뉴 동작
  // ------------------------------------------------------------------
  function choose(mx, my) {
    const item = MENUS[mx - 1].items[my - 1].replace(/\s*\|$/, '').trim();
    S.menu = null;
    S.anchor = null; S.penDown = false; S.spraying = false;
    switch (mx) {
      case 1:
        if (item === 'Load') fileList('load');
        else if (item === 'Save') {
          document.getElementById('save-name').value = S.name || '그림1';
          showPanel('panel-save');
          setTimeout(() => document.getElementById('save-name').select(), 30);
        } else if (item === 'Load(Dr)') fileInput.click();
        else if (item === 'Kill') fileList('kill');
        else if (item === 'Rename') fileList('rename');
        else if (item === 'Exit') {
          if (S.dirty) showPanel('panel-exit');
          else location.href = '../index.html';
        }
        break;
      case 2:
        if (item === 'Glasses') {
          S.zoom = !S.zoom;
          if (S.zoom) centerZoom();
          say(S.zoom ? '돋보기를 켰습니다. 한 칸이 한 점입니다. 다시 고르면 끕니다.' : '돋보기를 껐습니다.');
        } else {
          S.tool = item;
          S.stamp = null; S.select = null;
        }
        break;
      case 3:
        if (item === 'Erase') editArea((r) => { for (let y = r.y0; y <= r.y1; y++) pic.fill(0, y * W + r.x0, y * W + r.x1 + 1); });
        else if (item === 'Inverse') editArea((r) => { for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) pic[y * W + x] ^= 1; });
        else if (item.startsWith('Change↑')) editArea((r) => {
          const g = grab(r);
          for (let y = 0; y < g.h; y++) pic.set(g.bits.subarray((g.h - 1 - y) * g.w, (g.h - y) * g.w), (r.y0 + y) * W + r.x0);
        });
        else if (item.startsWith('Change→')) editArea((r) => {
          for (let y = r.y0; y <= r.y1; y++) pic.subarray(y * W + r.x0, y * W + r.x1 + 1).reverse();
        });
        else if (item === 'Copy' || item === 'Move' || item === 'P-Save') {
          S.select = { Copy: 'copy', Move: 'move', 'P-Save': 'psave' }[item];
          S.stamp = null;
        } else if (item === 'P-Load') {
          const p = loadJSON(STORAGE_PART, null);
          if (!p) say('저장한 조각이 없습니다. 먼저 P-Save로 영역을 저장하세요.');
          else {
            const s = atob(p.bits);
            S.stamp = { w: p.w, h: p.h, bits: Uint8Array.from(s, (ch) => ch.charCodeAt(0)), once: false };
          }
        }
        break;
      case 4:
        if (item === 'White') S.color = 1 - S.color;
        else if (item === 'Part') {
          if (S.partOn) { S.partOn = false; say('Part를 껐습니다. 편집은 화면 전체에 적용됩니다.'); }
          else { S.select = 'part'; S.stamp = null; }
        } else if (item === 'Pattern') S.pattern = (S.pattern + 1) % PATTERNS.length;
        else if (item === 'Step') S.step = STEPS[(STEPS.indexOf(S.step) + 1) % STEPS.length];
        break;
    }
    render();
  }
  function finishSelect(r) {
    const kind = S.select;
    S.select = null;
    S.anchor = null;
    if (kind === 'part') {
      S.part = r; S.partOn = true;
      say(`Part 영역 (${r.x0},${r.y0})-(${r.x1},${r.y1}). 그리기와 편집이 이 안에서만 됩니다.`);
      return;
    }
    const g = grab(r);
    if (kind === 'psave') {
      let s = '';
      for (let i = 0; i < g.bits.length; i += 0x8000) s += String.fromCharCode(...g.bits.subarray(i, i + 0x8000));
      if (saveJSON(STORAGE_PART, { w: g.w, h: g.h, bits: btoa(s) })) say(`조각(${g.w}x${g.h})을 저장했습니다. P-Load로 찍을 수 있습니다.`);
      return;
    }
    if (kind === 'move') {
      pushUndo();
      for (let y = r.y0; y <= r.y1; y++) pic.fill(0, y * W + r.x0, y * W + r.x1 + 1);
      changed();
    }
    S.stamp = { ...g, once: kind === 'move' };
    S.cx = r.x0; S.cy = r.y0;
  }

  // ------------------------------------------------------------------
  // 도구 동작 (키보드 Space/Enter, 포인터)
  // ------------------------------------------------------------------
  function startText(x, y) {
    S.text = { x, y, str: '' };
    textSink.value = '';
    textSink.focus({ preventScroll: true });
  }
  function commitText() {
    const t = S.text;
    S.text = null;
    canvas.focus({ preventScroll: true });
    if (!t || !t.str) { render(); return; }
    pushUndo();
    textBits(t.str, (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) plot(x, y); }, t.x, t.y);
    changed();
  }
  function actionKey() {
    const p = { x: S.cx, y: S.cy };
    if (S.stamp) { pushUndo(); stampAt(S.stamp, p.x, p.y); if (S.stamp.once) S.stamp = null; changed(); return; }
    if (S.select) {
      if (!S.anchor) S.anchor = p;
      else finishSelect(normRect(S.anchor, p));
      render();
      return;
    }
    switch (S.tool) {
      case 'Pen':
        S.penDown = !S.penDown;
        if (S.penDown) { pushUndo(); plot(p.x, p.y); changed(); }
        break;
      case 'Spray':
        S.spraying = !S.spraying;
        if (S.spraying) { pushUndo(); spray(p.x, p.y); changed(); }
        break;
      case 'Paint':
        pushUndo(); floodFill(p.x, p.y); changed();
        break;
      case 'Line': case 'Box': case 'Circle':
        if (!S.anchor) S.anchor = p;
        else { pushUndo(); shapes[S.tool](S.anchor, p, (x, y) => plot(x, y)); S.anchor = null; changed(); }
        break;
      case 'write':
        startText(p.x, p.y);
        break;
    }
    render();
  }
  function moveCursor(dx, dy, fine) {
    const step = S.zoom || fine ? 1 : S.step;
    const nx = Math.min(W - 1, Math.max(0, S.cx + dx * step));
    const ny = Math.min(H - 1, Math.max(0, S.cy + dy * step));
    if (S.penDown && S.tool === 'Pen') lineTo(S.cx, S.cy, nx, ny, (x, y) => plot(x, y));
    S.cx = nx; S.cy = ny;
    if (S.spraying && S.tool === 'Spray') spray(nx, ny);
    if (S.zoom) followZoom();
    if (S.penDown || S.spraying) changed(); else render();
  }
  function centerZoom() {
    S.vx = Math.min(W - ZW, Math.max(0, S.cx - (ZW >> 1)));
    S.vy = Math.min(H - ZH, Math.max(0, S.cy - (ZH >> 1)));
  }
  function followZoom() {
    if (S.cx < S.vx + 3 || S.cx > S.vx + ZW - 4 || S.cy < S.vy + 3 || S.cy > S.vy + ZH - 4) centerZoom();
  }
  function cancel() {
    if (S.text) { S.text = null; canvas.focus({ preventScroll: true }); }
    else if (S.anchor) S.anchor = null;
    else if (S.select) S.select = null;
    else if (S.stamp) S.stamp = null;
    else if (S.penDown || S.spraying) { S.penDown = false; S.spraying = false; }
    else { openMenu(); return; }
    render();
  }

  // 포인터
  function toPic(e) {
    const rect = canvas.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * W;
    let y = ((e.clientY - rect.top) / rect.height) * H;
    if (S.zoom && !S.menu) { x = S.vx + x / ZOOM; y = S.vy + y / ZOOM; }
    return { x: Math.min(W - 1, Math.max(0, Math.floor(x))), y: Math.min(H - 1, Math.max(0, Math.floor(y))), sx: x, sy: y };
  }
  let sprayTimer = 0;
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    if (S.menu) { menuPointer(e); return; }
    if (S.text) commitText();
    const p = toPic(e);
    S.cx = p.x; S.cy = p.y;
    canvas.setPointerCapture(e.pointerId);
    S.drag = { lastX: p.x, lastY: p.y, startX: p.x, startY: p.y, moved: false };
    if (S.stamp) { pushUndo(); stampAt(S.stamp, p.x, p.y); if (S.stamp.once) S.stamp = null; changed(); S.drag = null; return; }
    if (S.select) { if (!S.anchor) S.anchor = { x: p.x, y: p.y }; else { S.drag.second = true; } render(); return; }
    switch (S.tool) {
      case 'Pen': pushUndo(); plot(p.x, p.y); changed(); break;
      case 'Spray':
        pushUndo(); spray(p.x, p.y); changed();
        clearInterval(sprayTimer);
        sprayTimer = setInterval(() => { spray(S.cx, S.cy); changed(); }, 40);
        break;
      case 'Paint': pushUndo(); floodFill(p.x, p.y); changed(); S.drag = null; break;
      case 'Line': case 'Box': case 'Circle':
        if (!S.anchor) S.anchor = { x: p.x, y: p.y }; else S.drag.second = true;
        render();
        break;
      case 'write': startText(p.x, p.y); S.drag = null; render(); break;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toPic(e);
    if (S.menu) { menuHover(p); return; }
    if (S.text) return;
    if (!S.drag) { S.cx = p.x; S.cy = p.y; render(); return; }
    if (p.x !== S.drag.startX || p.y !== S.drag.startY) S.drag.moved = true;
    if (S.tool === 'Pen' && !S.select && !S.stamp) lineTo(S.drag.lastX, S.drag.lastY, p.x, p.y, (x, y) => plot(x, y));
    S.drag.lastX = p.x; S.drag.lastY = p.y;
    S.cx = p.x; S.cy = p.y;
    if (S.tool === 'Pen' && !S.select) changed(); else render();
  });
  const endDrag = () => {
    clearInterval(sprayTimer);
    const d = S.drag;
    S.drag = null;
    if (!d) return;
    const p = { x: S.cx, y: S.cy };
    // 끌어서 그리거나, 두 번 눌러서(시작점 → 끝점) 그린다.
    if (S.anchor && (d.moved || d.second)) {
      if (S.select) finishSelect(normRect(S.anchor, p));
      else if (shapes[S.tool]) { pushUndo(); shapes[S.tool](S.anchor, p, (x, y) => plot(x, y)); S.anchor = null; changed(); }
    }
    render();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); if (S.menu) closeMenu(); else openMenu(); });

  // ------------------------------------------------------------------
  // 메뉴 (원작 좌표)
  // ------------------------------------------------------------------
  function openMenu(mx) {
    if (S.text) commitText();
    S.menu = { mx: mx || (S.menu && S.menu.mx) || S.lastMx || 1 };
    S.menu.my = S.ym[S.menu.mx - 1];
    render();
  }
  function closeMenu() {
    if (S.menu) S.lastMx = S.menu.mx;
    S.menu = null;
    render();
  }
  function menuKey(key) {
    const m = S.menu, n = MENUS[m.mx - 1].items.length;
    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      S.ym[m.mx - 1] = m.my;
      m.mx = key === 'ArrowRight' ? (m.mx % 4) + 1 : ((m.mx + 2) % 4) + 1;
      m.my = S.ym[m.mx - 1];
    } else if (key === 'ArrowDown') m.my = m.my >= n ? 1 : m.my + 1;
    else if (key === 'ArrowUp') m.my = m.my <= 1 ? n : m.my - 1;
    else if (key === 'Enter' || key === ' ') { S.ym[m.mx - 1] = m.my; S.lastMx = m.mx; choose(m.mx, m.my); return; }
    else if (key === 'Escape') { S.ym[m.mx - 1] = m.my; closeMenu(); return; }
    render();
  }
  function menuHit(sx, sy) {
    if (sy < ROW) {
      const mx = Math.floor((sx - 8) / COLW) + 1;
      return mx >= 1 && mx <= 4 ? { mx, my: 0 } : null;
    }
    const m = S.menu, n = MENUS[m.mx - 1].items.length;
    const x0 = 8 + (m.mx - 1) * COLW, x1 = 10 + m.mx * COLW;
    const my = Math.floor(sy / ROW);
    if (sx >= x0 && sx <= x1 && my >= 1 && my <= n) return { mx: m.mx, my };
    return null;
  }
  function menuPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W, sy = ((e.clientY - rect.top) / rect.height) * H;
    const hit = menuHit(sx, sy);
    if (!hit) { closeMenu(); return; }
    if (hit.my === 0) { S.ym[S.menu.mx - 1] = S.menu.my; S.menu.mx = hit.mx; S.menu.my = S.ym[hit.mx - 1]; render(); return; }
    S.ym[hit.mx - 1] = hit.my;
    S.lastMx = hit.mx;
    choose(hit.mx, hit.my);
  }
  function menuHover(p) {
    const hit = menuHit(p.sx, p.sy);
    if (hit && hit.my > 0 && hit.my !== S.menu.my) { S.menu.my = hit.my; render(); }
  }
  function itemLabel(mx, i) {
    const t = MENUS[mx - 1].items[i];
    if (mx !== 4) return t;
    if (t === 'White') return 'White  ' + (S.color ? '√' : ' ');
    if (t === 'Part') return 'Part   ' + (S.partOn ? '√' : ' ');
    if (t === 'Pattern') return 'Pattern' + (S.pattern + 1);
    if (t === 'Step') return 'Step' + String(S.step).padStart(3, ' ');
    return t;
  }

  // ------------------------------------------------------------------
  // 키보드
  // ------------------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && t !== canvas && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (!overlay.hidden) { if (e.key === 'Escape') hidePanel(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (S.menu) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape'].includes(k)) { e.preventDefault(); menuKey(k); }
      return;
    }
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[k]) { e.preventDefault(); moveCursor(...dirs[k], e.shiftKey); return; }
    if (k === ' ' || k === 'Enter') { e.preventDefault(); actionKey(); return; }
    if (k === 'Escape' || k === 'F10') { e.preventDefault(); cancel(); }
  });
  textSink.addEventListener('input', () => { if (S.text) { S.text.str = textSink.value; render(); } });
  textSink.addEventListener('keydown', (e) => {
    if (!S.text || e.isComposing) return;
    if (e.key === 'Enter') { e.preventDefault(); commitText(); }
    else if (e.key === 'Escape') { e.preventDefault(); S.text = null; canvas.focus({ preventScroll: true }); render(); }
  });
  textSink.addEventListener('blur', () => { if (S.text) setTimeout(() => { if (S.text && document.activeElement !== textSink) commitText(); }, 0); });

  // ------------------------------------------------------------------
  // 그리기
  // ------------------------------------------------------------------
  const comp = new Uint8Array(W * H);     // 그림 + 미리보기 + 커서 (그림 좌표)
  const screen = new Uint8Array(W * H);   // 화면 (돋보기, 메뉴 적용 후). 0/1/2(격자)
  let raf = 0;
  function render() {
    if (!raf) raf = requestAnimationFrame(paintFrame);
    updateStatus();
  }
  function paintFrame() {
    raf = 0;
    comp.set(pic);
    const xor = (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) comp[y * W + x] ^= 1; };
    const set = (v) => (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) comp[y * W + x] = v; };
    const dashRect = (r, phase = 0) => {
      let k = phase;
      const dash = (x, y) => { if ((k++ >> 2) & 1) xor(x, y); };
      shapes.Box({ x: r.x0, y: r.y0 }, { x: r.x1, y: r.y1 }, dash);
    };
    if (S.partOn && S.part) dashRect(S.part);
    const cur = { x: S.cx, y: S.cy };
    if (S.anchor && S.select) dashRect(normRect(S.anchor, cur), 2);
    else if (S.anchor && shapes[S.tool]) shapes[S.tool](S.anchor, cur, set(S.color));
    if (S.stamp) {
      for (let j = 0; j < S.stamp.h; j++) for (let i = 0; i < S.stamp.w; i++) set(S.stamp.bits[j * S.stamp.w + i])(cur.x + i, cur.y + j);
      dashRect({ x0: cur.x, y0: cur.y, x1: cur.x + S.stamp.w - 1, y1: cur.y + S.stamp.h - 1 });
    }
    if (S.text) {
      const w = textBits(S.text.str, set(S.color), S.text.x, S.text.y);
      if (Math.floor(performance.now() / 400) % 2 === 0) for (let i = 0; i < 9; i++) xor(S.text.x + w + i, S.text.y + ROW - 2);
      requestAnimationFrame(() => render());
    }
    if (!S.menu && !S.text) {
      const arm = S.zoom ? 3 : 6;
      for (let i = 2; i <= arm; i++) { xor(cur.x - i, cur.y); xor(cur.x + i, cur.y); }
      for (let i = 2; i <= Math.max(2, Math.round(arm * ASPECT * 1.2)); i++) { xor(cur.x, cur.y - i); xor(cur.x, cur.y + i); }
      if (S.zoom) xor(cur.x, cur.y);
    }

    if (S.zoom) {
      for (let y = 0; y < H; y++) {
        const py = S.vy + Math.floor(y / ZOOM);
        for (let x = 0; x < W; x++) {
          const px = S.vx + Math.floor(x / ZOOM);
          const grid = x % ZOOM === ZOOM - 1 || y % ZOOM === ZOOM - 1;
          screen[y * W + x] = py < H ? (grid ? 2 : comp[py * W + px]) : 0;
        }
      }
    } else {
      screen.set(comp);
    }
    if (S.menu) drawMenu();

    const pal = PHOSPHOR[options.phosphor];
    const d = img.data;
    for (let i = 0, q = 0; i < screen.length; i++, q += 4) {
      const c = pal[screen[i]];
      d[q] = c[0]; d[q + 1] = c[1]; d[q + 2] = c[2]; d[q + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  function drawMenu() {
    const m = S.menu;
    const put = (v) => (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) screen[y * W + x] = v; };
    const fill = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) screen.fill(v, y * W + x0, y * W + x1 + 1); };
    // 제목 줄 (웹 버전은 네 제목을 모두 보여 준다)
    fill(0, 0, W - 1, ROW - 1, 0);
    for (let i = 1; i <= 4; i++) {
      const x = (8 * i - 7) * 9;
      if (i === m.mx) { fill(8 + (i - 1) * COLW, 0, 8 + i * COLW, ROW - 1, 1); textBits(MENUS[i - 1].title, put(0), x, 0); }
      else textBits(MENUS[i - 1].title, put(1), x, 0);
    }
    // 원작: LOCATE i + 1, 8 * mx - 6 : PRINT mn$(mx, i)  /  LINE (8+(mx-1)*72, 14)-(10+mx*72, 14*(mg+1)), , B
    const items = MENUS[m.mx - 1].items;
    const bx0 = 8 + (m.mx - 1) * COLW, bx1 = 10 + m.mx * COLW, by1 = ROW * (items.length + 1);
    fill(bx0, ROW, bx1, by1, 0);
    for (let i = 1; i <= items.length; i++) textBits(itemLabel(m.mx, i - 1), put(1), (8 * m.mx - 7) * 9, i * ROW);
    shapes.Box({ x: bx0, y: ROW }, { x: bx1, y: by1 }, put(1));
    // GET/PUT PRESET 으로 선택 항목 반전
    const hx0 = 9 + (m.mx - 1) * COLW, hy0 = m.my * ROW;
    for (let y = hy0; y <= Math.min(hy0 + ROW - 1, by1 - 1); y++) for (let x = hx0; x <= 9 + m.mx * COLW; x++) screen[y * W + x] ^= 1;
  }

  // ------------------------------------------------------------------
  // 상태 표시
  // ------------------------------------------------------------------
  function say(msg) { S.message = msg; S.messageAt = Date.now(); updateStatus(); }
  function hint() {
    if (S.menu) return '←/→ 메뉴, ↑/↓ 항목, Enter 선택, Esc 닫기';
    if (S.text) return '글자를 입력하고 Enter로 찍습니다. Esc는 취소.';
    if (S.stamp) return `Space/클릭으로 조각을 찍습니다${S.stamp.once ? '' : ' (여러 번 가능)'}. Esc는 그만.`;
    if (S.select) {
      const what = { copy: 'Copy', move: 'Move', psave: 'P-Save', part: 'Part' }[S.select];
      return `${what}: ${S.anchor ? '반대쪽 모서리에서 Space (또는 끌어서 놓기)' : '영역의 한쪽 모서리에서 Space (또는 끌기)'}. Esc는 취소.`;
    }
    switch (S.tool) {
      case 'Pen': return S.penDown ? '펜을 내렸습니다. 화살표로 그리고 Space로 펜을 듭니다.' : 'Space로 펜을 내리거나 마우스/손가락으로 끌어 그립니다.';
      case 'Spray': return S.spraying ? '뿌리는 중. 화살표로 옮기고 Space로 멈춥니다.' : 'Space를 누르고 움직이거나 누른 채 끌면 뿌립니다.';
      case 'Paint': return 'Space/클릭한 곳과 이어진 영역을 무늬로 채웁니다.';
      case 'write': return 'Space/클릭한 곳에 글자를 씁니다.';
      default: return S.anchor ? '끝점에서 Space (또는 끌어서 놓기). Esc는 취소.' : '시작점에서 Space (또는 끌어서 그리기).';
    }
  }
  function updateStatus() {
    const partTxt = S.partOn && S.part ? `Part (${S.part.x0},${S.part.y0})-(${S.part.x1},${S.part.y1})` : 'Part 끔';
    statusEl.textContent = `${S.name || '(새 그림)'}${S.dirty ? ' *' : ''} · ${S.tool}${S.zoom ? ' + Glasses' : ''} · ${S.color ? 'White' : 'Black'} · Pattern ${S.pattern + 1} · Step ${S.step} · ${partTxt} · (${S.cx}, ${S.cy})`;
    hintEl.textContent = S.message || hint();
  }
  // 메시지는 4초 뒤에 도움말로 돌아간다.
  setInterval(() => {
    if (S.message && Date.now() - S.messageAt > 4000) { S.message = ''; updateStatus(); }
  }, 1000);

  // ------------------------------------------------------------------
  // HTML 컨트롤
  // ------------------------------------------------------------------
  for (const b of document.querySelectorAll('[data-menu]')) {
    b.addEventListener('click', () => { const mx = Number(b.dataset.menu); if (S.menu && S.menu.mx === mx) closeMenu(); else openMenu(mx); canvas.focus({ preventScroll: true }); });
  }
  document.getElementById('btn-undo').addEventListener('click', () => { undo(); canvas.focus({ preventScroll: true }); });
  optColor.addEventListener('change', () => { options.phosphor = optColor.value; saveJSON(STORAGE_OPTS, options); render(); canvas.focus({ preventScroll: true }); });
  for (const b of overlay.querySelectorAll('[data-close]')) b.addEventListener('click', hidePanel);
  document.getElementById('save-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('save-name').value.trim().slice(0, 20);
    if (!name) return;
    if (saveToBrowser(name)) hidePanel();
  });
  const saveName = () => (document.getElementById('save-name').value.trim() || S.name || 'picture').replace(/[\\/:*?"<>|]/g, '_');
  document.getElementById('btn-dl-pic').addEventListener('click', () => { download(saveName() + '.pic', encodePic(), 'application/octet-stream'); });
  document.getElementById('btn-dl-bsave').addEventListener('click', () => { download(saveName() + '.bsv', encodeBsave(), 'application/octet-stream'); });
  document.getElementById('btn-dl-png').addEventListener('click', () => {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const im = g.createImageData(W, H);
    for (let i = 0; i < W * H; i++) { const v = pic[i] ? 255 : 0; im.data.set([v, v, v, 255], i * 4); }
    g.putImageData(im, 0, 0);
    c.toBlob((blob) => blob && blob.arrayBuffer().then((buf) => download(saveName() + '.png', new Uint8Array(buf), 'image/png')));
  });
  document.getElementById('btn-exit-yes').addEventListener('click', () => { location.href = '../index.html'; });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    const bytes = new Uint8Array(await f.arrayBuffer());
    try {
      if (bytes[0] === 0x41 && bytes[1] === 0x48) { pushUndo(); decodePic(bytes); loaded(f.name.replace(/\.[^.]+$/, '')); }
      else if (bytes[0] === 0xfd && bytes.length >= 7 + 0x7000) { pushUndo(); memToPic(bytes.subarray(7)); loaded(f.name.replace(/\.[^.]+$/, '')); }
      else importImage(f);
    } catch (err) { say(String(err.message || err)); }
  });

  // ------------------------------------------------------------------
  // 시작
  // ------------------------------------------------------------------
  const saved = loadJSON(STORAGE_CURRENT, null);
  if (saved && saved.data) {
    try { unpackBase64(saved.data); S.name = saved.name || ''; S.dirty = !!saved.dirty; } catch { pic.fill(0); }
  }
  canvas.tabIndex = 0;
  // 캔버스가 원본보다 작게 보이면 1픽셀 선이 빠지지 않도록 부드럽게 줄인다.
  const fitRendering = () => { canvas.style.imageRendering = canvas.getBoundingClientRect().width >= W ? 'pixelated' : 'auto'; };
  window.addEventListener('resize', fitRendering);
  fitRendering();
  if (location.hash === '#debug') window.__paint = { S, pic, encodePic, decodePic, encodeBsave, memToPic, picToMem, choose, render };
  render();
  canvas.focus({ preventScroll: true });
})();
