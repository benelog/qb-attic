CLEAR : SCREEN 0: CLS
INPUT "File name(.pic)"; filename$
DIM buffer(511)
DEF SEG = &HB000
OPEN filename$ + ".pic" FOR BINARY AS #1
MemCount = 0
Plane = 0
Count = 10
SCREEN 3: CLS
ChangePlane:
FOR getdata = 0 TO 511
buffer(getdata) = ASC(INPUT$(1, #1))
NEXT getdata
IF Count = 10 THEN
IF (buffer(0) <> &H41) OR (buffer(1) <> &H48) THEN GOTO quit
IF buffer(7) <> 7 THEN GOTO quit
END IF
LoopStart:
flag = buffer(Count)
Count = Count + 1
SELECT CASE flag
CASE &H80
Count = 0
GOTO ChangePlane
CASE 0
GOTO quit
CASE ELSE
SELECT CASE (flag AND &H80)
CASE 0
FOR loop1 = 1 TO (flag AND &H7F)
POKE MemCount, buffer(Count)
Count = Count + 1
MemCount = MemCount + 1
NEXT loop1
CASE &H80
Dummy = buffer(Count)
IF Dummy <> 0 THEN
FOR loop1 = 1 TO (flag AND &H7F)
POKE MemCount, Dummy
MemCount = MemCount + 1
NEXT loop1
ELSE
MemCount = MemCount + (flag AND &H7F)
END IF
Count = Count + 1
END SELECT
END SELECT
GOTO LoopStart
quit:
CLOSE : DEF SEG
PLAY "o1 c20 e20 g20"
WHILE INKEY$ = "": WEND
SCREEN 0
END
