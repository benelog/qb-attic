OPEN "data.msg" FOR OUTPUT AS #1
FOR i = 1 TO 29
PRINT #1, i; ",";
NEXT i
CLOSE #1
