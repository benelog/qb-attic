"""src/build.py가 읽는 원작 소스 설명.

orig: 옛 PC의 원래 경로 (C:\\ 아래)
date: 원래 파일의 수정 날짜
size: 원래 파일 크기(바이트). 바이너리 저장본은 바이너리 크기다.
"""

TEXT = 'CP949 텍스트를 UTF-8로 바꿈'
BINARY = 'QB 4.5 바이너리 저장본("Fast Load and Save")을 QB에서 텍스트로 다시 저장한 뒤 UTF-8로 바꿈'

NOTES = '''
옛 PC의 `C:\\FLAG`와 `C:\\LAN\\QB` 폴더에 있던 소스 가운데 직접 짠 것만 골라 옮겼습니다.
파일 이름은 내용을 알 수 있게 새로 붙였고, 각 페이지에 원래 이름을 적었습니다.
원본은 CP949(BIO.BAS는 조합형) 텍스트이거나 QB 4.5 바이너리 저장본이었습니다.
여기 있는 `.bas`는 모두 UTF-8 텍스트입니다.

- 같은 프로그램이 여러 벌 남아 있던 것은 가장 발전된 것 하나만 두었습니다.
  뺀 파일은 해당 페이지의 "정리하면서 뺀 파일"에 적었습니다.
- 내용이 똑같은 사본 `FLAG2.BAS`(= `VOICE.BAS`), `BE.BAS`(= `GE.BAS`)는 하나만 옮겼습니다.
- Microsoft 예제(`QCARDS`, `SORTDEMO`, `TORUS`, `REMLINE`, `CAL`/`MAL`, `WAVE`, `DIR_SCAN`, `CALL_EX`)는 옮기지 않았습니다.
- SVGAQB 라이브러리 배포본, `PCX2`, `LIB`, `LIB2`, `LIB3` 폴더의 라이브러리, 남이 짠 `NTYPE`, `PCX16`, `PCX16F`, `PCXVIEW`도 옮기지 않았습니다.
  `GREAD.BAS`는 SVGAQB 설명서의 GIF 예제를 그대로 옮긴 것이라 뺐습니다.
'''

