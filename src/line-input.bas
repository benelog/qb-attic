DECLARE SUB Kinput (Ans$, PrCan!, Can!, Ins!)
CLS
Kinput Ans$, 20, 30, 1
PRINT
PRINT Ans$

'Ans$ 는  Kinput 서브에서 주고 받을 값
'Prcan은 화면상에 보이는 입력면적이랄까?
'Can  은  Ans$가 주고 받을 글자 갯수입니다.
'Ins를 1로 하면 삽입모드, 그외에는 수정모드입니다.

SUB Kinput (Ans$, PrCan, Can, Ins)

CONST Back = 8, TabKey = 9, Enter = 13, ESC = 27
CONST DOWN = 80, UP = 72, LEFT = 75, RIGHT = 77
CONST HOME = 71, ENDKEY = 79, PGDN = 81, PGUP = 73, InsKey = 82, Del = 83

X1 = CSRLIN: Y1 = POS(0)                       ' 실행위치

IF Y1 > 79 THEN Y1 = 1                         '
IF Y1 + PrCan > 80 THEN PrCan = 81 - Y1        '에러 검사
IF Can > 32760 THEN Can = 32760                '

DO
    Li = LEN(Ans$)                             '
    IF Li > Can THEN                           '
        Ans$ = SaveAns$                        '글자 갯수를 검사해서
        WordPoint = WordPoint - 1              '
        Move = WordPoint                       'Can보다 많으면 삭제
        Li = LEN(Ans$)                         '
    END IF                                     '

    SELECT CASE WordPoint                      '
        CASE IS < 1                            '
            WordPoint = 1                      '커서 위치에 따른
        CASE IS > Can                          '수정위치
            WordPoint = Can                    '
    END SELECT                                 '
    SELECT CASE Move                           '커서위치 조정
        CASE IS > PrCan
            Move = PrCan
        CASE IS > Can
            Move = Can
        CASE IS < 1
            Move = 1
    END SELECT

    PrAns$ = MID$(Ans$, (WordPoint - Move) + 1, PrCan)
    LOCATE X1, Y1, 0
        PRINT PrAns$;                          '화면에 나올 Ans$의 값의 일부

    SaveLi2 = Li2
    Li2 = LEN(PrAns$)
    IF SaveLi2 > Li2 THEN PRINT SPACE$(PrCan - Li2);  '글자를 지웠을때 쓰임

    PrMove = Move + (Y1 - 1)
    IF Ins = 1 THEN TopCur = 1 ELSE TopCur = 10  '수정모드와 삽입모드
    DO
        LOCATE X1, PrMove, 1, TopCur, 14         '키입력 기다림
        Ky$ = INKEY$
    LOOP WHILE Ky$ = ""

    SaveAns$ = Ans$
    IF LEN(Ky$) = 1 THEN                         '키입력 결과처리 1바이트
        SELECT CASE ASC(Ky$)
            CASE IS = Enter, ESC
                EXIT DO
            CASE IS = Back
                IF Li > 0 THEN
                    SELECT CASE WordPoint
                        CASE IS < Li
                            IF WordPoint = 1 THEN
                                Ans$ = Ans$
                            ELSE
                                Ans$ = LEFT$(Ans$, WordPoint - 2) + RIGHT$(Ans$, Li - (WordPoint - 1))
                            END IF
                        CASE IS = Li
                            IF Li > 1 THEN Ans$ = LEFT$(Ans$, WordPoint - 2) + RIGHT$(Ans$, 1)
                        CASE IS > Li
                            Ans$ = LEFT$(Ans$, WordPoint - 2)
                    END SELECT
                        Move = Move - 1
                        WordPoint = WordPoint - 1
                    IF Move < 2 AND WordPoint > 2 THEN Move = 3
                END IF
            CASE 0 TO 6, 32 TO 254
                IF Li = 0 THEN
                    Ans$ = Ky$
                ELSE
                    IF Ins = 0 THEN
                        SELECT CASE WordPoint
                            CASE IS < Li
                                IF WordPoint = 1 THEN
                                    Ans$ = Ky$ + RIGHT$(Ans$, Li - 1)
                                ELSE
                                    Ans$ = LEFT$(Ans$, WordPoint - 1) + Ky$ + RIGHT$(Ans$, Li - WordPoint)
                                END IF
                            CASE IS = Li
                                Ans$ = LEFT$(Ans$, Li - 1) + Ky$
                            CASE IS > Li
                                Ans$ = Ans$ + Ky$
                        END SELECT
                    ELSE
                        SELECT CASE WordPoint
                            CASE IS <= Li
                                IF WordPoint = 1 THEN
                                    Ans$ = Ky$ + RIGHT$(Ans$, Li)
                                ELSE
                                    Ans$ = LEFT$(Ans$, WordPoint - 1) + Ky$ + RIGHT$(Ans$, Li - (WordPoint - 1))
                                END IF
                            CASE IS > Li
                                Ans$ = Ans$ + Ky$
                        END SELECT
                    END IF
                END IF
                Move = Move + 1
                WordPoint = WordPoint + 1
        END SELECT

    ELSE
                                                        '2바이트
        Ky$ = RIGHT$(Ky$, 1)

        SELECT CASE Ky$
            CASE CHR$(RIGHT)
                Move = Move + 1
                WordPoint = WordPoint + 1
                IF Move > Li THEN Move = Li + 1
                IF WordPoint > Li THEN WordPoint = Li + 1
            CASE CHR$(LEFT)
                Move = Move - 1
                WordPoint = WordPoint - 1
            CASE CHR$(DOWN)
                EXIT DO
            CASE CHR$(UP)
                EXIT DO
            'CASE CHR$(PGDN)
            'CASE CHR$(PGUP)
            'CASE CHR$(115)
            'CASE CHR$(116)
            CASE CHR$(HOME)
                Move = 0
                WordPoint = 1
            CASE CHR$(ENDKEY)
                Move = Li + 1
                WordPoint = Li + 1
            CASE CHR$(InsKey)
                IF Ins = 1 THEN Ins = 0 ELSE Ins = 1
            CASE CHR$(Del)
                IF WordPoint < Li THEN
                    IF WordPoint = 1 THEN
                        Ans$ = RIGHT$(Ans$, Li - 1)
                    ELSE
                        Ans$ = LEFT$(Ans$, WordPoint - 1) + RIGHT$(Ans$, Li - WordPoint)
                    END IF
                ELSEIF WordPoint = Li THEN
                    Ans$ = LEFT$(Ans$, Li - 1)
                END IF
        END SELECT
    END IF
LOOP

END SUB
