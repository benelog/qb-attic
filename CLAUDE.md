# 프로젝트 메모

정상혁이 1990년대에 QuickBasic으로 만든 DOS 프로그램과 2007년 QBasic 프로그램을 정적 웹페이지로 재구현한 프로젝트다.
브니엘고 컴퓨터 서클 돈데크만 시절 작품은 청기백기와 퍼즐 둘뿐이다.
나머지 페이지 제목이나 설명에 돈데크만을 붙이지 않는다.
프로그램별 사용법과 파일 구성은 README.md에 있다.
여기에는 코드만 봐서는 알 수 없는 배경만 적는다.

## 문서와 답변 작성 규칙

- 도움말, 설명, 답변은 한 문장마다 줄을 바꾼다.
- 한 줄에 두 문장 이상 이어 쓰지 않는다.

## 원작 소스 위치

- 원작은 형제 디렉터리 `../old-com/FLAG/`에 있다.
- 소스는 CP949 인코딩이라 `iconv -f CP949 -t UTF-8`로 읽는다.
- 청기백기 최종본은 `FF4.BAS`다.
  `FLAGV.BAS`와 `../old-com/LAN/QB/PCXLIB/FLV2.BAS`는 판정이 없는 이전 데모다.
  `NEWFF4.BAS`는 이전 버전이 아니라 1996년 퍼즐 작업 때 FF4를 고치다 만 곁가지다.
  버전 비교는 `flag/history.md`에 있다.
- 퍼즐은 `PUZZLE.BAS`다.
- `MKPU.BAS`는 BOARD.SPR을 만든 도구다.
  `VOICE.BAS`, `FLAG2.BAS`는 사운드블라스터 DMA 테스트다.
- 같은 폴더의 `DUMP*.PCX`, `NECH2.PCX`, `DISK`, `DON.WAV`, `DON3.WAV`, `BUP/WUP.WAV`는 게임에서 쓰지 않는 파일이다.
- 바이오리듬, 계산 연습, 그림판, 계산기의 원작은 `../old-com/LAN/QB/`에 있다.
  `BIO.BAS`, `CP.BAS`, `RANDOM.BAS`, `MULTI.BAS`, `D2.BAS`, `CALCU2.BAS`다.
  그림판 관련 루틴은 `READPIC.BAS`(.pic 로더), `BSAVE.BAS`, 격자 편집기 `GE.BAS`다.
- 3D 별 여행의 원작은 통신 프로그램 폴더 `../old-com/I/3D.BAS`(1995)다.
  같은 폴더의 `VOI`, `PVO`, `SDSS.BAS`는 사운드블라스터 DMA 테스트다.
- Code can be an art의 원작은 `old-com`에 없고 블로그 글 https://blog.benelog.net/1230429 (2007-06-01)에 소스가 있다.
  `cba/cba.js` 머리 주석과 README에 옮겨 적었다.
- `old-com`의 나머지 .BAS는 옮길 것이 없다.
  `CAL`(=`MAL`), `WAVE`, `NIBBLES`, `QCARDS`, `SORTDEMO`, `TORUS`, `REMLINE`, `DIR_SCAN`, `CALL_EX`는 Microsoft 샘플이다.
  `NTYPE`, `PCXVIEW`, `PCX16*`, `ENGFC`, `LIB*/`는 남의 코드나 라이브러리 예제다.
  `ASDF`, `S12ASC`, `TS`, `DE`, `KINPUT`은 몇 줄짜리 데모나 유틸리티다.
  `BE`, `MAIN`, `QU`, `TS4`, `TSS*`, `MOUSETE`, `DDD`, `MAKEDATA`는 2KB 이하 바이너리 저장본이고 문자열로 보아 타이틀 화면이나 테스트다.
  `CSS3`, `BS`, `SCROLL`, `NDV`, `CS.EXE`는 소스가 없다.
- `LAN/QB/`는 파일마다 한글 인코딩이 다르다.
  `BIO.BAS`는 조합형이라 `iconv -c -f JOHAB -t UTF-8`로 읽는다.
  `BIO.BAS`의 `D4 C9`, `D4 CD` 같은 2바이트 문자는 뒤 바이트가 CP437 선 문자 코드(╔, ═)인 한글 카드용 박스 문자이고 두 칸을 차지한다.
- `BIO.EXE`(1991)는 `BIO.BAS`(1993)보다 오래된 빌드다.
- 첫 바이트가 `0xFC`인 .BAS는 QB 4.5 바이너리 저장본이다(`CP`, `RANDOM`, `MULTI`, `D2`, `READPIC`, `BSAVE`, `FLAG/DAT.BAS` 등).
  아래 "바이너리 .BAS 읽기" 방법으로 텍스트로 바꿔 읽었다.
  변환한 텍스트 소스는 저장소에 두지 않았고 세션 임시 폴더에만 있었다.
  다시 필요하면 같은 방법으로 변환한다.

