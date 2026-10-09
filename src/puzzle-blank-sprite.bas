DECLARE SUB start ()
DEFINT A-Z
DECLARE SUB opening ()
DECLARE SUB gifload (GIFFILENAME$)
REM $INCLUDE: 'svgaqb10.bi'
RANDOMIZE TIMER
DIM SHARED GIFPAL AS STRING * 768
DIM blk(5477) AS INTEGER
VMODE = VIDEOMODEGET
  RES640

  start
  VMODE = VIDEOMODEGET
  RES640
  opening


  gifload "board.GIF "
  blkget 0, 0, 87, 121, blk(0)
  DEF SEG = VARSEG(blk(0))
  BSAVE "board.spr", VARPTR(blk(0)), 10956
  DEF SEG



WHILE INKEY$ = ""
 WEND
 VIDEOMODESET VMODE
 PRINT "It's test of the game programmed by Jung-Sang-Hyuk"

DEFSNG A-Z
SUB gifload (GIFFILENAME$)
            DEFINT A-Z
            FOR I = 1 TO 768
            MID$(GIFPAL, I, 1) = CHR$(63)
            NEXT I
            PALSET GIFPAL, 0, 255
            OK = GIFGETINFO(GIFFILENAME$, XSIZE, YSIZE, NUMCOL, GIFPAL)
            IF OK = 1 THEN
                FIXIT = 0
                FOR A = 1 TO NUMCOL * 3 STEP 3
                    R = ASC(MID$(GIFPAL, A, 1))
                    G = ASC(MID$(GIFPAL, A + 1, 1))
                    B = ASC(MID$(GIFPAL, A + 2, 1))
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
                NEXT A
                IF FIXIT = 1 THEN
                    FOR A = 1 TO NUMCOL * 3
                        C = ASC(MID$(GIFPAL, A, 1))
                        MID$(GIFPAL, A, 1) = CHR$(C \ 4)
                    NEXT A
                END IF
                OK = GIFPUT(1, 0, 0, GIFFILENAME$)
                PALSET GIFPAL, 0, 255
                IF OK <> 1 THEN
                    SOUND 100, 5
                END IF
            END IF

END SUB

  SUB opening
  gifload "logo.gif"
  WHILE INKEY$ = ""
  WEND
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
  PRINT "OK.... Press Any key..........."
  WHILE INKEY$ = ""
  WEND

END SUB
