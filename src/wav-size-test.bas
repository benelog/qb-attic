 DIM lf AS INTEGER
 f$ = "c:\flag\don2.wav"
 OPEN f$ FOR RANDOM AS #1 LEN = 200
 FIELD 1, 200 AS R$
 PRINT LOF(1)
 lf = LOF(1)
 CLOSE
