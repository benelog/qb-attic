DECLARE SUB jp ()
DECLARE SUB sbload (f$)
DECLARE SUB readpic (f$)
ON ERROR GOTO er
DIM mn$(4, 8), mg(4), mx(4), my(8), ym(4)
mg(1) = 6
mg(2) = 7
mg(3) = 8
mg(4) = 4
FOR i = 1 TO 4
 FOR j = 0 TO mg(i)
  READ mn$(i, j)
   DATA FILE    ,Load    ,Save    ,Load(Dr),Kill    ,Rename  ,Exit
   DATA TOOLS   ,Glasses ,Paint   ,Line    ,Box     ,Circle  ,write   ,Spray  |
   DATA EDIT    ,Erase  |,Inverse|
   DATA ,
   DATA Copy    ,Move    ,P-Save  ,P-Load
   DATA OPTION  ,White   ,Part    ,Pattern ,Step
   NEXT j, i
mn$(3, 3) = "Change" + CHR$(24) + "|"
mn$(3, 4) = "Change" + CHR$(26) + "|"
mx = 2
my = 1
FOR i = 1 TO 4
ym(i) = 1
NEXT i
DIM m1%(497), m2%(567), m3%(637), m4%(357)
m1%(0) = 75: m1%(1) = 99
m2%(0) = 75: m2%(1) = 113
m3%(0) = 75: m3%(1) = 127
m4%(0) = 75: m4%(1) = 71
SCREEN 3
CLS
DIM mn%(77)
a$ = CHR$(0) + CHR$(75)
main:
DO
 GET (9 + (mx - 1) * 72, my * 14)-(9 + mx * 72, my * 14 + 14), mn%
 PUT (9 + (mx - 1) * 72, my * 14), mn%, PRESET
 WHILE a$ = ""
 a$ = INKEY$
 WEND
 IF LEN(a$) = 2 THEN PUT (9 + (mx - 1) * 72, my * 14), mn%, PSET

 IF a$ = CHR$(0) + CHR$(75) OR a$ = CHR$(0) + CHR$(77) THEN
   ym(mx) = my
   IF mx = 1 THEN PUT (8 + (mx - 1) * 72, 0), m1%, PSET
   IF mx = 2 THEN PUT (8 + (mx - 1) * 72, 0), m2%, PSET
   IF mx = 3 THEN PUT (8 + (mx - 1) * 72, 0), m3%, PSET
   IF mx = 4 THEN PUT (8 + (mx - 1) * 72, 0), m4%, PSET

  IF a$ = CHR$(0) + CHR$(77) THEN
   mx = mx + 1
   IF mx = 5 THEN mx = 1
  END IF

  IF a$ = CHR$(0) + CHR$(75) THEN
   mx = mx - 1
   IF mx = 0 THEN mx = 4
  END IF

  my = ym(mx)
  FOR i = 0 TO mg(mx)
   LOCATE i + 1, 8 * mx - 6
   PRINT mn$(mx, i)
  NEXT i
  LINE (8 + (mx - 1) * 72, 14)-(10 + mx * 72, 14 * (mg(mx) + 1)), , B
 END IF

 IF a$ = CHR$(0) + CHR$(80) THEN
  my = my + 1
  IF my > mg(mx) THEN my = 1
 END IF

 IF a$ = CHR$(0) + CHR$(72) THEN
 my = my - 1
 IF my = 0 THEN my = mg(mx)
 END IF
 a$ = ""
LOOP
END
er:
IF ERR = 5 OR ERR = 53 THEN CLOSE #1
IF ERR = 5 THEN DEF SEG
GOTO main






SUB jp
FOR e = 1 TO 24
LOCATE 25, 1
PRINT
NEXT e
END SUB

SUB msg (ty, tx, c, me$)
IF c = 0 THEN COLOR 0, 7
LOCATE ty, tx
PRINT me$
END SUB

SUB readpic (f$)
DIM buffer(511)
DEF SEG = &HB000
OPEN f$ FOR BINARY AS #1
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
END SUB

SUB sbload (f$)
DEF SEG = &HB000
BLOAD f$, 0
DEF SEG
END SUB

SUB SBSAVE (f$)
DEF SEG = &HB000
BSAVE f$, 0, &H8000
DEF SEG
END SUB
