DECLARE SUB caledit (xj!, yj!, clmnum!)
DECLARE SUB calcu ()
DECLARE SUB makebox (xjwapyo1!, yjwapyo1!, xjwapyo2!, yjwapyo2!, editnum!)
DECLARE SUB clscreen (xn1!, yn1!, xn2!, yn2!)
DIM SHARED caldat$, caldatbak$


CALL calcu

SUB calcu
  DIM resultsu(500) AS DOUBLE
  DIM resu(500) AS STRING
  CALL clscreen(30, 4, 54, 25)
  CALL makebox(30, 4, 54, 22, 1)
  CALL makebox(30, 23, 54, 25, 1)
FOR a = 32 TO 52 STEP 2
	LOCATE 19, a: PRINT CHR$(166) + CHR$(172);
NEXT a
	  LOCATE 20, 32: PRINT "결과:";
	  LOCATE 21, 34: PRINT USING "####"; resu; : PRINT "  번째 계산";
	  caldat$ = ""
	  caldatbak$ = ""
	  clm = 5
	  z = 1
	  choo = 1
calsi:

	  'LOCATE choo+4, 33, 1, 1, 14
	  'DO: resu(choo) = INKEY$: LOOP WHILE resu(choo) = ""
	  'IF resu(choo) = "+" OR resu(choo) = "-" OR resu(choo) = "/" OR resu(choo) = "*" THEN
	  '                   LOCATE choo-5, 33: PRINT resu(choo);
	  '           ELSE
	  '                   GOTO calsi
	  'END IF
caldasi:
	  SELECT CASE caldatbak$
		 CASE "Tab"
dasitab:
			LOCATE clm, 33, 1, 1, 14: DO: intab$ = INKEY$: LOOP WHILE intab$ = ""
			IF intab$ = "+" OR intab$ = "-" OR intab$ = "/" OR intab$ = "*" THEN GOTO dasitab2 ELSE GOTO dasitab
dasitab2:
			LOCATE clm, 33: PRINT intab$;
			resu(choo) = intab$
			recalc$ = ""
			recalc$ = LEFT$(STR$(resultsu(choo)), 15)
			recalcnum = LEN(recalc$)
			LOCATE clm, 34: PRINT recalc$; SPACE$(16 - recalcnum);
		 'CASE "pgup"
		 '     choo = choo - 14
		 '     IF choo > 14 THEN z = z - 14
		 '     IF choo + 4 < 5 THEN choo = 1
		 'CASE "pgdn"
		 '     choo = choo + 14
		 '     IF choo > 14 THEN z = z + 14
		 '     IF choo > 484 THEN choo = 482
		 CASE "scroup"
		 IF choo < 15 THEN clm = clm - 1
		 z = z - 1
		 IF z < 1 THEN z = 1
		 choo = choo - 1
		 IF clm < 5 THEN clm = 5
		 IF choo < 1 THEN choo = 1
			recalc$ = ""
			recalc$ = LEFT$(STR$(resultsu(choo)), 15)
			recalcnum = LEN(recalc$)
			LOCATE clm, 34: PRINT recalc$; SPACE$(16 - recalcnum);
		 CASE "scrodn"
		 clm = clm + 1
		 choo = choo + 1
		 IF choo > 14 THEN z = z + 1
		 IF clm > 18 THEN clm = 18
		 IF choo > 500 THEN choo = 500
			recalc$ = ""
			recalc$ = LEFT$(STR$(resultsu(choo)), 15)
			recalcnum = LEN(recalc$)
			LOCATE clm, 34: PRINT recalc$; SPACE$(16 - recalcnum);
		 CASE "="
		 choo = choo
		 CASE "+"
		 clm = clm + 1
		 IF clm > 18 THEN clm = 18
		 choo = choo + 1
		 IF choo > 500 THEN choo = 500
		 IF choo > 14 THEN z = z + 1
		 CASE "-"
		 clm = clm + 1
		 IF clm > 18 THEN clm = 18
		 choo = choo + 1
		 IF choo > 14 THEN z = z + 1
		 IF choo > 500 THEN choo = 500
		 CASE "*"
		 clm = clm + 1
		 IF clm > 18 THEN clm = 18
		 choo = choo + 1
		 IF choo > 14 THEN z = z + 1
		 IF choo > 500 THEN choo = 500
		 CASE "/"
		 clm = clm + 1
		 IF clm > 18 THEN clm = 18
		 choo = choo + 1
		 IF choo > 14 THEN z = z + 1
		 IF choo > 500 THEN choo = 500
		 CASE "99999"
		 GOTO calend
	  END SELECT
	  IF caldatbak$ = "+" OR caldatbak$ = "-" OR caldatbak$ = "/" OR caldatbak$ = "*" THEN
	resu(choo) = caldatbak$
	  END IF
	  FOR cc = 1 TO choo - 1
	  SELECT CASE resu(cc)
		CASE ""
		IF choo <= 2 THEN resulthap# = resultsu(cc)
		IF choo > 2 THEN resulthap# = resulthap# + resultsu(cc)
		GOTO ense
		CASE "+"
		resulthap# = resulthap# + resultsu(cc)
		CASE "-"
		resulthap# = resulthap# - resultsu(cc)
		CASE "/"
		resulthap# = resulthap# / resultsu(cc)
		CASE "*"
		resulthap# = resulthap# * resultsu(cc)
