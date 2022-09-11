---
title: "Materialised Views - PCT Partition Truncation"
date: "2011-01-08"
categories: 
  - "bug"
  - "dwh"
  - "mviews"
  - "oracle"
---

I've been doing some work recently that involved the use of Materialised Views on Oracle 11g (11.1.0.7), particularly around PCT refresh. There are some things that are not clear from the documentation, or are actually bugs so far as I'm concerned, and I've detailed these below.

In this example I was working on part of a DWH with c.2 millions rows aggregated up daily. One of the things that I spent a long time trying to get to work was Partition Truncation when using PCT refresh. We had tried and discarded "FAST" refresh as being completely non-performant for our volumes.

There was something about PCT that confused me for a while, and so maybe other thickos like me will also be confused so I'll clarify it here: PCT is about **Tracking** the **Change** on **Partitions** of the **detail table**. It can have interactions with a partition on an MView, but this is not where its terminology refers to.

Our desired aggregation behaviour was as follows. Given the following:

- a base fact table (partitioned by day)
- a weekly aggregation MV (partitioned by week)
- data loaded daily, MV refreshed daily

we would expect the following to be the most efficient way of refreshing the MV:

1. When we load a new day's data, for a new week: a new partition populated on the weekly MV
2. When we load a new day's data, for an _existing_ week : truncate the partition on the weekly MV, and reload it (As any fule kno, truncate/insert is going to perform better than delete/insert)
3. When existing data is updated on the base table: corresponding weekly MV partition truncated and reloaded

From what I read in the documentation, this is what PCT would be expected to do. However, it didn't work like this for us at first.

## The Answer

I've discussed these elements in more detail in sections below, but to cut to the chase, here is how we got PCT Partition Truncation to work for a detail table partitioned on day and aggregate table partitioned on week:

- In the MView definition:
    1. Partition by range or list (n.b. not interval)
    2. Join to reference table for partition key (n.b. don’t use ANSI syntax)
    
    - Eg. Day->Week aggregation, join to calendar reference table
    - Alternatively partition MView on same partition key as detail table
    
    4. Define the MView **USING NO INDEX** to prevent the default global index being created
