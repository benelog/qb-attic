#!/usr/bin/env python3
"""src/*.bas 원작 소스의 설명 페이지(src/*.html)와 목록(src/index.html)을 만든다.

파일별 설명은 sources.py의 SOURCES 표에 적는다.
desc의 빈 줄은 문단을 나누고, '- '로 시작하는 줄은 목록 항목이 된다.
`백틱`은 <code>가 된다.

    python3 src/build.py
"""
import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True

# group: 목록 페이지의 묶음
GROUPS = [
    ('program', '프로그램', '웹 버전으로 다시 만든 프로그램의 원작입니다.'),
    ('flag', '청기백기와 퍼즐을 만들 때 쓴 도구와 시험 코드', '1995~1996년 SVGAQB 라이브러리로 그림, 스프라이트, 소리를 다루려고 만든 것입니다.'),
    ('etc', '작은 프로그램과 시험 코드', '웹 버전은 없고 소스만 남깁니다.'),
]

from sources import NOTES, SOURCES  # noqa: E402

KEYWORDS = set('''
ABS ABSOLUTE ACCESS AND APPEND AS ASC ATN BASE BEEP BINARY BLOAD BSAVE BYVAL CALL CASE CDBL CDECL CHAIN CHDIR CHR$
CINT CIRCLE CLEAR CLNG CLOSE CLS COLOR COMMAND$ COMMON CONST COS CSNG CSRLIN CVD CVI CVL CVS DATA DATE$ DECLARE
DEF DEFDBL DEFINT DEFLNG DEFSNG DEFSTR DIM DO DOUBLE DRAW ELSE ELSEIF END ENVIRON$ EOF EQV ERASE ERL ERR ERROR EXIT
EXP FIELD FILES FIX FOR FRE FREEFILE FUNCTION GET GOSUB GOTO HEX$ IF IMP INKEY$ INP INPUT INPUT$ INSTR INT INTEGER
INTERRUPT INTERRUPTX IS KEY KILL LBOUND LCASE$ LEFT$ LEN LET LINE LOC LOCATE LOF LOG LONG LOOP LPRINT LSET LTRIM$
MID$ MKD$ MKI$ MKL$ MKS$ MOD NAME NEXT NOT OCT$ OFF ON OPEN OPTION OR OUT OUTPUT PAINT PALETTE PCOPY PEEK PLAY
POINT POKE POS PRESET PRINT PSET PUT RANDOM RANDOMIZE READ REDIM RESET RESTORE RESUME RETURN RIGHT$ RMDIR RND
RSET RTRIM$ RUN SADD SCREEN SEEK SEG SELECT SGN SHARED SHELL SIN SINGLE SLEEP SOUND SPACE$ SPC SQR STATIC STEP
STOP STR$ STRING STRING$ SUB SWAP SYSTEM TAB TAN THEN TIME$ TIMER TO TROFF TRON TYPE UBOUND UCASE$ UNTIL USING
VAL VARPTR VARSEG VIEW WAIT WEND WHILE WIDTH WINDOW WRITE XOR
'''.split())

TOKEN = re.compile(r'"[^"\n]*"?|\'.*|\bREM\b.*|[A-Za-z_][A-Za-z0-9_.]*[$%&!#]?|&H[0-9A-Fa-f]+|\d+\.?\d*|\s+|.', re.I)


def highlight(line):
    out = []
    for m in TOKEN.finditer(line):
        t = m.group(0)
        e = html.escape(t)
        if t.startswith('"'):
            out.append(f'<span class="s">{e}</span>')
        elif t.startswith("'") or t.upper().startswith('REM') and (len(t) == 3 or not t[3].isalnum()):
            out.append(f'<span class="c">{e}</span>')
        elif t.upper() in KEYWORDS:
            out.append(f'<span class="k">{e}</span>')
        elif t[0].isdigit() or t.upper().startswith('&H'):
            out.append(f'<span class="n">{e}</span>')
        else:
            out.append(e)
    return ''.join(out)


def inline(text):
    parts = re.split(r'(`[^`]+`)', text)
    out = []
    for p in parts:
        if p.startswith('`') and p.endswith('`') and len(p) > 1:
            out.append(f'<code>{html.escape(p[1:-1])}</code>')
        else:
            out.append(html.escape(p))
    s = ''.join(out)
    # [글](주소) 링크
    return re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', r'<a href="\2">\1</a>', s)


