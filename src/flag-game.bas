DEFINT A-Z
DECLARE SUB comvoc (s%)
DECLARE FUNCTION RDMACNT& (n%)
DECLARE SUB voplay ()
DECLARE SUB opening ()
DECLARE SUB start ()
DECLARE SUB RUNDMA (APTR#, LENG&, CHANN%, DIR%)
DECLARE SUB initvoice ()
DECLARE SUB SBLCMD (n%)
DECLARE FUNCTION SBLSNDCMD% (n%)
DECLARE SUB SAYVOC (f$)
DECLARE SUB test ()
DECLARE SUB bnorput ()
DECLARE SUB buput ()
DECLARE SUB wuput ()
DECLARE SUB wdput ()
DECLARE SUB wnorput ()
DECLARE SUB bdput ()
DECLARE SUB putbnor ()
DECLARE SUB gifload (GIFFILENAME$)
REM $INCLUDE: 'svgaqb10.bi'
DIM SHARED BUF(100) AS STRING * 400
DIM SHARED VOCDSIZE, VOCDPOIN, VOCDATPHY(2), VOCDATPHYL(2), DMACHNPGE(4)
RANDOMIZE TIMER
  DMACHNPGE(0) = &H87
  DMACHNPGE(1) = &H83
  DMACHNPGE(2) = &H81
  DMACHNPGE(3) = &H82
DIM SHARED GIFPAL AS STRING * 768
  VMODE = VIDEOMODEGET
  RES640
  DIM SHARED bd(5586) AS INTEGER, wd(5586) AS INTEGER
  DIM SHARED bu(6741)  AS INTEGER, wu(6741) AS INTEGER
  DIM SHARED bnor(8127) AS INTEGER, wnor(8127) AS INTEGER
  DIM SHARED delay AS LONG, lf AS LONG
  DIM SHARED sg AS LONG, of AS LONG, h AS LONG, l AS LONG
  DIM SHARED rd(13) AS LONG

  start
  VMODE = VIDEOMODEGET
  RES640
  initvoice
  opening

  DEF SEG = VARSEG(bd(0))
  BLOAD "bd.spr", VARPTR(bd(0))
  DEF SEG

  DEF SEG = VARSEG(wd(0))
  BLOAD "wd.spr", VARPTR(wd(0))
  DEF SEG

  DEF SEG = VARSEG(bu(0))
  BLOAD "bu.spr", VARPTR(bu(0))
  DEF SEG

  DEF SEG = VARSEG(wu(0))
  BLOAD "wu.spr", VARPTR(wu(0))
  DEF SEG

  gifload "C:\FLAG\dgi.GIF "
  BLKGET 416, 43, 492, 253, bnor(0)
  BLKGET 545, 43, 621, 253, wnor(0)

 OPEN "c:\flag\b1.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(1) = LOF(1)
 IF rd(1) > 40000 THEN rd(1) = 40000
 kk% = INT(rd(1) / 400)
 DIM SHARED voc1(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(1) / 400)
  GET #1: voc1(i) = R$
  GET #1: MID$(voc1(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b2.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(2) = LOF(1)
 IF rd(2) > 40000 THEN rd(2) = 40000
 kk% = INT(rd(2) / 400)
 DIM SHARED voc2(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(2) / 400)
  GET #1: voc2(i) = R$
  GET #1: MID$(voc2(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b3.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(3) = LOF(1)
 IF rd(3) > 40000 THEN rd(3) = 40000
 kk% = INT(rd(3) / 400)
 DIM SHARED voc3(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(3) / 400)
  GET #1: voc3(i) = R$
  GET #1: MID$(voc3(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b4.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(4) = LOF(1)
 IF rd(4) > 40000 THEN rd(4) = 40000
 kk% = INT(rd(4) / 400)
 DIM SHARED voc4(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(4) / 400)
  GET #1: voc4(i) = R$
  GET #1: MID$(voc4(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b5.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(5) = LOF(1)
 IF rd(5) > 40000 THEN rd(5) = 40000
 kk% = INT(rd(5) / 400)
 DIM SHARED voc5(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(5) / 400)
  GET #1: voc5(i) = R$
  GET #1: MID$(voc5(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b6.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(6) = LOF(1)
 IF rd(6) > 40000 THEN rd(6) = 40000
 kk% = INT(rd(6) / 400)
 DIM SHARED voc6(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(6) / 400)
  GET #1: voc6(i) = R$
  GET #1: MID$(voc6(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b7.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(7) = LOF(1)
 IF rd(7) > 40000 THEN rd(7) = 40000
 kk% = INT(rd(7) / 400)
 DIM SHARED voc7(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(7) / 400)
  GET #1: voc7(i) = R$
  GET #1: MID$(voc7(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b8.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(8) = LOF(1)
 IF rd(8) > 40000 THEN rd(8) = 40000
 kk% = INT(rd(8) / 400)
 DIM SHARED voc8(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(8) / 400)
  GET #1: voc8(i) = R$
  GET #1: MID$(voc8(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b9.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(9) = LOF(1)
 IF rd(9) > 40000 THEN rd(9) = 40000
 kk% = INT(rd(9) / 400)
 DIM SHARED voc9(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(9) / 400)
  GET #1: voc9(i) = R$
  GET #1: MID$(voc9(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b10.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(10) = LOF(1)
 IF rd(10) > 40000 THEN rd(10) = 40000
 kk% = INT(rd(10) / 400)
 DIM SHARED voc10(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(10) / 400)
  GET #1: voc10(i) = R$
  GET #1: MID$(voc10(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b11.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(11) = LOF(1)
 IF rd(11) > 40000 THEN rd(11) = 40000
 kk% = INT(rd(11) / 400)
 DIM SHARED voc11(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(11) / 400)
  GET #1: voc11(i) = R$
  GET #1: MID$(voc11(i), 201, 200) = R$
 NEXT i
 CLOSE

 OPEN "c:\flag\b12.wav" FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 rd(12) = LOF(1)
 IF rd(12) > 40000 THEN rd(12) = 40000
 kk% = INT(rd(12) / 400)
 DIM SHARED voc12(kk%) AS STRING * 400
 FOR i = 0 TO INT(rd(12) / 400)
  GET #1: voc12(i) = R$
  GET #1: MID$(voc12(i), 201, 200) = R$
 NEXT i
 CLOSE
  test





WHILE INKEY$ = ""
 WEND
 VIDEOMODESET VMODE
 PRINT "It's demo version of flag game programmed by Jung-Sang-Hyuk"

SUB bdput
BLKPUT 1, 416, 109, bd(0)
END SUB

  SUB bnorput
  BLKPUT 1, 416, 43, bnor(0)
END SUB

 SUB buput
 BLKPUT 1, 416, 43, bu(0)
END SUB

SUB comvoc (s%)
lf = rd(s)
IF s = 1 THEN
 of = VARPTR(voc1(0)) + 64
 sg = VARSEG(voc1(0))
END IF

IF s = 2 THEN
 of = VARPTR(voc2(0)) + 64
 sg = VARSEG(voc2(0))
END IF

IF s = 3 THEN
 of = VARPTR(voc3(0)) + 64
 sg = VARSEG(voc3(0))
END IF

IF s = 4 THEN
 of = VARPTR(voc4(0)) + 64
 sg = VARSEG(voc4(0))
END IF

IF s = 5 THEN
 of = VARPTR(voc5(0)) + 64
 sg = VARSEG(voc5(0))
END IF

IF s = 6 THEN
 of = VARPTR(voc6(0)) + 64
 sg = VARSEG(voc6(0))
END IF

IF s = 7 THEN
 of = VARPTR(voc7(0)) + 64
 sg = VARSEG(voc7(0))
END IF

IF s = 8 THEN
 of = VARPTR(voc8(0)) + 64
 sg = VARSEG(voc8(0))
END IF

IF s = 9 THEN
 of = VARPTR(voc9(0)) + 64
 sg = VARSEG(voc9(0))
END IF

IF s = 10 THEN
 of = VARPTR(voc10(0)) + 64
 sg = VARSEG(voc10(0))
END IF

IF s = 11 THEN
 of = VARPTR(voc11(0)) + 64
 sg = VARSEG(voc11(0))
END IF

IF s = 12 THEN
 of = VARPTR(voc12(0)) + 64
 sg = VARSEG(voc12(0))
END IF

END SUB

DEFSNG A-Z
SUB gifload (GIFFILENAME$)

            DEFINT A-Z
            OK = GIFGETINFO(GIFFILENAME$, XSIZE, YSIZE, NUMCOL, GIFPAL)
            IF OK = 1 THEN
                FIXIT = 0
                FOR a = 1 TO NUMCOL * 3 STEP 3
                    R = ASC(MID$(GIFPAL, a, 1))
                    G = ASC(MID$(GIFPAL, a + 1, 1))
                    B = ASC(MID$(GIFPAL, a + 2, 1))
                    IF R > 63 THEN
                        FIXIT = 1
                        EXIT FOR
                    END IF
                    IF G > 63 THEN
                        FIXIT = 1
                        EXIT FOR
                    END IF
                    IF B > 63 THEN
                        FIXIT = 1
                        EXIT FOR
                    END IF
                NEXT a
                IF FIXIT = 1 THEN
                    FOR a = 1 TO NUMCOL * 3
                        C = ASC(MID$(GIFPAL, a, 1))
                        MID$(GIFPAL, a, 1) = CHR$(C \ 4)
                    NEXT a
                END IF
                PALSET GIFPAL, 0, 255
                OK = GIFPUT(1, 0, 0, GIFFILENAME$)
                IF OK <> 1 THEN
                    SOUND 100, 5
                END IF
            END IF

END SUB

SUB initvoice
 OUT &H220 + 6, 1
 FOR i = 0 TO 100: NEXT i
 OUT &H220 + 6, 0
 FOR i = 0 TO 511
  IF (INP(&H22E) AND &H80) <> 0 THEN
   FOR j = 0 TO 511
    IF INP(&H22A) = &HAA THEN GOTO OK
   NEXT j
  END IF
 NEXT i
 EXIT SUB
OK:
 OUT &H21, 0
 SBLCMD &HD1
 SBLCMD &H40
 a = 256 - (1000000 / 2900)
 IF a < 0 THEN a = a + 256
 a = INT(a)
 SBLCMD a
END SUB

  SUB opening
  gifload "c:\flag\logo.gif"
  WHILE INKEY$ = ""
  WEND
  END SUB

FUNCTION RDMACNT& (n)
 OUT &HB, 0
 DMAP = n * 2 + 1
 l = INP(DMAP)
 h = INP(DMAP)
 RDMACNT& = l OR (h * 256)
END FUNCTION

SUB RUNDMA (APTR#, LENG&, CHANN, DIR)
 DIM ava AS LONG
 PAGE = INT(APTR# / 65536)
 LA = APTR# AND 255
 HA = INT(APTR# / 256) AND 255
 ava = 65536 - (APTR# AND 65535)
 IF ava < LENG& THEN BEEP: EXIT SUB
 IF DIR THEN CMD = &H48 ELSE CMD = &H44
 CMD = CMD + CHANN
 DMAP = CHANN * 2
 OUT DMACHNPGE(CHANN), PAGE
 OUT &HC, 0
 OUT DMAP, LA
 OUT DMAP, HA
 DMAP = DMAP + 1
 OUT DMAP, (LENG& AND 255)
 OUT DMAP, INT(LENG& / 255)
 OUT &HB, CMD
 OUT &HA, CHANN
END SUB

SUB SAYVOC (f$)
OPEN f$ FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 lf = LOF(1)
 IF lf > 40000 THEN lf = 40000
 FOR i = 0 TO INT(lf / 400)
  GET #1: BUF(i) = R$
  GET #1: MID$(BUF(i), 201, 200) = R$
 NEXT i
 CLOSE
 of = VARPTR(BUF(0)) + 64
 sg = VARSEG(BUF(0))
 voplay
END SUB

SUB SBLCMD (n)
 IF SBLSNDCMD(n) THEN
  OUT &HA, 1
  NUL = INP(&H22E)
 END IF
END SUB

FUNCTION SBLSNDCMD (n)
 WHILE INP(&H22C) >= &H80
 Q = Q + 1: IF Q > 10000 THEN SBLSNDCMD = -1: EXIT FUNCTION
 WEND
 OUT &H22C, n
END FUNCTION

SUB start
  IF WHICHVGA = 0 THEN
  PRINT "Unknown graphic Card..."
  PRINT "Sorry!!!"
  STOP
  END IF

  IF WHICHMEM < 512 THEN
  PRINT "Not enough Video Memory."
  STOP
  END IF

  IF WHICHCPU = 286 OR WHICHCPU = 86 THEN
  PRINT "This Computer requires 30386 CPU at leat"
  STOP
  END IF

  PRINT "Your CPU is"; WHICHCPU
  PRINT "SPEED CHECKING.....Please Wait..."
  betime$ = TIME$
  WHILE betime$ = TIME$
  WEND
  betime$ = TIME$
  WHILE betime$ = TIME$
  delay = delay + 1
  WEND
  PRINT delay
  PRINT "OK.... Press Any key..........."
  WHILE INKEY$ = ""
  WEND

END SUB

 SUB test
DIM cup(1 TO 5)
SAYVOC "c:\flag\start.wav"
sdelay 50
waitime& = delay / 10
FOR i = 1 TO 5
cup(i) = INT(waitime& / 5 * i)
NEXT

  FOR j = 1 TO 5
  drwbox 4, 37, 90 + j * 44, 94, 134 + j * 44, 100
  NEXT j

sd:
s = INT(RND * 12) + 1
comvoc s
voplay
 WHILE RDMACNT(1) <> 65535
 WEND
i = 0

WHILE i < waitime& AND a$ = ""
 a$ = INKEY$
 i = i + 1
  FOR j = 1 TO 5
  IF i = cup(j) THEN

  END IF
  NEXT j


  IF a$ = "a" OR a$ = "A" THEN
  buput
  END IF

  IF a$ = "z" OR a$ = "Z" THEN
  bdput
  END IF

  IF a$ = "'" THEN
  wuput
  END IF

  IF a$ = "/" THEN
  wdput
 END IF

 IF a$ = "e" THEN EXIT SUB


 WEND

 IF a$ <> "" THEN FOR i = 1 TO delay / 4: NEXT

 IF s = 1 OR s = 2 THEN
  IF a$ = "a" OR a$ = "A" THEN
  wa% = wa% - 1
  PLAY "ge"
  END IF
 END IF

 IF s = 4 OR s = 5 THEN
  IF a$ = "z" OR a$ = "Z" THEN
  wa% = wa% - 1
  PLAY "ge"
  END IF
 END IF

 IF s = 7 OR s = 8 THEN
  IF a$ = "'" THEN
  wa% = wa% - 1
  PLAY "ge"
  END IF
 END IF

 IF s = 10 OR s = 11 THEN
  IF a$ = "/" THEN
  wa% = wa% - 1
  PLAY "ge"
  END IF
 END IF

 IF s = 3 OR s = 6 OR s = 9 OR s = 12 THEN
  IF a$ = "" THEN
  wa% = wa% - 1
  PLAY "ge"
  END IF
  END IF

 wa% = wa% + 1

 IF a$ = "A" OR a$ = "a" OR a$ = "z" OR a$ = "Z" THEN
 sdelay 20
 bnorput
 END IF

 IF a$ = "'" OR a$ = "/" THEN
 sdelay 20
 wnorput
 END IF

 a$ = ""
 IF wa% = 4 THEN GOTO gameover:



 GOTO sd:

gameover:
 PLAY "ceg>c"




END SUB

SUB voplay
 IF sg < 0 THEN sg = sg + 65536
 IF of < 0 THEN of = of + 65536
 PHY# = sg * 16 + of
 OUT &HA, 5
 RUNDMA PHY#, lf, 1, 1
 SBLCMD &H14
 SBLCMD (lf AND 255)
 SBLCMD INT(lf / 255)
END SUB

SUB wdput
 BLKPUT 1, 545, 109, wd(0)
 END SUB

SUB wnorput
BLKPUT 1, 545, 43, wnor(0)
END SUB

SUB wuput
 BLKPUT 1, 545, 43, wu(0)
END SUB
