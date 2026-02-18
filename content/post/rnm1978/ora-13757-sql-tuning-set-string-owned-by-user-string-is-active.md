---
title: "ORA-13757: \"SQL Tuning Set\" \"string\" owned by user \"string\" is active."
date: "2010-03-09"
categories: 
  - "oracle"
  - "performance"
---

I've been playing around with [SQL Tuning Sets](http://download.oracle.com/docs/cd/B28359_01/server.111/b28274/sql_tune.htm#i34915), and was trying to clear up my mess.

To list all the tuning sets: 
```sql
SET WRAP OFF SET LINE 140 COL NAME FOR A15 COL DESCRIPTION FOR A50 WRAPPED

select name,created,last\_modified,statement\_count,description from DBA\_SQLSET
```



```
NAME CREATED LAST\_MODI STATEMENT\_COUNT DESCRIPTION --------------- --------- --------- --------------- ---------------------------------------------------------------------------------------- sts\_test\_02 09-MAR-10 09-MAR-10 1 Test run 1 sts\_test\_01 12-FEB-10 12-FEB-10 1 an old STS test test test
```


To delete a tuning set: 
```sql
BEGIN DBMS\_SQLTUNE.DROP\_SQLSET(sqlset\_name => 'sts\_test\_01'); END;
```


But you may hit this message:

> ORA-13757: "SQL Tuning Set" "string" owned by user "string" is active. Cause: The user attempted to update an active SQL Tuning Set. Action: Remove all reference to the SQL Tuning Set and retry the operation.

For example: **ORA-13757: "SQL Tuning Set" "sts\_test\_01" owned by user "badger" is active.**

[Error code reference](http://download.oracle.com/docs/cd/B19306_01/server.102/b14219/e12700.htm)

To look up why the STS is considered active, check the [SQL Tuning Information Views](http://download.oracle.com/docs/cd/B28359_01/server.111/b28274/sql_tune.htm#i35947), in this case DBA\_SQLSET\_REFERENCES


```sql
SET WRAP OFF SET LINE 140 COL NAME FOR A15 COL DESCRIPTION FOR A50 WRAPPED

select description, created, owner from DBA\_SQLSET\_REFERENCES where sqlset\_name = 'sts\_test\_01';
```


which in my case showed this: 
```
DESCRIPTION CREATED OWNER -------------------------------------------------- --------- ------------------------------ created by: SQL Tuning Advisor - task: RNM\_TT 12-FEB-10 badger
```


So we check for this on DBA\_ADVISOR\_TASKS: 
```sql
SET WRAP OFF SET LINE 140 COL NAME FOR A15 COL OWNER FOR A10 COL DESCRIPTION FOR A50 WRAPPED

select owner,description, created,last\_modified from DBA\_ADVISOR\_TASKS where task\_name = 'RNM\_TT'
```


and it shows this: 
```
OWNER DESCRIPTION CREATED LAST\_MODI ---------- -------------------------------------------------- --------- --------- badger SQL Advisor - sts\_test\_01 12-FEB-10 12-FEB-10
```


So now we know it's a stale SQL Tuning Advisor task that uses the SQL Tuning Set, and I definitely want to delete it:


```sql
BEGIN DBMS\_SQLTUNE.DROP\_TUNING\_TASK(task\_name => 'RNM\_TT'); END;
```


and then I can delete my original SQL Tuning Set:


```sql
BEGIN DBMS\_SQLTUNE.DROP\_SQLSET(sqlset\_name => 'sts\_test\_01'); END;
```


All done :)