def render_desc(desc):
    blocks = []
    for para in desc.strip().split('\n\n'):
        lines = [l.rstrip() for l in para.strip().split('\n')]
        if all(l.startswith('- ') or l.startswith('  ') for l in lines):
            items = []
            for l in lines:
                if l.startswith('- '):
                    items.append(l[2:])
                else:
                    items[-1] += '\n' + l.strip()
            lis = ''.join(f'<li>{"<br>".join(inline(x) for x in it.split(chr(10)))}</li>' for it in items)
            blocks.append(f'<ul>{lis}</ul>')
        else:
            blocks.append('<p>' + '<br>\n'.join(inline(l) for l in lines) + '</p>')
    return '\n'.join(blocks)


def page(title, body, desc=''):
    return f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
{f'<meta name="description" content="{html.escape(desc)}">' if desc else ''}
<link rel="stylesheet" href="../style.css">
</head>
<body>
<main id="app">
<div class="src-page">
{body}
</div>
<footer><a href="../index.html">프로그램 목록</a> · <a href="index.html">소스 목록</a></footer>
</main>
</body>
</html>
'''


def build_one(s):
    path = HERE / s['file']
    text = path.read_text(encoding='utf-8')
    lines = text.split('\n')
    if lines and lines[-1] == '':
        lines.pop()
    code = ''.join(f'<span class="ln">{highlight(l)}</span>' for l in lines)
    meta = [
        ('원래 파일', f'<code>{html.escape(s["orig"])}</code>'),
        ('날짜', html.escape(s['date'])),
        ('크기', f'{s["size"]:,}바이트, {len(lines):,}줄'),
        ('저장 형식', inline(s['format'])),
    ]
    if s.get('web'):
        href, label = s['web']
        meta.append(('웹 버전', f'<a href="{href}">{html.escape(label)}</a>'))
    meta.append(('내려받기', f'<a href="{s["file"]}" download>{s["file"]}</a> (UTF-8)'))
    dl = ''.join(f'<dt>{k}</dt><dd>{v}</dd>' for k, v in meta)
    dropped = ''
    if s.get('dropped'):
        dropped = f'<h2>정리하면서 뺀 파일</h2>\n{render_desc(s["dropped"])}'
    body = f'''<nav class="crumb"><a href="index.html">← 소스 목록</a></nav>
<h1>{html.escape(s["title"])}</h1>
<p class="sub"><code>{s["file"]}</code></p>
<dl class="src-meta">{dl}</dl>
<h2>설명</h2>
{render_desc(s["desc"])}
{dropped}
<h2>소스</h2>
<pre class="src-code"><code>{code}</code></pre>'''
    out = HERE / (Path(s['file']).stem + '.html')
    out.write_text(page(f'{s["title"]} 소스', body, s['summary']), encoding='utf-8')


def build_index():
    sections = []
    for key, title, note in GROUPS:
        rows = []
        for s in sorted((x for x in SOURCES if x['group'] == key), key=lambda x: x['date']):
            name = Path(s['file']).stem
            rows.append(f'<tr><td><a href="{name}.html">{html.escape(s["title"])}</a><br><code>{s["file"]}</code></td>'
                        f'<td><code>{html.escape(s["orig"].split("/")[-1])}</code></td>'
                        f'<td>{s["date"][:4]}</td><td>{inline(s["summary"])}</td></tr>')
        sections.append(f'''<h2>{title}</h2>
<p>{note}</p>
<table class="src-list"><thead><tr><th>파일</th><th>원래 이름</th><th>연도</th><th>내용</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table>''')
    notes = render_desc(NOTES)
    body = f'''<nav class="crumb"><a href="../index.html">← 프로그램 목록</a></nav>
<h1>원작 소스</h1>
<p class="sub">1991~1996년에 QuickBasic 4.5로 짠 소스입니다.</p>
{notes}
{''.join(sections)}'''
    (HERE / 'index.html').write_text(page('원작 소스 목록', body, 'Quick Basic 프로그램 보관소의 원작 소스 목록'), encoding='utf-8')


if __name__ == '__main__':
    for s in SOURCES:
        build_one(s)
    build_index()
    print(f'{len(SOURCES)}개 소스 페이지와 index.html을 만들었습니다.')
