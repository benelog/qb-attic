# 프로젝트 메모

1995년 QuickBasic DOS 게임(브니엘고 컴퓨터 서클 돈데크만, 정상혁)을 정적 웹페이지로 재구현한 프로젝트다.
게임 규칙과 파일 구성은 README.md에 있다.
여기에는 코드만 봐서는 알 수 없는 배경만 적는다.

## 문서와 답변 작성 규칙

- 도움말, 설명, 답변은 한 문장마다 줄을 바꾼다.
- 한 줄에 두 문장 이상 이어 쓰지 않는다.

## 원작 소스 위치

- 원작은 형제 디렉터리 `../old-com/FLAG/`에 있다.
- 소스는 CP949 인코딩이라 `iconv -f CP949 -t UTF-8`로 읽는다.
- 청기백기 최종본은 `FF4.BAS`다.
  `NEWFF4.BAS`, `FLAGV.BAS`는 이전 버전이다.
- 퍼즐은 `PUZZLE.BAS`다.
- `MKPU.BAS`는 BOARD.SPR을 만든 도구다.
  `VOICE.BAS`, `FLAG2.BAS`는 사운드블라스터 DMA 테스트다.
- 같은 폴더의 `DUMP*.PCX`, `NECH2.PCX`, `DISK`, `DON.WAV`, `DON3.WAV`, `BUP/WUP.WAV`는 게임에서 쓰지 않는 파일이다.

## 에셋 변환 방법 (assets/ 를 다시 만들 때)

- 에셋은 게임별로 `flag/assets/`, `puzzle/assets/`에 나뉘어 있다.
  공통 `style.css`만 루트에 두고 두 게임이 `../style.css`로 쓴다.

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

## 확인하지 못한 것

- 청기백기 음성 12개의 실제 문구는 듣지 못했다.
  `flag.js`의 `COMMANDS` 자막은 원작 코드의 정답 판정에서 추정한 것이다.
  1·2번 "청기 올려", 3번 "청기 올리지 마" 식으로 두 개는 같은 명령, 세 번째는 "~하지 마"로 가정했다.
- 원작의 반응 제한시간은 CPU 속도 보정 루프(`delay/10`)라서 정확한 값을 알 수 없다.
  웹 버전의 1.3초 시작값은 임의로 정한 것이다.

## 테스트 방법

- Claude in Chrome 확장 없이도 테스트할 수 있다.
  `google-chrome --headless=new --remote-debugging-port=...`를 띄운다.
  Node 내장 `WebSocket`으로 CDP를 직접 호출해 키 입력, 스크린샷, 상태 확인을 한다.
  외부 패키지는 필요 없다.
- 두 게임 모두 URL 뒤에 `#debug`를 붙이면 `window.__flag`, `window.__puzzle`로 내부 상태가 노출된다.
  테스트 스크립트는 이 훅으로 정답을 읽어 자동 진행했다.
- 로컬 서버는 `python3 -m http.server`로 충분하다.
- `<audio>`, `<img>` 요소를 쓰므로 `file://`로 열어도 동작한다.

## 결정 사항

- 저장소는 `git@github.com:benelog/games-1995.git`이다(2026-09-11 생성).
  예전에 정했던 `dondekman-games` 이름 대신 `games-1995`를 쓴다.
  코드는 모두 상대 경로라 디렉터리 이름에 영향을 받지 않는다.
- 커밋할 때는 사용자 전역 규칙(간단한 메시지, SSH, main 브랜치)을 따른다.
- 배포는 GitHub Pages(main 브랜치 루트)로 한다.
  주소는 `https://games-1995.benelog.net/`이고 루트의 `CNAME` 파일이 이 도메인을 지정한다.
  DNS는 Netlify DNS(benelog 팀)에서 `games-1995` CNAME → `benelog.github.io`로 연결한다.
- 순위 이름 입력은 `flag-game.lastName` 키를 두 게임이 공유한다.