SOURCES = [
    # ------------------------------------------------------------ 프로그램
    dict(
        group='program', file='flag-game.bas', orig='FLAG/FF4.BAS', date='1995-02-17', size=11957, format=TEXT,
        title='청기백기', web=('../flag/index.html', '청기백기'),
        summary='음성 명령을 듣고 깃발 키를 누르는 게임. SVGAQB로 640×480 256색 그림을 띄우고 사운드블라스터로 음성을 냅니다.',
        desc='''
브니엘고 컴퓨터 서클 돈데크만 시절의 청기백기 최종본입니다.
SVGAQB 1.0 라이브러리로 `LOGO.GIF`, `DGI.GIF`를 640×480 256색 화면에 띄웁니다.
깃발 그림은 미리 만들어 둔 `BU/BD/WU/WD.SPR`을 `BLOAD`해서 `BLKPUT`으로 찍습니다.

- `SUB test`가 게임 본체입니다.
  `B1~B12.WAV` 가운데 하나를 골라 들려주고 A, Z, ', / 키 입력을 정답과 비교합니다.
  4번 틀리면 끝납니다.
- `SAYVOC`, `RUNDMA`, `SBLCMD`는 사운드블라스터에 DMA로 음성을 보내는 루틴입니다.
  [사운드블라스터 음성 시험](sb-voice-test.html)에서 시험한 코드를 옮겨 왔습니다.
- 반응 시간 제한은 CPU 속도에 따라 달라지는 빈 루프로 잽니다.
- 같은 폴더의 `FLAG.BAT`(`qb/l svgaqb10 ff4.bas`)로 SVGAQB 퀵 라이브러리를 붙여 QB를 띄웠습니다.

여러 버전의 차이는 [flag/history.md](../flag/history.md)에 정리했습니다.
''',
        dropped='''
- `FLAG/FLAGV.BAS` (1995-02-16), `LAN/QB/PCXLIB/FLV2.BAS` (1995-04-17)
  판정 없이 키를 누르면 깃발이 오르내리기만 하는 데모입니다.
- `FLAG/NEWFF4.BAS` (1996-02-08)
  퍼즐 작업 때 FF4를 복사해 고치다 만 파일입니다.
  SUB 다섯 개가 빠져 있어 컴파일되지 않습니다.
''',
    ),
    dict(
        group='program', file='puzzle-game.bas', orig='FLAG/PUZZLE.BAS', date='1996-02-10', size=5201, format=TEXT,
        title='퍼즐 그림 맞추기', web=('../puzzle/index.html', '퍼즐 그림 맞추기'),
        summary='장미 그림을 3×3으로 잘라 화살표 키로 맞추는 슬라이딩 퍼즐.',
        desc='''
청기백기와 같은 SVGAQB 틀 위에 만든 3×3 슬라이딩 퍼즐입니다.
`M3.GIF` 화면에서 89×123 조각 8개를 `BLKGET`으로 떼어 내고, 빈 칸은 `BOARD.SPR`로 찍습니다.

- 시작 배치는 고정(8 3 5 / 2 1 6 / 4 7 빈칸)입니다.
- 화살표 키는 조각이 움직이는 방향입니다.
- 15초 제한시간 코드가 있지만 `GOTO`로 건너뛰어 실제로는 동작하지 않습니다.
- 조각 좌표는 [퍼즐 조각 좌표 계산](puzzle-piece-coords.html)으로 구했고, 빈 칸 그림은 [퍼즐 빈 칸 스프라이트 만들기](puzzle-blank-sprite.html)로 만들었습니다.
''',
    ),
    dict(
        group='program', file='biorhythm.bas', orig='LAN/QB/BIO.BAS', date='1993-08-11', size=4650,
        format='조합형 한글 텍스트를 UTF-8로 바꿈',
        title='바이오리듬', web=('../bio/index.html', '바이오리듬'),
        summary='생년월일로 건강·감성·지성 주기를 텍스트 화면에 그리고, 달력처럼 인쇄합니다.',
        desc='''
1990년 '컴퓨터 쥬니어' 잡지에 실렸던 바이오리듬 프로그램을 다시 짠 것입니다.
줄 번호가 붙은 GW-BASIC 식 코드에 한글 출력용 `hput`, `setmode` 호출이 섞여 있습니다.

- 메뉴에서 1은 화면 출력, 2는 `LPRINT`로 여러 달치 인쇄, 3·4는 끝내기입니다.
- 건강 23일, 감성 28일, 지성 33일 주기를 `$`, `O`, `#` 문자로 그립니다.
- 연도를 두 자리로 받아서 2000년 이후에는 살아온 날이 음수가 됩니다.

원본은 조합형 한글 파일이었습니다.
`╔`, `═`, `║` 같은 선 문자는 원본에서 `D4 C9`, `D4 CD`처럼 2바이트로 적힌 한글 카드용 박스 문자라 화면에서 두 칸을 차지했습니다.
여기서는 같은 모양의 한 칸짜리 유니코드 문자로 바꿔서, 박스 줄의 길이가 원래보다 짧아 보입니다.
`BIO.EXE`(1991)는 이 소스보다 오래된 빌드라 옮기지 않았습니다.
''',
    ),
    dict(
        group='program', file='calc-practice.bas', orig='LAN/QB/CP.BAS', date='1996-03-02', size=1580, format=BINARY,
        title='계산 연습 CP', web=('../calc/index.html', '계산 연습'),
        summary='"Calculation Practice Trainer". 항 개수와 자릿수를 정해 덧셈·뺄셈 암산 문제를 냅니다.',
        desc='''
`+ 12 - 5 + 7` 같은 여러 항의 덧셈·뺄셈 문제를 내는 암산 연습기입니다.
항 개수, 자릿수, 문제 수, 문제당 시간을 차례로 입력받습니다.

- 끝나면 맞힌 개수와 백분율을 보여 주고 `CLEAR` 뒤 처음부터 다시 합니다.
- 문제당 시간을 입력받지만 코드는 그 값을 쓰지 않습니다.
- "your correc answer is" 같은 오타도 원문 그대로입니다.

[덧셈·뺄셈 20문제](calc-add-sub.html)를 일반화한 판입니다.
''',
    ),
    dict(
        group='program', file='calc-add-sub.bas', orig='LAN/QB/RANDOM.BAS', date='1994-08-28', size=839, format=BINARY,
        title='계산 연습 RANDOM', web=('../calc/index.html', '계산 연습'),
        summary='0~99 두 수의 덧셈 또는 뺄셈 20문제.',
        desc='''
0~99 사이 두 수로 덧셈이나 뺄셈 문제를 20개 냅니다.
맞으면 "Ok", 틀리면 정답을 보여 주고 마지막에 맞힌 개수를 찍습니다.
[곱셈 20문제](calc-multiply.html)는 이 파일을 고쳐 만들었습니다.
''',
    ),
    dict(
        group='program', file='calc-multiply.bas', orig='LAN/QB/MULTI.BAS', date='1994-09-07', size=739, format=BINARY,
        title='계산 연습 MULTI', web=('../calc/index.html', '계산 연습'),
        summary='0~99 × 0~9 곱셈 20문제.',
        desc='''
[덧셈·뺄셈 20문제](calc-add-sub.html)를 곱셈으로 바꾼 것입니다.
0~99와 0~9를 곱하는 문제를 20개 냅니다.
''',
    ),
    dict(
        group='program', file='paint.bas', orig='LAN/QB/D2.BAS', date='1992-01-10', size=3936, format=BINARY,
        title='그림판', web=('../paint/index.html', '그림판'),
        summary='허큘리스(SCREEN 3) 그림판의 메뉴 부분. 메뉴 이동까지만 만든 미완성입니다.',
        desc='''
허큘리스 그래픽(SCREEN 3, 720×348 흑백)용 그림판을 만들다 멈춘 소스입니다.
FILE, TOOLS, EDIT, OPTION 네 메뉴를 `DATA`로 정의하고 ←/→, ↑/↓로 옮겨 다니며 고른 항목을 반전시킵니다.
항목을 골라도 아무 기능이 없습니다.

- `readpic`은 [.pic 그림 불러오기](pic-loader.html)를 SUB로 옮긴 것입니다.
- `SBSAVE`, `sbload`는 [허큘리스 화면 BSAVE 시험](hercules-bsave.html)처럼 화면 메모리 32KB를 통째로 저장하고 불러옵니다.
- 항목 이름 끝의 `|` 표시가 무슨 뜻인지는 소스에 없습니다.

웹 버전은 메뉴 배치와 동작을 그대로 두고 기능을 메뉴 이름에 맞춰 새로 만들었습니다.
''',
    ),
    dict(
        group='program', file='calculator.bas', orig='LAN/QB/CALCU2.BAS', date='1993-12-12', size=9771, format=TEXT,
        title='계산기', web=('../calcu/index.html', '계산기'),
        summary='숫자를 한 줄씩 적어 내려가며 결과를 누적하는 전표식 계산기.',
        desc='''
숫자를 한 줄에 하나씩 넣고 `+` `-` `*` `/`를 누르면 그 연산자가 다음 줄에 붙으며 결과가 누적됩니다.
500줄까지 넣을 수 있고, 화면에는 14줄이 보이며 위아래로 오가며 고칠 수 있습니다.

- `caledit`가 한 줄 편집기입니다.
  `Home`, `End`, `Del`, `Backspace`를 처리하고 한글 2바이트를 한 번에 지웁니다.
- `makebox`, `clscreen`은 상자 그리기와 영역 지우기입니다.
- 큰 프로그램에 `CALCU2.OBJ`로 링크되던 모듈이라 화면색을 따로 정하지 않습니다.
''',
    ),

    # ------------------------------------------------------------ 청기백기·퍼즐 준비
    dict(
        group='flag', file='pcx-svga.bas', orig='LAN/QB/PCXLIB/PCX-SV.BAS', date='1995-02-05', size=5538, format=TEXT,
        title='PCX 읽기 모듈 (SVGAQB판)',
        summary='PCX 그림 디코더. QB 내장 그래픽 명령을 SVGAQB 호출로 바꿔 256색 고해상도에 그립니다.',
        desc='''
PCX 파일의 머리와 RLE 압축을 풀어 화면에 그리는 모듈입니다.
`PCXSet`으로 파일을 열고 `PCXWidth`, `PCXColor` 같은 함수로 정보를 읽은 뒤 `ReadPCX`로 그립니다.

1993년의 `PCX.BAS`(작성자 표기 없음)를 고쳐 `LINE`, `PSET`, `VIEW` 대신 SVGAQB의 `DRWLINE`, `DRWPOINT`, `SETVIEW`를 쓰게 했습니다.
청기백기 그림을 처음에는 PCX로 띄워 보려고 했던 흔적입니다.
결국 게임에는 SVGAQB의 GIF 함수를 썼습니다.
''',
        dropped='''
- `LAN/QB/PCXLIB/PCX.BAS` (1993-11-07)
  QB 내장 그래픽 명령(`SCREEN 12`, `SCREEN 13`)으로 그리는 원래 모듈입니다.
''',
    ),
    dict(
        group='flag', file='pcx-svga-viewer.bas', orig='LAN/QB/PCXLIB/PCXREAD2.BAS', date='1995-02-05', size=2006, format=TEXT,
        title='PCX 보기 (SVGAQB판)',
        summary='명령행으로 받은 256색 PCX 파일의 정보를 보여 주고 크기에 맞는 해상도로 띄웁니다.',
        desc='''
`PCXREAD 파일이름`으로 실행하는 PCX 뷰어입니다.
파일 크기, 버전, 색 수, 그림 크기, 압축 여부를 찍은 뒤 키를 누르면 그림을 띄웁니다.
그림 크기에 따라 `RES320`, `RES640`, `RES800`, `RES1024` 중 하나를 고르고, 256색이 아니면 끝냅니다.
[PCX 읽기 모듈](pcx-svga.html)과 함께 빌드했습니다(`PCXREAD2.MAK`).
''',
        dropped='''
- `LAN/QB/PCXLIB/PCXREAD.BAS` (1995-02-04)
  `SCREEN 13`/`SCREEN 12`로만 띄우던 이전 판입니다.
''',
    ),
    dict(
        group='flag', file='flag-sprite-down.bas', orig='LAN/QB/PCXLIB/MDATA.BAS', date='1995-02-13', size=1943, format=TEXT,
        title='깃발 내린 스프라이트 만들기',
        summary='DOWNBN.GIF에서 청기·백기를 내린 그림을 잘라 bd.spr, wd.spr로 저장합니다.',
        desc='''
`C:\\FLAG\\DOWNBN.GIF`를 띄우고 청기와 백기를 내린 부분을 `BLKGET`으로 잘라 `BSAVE`합니다.
청기는 `bd.spr`, 백기는 `wd.spr`가 되고 [청기백기](flag-game.html)가 이 파일을 `BLOAD`해서 씁니다.
SPR 파일에는 팔레트가 없어서 같은 팔레트의 화면(`DGI.GIF`) 위에서만 제 색이 나옵니다.
[깃발 올린 스프라이트 만들기](flag-sprite-up.html)는 이 파일을 복사해 좌표와 파일 이름만 바꾼 것입니다.
''',
    ),
    dict(
        group='flag', file='flag-sprite-up.bas', orig='LAN/QB/PCXLIB/MDATAUP.BAS', date='1995-02-13', size=1939, format=TEXT,
        title='깃발 올린 스프라이트 만들기',
        summary='UPBN.GIF에서 청기·백기를 올린 그림을 잘라 bu.spr, wu.spr로 저장합니다.',
        desc='''
[깃발 내린 스프라이트 만들기](flag-sprite-down.html)와 같은 일을 `C:\\FLAG\\UPBN.GIF`에 합니다.
깃발을 올린 그림이 더 길어서 잘라 내는 영역이 77×175이고 배열도 더 큽니다.
결과는 `bu.spr`, `wu.spr`입니다.
''',
    ),
    dict(
        group='flag', file='flag-sprite-check.bas', orig='LAN/QB/PCXLIB/GREADS.BAS', date='1995-02-13', size=1942, format=TEXT,
        title='깃발 스프라이트 확인',
        summary='DOWNBN.GIF를 띄우고 그 위에 bu.spr를 찍어 스프라이트가 제대로 저장됐는지 봅니다.',
        desc='''
GIF를 띄우는 `gifload`에 `bu.spr`를 `BLOAD`해서 (0, 0)에 `BLKPUT`하는 코드를 붙였습니다.
[깃발 올린 스프라이트 만들기](flag-sprite-up.html)로 만든 파일이 제대로 나오는지 확인하는 용도입니다.
끝나면 "It's demo version of flag game programmed by Jung-Sang-Hyuk"를 찍습니다.
''',
    ),
    dict(
        group='flag', file='sb-voice-test.bas', orig='FLAG/VOICE.BAS', date='1995-02-15', size=2089, format=TEXT,
        title='사운드블라스터 음성 재생 시험',
        summary='사운드블라스터 포트를 직접 다뤄 DON2.WAV를 DMA로 재생합니다.',
        desc='''
사운드블라스터(포트 220h, DMA 1번)를 초기화하고 `C:\\FLAG\\DON2.WAV`를 재생합니다.
파일을 400바이트씩 문자열 배열에 읽어 들인 뒤, 배열의 물리 주소를 계산해 DMA 컨트롤러에 넘깁니다.

- `initvoice`: DSP를 리셋하고 스피커를 켠 뒤 샘플링 속도를 정합니다.
- `RUNDMA`: DMA 페이지, 주소, 길이를 설정합니다.
  64KB 경계를 넘으면 `BEEP`하고 그만둡니다.
- `sayvoc`: 최대 40000바이트를 읽어 재생 명령(14h)을 보냅니다.

이 루틴은 그대로 [청기백기](flag-game.html)에 들어갔습니다.
같은 폴더에 내용이 똑같은 `FLAG2.BAS`가 있었습니다.
''',
    ),
    dict(
        group='flag', file='wav-size-test.bas', orig='FLAG/OVERLF.BAS', date='1995-02-15', size=143, format=TEXT,
        title='WAV 파일 길이 시험',
        summary='DON2.WAV를 RANDOM 파일로 열어 LOF 값을 정수 변수에 넣어 봅니다.',
        desc='''
`DON2.WAV`의 크기를 `LOF`로 읽어 `INTEGER` 변수에 넣는 일곱 줄짜리 시험입니다.
파일 이름(OVERLF)으로 보아 32767바이트가 넘는 길이가 정수에서 넘치는지(overflow) 본 것 같습니다.
[청기백기](flag-game.html)의 `RUNDMA`는 길이를 `LENG&`(LONG)로 받습니다.
''',
    ),
    dict(
        group='flag', file='puzzle-blank-sprite.bas', orig='FLAG/MKPU.BAS', date='1996-02-08', size=2470, format=TEXT,
        title='퍼즐 빈 칸 스프라이트 만들기',
        summary='board.gif의 왼쪽 위 88×122 영역을 잘라 board.spr로 저장합니다.',
        desc='''
[퍼즐](puzzle-game.html)의 빈 칸 그림 `BOARD.SPR`를 만든 도구입니다.
CPU와 그래픽 카드를 확인하고 로고를 보여 준 뒤 `board.gif`를 띄워 왼쪽 위를 `BLKGET`, `BSAVE`합니다.
`start`, `opening`, `gifload`는 청기백기에서 가져온 것입니다.
끝나면 "It's test of the game programmed by Jung-Sang-Hyuk"를 찍습니다.
''',
    ),
    dict(
        group='flag', file='puzzle-piece-coords.bas', orig='FLAG/DAT.BAS', date='1996-02-08', size=583, format=BINARY,
        title='퍼즐 조각 좌표 계산',
        summary='3×3 퍼즐 칸마다 왼쪽 위·오른쪽 아래 좌표를 찍어 봅니다.',
        desc='''
퍼즐 칸 (j, i)마다 `109 + 90 * j`, `124 * i - 105`, `197 + 90 * j`, `17 + 124 * i`를 찍습니다.
가로 90, 세로 124 간격의 칸에서 89×123 조각을 떼어 낼 좌표입니다.
[퍼즐](puzzle-game.html)의 조각 좌표가 이 식으로 정해졌습니다.
''',
    ),

    # ------------------------------------------------------------ 작은 프로그램
    dict(
        group='etc', file='make-data-msg.bas', orig='LAN/QB/MAKEDATA.BAS', date='1991-06-01', size=488, format=BINARY,
        title='data.msg 만들기',
        summary='1부터 29까지를 쉼표로 이어 data.msg 파일에 씁니다.',
        desc='''
`data.msg`에 `1 , 2 , ... 29 ,`를 한 줄로 씁니다.
파일 쓰기를 익히던 무렵의 다섯 줄짜리 시험입니다.
''',
    ),
    dict(
        group='etc', file='password-lock.bas', orig='LAN/QB/QU.BAS', date='1991-08-13', size=613, format=BINARY,
        title='암호 잠금',
        summary='다섯 글자 암호를 맞힐 때까지 "Enter password."를 반복합니다.',
        desc='''
키를 다섯 번 받아 암호와 같으면 끝나고, 다르면 처음부터 다시 묻습니다.
입력한 글자는 화면에 찍지 않습니다.

암호의 첫 글자는 원본에서 바이트 `C8`(10진수 200)입니다.
Alt를 누른 채 숫자판으로 200을 쳐야 들어가는 글자라 남이 맞히기 어렵게 한 것으로 보입니다.
여기서는 CP437에서 같은 코드인 `╚`로 적었습니다.
''',
    ),
    dict(
        group='etc', file='title-screen.bas', orig='LAN/QB/MAIN.BAS', date='1991-08-22', size=1001, format=BINARY,
        title='타이틀 화면',
        summary='허큘리스 화면에 "Begin !!"을 크게 키워 그리고 한 글자씩 안내문을 찍습니다.',
        desc='''
SCREEN 3(허큘리스)에서 `PRINT`로 찍은 " Begin !! "을 `POINT`로 읽습니다.
흰 상자를 칠한 뒤 켜진 점마다 검은 사선을 그어 글자를 8배로 키워 그립니다.
배경을 무늬로 칠한 뒤 " Strike a key when ready...."를 `SOUND`와 함께 한 글자씩 찍고 키를 기다립니다.

글자를 찍고 `POINT`로 읽어 크게 키우는 방법은 [큰 글자 타자](big-letters.html)(1995)와 2007년의 [Code can be an art](../cba/index.html)에서도 다시 썼습니다.
''',
    ),
    dict(
        group='etc', file='sprite-grid-editor.bas', orig='LAN/QB/GE.BAS', date='1991-09-21', size=2360, format=BINARY,
        title='격자 스프라이트 편집기',
        summary='20×20 격자에서 점을 찍어 작은 그림을 만들고 GET 배열로 저장합니다.',
        desc='''
허큘리스 화면에 20×20 격자를 그리고 화살표로 커서를 옮겨 점을 찍는 편집기입니다.
왼쪽 위에 실제 크기 그림이 함께 그려집니다.

- `Z`는 점 찍기, `X`는 지우기, `S`는 저장, `E`는 끝내기입니다.
- 저장하면 실제 크기 그림을 `GET`으로 읽어 배열 값을 쉼표로 이어 `이름6.gri` 파일에 씁니다.
  이 숫자를 `DATA`에 붙여 `PUT`으로 찍는 데 썼습니다([타일 지도](tile-map.html) 참고).

같은 폴더에 내용이 똑같은 `BE.BAS`가 있었습니다.
''',
    ),
    dict(
        group='etc', file='hercules-bsave.bas', orig='LAN/QB/BSAVE.BAS', date='1991-10-08', size=479, format=BINARY,
        title='허큘리스 화면 BSAVE 시험',
        summary='허큘리스 그래픽 화면 메모리(B000:0000부터 32KB)를 파일로 저장합니다.',
        desc='''
SCREEN 3에 선과 원을 그린 뒤 `DEF SEG = &HB000`, `BSAVE "ae", 0, &H8000`으로 화면 메모리를 통째로 저장합니다.
[그림판](paint.html)의 `SBSAVE`가 같은 방법을 씁니다.
''',
    ),
    dict(
        group='etc', file='pic-loader.bas', orig='LAN/QB/READPIC.BAS', date='1991-10-08', size=1327, format=BINARY,
        title='.pic 그림 불러오기',
        summary='"AH" 머리의 압축 .pic 그림을 풀어 허큘리스 화면 메모리에 바로 씁니다.',
        desc='''
`.pic` 파일을 512바이트씩 읽어 허큘리스 화면 메모리(`B000`)에 `POKE`합니다.
첫 블록은 "AH" 머리와 7번 바이트가 7인지 확인합니다.

- 표지 바이트가 `80h`이면 다음 블록을 읽습니다.
- 위 비트가 0이면 뒤따르는 n바이트를 그대로 씁니다.
- 위 비트가 1이면 다음 바이트를 n번 반복합니다.
  그 바이트가 0이면 쓰지 않고 n바이트를 건너뜁니다.

어떤 프로그램이 만든 형식인지는 남아 있지 않습니다.
웹 [그림판](../paint/index.html)의 `.pic` 저장은 이 코드를 거꾸로 만든 것입니다.
''',
    ),
    dict(
        group='etc', file='screen-fill-test.bas', orig='LAN/QB/DDD.BAS', date='1991-11-11', size=513, format=BINARY,
        title='화면 반전 채우기',
        summary='검은 글자·흰 바탕 색으로 바꾸고 빈 줄을 찍어 화면을 위로 밀어 올립니다.',
        desc='''
`COLOR 0, 7`로 바꾼 뒤 24번째 줄에서 빈 줄을 24번 찍어, 화면이 한 줄씩 흰 바탕으로 밀려 올라가게 합니다.
줄마다 빈 루프로 잠깐 쉽니다.
끝나면 `COLOR 7, 0`으로 되돌립니다.
''',
    ),
    dict(
        group='etc', file='mouse-test.bas', orig='LAN/QB/MOUSETE.BAS', date='1991-12-22', size=472, format=BINARY,
        title='마우스 시험',
        summary='허큘리스 화면에서 mouse SUB를 부르는 세 줄짜리 시험. SUB 본체는 남아 있지 않습니다.',
        desc='''
SCREEN 3에서 `CALL mouse(1, ...)`로 마우스 커서를 켜 보려던 시험입니다.
`mouse`는 별도 라이브러리에 있던 루틴이라 이 파일만으로는 실행되지 않습니다.
''',
    ),
    dict(
        group='etc', file='text-mode-switch.bas', orig='LAN/QB/TS.BAS', date='1993-02-07', size=694, format=BINARY,
        title='텍스트 모드로 돌아가기',
        summary='그래픽 화면에서 멈춘 모니터를 SCREEN 0으로 돌려놓는 작은 유틸리티.',
        desc='''
`SCREEN 0, 0, 0`으로 텍스트 화면으로 돌아가 "Graphic Mode ----> Text Mode"를 찍고 키를 기다립니다.
같은 폴더에 `TS.EXE`가 있습니다.
그래픽 프로그램이 비정상으로 끝나 화면이 그래픽 모드에 남았을 때 쓰려던 것으로 보입니다.
"made by Sang-Hyuk", "Pc-Serve ID: Bobble"이라는 서명이 있습니다.
''',
    ),
    dict(
        group='etc', file='tile-map.bas', orig='LAN/QB/DE.BAS', date='1993-05-30', size=487, format=TEXT,
        title='타일 지도 그리기',
        summary='MAP 파일의 1을 20×20 벽돌 그림으로 바꿔 허큘리스 화면에 찍습니다.',
        desc='''
`MAP` 텍스트 파일을 15줄 읽어 글자가 `1`인 칸마다 20×20 그림을 `PUT`합니다.
그림은 `DATA`에 적은 `GET` 배열입니다.
[격자 스프라이트 편집기](sprite-grid-editor.html)로 만든 20×20 그림을 이렇게 썼습니다.
게임 화면의 벽을 그려 보던 시험으로 보입니다.
''',
    ),
    dict(
        group='etc', file='line-input.bas', orig='LAN/QB/KINPUT.BAS', date='1993-07-04', size=6139, format=TEXT,
        title='한 줄 입력 SUB (Kinput)',
        summary='INPUT 대신 쓰려고 만든 한 줄 편집 SUB. 보이는 폭보다 긴 글을 옆으로 밀며 고칠 수 있습니다.',
        desc='''
`INPUT` 대신 쓸 한 줄 입력 루틴 `Kinput`과, 그것을 한 번 불러 보는 짧은 시험 코드입니다.
`Kinput Ans$, 화면 폭, 최대 글자 수, 삽입 여부`로 부르고, 주석에 인자의 뜻을 적어 두었습니다.

- 커서가 있는 줄과 칸에서 입력을 받습니다.
  화면 폭(`PrCan`)보다 긴 글은 커서 위치에 맞춰 보이는 부분을 옆으로 밉니다.
- `←` `→` `Home` `End`로 커서를 옮기고 `Backspace`, `Del`로 지웁니다.
- `Ins` 키로 삽입 모드와 수정(덮어쓰기) 모드를 바꾸고, 모드에 따라 커서 모양이 달라집니다.
- 최대 글자 수(`Can`)를 넘으면 마지막 입력을 되돌립니다.
- `Enter`, `Esc`, `↑`, `↓`를 누르면 끝납니다.
  `↑` `↓`로도 끝나는 것은 여러 입력 칸을 오가는 화면에 쓰려던 것으로 보입니다.
- 글자를 1바이트씩 다루므로 한글 2바이트를 한 글자로 묶어 처리하지는 않습니다.
''',
    ),
    dict(
        group='etc', file='text-screen-save.bas', orig='LAN/QB/TSS.BAS', date='1993-08-05', size=637, format=BINARY,
        title='텍스트 화면 저장과 복원',
        summary='텍스트 화면 메모리를 BSAVE로 저장했다가 화면을 지운 뒤 BLOAD로 되살립니다.',
        desc='''
화면에 글자를 가득 찍고 `DEF SEG = &HB000`, `BSAVE "ae.aaa", 0, &HFA0`으로 80×25 텍스트 화면 4000바이트(글자와 색)를 저장합니다.
키를 누르면 화면을 지웠다가 `BLOAD`로 되살립니다.
`B000`은 흑백(MDA, 허큘리스) 텍스트 화면의 세그먼트입니다.
''',
        dropped='''
같은 일을 다른 방법으로 해 본 이전·이후 판입니다.

- `LAN/QB/TSS3.BAS` (1993-06-09)
  `PEEK`으로 글자 바이트만 2000개 읽어 배열에 두었다가 `POKE`로 되돌립니다.
- `LAN/QB/TSS2.BAS` (1993-06-13)
  글자와 색 4000바이트를 모두 `PEEK`, `POKE`합니다.
- `LAN/QB/TS4.BAS` (1995-01-08)
  `FILES` 출력을 `SCREEN()` 함수로 한 글자씩 읽어 두었다가 `PRINT`로 다시 찍습니다.
  글자만 되살리고 느립니다.
''',
    ),
    dict(
        group='etc', file='dos-time.bas', orig='LAN/QB/DOSINCLO.BAS', date='1995-02-13', size=2739, format=BINARY,
        title='DOS 시계 (1/100초)',
        summary='DOS 인터럽트 21h 2Ch로 시각을 읽어 1/100초가 바뀔 때마다 찍습니다.',
        desc='''
`INTERRUPTX`로 DOS 함수 2Ch(시각 읽기)를 불러 시, 분, 초, 1/100초를 꺼냅니다.
1/100초 값이 바뀔 때마다 한 줄씩 찍어서 `TIMER`보다 세밀한 시간을 얻을 수 있는지 본 것입니다.
`QB.BI`를 포함하므로 `QB.QLB`를 붙여 실행해야 합니다.
''',
    ),
    dict(
        group='etc', file='analog-clock.bas', orig='LAN/QB/CLOCK.BAS', date='1995-04-17', size=918, format=TEXT,
        title='아날로그 시계',
        summary='SCREEN 12에 색 점을 뿌리고 DRAW의 TA(회전) 명령으로 시침·분침·초침을 그립니다.',
        desc='''
640×480 화면에 색 점 19800개를 뿌린 뒤 원 두 개로 시계판을 그립니다.
눈금과 바늘은 모두 `DRAW "bm360,250 ta각도 u길이"`처럼 회전 각도를 바꿔 가며 그립니다.

- 바늘은 `c0`(검정)으로 그렸다가 `TIME$`가 바뀌면 `c15`(흰색)로 다시 그립니다.
- 분침은 초를 반영해 조금씩 움직입니다.
- 시침은 시와 분으로 계산한 각도 `d`를 쓰지 않고 시 값 `c`를 그대로 각도로 씁니다.
  그래서 시침이 12시 근처에서 거의 움직이지 않습니다.
- `E`를 누르면 끝납니다.
''',
    ),
    dict(
        group='etc', file='big-letters.bas', orig='LAN/QB/S12ASC.BAS', date='1995-04-17', size=238, format=TEXT,
        title='큰 글자 타자',
        summary='친 글자를 화면 위에 찍고 POINT로 읽어 상자 모양 점으로 크게 다시 그립니다.',
        desc='''
SCREEN 12에서 키를 칠 때마다 지금까지 친 글자를 (1, 1)에 찍습니다.
그 영역을 `POINT`로 읽어 켜진 점마다 초록 상자를 그려 8배로 키워 보여 줍니다.
[타이틀 화면](title-screen.html)(1991)과 같은 방법이고, 2007년의 [Code can be an art](../cba/index.html)로 이어집니다.
''',
    ),
]
