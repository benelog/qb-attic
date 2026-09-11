# Quick Basic 프로그램 보관소 (qb-attic)

정상혁(브니엘고 컴퓨터 서클 "돈데크만")이 1992~1996년에 QuickBasic 4.5로 만든 DOS 프로그램을 정적 웹페이지로 다시 구현한 것입니다.
`index.html`에서 고릅니다.

| 페이지 | 프로그램 | 원작 |
|--------|----------|------|
| `flag/index.html` | 청기백기 | `FLAG/FF4.BAS` (1995, SVGAQB) |
| `puzzle/index.html` | 퍼즐 그림 맞추기 (3×3 슬라이딩 퍼즐) | `FLAG/PUZZLE.BAS` (1996, SVGAQB) |
| `bio/index.html` | 바이오리듬 | `LAN/QB/BIO.BAS` (1993) |
| `calc/index.html` | 계산 연습 (CP, RANDOM, MULTI) | `LAN/QB/CP.BAS` (1996), `RANDOM.BAS`, `MULTI.BAS` (1994) |
| `paint/index.html` | 그림판 | `LAN/QB/D2.BAS` (1992) |

청기백기와 퍼즐은 원작의 그림(`DGI.GIF`, `LOGO.GIF`, `M3.GIF`), 스프라이트(`*.SPR`),
음성 명령(`B1~B12.WAV`, `START.WAV`, `DON2.WAV`)을 그대로 변환해서 사용합니다.
나머지 세 개는 그림 파일이 없는 프로그램이라 원작 코드의 화면 출력을 그대로 옮겼습니다.
청기백기 소스 여러 벌(데모판 `FLV2.BAS`, `FLAGV.BAS`, `NEWFF4.BAS`와 준비 코드)의 차이는 `flag/history.md`에 정리했습니다.

## 실행

배포 주소: https://qb-attic.benelog.net/ (GitHub Pages)

정적 파일이므로 아무 웹 서버에나 올리면 됩니다.

```bash
python3 -m http.server 8000
# http://localhost:8000/
```

`index.html`을 파일로 직접 열어도(`file://`) 동작합니다.

## 청기백기 (flag/)

### 조작

| 키 | 동작 |
|----|------|
| `A` | 청기 올려 |
| `Z` | 청기 내려 |
| `'` | 백기 올려 |
| `/` | 백기 내려 |
| `↑` `↓` `Enter` | 메뉴 이동/선택 |
| `Esc` (또는 `E`) | 메뉴로 돌아가기 |

모바일에서는 화면 아래 4개의 버튼이나 보드 위 키 그림을 눌러도 됩니다.

### 규칙 (원작 그대로)

- 12가지 음성 명령 중 하나가 무작위로 나옵니다.
  "청기 올려", "청기 내려", "백기 올려", "백기 내려"와 각각의 "~하지 마" 변형입니다.
- "~하지 마"가 나오면 아무 키도 누르지 않아야 정답입니다.
- 4번 틀리면 게임이 끝납니다 (원작 `wa% = 4`).
- 정답이면 `PLAY "ge"`, 게임 종료 시 `PLAY "ceg>c"` 효과음을 Web Audio로 흉내 냅니다.

웹 버전에서 추가된 것:

- 반응 제한 시간이 5회 맞출 때마다 조금씩 짧아집니다.
- 점수는 정답당 100점 + 반응 속도 보너스(최대 100점)입니다.
- 상위 10개 기록(이름, 점수, 맞은 횟수, 날짜)을 브라우저 Local Storage에 저장합니다.
  (`flag-game.ranking` 키. "기록 삭제" 버튼으로 지울 수 있습니다.)
- 자막/소리 켜고 끄기 옵션 (`flag-game.options` 키에 저장).

## 퍼즐 그림 맞추기 (puzzle/)

원작 `PUZZLE.BAS`는 `M3.GIF` 화면의 장미 그림을 89×123 조각 8개로 잘라 3×3 슬라이딩 퍼즐을 만듭니다.
빈 칸 그림은 `BOARD.SPR`입니다.

- 화살표 키는 **조각이 움직이는 방향**입니다 (원작과 같음). `↑`는 빈 칸 아래의 조각을 위로 밉니다.
- 빈 칸 옆의 조각을 클릭/터치해도 되고, 화면 아래 방향 버튼도 있습니다.
- `Q`는 포기. 원작의 "You are Failed... Time Over..." 메시지가 나옵니다.
- 시작 배치는 "무작위(풀 수 있는 배치)"와 원작의 고정 배치(8 3 5 / 2 1 6 / 4 7 _) 중 고를 수 있습니다.
- 완성하면 원작처럼 전체 그림을 보여 주고, 시간과 이동 횟수로 상위 10개 기록을
  Local Storage(`puzzle-game.ranking`)에 저장합니다. 시간이 짧은 순, 같으면 이동이 적은 순입니다.
