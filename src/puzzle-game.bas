DECLARE SUB putgr (x%, y%, z%)
DECLARE SUB start ()
DEFINT A-Z
DECLARE SUB opening ()
DECLARE SUB gifload (GIFFILENAME$)
REM $INCLUDE: 'svgaqb10.bi'
DIM SHARED GIFPAL AS STRING * 768
DIM up$, dn$, lt$, rt$
up$ = CHR$(0) + CHR$(72)
dn$ = CHR$(0) + CHR$(80)
lt$ = CHR$(0) + CHR$(75)
rt$ = CHR$(0) + CHR$(77)
DIM SHARED gr0(5477)  AS INTEGER
DIM SHARED gr1(5477)  AS INTEGER
DIM SHARED gr2(5477)  AS INTEGER
DIM SHARED gr3(5477)  AS INTEGER
DIM SHARED gr4(5477)  AS INTEGER
DIM SHARED gr5(5477)  AS INTEGER
DIM SHARED gr6(5477)  AS INTEGER
DIM SHARED gr7(5477)  AS INTEGER
DIM SHARED gr8(5477) AS INTEGER
DIM graph(1 TO 3, 1 TO 3) AS INTEGER
VMODE = VIDEOMODEGET
  RES640
  DIM SHARED delay AS LONG
  SCREEN 0, 0, 0

  start
  VMODE = VIDEOMODEGET
  RES640

DIM x, y, nx, ny AS INTEGER
x = 3: y = 3: nx = 3: ny = 3
DIM checkcode, gum AS INTEGER
DEF SEG = VARSEG(gr0(0))
BLOAD "board.spr", VARPTR(gr0(0))
DEF SEG


a:
limi = 15


gifload "logo.gif"
  WHILE INKEY$ = ""
  WEND
gifload "m3.GIF "
blkget 199, 19, 287, 141, gr1(0)
blkget 289, 19, 377, 141, gr2(0)
blkget 379, 19, 467, 141, gr3(0)
blkget 199, 143, 287, 265, gr4(0)
blkget 289, 143, 377, 265, gr5(0)
blkget 379, 143, 467, 265, gr6(0)
blkget 199, 267, 287, 389, gr7(0)
blkget 289, 267, 377, 389, gr8(0)

WHILE INKEY$ = ""
WEND



FOR i = 1 TO 3
FOR j = 1 TO 3
drwbox 1, 1, 108 + 90 * j, 124 * i - 106, 198 + 90 * j, 18 + 124 * i
NEXT j, i
graph(1, 1) = 8
graph(2, 1) = 3
graph(3, 1) = 5
graph(1, 2) = 2
graph(2, 2) = 1
graph(3, 2) = 6
graph(1, 3) = 4
graph(2, 3) = 7
graph(3, 3) = 0

FOR i = 1 TO 3
FOR j = 1 TO 3
putgr j, i, graph(j, i)
NEXT j, i


timecheck$ = TIME$

WHILE checkcode = 0
a$ = INKEY$
IF a$ = "q" OR a$ = "Q" THEN
a$ = ""
checkcode = 1
END IF
IF a$ = up$ OR a$ = dn$ OR a$ = lt$ OR a$ = rt$ THEN
  IF a$ = up$ AND y <> 3 THEN ny = y + 1
  IF a$ = dn$ AND y <> 1 THEN ny = y - 1
  IF a$ = rt$ AND x <> 1 THEN nx = x - 1
  IF a$ = lt$ AND x <> 3 THEN nx = x + 1
  putgr nx, ny, 0
  putgr x, y, graph(nx, ny)
  graph(x, y) = graph(nx, ny)
  graph(nx, ny) = 0
  x = nx
  y = ny

END IF

a$ = ""

FOR i = 1 TO 3
FOR j = 1 TO 3
gum = gum + 1
IF graph(j, i) = gum THEN sum = sum + 1
NEXT j, i

IF sum = 8 THEN checkcode = 3
gum = 0: sum = 0

GOTO c:
IF timecheck$ <> TIME$ THEN
 limi = limi - 1
 IF limi = 0 THEN checkcode = 1
 ttt$ = STR$(limi)
 IF LEN(ttt$) = 1 THEN ttt$ = "0" + ttt$
 drwstring 1, 1, 255, ttt$, 28, 370
 timecheck$ = TIME$
 END IF
c:

WEND

IF checkcode = 3 THEN
gifload "m3.gif"
WHILE INKEY$ = ""
WEND
END IF

IF checkcode = 1 THEN
a$ = ""
drwstring 1, 1, 255, "You are Failed... Time Over...", 320, 200
drwstring 1, 1, 255, "Press AnyKey.......", 320, 220
WHILE INKEY$ = ""
WEND
END IF





checkcode = 0



GOTO a:


 VIDEOMODESET VMODE

DEFSNG A-Z
SUB gifload (GIFFILENAME$)
            DEFINT A-Z
            FOR i = 1 TO 768
            MID$(GIFPAL, i, 1) = CHR$(63)
            NEXT i
            PALSET GIFPAL, 0, 255
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
                        c = ASC(MID$(GIFPAL, a, 1))
                        MID$(GIFPAL, a, 1) = CHR$(c \ 4)
                    NEXT a
                END IF
                OK = GIFPUT(1, 0, 0, GIFFILENAME$)
                PALSET GIFPAL, 0, 255
                IF OK <> 1 THEN
                    SOUND 100, 5
                END IF
            END IF

END SUB

SUB putgr (x, y, z)
cx = 109 + 90 * x
cy = 124 * y - 105
IF z = 1 THEN blkput 1, cx, cy, gr1(0)
IF z = 2 THEN blkput 1, cx, cy, gr2(0)
IF z = 3 THEN blkput 1, cx, cy, gr3(0)
IF z = 4 THEN blkput 1, cx, cy, gr4(0)
IF z = 5 THEN blkput 1, cx, cy, gr5(0)
IF z = 6 THEN blkput 1, cx, cy, gr6(0)
IF z = 7 THEN blkput 1, cx, cy, gr7(0)
IF z = 8 THEN blkput 1, cx, cy, gr8(0)
IF z = 0 THEN blkput 1, cx, cy, gr0(0)

END SUB

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
  PRINT "OK.... Press Any key..........."
  WHILE INKEY$ = ""
  WEND

END SUB