ense:
	  END SELECT
	  NEXT cc
	  IF resulthap# > 10000000000000# THEN DO: aar$ = INKEY$: LOOP WHILE aar$ = "": GOTO calend
	  IF resulthap# < -10000000000000# THEN DO: aar$ = INKEY$: LOOP WHILE aar$ = "": GOTO calend
	  LOCATE 20, 37: PRINT USING "#,###,###,###,###"; resulthap#;
	  resulthap# = 0
	  LOCATE 21, 32: PRINT USING "####"; choo - 1; : PRINT "  째자료 까지 계산";
	  IF caldatbak$ = "+" OR caldatbak$ = "-" OR caldatbak$ = "/" OR caldatbak$ = "*" THEN
	  '   resu(choo) = caldatbak$
	LOCATE clm, 33: PRINT caldatbak$;
	  END IF
	  FOR sd = choo TO choo + 13
	  LOCATE sd - choo + 5, 33: PRINT SPACE$(1);
	  LOCATE sd - choo + 5, 33: PRINT resu(sd - choo + z);
	  IF (sd - choo + 5) = clm THEN GOTO nsd
	  LOCATE sd - choo + 5, 35: PRINT USING "###,###,###,###"; resultsu(sd - choo + z);
nsd:
	  NEXT sd
	  CALL caledit(35, clm, 15)
	  FOR df = 1 TO 15
	  chooo$ = MID$(caldat$, df, 1)
	  IF chooo$ = "," THEN GOTO gunnu
	  calda$ = calda$ + chooo$
gunnu:
	  NEXT df
	  resultsu(choo) = VAL(calda$)
	  calda$ = "": chooo$ = ""
	  IF resultsu(choo) > 1000000000000# THEN DO: aad$ = INKEY$: LOOP WHILE aad$ = "": GOTO calend
	  IF resultsu(choo) < -1000000000000# THEN DO: aad$ = INKEY$: LOOP WHILE aad$ = "": GOTO calend
	  LOCATE clm, 35: PRINT USING "###,###,###,###"; resultsu(choo)
	  'CALL clscreen(32, 5, 53, 18)

	  GOTO calsi
calend:
  CALL clscreen(30, 4, 55, 25)
		 EXIT SUB


END SUB

SUB caledit (xj, yj, clmnum)
caldatbak$ = caldat$
caldat$ = ""
choice = 1
znumber = 0
column = xj: row = yj
 LOCATE yj, xj, 1, 14
calsija:

SELECT CASE column
		CASE IS < xj
			column = xj
		CASE IS > xj + clmnum
			column = xj + clmnum
END SELECT
SELECT CASE row
		CASE IS < 5
			row = 5
		CASE IS > 18
			row = 18
