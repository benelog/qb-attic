 DEFINT A-Z

 REM $INCLUDE: 'QB.BI'
 REM $INCLUDE: 'c:\lan\qb\pcxlib\SVGAQB10.BI'

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

 VGA = WHICHVGA

 PCXFileName$ = UCASE$(COMMAND$)

 IF PCXFileName$ = "" THEN
	PRINT "PCX File Reader version 0.1"
	PRINT "USAGE : PCXREAD PCXFilename[.PCX]"
	END
 ELSE
	IF INSTR(PCXFileName$, ".") = 0 THEN PCXFileName$ = PCXFileName$ + ".PCX"
	IF CheckFile(PCXFileName$) <> 0 THEN
		PRINT "PCX File Reader version 0.1"
		PRINT "'"; PCXFileName$; "' is not found."
		END
	END IF
 END IF

 CLS

 SetViewPCX 0, 0, 0, 0

 IF PCXSet(PCXFileName$) = 0 THEN
	PRINT "File name        : "; PCXFileName$
	PRINT "File size        :"; PCXSize; "Byte"
	PRINT "File version     :"; " Ver"; PCXVersion
	PRINT "Color type       :"; PCXColor; "Color"
	PRINT "Picture size     :"; PCXWidth; "x"; PCXHeight
	PRINT "RLE Compressdion : ";
	IF PCXCompression = 1 THEN PRINT "On" ELSE PRINT "Off"

	A$ = INPUT$(1)

	IF PCXColor = 256 THEN
		IF PCXWidth <= 320 AND PCXHeight <= 200 THEN
			RES320
		ELSEIF PCXWidth <= 640 AND PCXHeight <= 480 THEN
			RES640
		ELSEIF PCXWidth <= 800 AND PCXHeight <= 600 THEN
			RES800
		ELSE
			RES1024
		END IF
	ELSE
		PRINT
		PRINT "Sorry! This program can read only 256color PCX file."
		PRINT "Program terminated."
		END
	END IF

	ReadPCX 0, 0, PCXFileName$
	A$ = INPUT$(1)

	SetViewPCX 50, 50, 150, 150
	SETVIEW 124, 49, 227, 152
	FILLVIEW 255
	SETVIEW 0, 0, 1023, 767
	ReadPCX 125, 50, PCXFileName$
	A$ = INPUT$(1)

	RESTEXT
 ELSE
	PRINT "File not found."
 END IF
