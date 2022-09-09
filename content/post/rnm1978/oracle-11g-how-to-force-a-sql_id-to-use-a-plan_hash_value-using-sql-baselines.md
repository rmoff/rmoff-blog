---
title: "Oracle 11g - How to force a sql_id to use a plan_hash_value using SQL Baselines"
date: "2011-06-28"
categories: 
  - "etl"
  - "oracle"
  - "performance"
  - "plan-management"
  - "sql-plan-baseline"
---

Here's a scenario that'll be depressingly familiar to most reading this: after ages of running fine, and no changes to the code, a query suddenly starts running for magnitudes longer than it used to.

In this instance it was an ETL step which used to take c.1 hour, and was now at 5 hours and counting. Since it still hadn't finished, and the gods had conspired to bring down Grid too (unrelated), I generated a SQL Monitor report to see what was happening: \[sourcecode language="sql"\] select DBMS\_SQLTUNE.REPORT\_SQL\_MONITOR( type=>'HTML', report\_level=>'ALL',sql\_id=>'939abmqmvcc4d') as report FROM dual; \[/sourcecode\] (h/t to [Martin Berger](http://twitter.com/martinberx/status/85295030713073664) for this)

It showed a horrendous explain plan: [![](http://rnm1978.files.wordpress.com/2011/06/snag-2011-06-28-13-53-23-0000.png?w=700 "SNAG-2011-06-28-13.53.23-0000")](http://rnm1978.files.wordpress.com/2011/06/snag-2011-06-28-13-53-23-0000.png)

Using [Kerry Osborne's script](http://kerryosborne.oracle-guy.com/scripts/awr_plan_change.sql) to look at the plan\_hash\_value over time from AWR, it was clear that the CBO had picked a new, bad, explain plan. ![](/images/rnm1978/snag-2011-06-28-14-03-56-0000.png "SNAG-2011-06-28-14.03.56-0000")

So we knew the sql\_id, and we knew the plan\_hash\_value of the plan which we wanted the CBO to use. But how to do this?

Back to Kerry Osborne again, and his article about [SQL Plan Baselines](http://kerryosborne.oracle-guy.com/2009/04/oracle-11g-sql-plan-management-sql-plan-baselines/). He (and others) write in detail about how and what SQL Plan Baselines are, but in essence it lets you tell Oracle which plan to use (or optionally, prefer) for a given sql\_id.

Since the desired plan\_hash\_value was no longer in the cursor cache, we could get it back from AWR, loaded in via a SQL Tuning Set. Here's the code with in-line comments explaining the function of each block: \[sourcecode language="sql"\] /\* Set up a SQL Baseline using known-good plan, sourced from AWR snapshots http://rnm1978.wordpress.com/

In this example, sql\_id is 939abmqmvcc4d and the plan\_hash\_value of the good plan that we want to force is 1239572551 \*/

\-- Drop SQL Tuning Set (STS) BEGIN DBMS\_SQLTUNE.DROP\_SQLSET( sqlset\_name => 'MySTS01'); END;

\-- Create SQL Tuning Set (STS) BEGIN DBMS\_SQLTUNE.CREATE\_SQLSET( sqlset\_name => 'MySTS01', description => 'SQL Tuning Set for loading plan into SQL Plan Baseline'); END;

\-- Populate STS from AWR, using a time duration when the desired plan was used -- List out snapshot times using : SELECT SNAP\_ID, BEGIN\_INTERVAL\_TIME, END\_INTERVAL\_TIME FROM dba\_hist\_snapshot ORDER BY END\_INTERVAL\_TIME DESC; -- Specify the sql\_id in the basic\_filter (other predicates are available, see documentation) DECLARE cur sys\_refcursor; BEGIN OPEN cur FOR SELECT VALUE(P) FROM TABLE( dbms\_sqltune.select\_workload\_repository(begin\_snap=>22673, end\_snap=>22710,basic\_filter=>'sql\_id = ''939abmqmvcc4d''',attribute\_list=>'ALL') ) p; DBMS\_SQLTUNE.LOAD\_SQLSET( sqlset\_name=> 'MySTS01', populate\_cursor=>cur); CLOSE cur; END; /

\-- List out SQL Tuning Set contents to check we got what we wanted SELECT first\_load\_time , executions as execs , parsing\_schema\_name , elapsed\_time / 1000000 as elapsed\_time\_secs , cpu\_time / 1000000 as cpu\_time\_secs , buffer\_gets , disk\_reads , direct\_writes , rows\_processed , fetches , optimizer\_cost , sql\_plan , plan\_hash\_value , sql\_id , sql\_text FROM TABLE(DBMS\_SQLTUNE.SELECT\_SQLSET(sqlset\_name => 'MySTS01') );

\-- List out the Baselines to see what's there SELECT \* FROM dba\_sql\_plan\_baselines ;

\-- Load desired plan from STS as SQL Plan Baseline -- Filter explicitly for the plan\_hash\_value here if you want DECLARE my\_plans pls\_integer; BEGIN my\_plans := DBMS\_SPM.LOAD\_PLANS\_FROM\_SQLSET( sqlset\_name => 'MySTS01', basic\_filter=>'plan\_hash\_value = ''1239572551''' ); END; /

\-- List out the Baselines SELECT \* FROM dba\_sql\_plan\_baselines ; \[/sourcecode\]

Now when the query's run, it will use the desired plan.

Things to note:

- In 10g and 11gR1 the default for SELECT\_WORKLOAD\_REPOSITORY is to return only BASIC information, which excludes the plan! So DBMS\_SPM.LOAD\_PLANS\_FROM\_SQLSET doesn't load any plans.
    - It doesn't throw a warning either, which it could sensibly, since the STS has no plan, and it can see that</grumble>
    - This changes to TYPICAL in 11gR2 (thanks [Surachart](http://twitter.com/surachart/status/85666985681227776)!)
- Parameter "optimizer\_use\_sql\_plan\_baselines" must be set to TRUE for a baseline to be used
- Flush the cursor cache after loading the baseline to make sure it gets picked up on next execution of the sql\_id

References:

- [Managing SQL Plan Baselines](http://download.oracle.com/docs/cd/B28359_01/server.111/b28274/optplanmgmt.htm#CHDCFBAA)
- [SQL Tuning Sets](http://download.oracle.com/docs/cd/B28359_01/server.111/b28274/sql_tune.htm#i34915)
- [DBMS\_SPM](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_spm.htm#ARPLS150)
- [DBMS\_SQLTUNE](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_sqltun.htm#CHDGAJCI)

_Thanks to [John Hallas](http://jhdba.wordpress.com/) for his help with this problem._
