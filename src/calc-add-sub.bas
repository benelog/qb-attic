CLS
RANDOMIZE TIMER
FOR i = 1 TO 20
a = INT(RND * 100)
b = INT(RND * 100)
d = INT(RND * 2)
IF d = 0 THEN
 PRINT a; "+"; b; "=";
 ca = a + b
END IF

IF d = 1 THEN
 PRINT a; "-"; b; "=";
 ca = a - b
END IF

INPUT c
IF c = ca THEN
PRINT "Ok"
s = s + 1
END IF
IF ca <> c THEN PRINT "no,correct answer is "; ca
NEXT i
PRINT "Total Correct answer is "; s
