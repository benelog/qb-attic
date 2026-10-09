a:
PRINT "Enter password."
FOR i = 1 TO 5
WHILE a$ = ""
a$ = INKEY$
WEND
d$ = d$ + a$
a$ = ""
NEXT i
IF d$ = "╚2822" THEN END
d$ = ""
GOTO a
