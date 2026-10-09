CLS
SCREEN 12
DO
WHILE a$ = ""
a$ = INKEY$
WEND
c$ = c$ + a$
LOCATE 1, 1
PRINT c$
FOR i = 0 TO 18
FOR j = 0 TO 80
IF POINT(j, i) THEN LINE (j * 8 - 5, i * 8 + 90)-(j * 8, i * 8 + 98), 2, B
NEXT j
NEXT i
a$ = ""
LOOP