- When refreshing the MView:
    1. alter session set "\_mv\_refresh\_costing"='rule\_pt\_pd\_fa\_co';
    2. dbms\_mview.refresh(
        - atomic\_refresh=>false
        - method=>'P' or '?'

Note: this is what **we** did to get it to work; it may be that other versions differ particularly around the \_mv\_refresh\_costing parameter and its default value. I presume there is standard disclaimer around using undocumented parameters too.

## RTFM!

Links to 11gR1 docs:

- [Basic Materialized Views](http://download.oracle.com/docs/cd/B28359_01/server.111/b28313/basicmv.htm)
- [Advanced Materialized Views](http://download.oracle.com/docs/cd/B28359_01/server.111/b28313/advmv.htm)
- [DBMS\_MVIEW](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_mview.htm)
- [CREATE MATERIALIZED VIEW](http://download.oracle.com/docs/cd/B28359_01/server.111/b28286/statements_6002.htm)
- [ALTER MATERIALIZED VIEW](http://download.oracle.com/docs/cd/B28359_01/server.111/b28286/statements_2001.htm)

## What it says in the manual

[See here for the documentation regarding PCT partition truncation.](http://download.oracle.com/docs/cd/B28359_01/server.111/b28313/advmv.htm#i1009128) There are three conditions that you must obey for it to work (although see below for a further condition):

1. **The materialized view is partitioned on the partitioning key column or join dependent expressions of the detail table.** If you think about this it makes a lot of sense. PCT is about tracking change on the partition of the detail table, and so if data in this partition changes, Oracle must be told how this relates to the data in the MView, so that it can refresh just the relevant subset of it.
    - An example of the former (partitioned on the partitioning key of the detail table) is base table and aggregate MV both partitioned on Store, or Warehouse, etc.![](/images/rnm1978/snag-2011-01-07-14-47-22-0000.png "SNAG-2011-01-07-14.47.22-0000")
    - An example of the latter (join dependent expression) is where you link to a second table in the MV definition, giving Oracle the understanding of the relation between two different partitioning columns (for example, how do weeks relate to days): ![](/images/rnm1978/snag-2011-01-07-14-48-38-0000.png "SNAG-2011-01-07-14.48.38-0000")
2. **The materialized view should be range or list partitioned**
3. **PCT refresh is nonatomic**
    - That is, you specify the atomic\_refresh parameter in your refresh call as false: \[sourcecode language="sql"\]EXEC DBMS\_MVIEW.REFRESH( \[…\], \[…\], atomic\_refresh=>false, \[…\]); \[/sourcecode\]
    - **By default (i.e. if you do not specify it), atomic\_refresh=>true**

<grumble> The documentation on all this is there, if you look for it. My personal opinion is that other functionality of Oracle DB is better documented than this, and that DBMS\_MVIEW as a whole gives away its long history in the disjointed nature of the documentation. If it were re-written today with a focus on data warehousing I'm confident it would be clearer. Anyway, that's my excuse for not RTFMing properly... </grumble>

## What it doesn't say in the manual

Despite having met all the above conditions for PCT partition truncation, it still wasn’t happening. When adding or updating data for an existing weekly partition, we always saw DELETE … INSERT, rather than TRUNCATE … INSERT. The DELETE took ages, as would be expected

A 10979 trace (see below) on the MView refresh showed this crucial line : \[sourcecode\] \[...\]

Value of \_mv\_refresh\_costing : rule

\[...\] \[/sourcecode\]

This undocumented parameter is at the very heart of getting PCT partition truncation. By default it is set to Rule, which means that you will get DELETE ... INSERT and never TRUNCATE...INSERT. There is a document on My Oracle Support: [PCT REFRESH ISSUES DELETE WHERE IT SHOULD ISSUE TRUNCATE (Doc ID 733673.1)](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=733673.1).

The suggested solution is to set it to Cost, which instructs Oracle to cost the different options and use the best for the given situation. However, during testing we saw an instance of bad costing on this leading Oracle to still DELETE instead of TRUNCATE. Therefore, we opted for forcing the choice through rule, but specified in order of preference: \[sourcecode language="sql"\] alter session set "\_mv\_refresh\_costing"='rule\_pt\_pd\_fa\_co'; \[/sourcecode\] where:

- pt = PCT – TRUNC _(i.e. TRUNCATE ... INSERT)_
- pd = PCT – DEL/TRUNC _(i.e. DELETE ... INSERT)_
- fa = FAST
- co = COMPLETE

(Credit: "wilhelm2000" on [this OTN forum post](http://forums.oracle.com/forums/thread.jspa?threadID=569191))

N.B. Despite the 'TRUNC' in the name, "PCT - DEL/TRUNC" does not do a TRUNCATE - maybe the name comes from DELETE being used as a kind of TRUNCATE?

## \[What it kind of says in the manual\] - Default global index

Our elation at seeing a TRUNCATE occur was short-lived, because the refresh still took ages to run.

After a bit of head-scratching and more RTFMing, we found that the reason for the slow refresh time was down to a default global index that is created on MViews. Named I\_SNAP$.\[...\], they are used when you do "fast" (incremental) refreshes, using the mv$log tables. However, if you're only doing PCT refreshes of a MView, they are a positive hindrance because they need rebuilding every time. On an MView with millions of rows this takes a long time.

Here is an abridged trace for a PCT-Truncate refresh of an MView with the default global index in place: \[sourcecode language="sql"\] /\* MV\_REFRESH (IND\_UNUSABLE) \*/ ALTER INDEX "HR"."I\_SNAP$\_MV\_WEEK" UNUSABLE

ALTER TABLE "HR"."MV\_WEEK" TRUNCATE PARTITION PART\_20101122 UPDATE GLOBAL INDEXES

/\* MV\_REFRESH (INS) \*/ INSERT /\*+ SKIP\_UNQ\_UNUSABLE\_IDX APPEND BYPASS\_RECURSIVE\_CHECK \*/ INTO\[…\]

BEGIN sys.dbms\_index\_utl.multi\_level\_build(index\_list=>'"HR"."I\_SNAP$\_MV\_WEEK"',just\_unusable=>TRUE, cont\_after\_err=>TRUE, concurrent=>TRUE); END; \[/sourcecode\]

By defining the MView using the USING NO INDEX clause, the global index is not created and the PCT-Truncate works much more efficiently: \[sourcecode language="sql"\] ALTER TABLE "HR"."MV\_WEEK" TRUNCATE PARTITION\[…\]

/\* MV\_REFRESH (INS) \*/ INSERT /\*+ APPEND \[…\] \[/sourcecode\]

## Refresh method

To get PCT refresh, use method=>'P' \[sourcecode language="sql"\]EXEC DBMS\_MVIEW.REFRESH( \[…\], \[…\], method=>'P', \[…\]); \[/sourcecode\] You can also use method=>'?' where Oracle will try PCT first, and then Complete if PCT is not possible. However, if PCT isn't possible you may have a problem that you want to know about rather than rebuilding the MV each time without you being aware of it.

## Bug: Interval Partitioned MView and PCT Partition Truncation

Interval partitioning removes the headache of partition management for new data. Unfortunately, it appears that you can’t partition MViews and refresh them using PCT partition truncation. If you try to PCT partition truncate refresh an interval-partitioned MView, you get this error: \[sourcecode\] ERROR at line 1: ORA-12008: error in materialized view refresh path ORA-00936: missing expression ORA-06512: at "SYS.DBMS\_SNAPSHOT", line 2545 ORA-06512: at "SYS.DBMS\_SNAPSHOT", line 2751 ORA-06512: at "SYS.DBMS\_SNAPSHOT", line 2720 ORA-06512: at line 1 \[/sourcecode\]

You don't get the error if you do a non-atomic refresh - but if you do a non-atomic refresh you don't get partition truncation (you get DELETE instead).

Test case: [mv\_issue\_01a.sql](http://rnm1978.wordpress.com/mv_issue_01a-sql/)

## Bug: MView defined with ANSI SQL

This will probably have some people exclaiming "serves you right ..." but ANSI SQL joins (INNER JOIN etc, instead of joining tables in the WHERE clause) is what I was brought up on. I discovered after several frustrating hours that you shouldn't use it when you define MViews, as it can result in an erroneous "COMPILATION ERROR" state for the MView when data on the base table is changed. There's a of MOS article: [Mview Refresh Fails And COMPILE\_STATE => COMPILATION\_ERROR (Doc ID 1081493.1)](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=1081493.1), which refers to bug [5759944](https://supporthtml.oracle.com/ep/faces/secure/km/BugDisplay.jspx?id=5759944&bugProductSource=Oracle) and for which there's a patch number. It's supposedly fixed in 11.2 but appears to still be present in 11.2.0.1.0.

Test case: [mv\_issue\_02.sql](http://rnm1978.wordpress.com/mv_issue_02-sql/)

## 10979 Tracing

To understand exactly what happens when a MView refresh takes place, you can enable tracing using: \[sourcecode language="sql"\] -- enable the trace alter session set events '10979 trace name context forever'; -- SQL commands to trace go here \[...\] -- Disable the trace alter session set events '10979 trace name context off'; \[/sourcecode\]

Here's an annotated trace log of a successful PCT partition truncation MView refresh:

First is one of the key bits - is the refresh atomic (atomic\_refresh=>'true', which is the default) or non-atomic (atomic\_refresh=>'false') which is required for PCT partition truncation \[sourcecode\] NON ATOMIC REFRESH ON DEMAND REFRESH

ONLY TRUNCATE based PCT REFRESH possible \[/sourcecode\] Next follows the statements that Oracle would execute, for all of the MV refresh methods that it thinks are applicable in this refresh scenario.

Method 4 is a DELETE ... INSERT, whilst Method 5 is TRUNCATE ... INSERT. Note that the global index hasn't been removed from the MView, hence the additional index maintenance commands

\[sourcecode\] Refresh Method 4 REFRESH Stmt 0 /\* MV\_REFRESH (DEL) \*/ DELETE FROM "HR"."MV\_WEE\[...\] REFRESH Stmt 1 /\* MV\_REFRESH (INS) \*/ INSERT /\*+ BYPASS\_RECURSIVE\_CHEC\[...\]

Refresh Method 5 REFRESH Stmt 0 /\* MV\_REFRESH (IND\_UNUSABLE) \*/ ALTER INDEX "HR\[...\] REFRESH Stmt 1 ALTER TABLE "HR"."MV\_WEEK" TRUNCATE PARTITION \[...\] REFRESH Stmt 2 /\* MV\_REFRESH (INS) \*/ INSERT /\*+ SKIP\_UNQ\_UNUSABLE\_IDX\[...\] REFRESH Stmt 3 BEGIN sys.dbms\_index\_utl.multi\_level\_build(index\_list=\[...\] \[/sourcecode\] Watch out for this parameter value - it's crucial! \[sourcecode\]

Value of \_mv\_refresh\_costing : COST

\[/sourcecode\] By default (11.1.0.7) it's "RULE" and will do DELETE...INSERT \*always\* instead of TRUNCATE...INSERT

If you're using COST, then the cost of the possible refresh methods will be calculated: \[sourcecode\] REFRESH STATEMENT /\* MV\_REFRESH (DEL) \*/ DELETE FROM "HR"."MV\_WEE\[...\] COST = 4.002855 REFRESH STATEMENT /\* MV\_REFRESH (INS) \*/ INSERT /\*+ BYPASS\_RECURSIVE\_CHEC\[...\] COST = 2.571476 TOTAL COST OF REFRESH = 6.574331

REFRESH STATEMENT /\* MV\_REFRESH (IND\_UNUSABLE) \*/ ALTER INDEX "HR\[...\] COST = 0.000000 REFRESH STATEMENT ALTER TABLE "HR"."MV\_WEEK" TRUNCATE PARTITION \[...\] COST = 0.000000 REFRESH STATEMENT /\* MV\_REFRESH (INS) \*/ INSERT /\*+ SKIP\_UNQ\_UNUSABLE\_IDX\[...\] COST = 2.279282 REFRESH STATEMENT BEGIN sys.dbms\_index\_utl.multi\_level\_build(index\_list=\[...\] COST = 0.000000 TOTAL COST OF REFRESH = 2.279282

\[/sourcecode\] After costing, or by rule, the method chosen will be stated: \[sourcecode\]

Refresh method picked PCT - TRUNC

\[/sourcecode\] Oracle then records the actual statements executed: \[sourcecode\]

Executed Stmt - /\* MV\_REFRESH (IND\_UNUSABLE) \*/ ALTER INDEX "HR\[...\] Executed Stmt - ALTER TABLE "HR"."MV\_WEEK" TRUNCATE PARTITION \[...\] Executed Stmt - /\* MV\_REFRESH (INS) \*/ INSERT /\*+ SKIP\_UNQ\_UNUSABLE\_IDX\[...\] Executed Stmt - BEGIN sys.dbms\_index\_utl.multi\_level\_build(index\_list=\[...\]

\[/sourcecode\]

A final word of warning - remember that the trace file is an internal diagnostic, it is not for user-consumption. I spent a while worrying about this entry in the log: \[sourcecode\] PARSE ERROR #19:len=12330 dep=1 uid=142 oct=3 lid=142 tim=35441256289311 err=10980 SELECT "R"."BSNS\_WK\_KEY" "WK\_KEY","D"."SOURCE\_SYSTEM\_KEY" "SOURCE\_SYSTEM\_KEY","D"." CLOSE #19:c=0,e=0,dep=1,type=0,tim=35441256289311 \[/sourcecode\] Even though there was no error returned to the user session calling the refresh, I figured this must be some problem. However, according to MOS doc [Errors In Refresh Snapshot Trace Files ORA-10980 (Doc ID 294513.1)](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=294513.1) the parse error is raised and cleared internally and therefore nothing to worry about.
