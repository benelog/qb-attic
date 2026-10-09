DECLARE SUB GIFLOAD (GIFFILENAME$)
REM $INCLUDE: 'C:\LAN\QB\PCXLIB\SVGAQB10.BI'
DEFINT A-Z
DIM SHARED bu(6741) AS INTEGER
DIM SHARED wu(6741) AS INTEGER
DIM SHARED GIFPAL AS STRING * 768
  IF WHICHVGA = 0 THEN STOP
  IF WHICHMEM < 512 THEN STOP
  VMODE = VIDEOMODEGET
  RES640
  GIFLOAD "C:\FLAG\upbn.GIF "
blkget 416, 43, 492, 217, bu(0)
blkget 545, 43, 621, 217, wu(0)
DEF SEG = VARSEG(bu(0))
BSAVE "bu.spr", VARPTR(bu(0)), 13484
DEF SEG
DEF SEG = VARSEG(wu(0))
BSAVE "wu.spr", VARPTR(wu(0)), 13484
DEF SEG

 WHILE INKEY$ = ""
 WEND
 VIDEOMODESET VMODE
 PRINT "It's demo version of flag game programmed by Jung-Sang-Hyuk"

DEFSNG A-Z
SUB GIFLOAD (GIFFILENAME$)

            DEFINT A-Z
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
                PALSET GIFPAL, 0, 255
                OK = GIFPUT(1, 0, 0, GIFFILENAME$)
                IF OK <> 1 THEN
                    SOUND 100, 5
                END IF
            END IF

END SUB
