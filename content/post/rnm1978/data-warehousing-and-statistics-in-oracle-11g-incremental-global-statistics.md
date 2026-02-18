---
title: "Data Warehousing and Statistics in Oracle 11g - incremental global statistics"
date: "2010-12-30"
categories:
  - "etl"
  - "oracle"
  - "statistics"
---

This is a series of posts where I hope to humbly plug some gaps in the information available (or which has escaped my [google-fu](http://www.urbandictionary.com/define.php?term=google-fu)) regarding statistics management in Oracle 11g specific to Data Warehousing.

Incremental Global Statistics is new functionality in Oracle 11g (and 10.2.0.4?) and is explained in depth in several places including:

- [Oracle® Database Performance Tuning Guide - Statistics on Partitioned Objects](http://download.oracle.com/docs/cd/B28359_01/server.111/b28274/stats.htm#i42218)
- [Greg Rahn - Oracle 11g: Incremental Global Statistics On Partitioned Tables](http://structureddata.org/2008/07/16/oracle-11g-incremental-global-statistics-on-partitioned-tables/)
- [Inside the Oracle Optimiser - Maintaining statistics on large partitioned tables](http://blogs.oracle.com/optimizer/2009/02/maintaining_statistics_on_large_partitioned_tables.html)
- [Amit Poddar - One Pass Distinct Sampling](http://www.oraclegeek.net/downloads/One_Pass_Distinct_Sampling.ppt) (ppt - slides 52 onwards are most relevant)

In essence, Oracle maintains information about each partition when statistics is gathered on the partition, and it uses this to work out the global statistics - without having to scan the whole table. For a more detailed description, see the above links. It's important to note that this is not the same as aggregated global statistics (which Doug Burns [covers in detail here](http://oracledoug.com/serendipity/index.php?/archives/1590-Statistics-on-Partitioned-Tables-Contents.html))

To use it, you there are two conditions:

1. The `INCREMENTAL` value for a partition table is set to `TRUE`
2. You gather statistics on that table with the `GRANULARITY` parameter set to `AUTO`

## Too good to be true?

From what I'd read, it sounded ideal for what we do, which is load big (10M+ rows per day) tables, partitioned on day. However, when I started testing it I discovered what may be a problem. The information about each partition is stored in the SYSAUX tablespace in two tables:

- `SYS.WRI$_OPTSTAT_SYNOPSIS_HEAD$`
- `SYS.WRI$_OPTSTAT_SYNOPSIS$`

Looking at the `WRI$_OPTSTAT_SYNOPSIS$` table on one of our databases, it had 216 million rows in and took up about 16GB of space. The documentation does say "the SYSAUX tablespace consumes additional space to maintain the global statistics" but this is an awful lot of space.

When I ran a test to gather incremental statistics on a two-partition table with a single row in each partition, it took three minutes to gather stats each time! A quick look at SQL Monitor showed that a lot of the time was spent on a `DELETE` from `WRI$_OPTSTAT_SYNOPSIS$`.

In a database with no other data in `WRI$_OPTSTAT_SYNOPSIS$`, the stats gather was sub-second.

Looking at the data on `WRI$_OPTSTAT_SYNOPSIS$`, it can be determined that for every table, partition, and column, there is an entry on the header table `WRI$_OPTSTAT_SYNOPSIS_HEAD$`. There is a unique synopsis number given to each combination, which has one or many entries on the synopsis hash table `WRI$_OPTSTAT_SYNOPSIS$`. There seems to be one hash for every distinct value in the table/partition/column.

## Behind the scenes

You can check whether a table is set for `INCREMENTAL` global statistics in two ways. For an individual table, `dbms_stats.get_prefs` will return the value:

```sql
select dbms_stats.get_prefs(ownname=>'HR',pname=>'INCREMENTAL', tabname=>'BASE_T1') from dual;
```

Alternatively, to list all tables in the database that have INCREMENTAL set, use this:

```sql
select u.name "OWNER" ,o.name "TABLE_NAME" ,p.valchar from sys.OPTSTAT_USER_PREFS$ p inner join sys.obj$ o on p.obj#=o.obj# inner join sys.user$ u on o.owner#=u.user# where p.PNAME = 'INCREMENTAL'

```

To look at the synopses (synopsii?), use this query:

```sql
SELECT u.NAME "owner", o.NAME "table_name", p.subname "partition_name", c.NAME "column_name", to_char(h.analyzetime, 'YYYY-MM-DD-HH24:MI:SS') "analyse_Time", COUNT(*) "hash entries" FROM sys.wri$_optstat_synopsis_head$ h left join sys.`WRI$_OPTSTAT_SYNOPSIS$` s ON h.synopsis# = s.synopsis# left join sys.obj$ o ON h.bo# = o.obj# left join sys.user$ u ON o.owner# = u.user# left join sys.col$ c ON h.bo# = c.obj# AND h.intcol# = c.intcol# left join (SELECT bo#, obj# FROM sys.tabpart$ UNION ALL SELECT bo#, obj# FROM sys.tabcompart$) tp ON h.bo# = tp.bo# AND h.group# = tp.obj# * 2 left join sys.obj$ p ON tp.obj# = p.obj# GROUP BY u.NAME, o.NAME, p.subname, c.NAME, h.analyzetime ORDER BY u.NAME, o.NAME, c.NAME;

```

## Test case

This is the test case I've been using to investigate the issue. It is hopefully self-documenting.

I've written a set of queries that examine the statistics in the data dictionary so that I can see how they get built up. USER_TAB_STATS_HISTORY is good for seeing a chronological record of the stats gathers.

```sql
/* https://rmoff.net */

\-- -- ***************************** -- test_incr_stats.sql -- -- Test incremental statistic gathering -- ***************************** --

set echo off
set timing off
set feedback on

prompt
prompt ************
prompt Check the current size of the synopsis table `WRI$_OPTSTAT_SYNOPSIS$`

select table_name, num_rows from dba_tables where table_name like 'WRI$_OPTSTAT_SYNOPSIS%';

select to_char(min(h.analyzetime),'YYYY-MM-DD-HH24:MI:SS') "Earliest Synopsis" FROM SYS.WRI$_OPTSTAT_SYNOPSIS_HEAD$ h;

prompt
prompt ************
prompt Create a simple test table

drop table BASE_T1;
CREATE TABLE BASE_T1 ( day_key INTEGER, store_num INTEGER, fact_01 NUMBER(38,4) DEFAULT 0) PARTITION BY RANGE ( "DAY_KEY") ( PARTITION PART_1 VALUES LESS THAN (2) NOCOMPRESS, PARTITION PART_2 VALUES LESS THAN (3) NOCOMPRESS) PARALLEL;

prompt
prompt ************
prompt Set the table to INCREMENTAL stats
exec dbms_stats.set_table_prefs(pname=>'INCREMENTAL',ownname=>USER,tabname=>'BASE_T1',pvalue=>'TRUE');

prompt
prompt ************
prompt Gather initial stats
set timing on
exec dbms_stats.gather_table_stats( ownname=>USER, tabname=>'BASE_T1', granularity=>'AUTO');
set timing off

prompt
prompt ************
prompt Add one row of data to partition 1
insert into base_t1 (day_key,store_num,fact_01) values (1, 1,10);

prompt
prompt ************
prompt Gather stats
set timing on
exec dbms_stats.gather_table_stats( ownname=>USER, tabname=>'BASE_T1', granularity=>'AUTO');
set timing off

prompt
prompt ************
prompt Add one row of data to partition 2
insert into base_t1 (day_key,store_num,fact_01) values (2, 1,10);

prompt
prompt ************
prompt Gather stats
set timing on
exec dbms_stats.gather_table_stats( ownname=>USER, tabname=>'BASE_T1', granularity=>'AUTO');
set timing off

prompt
prompt ************
prompt Add another row of data to partition 1, with a new store_num value
insert into base_t1 (day_key,store_num,fact_01) values (1, 2,10);

prompt
prompt ************
prompt Gather stats
set timing on exec
dbms_stats.gather_table_stats( ownname=>USER, tabname=>'BASE_T1', granularity=>'AUTO');
set timing off

set linesize 156 col table_name for a12 col partition_name for a14 col column_name for a12 col high_value for a8 col low_value for a8 col global_stats head "Global|Stats" for a7 col stale_stats head "Stale|Stats" for a5

prompt
prompt Incremental stats setting:
select dbms_stats.get_prefs(ownname=>USER,pname=>'INCREMENTAL', tabname=>'BASE_T1') from dual;

prompt
prompt Actual data in the table:
select day_key,count(*) from BASE_T1 group by day_key order by day_key asc;

prompt
prompt USER_TAB_STATISTICS:
select table_name,partition_name,num_rows,sample_size, to_char(last_analyzed,'YYYY-MM-DD-HH24:MI:SS') "Last Analyzed",global_stats,stale_stats from user_tab_statistics where table_name='BASE_T1';

prompt
prompt USER_TAB_STATS_HISTORY:
select table_name,partition_name,stats_update_time from user_tab_stats_history where table_name='BASE_T1' order by stats_update_time asc ;

prompt
prompt USER_TAB_COL_STATISTICS:
select table_name,column_name,sample_size,to_char(last_analyzed,'YYYY-MM-DD-HH24:MI:SS') "Last Analyzed", global_stats,num_distinct,low_value,high_value from USER_TAB_COL_STATISTICS where table_name='BASE_T1';

prompt
prompt USER_PART_COL_STATISTICS:
select table_name,partition_name,column_name,sample_size,to_char(last_analyzed,'YYYY-MM-DD-HH24:MI:SS') "Last Analyzed", global_stats,num_distinct,low_value,high_value from USER_PART_COL_STATISTICS where table_name='BASE_T1';

prompt
prompt Synopsis data:
SELECT o.name "TABLE_NAME" ,p.subname "Part" ,c.name "Column" ,to_char(h.analyzetime,'YYYY-MM-DD-HH24:MI:SS') "Analyse Time" ,count(*) "Hash count" FROM SYS.WRI$_OPTSTAT_SYNOPSIS_HEAD$ h left join sys.`WRI$_OPTSTAT_SYNOPSIS$` s on h.synopsis# = s.synopsis# left join sys.obj$ o on h.bo#=o.obj# left join sys.user$ u on o.owner#=u.user# left join sys.col$ c on h.bo#=c.obj# and h.intcol# = c.intcol# left join (select bo#,obj# from sys.tabpart$ union all select bo#,obj# from sys.tabcompart$) tp on h.bo#=tp.bo# and h.group#=tp.obj#*2 left join sys.obj$ p on tp.obj#=p.obj# where u.name = USER and o.name = 'BASE_T1' group by u.name,o.name ,p.subname,c.name,h.analyzetime order by u.name,o.name;
```


## Results

This was run on Oracle 11.1.0.7, on several different databases. I've edited the output slightly for brevity.

Where SYS.WRI$_OPTSTAT_SYNOPSIS is small, it can be seen that the stats gather is fast - as would be expected for a table so small:

```
************ Check the current size of the synopsis table `WRI$_OPTSTAT_SYNOPSIS$`

TABLE_NAME   NUM_ROWS
------------ ----------
WRI$_OPTSTAT 0
WRI$_OPTSTAT 1940
WRI$_OPTSTAT 287236

Gather initial stats PL/SQL procedure successfully completed.
Elapsed: 00:00:00.16

************ Add one row of data to partition 1
************ Gather stats PL/SQL procedure successfully completed.
Elapsed: 00:00:00.27
************ Add one row of data to partition 2
************ Gather stats PL/SQL procedure successfully completed.
Elapsed: 00:00:00.27
************ Add another row of data to partition 1, with a new store_num value
************ Gather stats PL/SQL procedure successfully completed.
Elapsed: 00:00:00.34

Incremental stats setting:
DBMS_STATS.GET_PREFS(OWNNAME=>USER,PNAME=>'INCREMENTAL',TABNAME=>'BASE_T1')
------------------------------------------------------------------------------------------------
TRUE

Actual data in the table:

DAY_KEY     COUNT(*)
----------  ----------
1           2
2           1

2 rows selected.

USER_TAB_STATISTICS:

Global Stale TABLE_NAME PARTITION_NAME NUM_ROWS SAMPLE_SIZE Last Analyzed Stats Stats ------------ -------------- ---------- ----------- ------------------- ------- ----- BASE_T1 3 3 2010-12-30-18:04:56 YES NO BASE_T1 PART_1 2 2 2010-12-30-18:04:56 YES NO BASE_T1 PART_2 1 1 2010-12-30-18:04:56 YES NO

3 rows selected.

USER_TAB_STATS_HISTORY:

TABLE_NAME PARTITION_NAME STATS_UPDATE_TIME ------------ -------------- --------------------------------------------------------------------------- BASE_T1 PART_1 30-DEC-10 18.04.55.633710 +00:00 BASE_T1 PART_2 30-DEC-10 18.04.55.633710 +00:00 BASE_T1 30-DEC-10 18.04.55.645162 +00:00 BASE_T1 PART_1 30-DEC-10 18.04.55.856920 +00:00 BASE_T1 30-DEC-10 18.04.55.910722 +00:00 BASE_T1 PART_2 30-DEC-10 18.04.56.126645 +00:00 BASE_T1 30-DEC-10 18.04.56.181336 +00:00 BASE_T1 PART_1 30-DEC-10 18.04.56.442624 +00:00 BASE_T1 30-DEC-10 18.04.56.527702 +00:00

9 rows selected.

USER_TAB_COL_STATISTICS:

Global TABLE_NAME COLUMN_NAME SAMPLE_SIZE Last Analyzed Stats NUM_DISTINCT LOW_VALU HIGH_VAL ------------ ------------ ----------- ------------------- ------- ------------ -------- -------- BASE_T1 DAY_KEY 3 2010-12-30-18:04:56 YES 2 C102 C103 BASE_T1 STORE_NUM 3 2010-12-30-18:04:56 YES 2 C102 C103 BASE_T1 FACT_01 3 2010-12-30-18:04:56 YES 1 C10B C10B

3 rows selected.

USER_PART_COL_STATISTICS:

Global TABLE_NAME PARTITION_NAME COLUMN_NAME SAMPLE_SIZE Last Analyzed Stats NUM_DISTINCT LOW_VALU HIGH_VAL ------------ -------------- ------------ ----------- ------------------- ------- ------------ -------- -------- BASE_T1 PART_1 DAY_KEY 2 2010-12-30-18:04:56 YES 1 C102 C102 BASE_T1 PART_1 STORE_NUM 2 2010-12-30-18:04:56 YES 2 C102 C103 BASE_T1 PART_1 FACT_01 2 2010-12-30-18:04:56 YES 1 C10B C10B BASE_T1 PART_2 DAY_KEY 1 2010-12-30-18:04:56 YES 1 C103 C103 BASE_T1 PART_2 STORE_NUM 1 2010-12-30-18:04:56 YES 1 C102 C102 BASE_T1 PART_2 FACT_01 1 2010-12-30-18:04:56 YES 1 C10B C10B

6 rows selected.

Synopsis data:

TABLE_NAME Part Column Analyse Time Hash count ------------ ------------------------------ ------------------------------ ------------------- ---------- BASE_T1 PART_2 DAY_KEY 2010-12-30-18:04:56 1 BASE_T1 PART_2 FACT_01 2010-12-30-18:04:56 1 BASE_T1 PART_1 STORE_NUM 2010-12-30-18:04:56 2 BASE_T1 PART_1 DAY_KEY 2010-12-30-18:04:56 1 BASE_T1 PART_2 STORE_NUM 2010-12-30-18:04:56 1 BASE_T1 PART_1 FACT_01 2010-12-30-18:04:56 1

6 rows selected.

```


Note that there are two hash values for the synopsis for PART_1 column STORE_NUM, because there are two values in the column in that partition.

You can see clearly from USER_TAB_STATS_HISTORY three things:

1. The order in which stats are gathered - partitions, and then table
2. That partitions that have not been updated are not re-analyzed
3. That global stats are updated each time the stats gather is run

Where SYS.WRI$_OPTSTAT_SYNOPSIS is large, stats gather is much slower:


```
Check the current size of the synopsis table `WRI$_OPTSTAT_SYNOPSIS$`

TABLE_NAME NUM_ROWS ------------------------------ ---------- WRI$_OPTSTAT_SYNOPSIS_PARTGRP 0 WRI$_OPTSTAT_SYNOPSIS_HEAD$ 64259 `WRI$_OPTSTAT_SYNOPSIS$` 216854569

************ Gather initial stats Elapsed: 00:00:00.57 ************ Add one row of data to partition 1 ************ Gather stats Elapsed: 00:03:04.58 ************ Add one row of data to partition 2 ************ Gather stats Elapsed: 00:02:25.20 ************ Add another row of data to partition 1, with a new store_num value ************ Gather stats Elapsed: 00:02:25.76 ************

Actual data in the table:

DAY_KEY COUNT(*) ---------- ---------- 1 2 2 1

USER_TAB_STATISTICS:

Global Stale TABLE_NAME PARTITION_NAME NUM_ROWS SAMPLE_SIZE Last Analyzed Stats Stats ------------ -------------- ---------- ----------- ------------------- ------- ----- BASE_T1 3 3 2010-12-30-17:51:34 YES NO BASE_T1 PART_1 2 2 2010-12-30-17:50:53 YES NO BASE_T1 PART_2 1 1 2010-12-30-17:48:27 YES NO

USER_TAB_STATS_HISTORY:

TABLE_NAME PARTITION_NAME STATS_UPDATE_TIME ------------ -------------- --------------------------------------------------------------------------- BASE_T1 PART_1 30-DEC-10 17.43.39.320426 +00:00 BASE_T1 PART_2 30-DEC-10 17.43.39.320426 +00:00 BASE_T1 30-DEC-10 17.43.39.360753 +00:00 BASE_T1 PART_1 30-DEC-10 17.46.02.331166 +00:00 BASE_T1 30-DEC-10 17.46.43.939090 +00:00 BASE_T1 PART_2 30-DEC-10 17.48.27.926559 +00:00 BASE_T1 30-DEC-10 17.49.09.144722 +00:00 BASE_T1 PART_1 30-DEC-10 17.50.53.818049 +00:00 BASE_T1 30-DEC-10 17.51.34.915096 +00:00

USER_TAB_COL_STATISTICS:

Global TABLE_NAME COLUMN_NAME SAMPLE_SIZE Last Analyzed Stats NUM_DISTINCT LOW_VALU HIGH_VAL ------------ ------------ ----------- ------------------- ------- ------------ -------- -------- BASE_T1 DAY_KEY 3 2010-12-30-17:51:34 YES 2 C102 C103 BASE_T1 STORE_NUM 3 2010-12-30-17:51:34 YES 2 C102 C103 BASE_T1 FACT_01 3 2010-12-30-17:51:34 YES 1 C10B C10B

USER_PART_COL_STATISTICS:

Global TABLE_NAME PARTITION_NAME COLUMN_NAME SAMPLE_SIZE Last Analyzed Stats NUM_DISTINCT LOW_VALU HIGH_VAL ------------ -------------- ------------ ----------- ------------------- ------- ------------ -------- -------- BASE_T1 PART_1 DAY_KEY 2 2010-12-30-17:50:53 YES 1 C102 C102 BASE_T1 PART_1 STORE_NUM 2 2010-12-30-17:50:53 YES 2 C102 C103 BASE_T1 PART_1 FACT_01 2 2010-12-30-17:50:53 YES 1 C10B C10B BASE_T1 PART_2 DAY_KEY 1 2010-12-30-17:48:27 YES 1 C103 C103 BASE_T1 PART_2 STORE_NUM 1 2010-12-30-17:48:27 YES 1 C102 C102 BASE_T1 PART_2 FACT_01 1 2010-12-30-17:48:27 YES 1 C10B C10B

Synopsis data:

TABLE_NAME Part Column Analyse Time Hash count ------------ ------------------------------ ------------------------------ ------------------- ---------- BASE_T1 PART_1 FACT_01 2010-12-30-17:50:53 1 BASE_T1 PART_2 DAY_KEY 2010-12-30-17:48:27 1 BASE_T1 PART_1 STORE_NUM 2010-12-30-17:50:53 2 BASE_T1 PART_2 FACT_01 2010-12-30-17:48:27 1 BASE_T1 PART_2 STORE_NUM 2010-12-30-17:48:27 1 BASE_T1 PART_1 DAY_KEY 2010-12-30-17:50:53 1

```


## Why the worry?

My worry is that with wide tables and many partitions, the synopsis history could grow very large. In the same way that FTS of a big table to gather global stats the 'old' way is going to get slower as the size increases, is the same going to happen with incremental stats?

I've dug around on My Oracle Support but not hit any specific bugs on this.

I found [a posting on OTN](http://forums.oracle.com/forums/thread.jspa?threadID=862386) describing the same behaviour as I've found, but with the comment "Oracle \[...\] just tell me that it is normal, expected behaviour and that if I don't like it I should turn off Incremental global stats.".

Doing some back-of-a-fag-packet maths with some of our tables would have the synopsis information growing at 150k rows per day for one table. We've quite a few wide & big tables, and unless we can convince our users to make do with no history ;-) they're going to keep growing.

Hopefully someone will see this and point out something I've not understood about the functionality, or missed in the documentation. If not, then I'm going to do some larger-scale testing to try and put numbers around stats gather times using incremental vs non-incremental. If nothing else, to get a better understanding of how big this table could be growing.

I'd be really interested to know what other data warehousing sites on 11g do in terms of partitioned table statistics and whether they use incremental stats or not.

Comments most welcome, please! :)