## 에셋 변환 방법 (assets/ 를 다시 만들 때)

- 에셋은 프로그램별로 `flag/assets/`, `puzzle/assets/`에 나뉘어 있다.
  바이오리듬, 계산 연습, 그림판은 `bio/`, `calc/`, `paint/`에 있다.
  루트에는 공통 `style.css`와 `textscreen.js`(QB 텍스트 화면 흉내, 바이오리듬과 계산 연습이 씀)만 둔다.
- 새 세 페이지의 `assets/thumb.png`는 원작 그림이 아니라 웹 버전 화면을 헤드리스 Chrome으로 캡처한 카드용 그림이다.
  그림판 썸네일은 청기백기 `board.png`를 Load(Dr)로 불러와 디더링한 화면이다.
- `*.SPR`은 SVGAQB의 BLKGET/BSAVE 형식이다.
  7바이트 BSAVE 헤더 뒤에 `(폭-1)`, `(높이-1)`가 각각 16비트 LE로 온다.
  이어서 8bpp 픽셀이 행 단위로 온다.
- SPR에는 팔레트가 없다.
  그 스프라이트가 표시되던 화면 GIF의 팔레트를 써야 한다.
  깃발 스프라이트(BU/BD/WU/WD)는 `DGI.GIF` 팔레트를 쓴다.
  빈 칸(BOARD.SPR)은 `M3.GIF` 팔레트를 쓴다.
- `B1~B12.WAV`는 이름과 달리 헤더 없는 8비트 unsigned PCM 모노 11025Hz 원시 데이터다.
  `ffmpeg -f u8 -ar 11025 -ac 1 -i B1.WAV -acodec pcm_s16le b1.wav`로 변환했다.
- `START.WAV`, `DON2.WAV`는 정상 RIFF WAV다.
- GIF는 PIL로 팔레트(P) 모드 그대로 PNG 저장하면 크기가 가장 작다.
- `LOGO.GIF`는 흰 바탕이 맞다.
- 퍼즐 조각은 별도 이미지가 아니다.
  `puzzle_screen.png`에서 런타임에 `drawImage`로 잘라 쓴다.

## 바이너리 .BAS 읽기 (DOSBox-X)

- 이 머신에는 DOSBox가 설치되어 있지 않고 sudo에는 비밀번호가 필요하다.
- root 없이 `apt-get download dosbox-x dosbox-x-data libsdl2-net-2.0-0 libopusfile0 libminizip1t64 libphysfs1` 후 `dpkg -x`로 풀었다.
  `LD_LIBRARY_PATH=<풀린 곳>/usr/lib/x86_64-linux-gnu`로 실행한다.
- `Xvfb :97`을 띄우고 `DISPLAY=:97`로 실행하고 `import -window root`로 화면을 찍었다.
- `[autoexec]`에서 `AUTOTYPE -w 4 -p 0.25 lalt f a c p period t x t tab tab down enter`를 먼저 걸고 `QB CP.BAS`를 실행하면 "Save As → Text" 형식으로 `CP.TXT`가 저장된다.
  키 이름은 `AUTOTYPE -list`로 본다(`alt`가 아니라 `lalt`).
  QB 종료 키는 잘 먹지 않아서 파일마다 DOSBox를 띄우고 15초 뒤 끝냈다.
- 원본 폴더를 건드리지 않도록 `LAN/QB`를 임시 폴더에 복사해서 마운트했다.
- SCREEN 3(허큘리스) 프로그램은 `machine=hercules`로 띄우고 `MSHERC.COM`을 먼저 실행해야 한다.
  그렇지 않으면 "Illegal function call"이 난다.

## 확인하지 못한 것

- 청기백기 음성 12개의 실제 문구는 듣지 못했다.
  `flag.js`의 `COMMANDS` 자막은 원작 코드의 정답 판정에서 추정한 것이다.
  1·2번 "청기 올려", 3번 "청기 올리지 마" 식으로 두 개는 같은 명령, 세 번째는 "~하지 마"로 가정했다.
- 원작의 반응 제한시간은 CPU 속도 보정 루프(`delay/10`)라서 정확한 값을 알 수 없다.
  웹 버전의 1.3초 시작값은 임의로 정한 것이다.
- `D2.BAS`는 메뉴 이동만 있는 미완성이다.
  메뉴 항목의 실제 의도는 알 수 없어서 이름에 맞춰 기능을 새로 만들었다.
  항목 끝의 `|` 표시는 Part 영역을 따르는 기능으로 해석했고, Pen 항목은 웹에서 추가했다.
