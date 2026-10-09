 DEFINT A-Z

 REM $INCLUDE: 'QB.BI'
 REM $INCLUDE: 'c:\lan\qb\pcxlib\SVGAQB10.BI'

 TYPE PCXHEADER
	Id AS STRING * 1
	Version AS STRING * 1
	Encording AS STRING * 1
	BitsPerPixel AS STRING * 1
	X1 AS INTEGER
	Y1 AS INTEGER
	X2 AS INTEGER
	Y2 AS INTEGER
	Hres AS INTEGER
	Vres AS INTEGER
	PcxPalette AS STRING * 48
	Reserved AS STRING * 1
	Plane AS STRING * 1
	BytePerLine AS INTEGER
	PaletteType AS INTEGER
	Shres AS INTEGER
	Svres AS INTEGER
	NotUsed AS STRING * 54
 END TYPE

 DECLARE FUNCTION PCXSize& ()
 DECLARE FUNCTION PCXVersion! ()
 DECLARE FUNCTION PCXColor ()
 DECLARE FUNCTION PCXWidth ()
 DECLARE FUNCTION PCXHeight ()
 DECLARE FUNCTION PCXCompression ()

 DECLARE FUNCTION PCXSet (FileName AS STRING)
 DECLARE FUNCTION CheckFile (CheckFileName AS STRING)

 DECLARE SUB ReadPCX (X AS INTEGER, Y AS INTEGER, FileName AS STRING)
 DECLARE SUB SetViewPCX (X1 AS INTEGER, Y1 AS INTEGER, X2 AS INTEGER, Y2 AS INTEGER)

 DIM SHARED HEAD AS PCXHEADER
 DIM SHARED InRegs AS RegTypeX, OutRegs AS RegTypeX

 DIM SHARED PCXFileName AS STRING

 DIM SHARED ViewX1 AS INTEGER, ViewY1 AS INTEGER
 DIM SHARED ViewX2 AS INTEGER, ViewY2 AS INTEGER

FUNCTION CheckFile (CheckFileName AS STRING)

   DIM DTA AS STRING * 128
   DIM FCB AS STRING * 128

   InRegs.ax = &H1A00
   InRegs.dx = VARPTR(DTA)
   InRegs.ds = VARSEG(DTA)
   INTERRUPTX &H21, InRegs, OutRegs

   FCB = CheckFileName + CHR$(0)
   InRegs.ax = &H4E00
   InRegs.cx = &H20
   InRegs.ds = VARSEG(FCB)
   InRegs.dx = VARPTR(FCB)
   INTERRUPTX &H21, InRegs, OutRegs

   IF OutRegs.ax = 0 THEN
	  CheckFile = 0
   ELSE
	  CheckFile = NOT 0
   END IF

END FUNCTION

FUNCTION PCXColor

 PCXColor = (2 ^ ASC(HEAD.BitsPerPixel)) * (2 ^ ASC(HEAD.Plane) / 2)

END FUNCTION

FUNCTION PCXCompression

 PCXCompression = ASC(HEAD.Encording)

END FUNCTION

FUNCTION PCXHeight

 PCXHeight = HEAD.Y2 - HEAD.Y1 + 1

END FUNCTION

FUNCTION PCXSet (FileName AS STRING)

 IF CheckFile(FileName) = 0 THEN
	PCXFileName = FileName

	OPEN PCXFileName FOR BINARY AS #1
		GET #1, , HEAD
	CLOSE #1

	PCXSet = 0
 ELSE
	PCXSet = NOT 0
 END IF

END FUNCTION

FUNCTION PCXSize&

 OPEN PCXFileName FOR BINARY AS #1
	PCXSize& = LOF(1)
 CLOSE #1

END FUNCTION

FUNCTION PCXVersion!

 PCXVersion! = 3 + ASC(HEAD.Version) / (10 ^ LEN(LTRIM$(HEAD.Version)))

END FUNCTION

FUNCTION PCXWidth

 PCXWidth = HEAD.X2 - HEAD.X1 + 1

END FUNCTION

