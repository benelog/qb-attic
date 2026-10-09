'$INCLUDE: 'qb.bi'
DIM SHARED InRegs AS RegtypeX, OutRegs AS RegtypeX
CLS
InRegs.ax = &H2C00
DO
WHILE hsec% = before
CALL interruptx(&H21, InRegs, OutRegs)
hour% = OutRegs.cx / 256
min% = OutRegs.cx AND &HFF
sec% = OutRegs.dx / 256
hsec% = OutRegs.dx AND &HFF
WEND
before = hsec%
PRINT hour%; ":"; min%; ":"; sec%; ":"; hsec%
LOOP
