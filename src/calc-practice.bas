CLS
PRINT "                   ****** Calculation Practice Trainer *****"
PRINT
PRINT "                                          Programmed by Jung-Sang-Hyuk"
PRINT "                                                Version 1.0"

DO
RANDOMIZE TIMER
INPUT "XX+XX+XX ...", hs
INPUT "XXXX........", js
INPUT "How many problems do you want to solve?", mh
INPUT "How long do you take to solve a problem?", tm
DIM pb(hs), cas(mh), mj$(mh)
FOR j = 1 TO mh
 FOR i = 1 TO hs
 pb(i) = INT(RND * 10 ^ js)
 bh = INT(RND * 2)
 IF bh = 0 THEN
  b$ = "+"
  cas(j) = cas(j) + pb(i)
 END IF
 IF bh = 1 THEN
  b$ = "-"
  cas(j) = cas(j) - pb(i)
 END IF
 mj$(j) = mj$(j) + " " + b$ + STR$(pb(i))
 NEXT i
 NEXT j

 FOR i = 1 TO mh
 PRINT mj$(i); "  ";
 INPUT A
 IF A = cas(i) THEN
 PRINT "OK"
 cr = cr + 1
 ELSE PRINT "no, correct answer is"; cas(i)
 END IF
 NEXT i


 PRINT "your correc answer is"; cr; "of"; mh; "problems"
 PRINT cr / mh * 100; "%"
 PRINT "Press Any Key..."
 WHILE INKEY$ = ""
 WEND
 CLEAR
 LOOP