SUB ReadPCX (X AS INTEGER, Y AS INTEGER, FileName AS STRING)

 IF FileName <> "" THEN
	IF PCXSet(FileName) <> 0 THEN
		SCREEN 0, 0, 0, 0
		PRINT "File not found."
		END
	END IF
 END IF

 IF ViewX1 <> 0 OR ViewY1 <> 0 OR ViewX2 <> 0 OR ViewY2 <> 0 THEN
	SETVIEW X, Y, X + (ViewX2 - ViewX1 + 1), Y + (ViewY2 - ViewY1 + 1)
	X = X - ViewX1: Y = Y - ViewY1
 END IF

 SELECT CASE PCXColor
	CASE 16
		Palette16$ = HEAD.PcxPalette
		DEF SEG = VARSEG(Palette16$)
			FOR I = 0 TO 47
				POKE SADD(Palette16$) + 1, PEEK(SADD(Palette16$) + I) \ 4
			NEXT I
		DEF SEG
		IF HEAD.PaletteType = 1 THEN
		   InRegs.ax = &H1012
		   InRegs.bx = 0
		   InRegs.cx = 16
		   InRegs.dx = SADD(Palette16$)
		   InRegs.es = VARSEG(Palette16$)
		   INTERRUPTX &H10, InRegs, OutRegs
		 ELSE
		   InRegs.ax = &H101B
		   InRegs.bx = 0
		   InRegs.cx = 16
		   INTERRUPTX &H10, InRegs, OutRegs
		END IF
	CASE 256
		Palette256$ = SPACE$(768)
		OPEN PCXFileName FOR BINARY AS #1
			GET #1, LOF(1) - 767, Palette256$
		CLOSE #1
		DEF SEG = VARSEG(Palette256$)
			FOR I = 0 TO 767
				POKE SADD(Palette256$) + I, PEEK(SADD(Palette256$) + I) \ 4
			NEXT I
		DEF SEG
		'IF HEAD.PaletteType = 1 THEN
		   InRegs.ax = &H1012
		   InRegs.bx = 0
		   InRegs.cx = 256
		   InRegs.dx = SADD(Palette256$)
		   InRegs.es = VARSEG(Palette256$)
		   INTERRUPTX &H10, InRegs, OutRegs
		'ELSE
		'   InRegs.ax = &H101B
		'   InRegs.bx = 0
		'   InRegs.cx = 256
		'   INTERRUPTX &H10, InRegs, OutRegs
		'END IF
	CASE ELSE
 END SELECT

 PointX = X
 PointY = Y

 EndX = X + PCXWidth
 EndY = Y + PCXHeight

 ReadPoint = -1

 ReadBlock$ = SPACE$(500)

 OPEN PCXFileName FOR BINARY AS #1
	GET #1, , HEAD
	GET #1, , ReadBlock$
	DEF SEG = VARSEG(ReadBlock$)
		DO
			IF ReadPoint = 499 THEN GET #1, , ReadBlock$: ReadPoint = -1
			ReadPoint = ReadPoint + 1
			NowPoint = PEEK(SADD(ReadBlock$) + ReadPoint)
			IF (NowPoint AND &HC0) = &HC0 THEN
				IF ReadPoint = 499 THEN GET #1, , ReadBlock$: ReadPoint = -1
				ReadPoint = ReadPoint + 1
				IF PointY >= 0 THEN
					IF PointX + (NowPoint AND &H3F) >= 0 THEN
						IF PointX < 0 THEN
							DRWLINE 1, PEEK(SADD(ReadBlock$) + ReadPoint), 0, PointY, (NowPoint AND &H3F) - 1, PointY
						ELSE
							DRWLINE 1, PEEK(SADD(ReadBlock$) + ReadPoint), PointX, PointY, PointX + (NowPoint AND &H3F) - 1, PointY
						END IF
					END IF
				END IF
				PointX = PointX + (NowPoint AND &H3F)
			ELSE
				IF PointY >= 0 THEN
					IF PointX >= 0 THEN
						DRWPOINT 1, NowPoint, PointX, PointY
					END IF
				END IF
				PointX = PointX + 1
			END IF
			IF PointX >= EndX THEN
				PointX = X
				PointY = PointY + 1
				IF PointY >= EndY THEN EXIT DO
			END IF
		LOOP WHILE 1
	DEF SEG
 CLOSE #1

 SETVIEW 0, 0, 1023, 767

END SUB

SUB SetViewPCX (X1 AS INTEGER, Y1 AS INTEGER, X2 AS INTEGER, Y2 AS INTEGER)

 IF X1 > X2 THEN SWAP X1, X2
 IF Y1 > Y2 THEN SWAP Y1, Y2

 ViewX1 = X1: ViewY1 = Y1
 ViewX2 = X2: ViewY2 = Y2

END SUB