- 원작에는 15초 제한시간 코드가 있지만 `GOTO`로 건너뛰어 실제로는 동작하지 않았기 때문에
  웹 버전에서도 제한시간은 두지 않고, 대신 시계 위에 초침을 돌립니다.

## 바이오리듬 (bio/)

원작 `BIO.BAS`(1993)를 옮겼습니다.
화면은 QB 텍스트 모드(80×25)를 흉내 낸 캔버스입니다.

- 메뉴에서 숫자 키를 누릅니다.
  1은 화면 출력, 2는 인쇄 용지, 3·4는 프로그램 목록으로 나갑니다.
- 화면 출력은 생년월일과 오늘 날짜로 살아온 날을 구합니다.
  건강 23일, 감성 28일, 지성 33일 주기의 사인 곡선을 `$`, `O`, `#` 문자로 그립니다.
  한 칸이 반나절이고 오늘 앞 5일부터 뒤 30일까지 보입니다.
- 인쇄 용지는 원작의 `LPRINT` 출력을 `TAB` 위치까지 그대로 만들어 화면 아래에 보여 줍니다.
  "인쇄" 버튼으로 실제 프린터에 찍을 수 있습니다.
- 원작은 두 자리 연도(1900년대)만 받아서 2000년 이후에는 살아온 날이 음수가 됩니다.
  웹 버전은 네 자리 연도(1900~2099)를 받고 실제 달력으로 날짜 차이를 계산합니다.
- 웹 버전에서 추가된 것은 그래프 아래의 오늘 수치(백분율) 한 줄입니다.
- `BIO.EXE`(1991)는 `BIO.BAS`보다 오래된 빌드입니다.
  제목에 박스가 있고 "무엇을 원하나요 ?" 문구가 있어서, 이 문구만 메뉴에 빌려 왔습니다.

## 계산 연습 (calc/)

암산 연습 프로그램 세 개를 한 페이지에 묶었습니다.
위의 버튼이나 메뉴 화면의 숫자 키로 고릅니다.

| 프로그램 | 원작 | 내용 |
|----------|------|------|
| CP | `CP.BAS` (1996) | "Calculation Practice Trainer". 항 개수, 자릿수, 문제 수, 문제당 시간을 입력받아 `+ 12 - 5 + 7` 같은 문제를 냅니다. 끝나면 맞힌 개수와 백분율을 보여 주고 다시 처음부터 반복합니다. |
| RANDOM | `RANDOM.BAS` (1994) | 0~99 두 수의 덧셈 또는 뺄셈 20문제 |
| MULTI | `MULTI.BAS` (1994) | 0~99 × 0~9 곱셈 20문제 |

- 원작의 출력 문구("no,correct answer is", "your correc answer is" 같은 오타까지)와 QB의 숫자 출력 공백을 그대로 따릅니다.
- CP는 문제당 시간을 입력받지만 원작 코드는 그 값을 쓰지 않습니다.
  웹 버전은 "CP 문제당 제한시간 적용" 옵션을 켜면 그 시간 안에 답하지 않은 문제를 틀린 것으로 처리합니다.
- CP의 "Press Any Key..."에서 `Esc`를 누르면 메뉴로 돌아갑니다(원작은 끝없이 반복).
- RANDOM과 MULTI는 20문제로 고정이라 정답 수(많은 순)와 걸린 시간(짧은 순)으로 상위 10개 기록을 남깁니다(`calc-game.ranking` 키).

## 그림판 (paint/)

원작 `D2.BAS`(1992)는 허큘리스 그래픽(SCREEN 3, 720×348 흑백)용 그림판입니다.
원작은 메뉴 이동까지만 만들어진 미완성이라 항목을 골라도 아무 일도 하지 않습니다.
웹 버전은 원작 메뉴의 배치와 동작(←/→ 메뉴, ↑/↓ 항목, 선택 항목 반전)을 그대로 두고 기능을 메뉴 이름에 맞춰 새로 만들었습니다.

| 메뉴 | 항목 | 웹 버전의 기능 |
|------|------|----------------|
| FILE | Load, Save, Kill, Rename | 브라우저(Local Storage)에 이름 붙여 저장한 그림을 불러오기, 저장, 지우기, 이름 바꾸기 |
| | Load(Dr) | 디스크 파일 불러오기. 원작 `.pic` 형식, BSAVE 화면 덤프, 일반 그림 파일(흑백 디더링) |
| | Exit | 프로그램 목록으로 |
| TOOLS | Pen | 자유 그리기. 원작 메뉴에 없는 항목입니다(추가). |
| | Glasses | 돋보기(8배, 한 점씩 편집) 켜고 끄기 |
| | Paint, Line, Box, Circle, write, Spray | 무늬 채우기, 선, 상자, 원(4:3 화면에서 둥글게 보이도록 보정), 글자, 스프레이 |
| EDIT | Erase, Inverse, Change↑, Change→ | 지우기, 반전, 상하 뒤집기, 좌우 뒤집기 |
| | Copy, Move | 영역을 골라 복사하거나 옮기기 |
| | P-Save, P-Load | 영역을 조각으로 저장하고 불러와 찍기 |
| OPTION | White | 그리는 색(흰색/검은색) 바꾸기 |
| | Part | 영역을 정해 두면 그리기와 편집이 그 안에만 적용됩니다. |
| | Pattern, Step | 채우기 무늬 8가지, 커서 이동 간격(1·2·4·8·16) 바꾸기 |

