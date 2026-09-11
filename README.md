# 돈데크만 게임 모음 (FLAG)

1995년 브니엘고 컴퓨터 서클 "돈데크만"의 정상혁이 QuickBasic 4.5 + SVGAQB 라이브러리로 만든
DOS 게임 두 개를 정적 웹페이지로 다시 구현한 것입니다. `index.html`에서 게임을 고릅니다.

| 페이지 | 게임 | 원작 |
|--------|------|------|
| `flag/index.html` | 청기백기 | `FF4.BAS` |
| `puzzle/index.html` | 퍼즐 그림 맞추기 (3×3 슬라이딩 퍼즐) | `PUZZLE.BAS` |

원작의 그림(`DGI.GIF`, `LOGO.GIF`, `M3.GIF`), 스프라이트(`*.SPR`),
음성 명령(`B1~B12.WAV`, `START.WAV`, `DON2.WAV`)을 그대로 변환해서 사용합니다.

## 실행

배포 주소: https://games-1995.benelog.net/ (GitHub Pages)

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

## 파일 구성

```
index.html                  게임 선택 (최고 기록도 표시)
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
```

Local Storage 키: `flag-game.ranking`, `flag-game.options`, `puzzle-game.ranking`, `puzzle-game.options`,
`flag-game.lastName`(마지막에 입력한 이름, 두 게임이 공유).

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
