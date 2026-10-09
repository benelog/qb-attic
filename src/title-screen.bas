DECLARE SUB title ()
title

SUB title
SCREEN 3
CLS : PRINT "  Begin !! "
LINE (30, 220)-(670, 80), , BF
FOR i = 0 TO 18
FOR j = 0 TO 80
IF POINT(j, i) THEN LINE (j * 8 - 5, i * 8 + 90)-(j * 8, i * 8 + 98), 0
NEXT j
NEXT i
LOCATE 1, 1
PRINT "          "
DRAW "C1 bm 40,330 r630 u30 l630 d30"
PAINT (1, 1), CHR$(&HAA) + CHR$(&H55)
PAINT (50, 310), CHR$(55) + CHR$(&H55)
LOCATE 23, 20
lg$ = " Strike a key when ready...."

FOR i = 1 TO LEN(lg$)
SOUND 100, .3
FOR j = 1 TO 100
NEXT j
PRINT MID$(lg$, i, 1);
NEXT i
d$ = INPUT$(1)
END SUB
