SCREEN 12
CLS
FOR i = 1 TO 19800
PSET (INT(RND(1) * 640), INT(RND(1) * 480)), INT(RND(1) * 16)
NEXT i
CIRCLE (360, 250), 220
CIRCLE (360, 250), 200
FOR i = 0 TO 360 STEP 6
DRAW "c0 BM360,250 TA" + STR$(i) + " BU120 u5"
IF i = 0 OR i / 30 = INT(i / 30) THEN
DRAW "c0 bm360,250 ta" + STR$(i) + "bu110 u10"
END IF
NEXT i
DO
a = VAL(MID$(TIME$, 7, 2)) * 6 * -1
b = INT(VAL(MID$(TIME$, 4, 2)) * 6 + VAL(MID$(TIME$, 7, 2)) / 10) * -1
c = VAL(MID$(TIME$, 1, 2)) * -1
IF c > 12 THEN c = c - 12
d = INT(c * 30 + b / 10)
DRAW "c0 bm360,250 ta" + STR$(a) + "u100"
DRAW "c0 bm360,250 ta" + STR$(b) + "u120  "
DRAW "c0 bm360,250 ta" + STR$(c) + "u70"
a1$ = INKEY$
IF a1$ = "e" OR a1$ = "E" THEN END
a$ = TIME$
DO WHILE a$ = TIME$
LOOP
DRAW "c15 bm360,250 ta" + STR$(a) + "u100"
DRAW "c15 bm360,250 ta" + STR$(b) + "u120"
DRAW "c15 bm360,250 ta" + STR$(c) + "u70"
LOOP
SCREEN 0
