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

select name,created,last_modified,statement_count,description from DBA_SQLSET
```



```
NAME CREATED LAST_MODI STATEMENT_COUNT DESCRIPTION --------------- --------- --------- --------------- ---------------------------------------------------------------------------------------- sts_test_02 09-MAR-10 09-MAR-10 1 Test run 1 sts_test_01 12-FEB-10 12-FEB-10 1 an old STS test test test
```


To delete a tuning set: 
```sql
BEGIN DBMS_SQLTUNE.DROP_SQLSET(sqlset_name => 'sts_test_01'); END;
```


But you may hit this message:

> ORA-13757: "SQL Tuning Set" "string" owned by user "string" is active. Cause: The user attempted to update an active SQL Tuning Set. Action: Remove all reference to the SQL Tuning Set and retry the operation.

For example: **ORA-13757: "SQL Tuning Set" "sts\_test\_01" owned by user "badger" is active.**

[Error code reference](http://download.oracle.com/docs/cd/B19306_01/server.102/b14219/e12700.htm)

To look up why the STS is considered active, check the [SQL Tuning Information Views](http://download.oracle.com/docs/cd/B28359_01/server.111/b28274/sql_tune.htm#i35947), in this case DBA\_SQLSET\_REFERENCES


```sql
SET WRAP OFF SET LINE 140 COL NAME FOR A15 COL DESCRIPTION FOR A50 WRAPPED

select description, created, owner from DBA_SQLSET_REFERENCES where sqlset_name = 'sts_test_01';
```


which in my case showed this: 
```
DESCRIPTION CREATED OWNER -------------------------------------------------- --------- ------------------------------ created by: SQL Tuning Advisor - task: RNM_TT 12-FEB-10 badger
```


So we check for this on DBA\_ADVISOR\_TASKS: 
```sql
SET WRAP OFF SET LINE 140 COL NAME FOR A15 COL OWNER FOR A10 COL DESCRIPTION FOR A50 WRAPPED

select owner,description, created,last_modified from DBA_ADVISOR_TASKS where task_name = 'RNM_TT'
```


and it shows this: 
```
OWNER DESCRIPTION CREATED LAST_MODI ---------- -------------------------------------------------- --------- --------- badger SQL Advisor - sts_test_01 12-FEB-10 12-FEB-10
```


So now we know it's a stale SQL Tuning Advisor task that uses the SQL Tuning Set, and I definitely want to delete it:


```sql
BEGIN DBMS_SQLTUNE.DROP_TUNING_TASK(task_name => 'RNM_TT'); END;
```


and then I can delete my original SQL Tuning Set:


```sql
BEGIN DBMS_SQLTUNE.DROP_SQLSET(sqlset_name => 'sts_test_01'); END;
```


All done :)