- 원작에서 `.pic` 그림 파일은 `old-com` 어디에서도 찾지 못했다.
  웹 버전의 `.pic` 인코더는 `READPIC.BAS` 디코더를 거꾸로 만든 것이고 원작 파일로 검증하지 못했다.
- `CALCU2.BAS`는 `CALCU2.OBJ`로 링크되던 모듈이라 단독 실행 화면색이 없다.
  `makebox`가 `COLOR 0, 1`로 끝나지만 Esc 처리에서 `COLOR 15, 1`로 되돌리므로 웹은 흰 글자, 파란 바탕 전체 화면으로 정했다.
  `strnum$`는 모듈 밖 변수라 웹에서는 항상 빈 값으로 본다.
- Code can be an art의 `PLAY`는 QB 문서대로 옥타브 3을 가운데 C(261.63Hz)로 보았다.
  실제 QBasic 소리를 녹음해 비교하지는 못했다.
  SCREEN 2의 글꼴은 IBM PC BIOS 8×8(CP437)로 가정했다.

## 테스트 방법

- Claude in Chrome 확장 없이도 테스트할 수 있다.
  `google-chrome --headless=new --remote-debugging-port=...`를 띄운다.
  Node 내장 `WebSocket`으로 CDP를 직접 호출해 키 입력, 스크린샷, 상태 확인을 한다.
  외부 패키지는 필요 없다.
- URL 뒤에 `#debug`를 붙이면 `window.__flag`, `__puzzle`, `__bio`, `__calc`, `__paint`, `__calcu`, `__stars`, `__cba`로 내부 상태가 노출된다.
  테스트 스크립트는 이 훅으로 정답을 읽어 자동 진행했다.
  계산 연습은 `__calc.scr.cells`에서 현재 줄의 문제를 읽었다.
- 같은 URL에 해시만 바꿔 `Page.navigate`하면 다시 로드되지 않는다.
  먼저 `about:blank`로 이동한 뒤 연다.
- 그림판의 Load(Dr)는 CDP `DOM.setFileInputFiles`로 `#file-input`에 파일을 넣어 시험했다.
- 로컬 서버는 `python3 -m http.server`로 충분하다.
- 헤드리스 Chrome을 띄우기 전에 같은 디버그 포트를 쓰는 예전 Chrome이 남아 있는지 `pgrep -af remote-debugging-port`로 확인한다.
  2026-09-12에 예전 세션의 Chrome(9333)이 남아 있어서 새 페이지 대신 그쪽 빈 탭에 붙었다.
- CDP `Runtime.evaluate`에 `awaitPromise`를 켠 채 `__cba.run()` 같은 긴 Promise를 식의 마지막에 두면 끝날 때까지 기다린다.
  중간 상태를 보려면 `void __cba.run()`처럼 쓴다.
- 테스트 스크립트(harness, 세 페이지 시험, 썸네일 캡처)는 세션 임시 폴더에만 있었다.
- `<audio>`, `<img>` 요소를 쓰므로 `file://`로 열어도 동작한다.

## 결정 사항

- 저장소는 `git@github.com:benelog/qb-attic.git`이다.
  2026-09-11에 `games-1995`로 만들었다가 2026-09-12에 `qb-attic`으로 이름을 바꿨다.
  게임만 있는 모음이 아니라서 사이트 이름은 "Quick Basic 프로그램 보관소"로 하고, 문구에서 '게임' 대신 '프로그램'을 쓴다.
  코드는 모두 상대 경로라 디렉터리 이름에 영향을 받지 않는다.
- 커밋할 때는 사용자 전역 규칙(간단한 메시지, SSH, main 브랜치)을 따른다.
- 배포는 GitHub Pages(main 브랜치 루트)로 한다.
  주소는 `https://qb-attic.benelog.net/`이고 루트의 `CNAME` 파일이 이 도메인을 지정한다.
  DNS는 Netlify DNS(benelog 팀)에서 `qb-attic` CNAME → `benelog.github.io`로 연결한다.
  예전 `games-1995` 레코드는 지웠다.
- 순위 이름 입력은 `flag-game.lastName` 키를 청기백기, 퍼즐, 계산 연습이 공유한다.
- 바이오리듬은 원작의 두 자리 연도 대신 네 자리 연도(1900~2099)를 받는다.
  원작은 2000년 이후 살아온 날이 음수가 되는 Y2K 문제가 있다.
- 시계(`CLOCK.BAS`)는 한때 넣었다가 2026-09-12에 뺐다.
