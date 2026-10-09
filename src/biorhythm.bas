CALL setmode(1)
CALL scrcls
DIM M(13), G$(51)
FOR I = 1 TO 13: READ M(I): NEXT I
DATA 0,31,59,90,120,151,181,212,243,273,304,334,365
menu:
130 CALL hput(25, 5, 0, "        B I O R Y T H M         ")
150 CALL hput(31, 9, 0, "   Designed by 정 상 혁")
170 CALL hput(30, 12, 0, "  1.  화 면 출 력    ")
180 CALL hput(30, 14, 0, "  2.  인 쇄 용 지    ")
190 CALL hput(30, 16, 0, "  3.  프로그램 끝    ")
200 CALL hput(30, 18, 0, "  4.  MS-DOS 복귀    ")
230 A = VAL(INKEY$)
240 IF A = 0 OR A > 4 GOTO 230
250 ON A GOTO 300, 300, 260, 270
260 END
270 SYSTEM
290 '
300 REM 주 모듈
310 CLS
320 LOCATE 4, 20: PRINT "╔══════════════╗"
330 LOCATE 5, 20: PRINT "║      바 이 오 리 듬        ║"
340 LOCATE 6, 20: PRINT "╚══════════════╝"
350 PRINT : PRINT : PRINT "당신의 생년월일": PRINT
360 Y1 = 1
370 GOSUB 800: GOSUB 900
380 T1 = T: Y1 = Y: M1 = M: D1 = D
385 IF A = 2 GOTO 1000
390 V$ = DATE$
400 Y = VAL(MID$(V$, 9, 2))
410 M = VAL(MID$(V$, 1, 2))
420 D = VAL(MID$(V$, 4, 2))
430 PRINT : PRINT : PRINT "오늘이"; Y; "년 "; M; "월"; D; "일이면 아무 키나 누르시고,"
440 PRINT "아니면 N키를 누르시오": PRINT
450 A$ = INKEY$
455 IF A$ = "N" OR A$ = "n" THEN GOSUB 800
460 IF A$ = "" THEN GOTO 450
465 GOSUB 900
470 T = T - T1
480 CLS
490 '
500 REM 화면 그래픽
510 COLOR 0, 7
520 LOCATE 1, 30: PRINT "     바 이 오 리 듬     "
530 COLOR 7, 0
540 LOCATE 3, 25: PRINT "당신이 오늘 까지 살아온 날 = "; T + 1
550 FOR I = 5 TO 23
560 LOCATE I, 11: PRINT "║"
570 NEXT I
580 FOR I = 1 TO 8
590 LOCATE 14, 10 * I - 9: PRINT "╬════"
600 LOCATE 15, 10 * I - 9: PRINT 5 * I - 10
610 NEXT I
620 LOCATE 15, 74: PRINT "일후"
630 LOCATE 23, 10: PRINT "오늘"
640 B$ = "$": C$ = "건 강": Q = 23: GOSUB 700
650 B$ = "O": C$ = "감 성": Q = 28: GOSUB 700
660 B$ = "#": C$ = "지 성": Q = 33: GOSUB 700
670 A$ = INKEY$
680 IF A$ = "" GOTO 670
690 GOTO menu
695 '
700 REM SIGN 그래프
710 K = T - Q * INT(T / Q)
720 FOR I = -10 TO 60
730 Y = 14 - 8 * SIN(6.2832 * (K + .5 * I) / Q)
740 LOCATE Y, I + 11: PRINT B$;
750 NEXT I
760 PRINT C$
770 RETURN
790 '
800 REM 입력
810 PRINT Y1; "년부터 99년 사이의 년도를 입력하시오.": PRINT
820 INPUT "몇 년"; Y
830 IF Y < Y1 OR Y > 99 THEN PRINT "입력이 틀렸습니다.": GOTO 820
840 INPUT "몇 월"; M
850 IF M < 1 OR M > 12 THEN PRINT "입력이 틀렸습니다.": GOTO 840
860 INPUT "몇 일"; D
870 IF D < 1 OR D > 31 THEN PRINT "입력이 틀렸습니다.": GOTO 860
880 RETURN
890 '
900 REM 계산
910 T = 365 * Y + M(M) + D + INT(Y / 4)
920 IF Y = 4 * INT(Y / 4) AND 30 * M + D < 90 THEN T = T - 1
930 RETURN
990 '
1000 REM 바이오 리듬 인쇄
1010 FOR I = 1 TO 51: G$(I) = " ": NEXT I
1020 PRINT : PRINT
1030 INPUT "이름은"; N$
1040 INPUT "인쇄를 원하는 해는 "; Y
1045 IF Y > 99 THEN PRINT "끝의 두자리만 입력하세요.": GOTO 1040
1050 INPUT "원하는 처음 달은"; M
1060 D = 1: GOSUB 900: T = T - T1
1070 INPUT "원하는 마지막 달은"; L
1080 IF L < M THEN GOTO 1070
1090 '
1100 REM 인쇄
1102 LPRINT CHR$(27); "h";
1104 LPRINT CHR$(27); "W"
1110 LPRINT TAB(22); "**********************************"
1120 LPRINT TAB(22); "***                            ***"
1130 LPRINT TAB(22); "       바 이 오 리 듬  달 력"
1140 LPRINT TAB(22); "***                            ***"
1150 LPRINT TAB(22); "**********************************"
1160 LPRINT : LPRINT : LPRINT TAB(29); "Designed by Jung Sang Hyuk": LPRINT : LPRINT
1170 LPRINT TAB(3); "성    명  =  "; N$
1180 LPRINT TAB(3); "생년월일  = "; Y1; "."; M1; "."; D1
1190 LPRINT TAB(60); "건 강 = $$$$$$$$$$"
1200 LPRINT TAB(60); "감 성 = OOOOOOOOOO"
1210 LPRINT TAB(60); "지 성 = ##########"
1220 LPRINT : LPRINT
1230 LPRINT "  월    일   살아온 날"; TAB(44); "C O N D I T I O N": LPRINT
1240 FOR I = -5 TO 5
1250 LPRINT TAB(5 * I + 51); 20 * I;
1260 NEXT I
1270 GOSUB 1600
1280 FOR I = M TO L
1290 D = M(I + 1) - M(I)
1300 FOR J = 1 TO D
1310 GOSUB 1400
1320 NEXT J
1330 IF Y = 4 * INT(Y / 4) AND I = 2 THEN D = 29: GOSUB 1400
1340 GOSUB 1600
1350 NEXT I
1360 LPRINT CHR$(12)
1370 GOTO menu
1390 '
1400 REM 사인 그래프
1410 LPRINT TAB(2); I; TAB(8); J; TAB(15); T + 1; TAB(26); "I";
1420 G$(26) = "I"
1430 G$(INT(25 * SIN(6.2832 * T / 23) + 26)) = "$"
1440 G$(INT(25 * SIN(6.2832 * T / 28) + 26)) = "O"
1450 G$(INT(25 * SIN(6.2832 * T / 33) + 26)) = "#"
1460 FOR K = 1 TO 51
1470 LPRINT TAB(K + 26); G$(K);
1480 G$(K) = " "
1490 NEXT K
1500 LPRINT TAB(78); "I"
1510 IF J = 15 THEN GOSUB 1600
1520 T = T + 1
1530 RETURN
1590 '
1600 REM 구분 선
1610 FOR X = 27 TO 72 STEP 5
1620 LPRINT TAB(X); "+----";
1630 NEXT X
1640 LPRINT "+"
1650 RETURN