END SELECT
LOCATE row, column, 1, 1, 14
DO: mainput$ = INKEY$: LOOP WHILE mainput$ = ""
IF ASC(mainput$) > 58 THEN BEEP: GOTO calsija
calsija2:
SELECT CASE mainput$
		CASE CHR$(9)
			FOR i = xj TO xj + 15
			caldat$ = caldat$ + CHR$(SCREEN(row, i))
			NEXT i
			LOCATE , , 0, 0
			caldatbak$ = "Tab":   EXIT SUB
		CASE "+"
			FOR i = xj TO column - 1
			caldat$ = caldat$ + CHR$(SCREEN(row, i))
			NEXT i
			LOCATE , , 0, 0
			caldatbak$ = "+":   EXIT SUB
		CASE "-"
			FOR i = xj TO column - 1
			caldat$ = caldat$ + CHR$(SCREEN(row, i))
			NEXT i
			LOCATE , , 0, 0
			caldatbak$ = "-":   EXIT SUB
		CASE "*"
			FOR i = xj TO column - 1
			caldat$ = caldat$ + CHR$(SCREEN(row, i))
			NEXT i
			LOCATE , , 0, 0
			caldatbak$ = "*":   EXIT SUB
		CASE "/"
			FOR i = xj TO column - 1
			caldat$ = caldat$ + CHR$(SCREEN(row, i))
			NEXT i
			LOCATE , , 0, 0
			caldatbak$ = "/":   EXIT SUB
		CASE CHR$(0) + CHR$(72)
			IF column = 35 THEN column = clmnum + xj + 1
			FOR i = xj TO column - 1
			caldat$ = caldat$ + CHR$(SCREEN(row, i))
			NEXT i
			LOCATE , , 0, 0
			caldatbak$ = "scroup":   EXIT SUB
		CASE CHR$(0) + CHR$(80)
			IF column = 35 THEN column = clmnum + xj + 1
			FOR i = xj TO column - 1
			caldat$ = caldat$ + CHR$(SCREEN(row, i))
			NEXT i
			LOCATE , , 0, 0
			caldatbak$ = "scrodn":   EXIT SUB
		'CASE CHR$(0) + CHR$(81)
		'             FOR i = xj TO column - 1
		'             caldat$ = caldat$ + CHR$(SCREEN(row, i))
		'             NEXT i
		'             LOCATE , , 0, 0
		'            caldatbak$ = "pgdn":   EXIT SUB
	  ' CASE CHR$(0) + CHR$(73)
	  '              FOR i = xj TO column - 1
	  '              caldat$ = caldat$ + CHR$(SCREEN(row, i))
	  '              NEXT i
	  '              LOCATE , , 0, 0
	  '              caldatbak$ = "pgup":   EXIT SUB
		CASE CHR$(0) + CHR$(71)

			column = xj
		CASE CHR$(0) + CHR$(79)
			column = xj + clmnum - 1

		CASE CHR$(0) + CHR$(83)
			FOR deli = column TO clmnum + xj
			jam$ = jam$ + CHR$(SCREEN(row, deli))
			NEXT deli
			jamdata$ = RIGHT$(jam$, clmnum + xj - column)
			LOCATE row, column: PRINT jamdata$;
		CASE CHR$(27)
			FOR i = xj TO column - xj
			caldat$ = caldat$ + CHR$(SCREEN(row, i))
			NEXT i
			COLOR 23, 0: LOCATE 24, 32: PRINT " 끝낼까요? [끝은 Esc] "; : COLOR 15, 1
			LOCATE 24, 49
			DO: escin$ = INKEY$: LOOP WHILE escin$ = ""
			IF escin$ = CHR$(27) THEN caldatbak$ = "99999": COLOR 15, 1: EXIT SUB
			IF strnum$ = "number2" THEN caldatbak$ = "22222": COLOR 15, 1: EXIT SUB
			 COLOR 15, 1: GOTO calsija
		CASE CHR$(8)
			column = column - 1
			IF column <= xj THEN column = xj
			IF column >= (xj + clmnum - 1) THEN LOCATE row, column + 1: PRINT " ";
			'한글일때 백스페이스키를 잘못사용하면 안되므로 한글인지(ascii > 159)판단하여 지워준다.
			IF SCREEN(row, column) > 159 THEN column = column - 1: LOCATE row, column: PRINT "  "; : GOTO calsija
			LOCATE row, column: PRINT " "; : GOTO calsija
		CASE IS > CHR$(31)
			IF column >= xj + clmnum - 1 THEN LOCATE row, column: PRINT mainput$; : GOTO calsija
			IF strnum$ = "number" OR strnum$ = "number2" THEN IF mainput$ = "-" THEN LOCATE row, column: PRINT mainput$; : column = column + 1: GOTO calsija
			IF strnum$ = "number" OR strnum$ = "number2" THEN IF ASC(mainput$) = 32 THEN LOCATE row, column: PRINT mainput$; : column = column + 1: GOTO calsija
			IF strnum$ = "number" OR strnum$ = "number2" THEN IF ASC(mainput$) < 46 OR ASC(mainput$) > 57 THEN BEEP: column = column - 1: GOTO calsija
			LOCATE row, column: PRINT mainput$;
			column = column + 1: znumber = 1
			GOTO calsija
		CASE ELSE
		GOTO calsija
END SELECT
GOTO calsija
END SUB

SUB clscreen (xn1, yn1, xn2, yn2)
xycl = xn2 - xn1 + 1
 FOR one = yn1 TO yn2
	 LOCATE one, xn1: PRINT SPACE$(xycl);
 NEXT one

END SUB

SUB makebox (xjwapyo1, yjwapyo1, xjwapyo2, yjwapyo2, editnum)
 LOCATE , , 0
COLOR 2, 1
SELECT CASE editnum
  CASE 0, 1
  FOR a = xjwapyo1 + 2 TO xjwapyo2 - 2 STEP 2
	IF a <= 0 THEN GOTO naga12
	LOCATE yjwapyo1, a: PRINT "─";
	LOCATE yjwapyo2, a: PRINT "━";
naga12:
  NEXT a
LOCATE yjwapyo1, xjwapyo1: PRINT "┌";
LOCATE yjwapyo1, xjwapyo2: PRINT "┒";
LOCATE yjwapyo2, xjwapyo1: PRINT "┕";
LOCATE yjwapyo2, xjwapyo2: PRINT "┛";
  FOR b = yjwapyo1 + 1 TO yjwapyo2 - 1
	IF b <= 0 THEN GOTO kkeud2
	LOCATE b, xjwapyo1: PRINT "│";
	LOCATE b, xjwapyo2: PRINT "┃";
kkeud2:
  NEXT b
END SELECT
 COLOR 0, 1
END SUB