- 원작 메뉴 문자열에 붙은 `|` 표시(Erase, Inverse, Change, Spray)의 뜻은 소스에 없습니다.
  웹 버전은 Part 영역을 따르는 항목이라는 뜻으로 해석했습니다.
- 조작: `Esc` 메뉴, 화살표로 커서 이동(`Shift`는 한 점씩), `Space`/`Enter`로 찍기, `Ctrl`+`Z` 되돌리기.
  마우스나 손가락으로 끌어서 그려도 되고, 선·상자·원·영역은 두 번 눌러도 됩니다.
- 파일로 내려받기는 세 가지입니다.
  `.pic`은 원작 `READPIC.BAS`가 읽는 압축 형식(512바이트 블록, "AH" 머리)입니다.
  BSAVE는 원작 `SBSAVE`가 쓰는 허큘리스 화면 메모리 덤프(`B000:0000`부터 32KB)입니다.
  PNG는 흑백 그림입니다.
- 지금 그리는 그림은 `paint.current` 키에 자동으로 남아 다시 열면 이어서 그립니다.
  이름 붙여 저장한 그림은 `paint.files`, 조각은 `paint.part` 키에 있습니다.
- 화면 색은 녹색, 호박색, 흑백 모니터 중에서 고릅니다.

## 파일 구성

```
index.html                  프로그램 목록 (최고 기록도 표시)
style.css                   공통 스타일
flag/index.html, flag.js    청기백기
flag/assets/board.png       원작 DGI.GIF (청기백기 보드)
flag/assets/logo.png        원작 LOGO.GIF
flag/assets/flag_*.png      원작 *.SPR 스프라이트 (DGI.GIF 팔레트로 디코딩)
flag/assets/snd/b1~b12.wav  음성 명령 (원작 헤더 없는 8비트 PCM 11025Hz → 16비트 WAV)
flag/assets/snd/start.wav   경기 시작음 (START.WAV)
flag/assets/snd/opening.wav 로고 화면 음성 (DON2.WAV)
puzzle/index.html, puzzle.js      퍼즐 그림 맞추기
puzzle/assets/puzzle_screen.png   원작 M3.GIF (퍼즐 화면, 조각은 여기서 잘라 씀)
puzzle/assets/puzzle_blank.png    원작 BOARD.SPR (빈 칸, M3.GIF 팔레트로 디코딩)
textscreen.js               QB 텍스트 화면(80x25, PRINT/INPUT/INKEY$) 흉내. 바이오리듬과 계산 연습이 함께 씀
bio/index.html, bio.js      바이오리듬
calc/index.html, calc.js    계산 연습 (CP, RANDOM, MULTI)
paint/index.html, paint.js  그림판
*/assets/thumb.png          프로그램 목록의 카드 그림 (웹 버전 화면을 캡처)
flag/history.md             청기백기 소스 버전 비교
```

Local Storage 키: `flag-game.ranking`, `flag-game.options`, `puzzle-game.ranking`, `puzzle-game.options`,
`calc-game.ranking`, `calc-game.options`, `paint.files`, `paint.current`, `paint.part`, `paint.options`,
`flag-game.lastName`(마지막에 입력한 이름, 청기백기·퍼즐·계산 연습이 공유).

## 참고: 청기백기 음성 파일과 명령의 대응

원작 소스(`FF4.BAS`의 `SUB test`)에서 정답 키만 확인할 수 있고 실제 음성 내용은 소스에 없습니다.
`flag.js`의 `COMMANDS` 표에 있는 자막 문구는 코드의 정답 판정에서 추정한 것입니다.
실제 음성을 들어 보고 문구가 다르면 `COMMANDS`의 `text`만 고치면 됩니다.

| 번호 | 정답 | 추정 문구 |
|------|------|-----------|
| 1, 2 | A | 청기 올려 |
| 3 | 없음 | 청기 올리지 마 |
| 4, 5 | Z | 청기 내려 |
| 6 | 없음 | 청기 내리지 마 |
| 7, 8 | ' | 백기 올려 |
| 9 | 없음 | 백기 올리지 마 |
| 10, 11 | / | 백기 내려 |
| 12 | 없음 | 백기 내리지 마 |
