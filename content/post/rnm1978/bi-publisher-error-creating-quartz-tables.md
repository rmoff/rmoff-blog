---
title: "BI Publisher - error creating Quartz tables"
date: "2010-08-25"
categories: 
  - "bi-publisher"
  - "quartz"
---

A very short blog post to break the drought, but I didn't hit any google results for this error so thought it might be useful to record it.

In BI Publisher 10.1.3.4, trying to install the Scheduler (Quartz) schema, I got this error:


```
Schema installation failed while creating tables. Schema may already exist. Please remove the existing schema or choose another database and try again.
```


To me, the error text is a bit unhelpful. Whilst the first statement is correct - "Schema installation failed while creating tables", it doesn't tell you the error it encountered, and then it goes on to suggest only one reason for the failure.

The problem in this case was that my user didn't have privileges to create the tables: 
```sql
SQL> create table test_table (col1 int);
create table test_table (col1 int)
*
ERROR at line 1:
ORA-01031: insufficient privileges
```


Granting the CREATE TABLE privilege resolved the problem.
