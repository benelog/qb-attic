DIM a%(5)
x = 20
y = 20
d = (4 + INT((x + 7) / 8) * y) / 2
DIM g%(d)
INPUT "File name"; f$
SCREEN 3
CLS
LINE (10, 10)-(x + 11, y + 11), , B
FOR i = 1 TO 21
LINE (i * 10 + 35, 30)-(i * 10 + 35, 230)
LINE (45, i * 10 + 20)-(245, i * 10 + 20)
NEXT i
LOCATE 2, 2
FOR i = 0 TO 5
READ a%(i)
DATA 8,8,-16130,-28512,-31608,386
NEXT i
x1 = 1
y1 = 1
PUT (x1 * 10 + 40, y1 * 10 + 25), a%
DO
WHILE a$ = ""
a$ = INKEY$
WEND
IF a$ = CHR$(0) + CHR$(72) THEN
PUT (x1 * 10 + 40, y1 * 10 + 25), a%, XOR
IF y1 = 1 THEN y1 = 21
y1 = y1 - 1
PUT (x1 * 10 + 40, y1 * 10 + 25), a%
END IF
IF a$ = CHR$(0) + CHR$(80) THEN
PUT (x1 * 10 + 40, y1 * 10 + 25), a%, XOR
IF y1 = 20 THEN y1 = 0
y1 = y1 + 1
PUT (x1 * 10 + 40, y1 * 10 + 25), a%
END IF
IF a$ = CHR$(0) + CHR$(75) THEN
PUT (x1 * 10 + 40, y1 * 10 + 25), a%, XOR
IF x1 = 1 THEN x1 = 21
x1 = x1 - 1
PUT (x1 * 10 + 40, y1 * 10 + 25), a%
END IF
IF a$ = CHR$(0) + CHR$(77) THEN
PUT (x1 * 10 + 40, y1 * 10 + 25), a%, XOR
IF x1 = 20 THEN x1 = 0
x1 = x1 + 1
PUT (x1 * 10 + 40, y1 * 10 + 25), a%
END IF
IF a$ = "z" OR a$ = "Z" THEN
PUT (x1 * 10 + 40, y1 * 10 + 25), a%, XOR
LINE (x1 * 10 + 44, y1 * 10 + 21)-(x1 * 10 + 36, y1 * 10 + 29), 1, BF
PUT (x1 * 10 + 40, y1 * 10 + 25), a%
PSET (x1 + 10, y1 + 10)
END IF
IF a$ = "x" OR a$ = "X" THEN
PUT (x1 * 10 + 40, y1 * 10 + 25), a%, XOR
LINE (x1 * 10 + 44, y1 * 10 + 21)-(x1 * 10 + 36, y1 * 10 + 29), 0, BF
PUT (x1 * 10 + 40, y1 * 10 + 25), a%
PRESET (x1 + 10, y1 + 10)
END IF
IF a$ = "s" OR a$ = "S" THEN
d = (4 + INT((x + 7) / 8) * y) / 2
x2 = x + 10
y2 = y + 10
GET (11, 11)-(x2, y2), g%
OPEN f$ + "6.gri" FOR OUTPUT AS #1
FOR i = 0 TO d
IF i < d THEN PRINT #1, g%(i); ",";
IF i = d THEN PRINT #1, g%(i)
NEXT i
CLOSE #1
END IF
IF a$ = "e" OR a$ = "E" THEN
SCREEN 0
END
END IF
a$ = ""
LOOP
