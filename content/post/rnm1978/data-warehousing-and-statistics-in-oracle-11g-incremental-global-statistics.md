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

1. The INCREMENTAL value for a partition table is set to TRUE
2. You gather statistics on that table with the GRANULARITY parameter set to AUTO

## Too good to be true?

From what I'd read, it sounded ideal for what we do, which is load big (10M+ rows per day) tables, partitioned on day. However, when I started testing it I discovered what may be a problem. The information about each partition is stored in the SYSAUX tablespace in two tables:

- SYS.WRI$\_OPTSTAT\_SYNOPSIS\_HEAD$
- SYS.WRI$\_OPTSTAT\_SYNOPSIS$

Looking at the WRI$\_OPTSTAT\_SYNOPSIS$ table on one of our databases, it had 216 million rows in and took up about 16GB of space. The documentation does say "the SYSAUX tablespace consumes additional space to maintain the global statistics" but this is an awful lot of space.

When I ran a test to gather incremental statistics on a two-partition table with a single row in each partition, it took three minutes to gather stats each time! A quick look at SQL Monitor showed that a lot of the time was spent on a DELETE from WRI$\_OPTSTAT\_SYNOPSIS$.

In a database with no other data in WRI$\_OPTSTAT\_SYNOPSIS$, the stats gather was sub-second.

Looking at the data on WRI$\_OPTSTAT\_SYNOPSIS$, it can be determined that for every table, partition, and column, there is an entry on the header table WRI$\_OPTSTAT\_SYNOPSIS\_HEAD$. There is a unique synopsis number given to each combination, which has one or many entries on the synopsis hash table WRI$\_OPTSTAT\_SYNOPSIS$. There seems to be one hash for every distinct value in the table/partition/column.

## Behind the scenes

You can check whether a table is set for INCREMENTAL global statistics in two ways. For an individual table, dbms\_stats.get\_prefs will return the value: \[sourcecode language="sql"\] select dbms\_stats.get\_prefs(ownname=>'HR',pname=>'INCREMENTAL', tabname=>'BASE\_T1') from dual; \[/sourcecode\]

Alternatively, to list all tables in the database that have INCREMENTAL set, use this: \[sourcecode language="sql"\] select u.name "OWNER" ,o.name "TABLE\_NAME" ,p.valchar from sys.OPTSTAT\_USER\_PREFS$ p inner join sys.obj$ o on p.obj#=o.obj# inner join sys.user$ u on o.owner#=u.user# where p.PNAME = 'INCREMENTAL' \[/sourcecode\]

To look at the synopses (synopsii?), use this query: \[sourcecode language="sql"\] SELECT u.NAME "owner", o.NAME "table\_name", p.subname "partition\_name", c.NAME "column\_name", to\_char(h.analyzetime, 'YYYY-MM-DD-HH24:MI:SS') "analyse\_Time", COUNT(\*) "hash entries" FROM sys.wri$\_optstat\_synopsis\_head$ h left join sys.wri$\_optstat\_synopsis$ s ON h.synopsis# = s.synopsis# left join sys.obj$ o ON h.bo# = o.obj# left join sys.user$ u ON o.owner# = u.user# left join sys.col$ c ON h.bo# = c.obj# AND h.intcol# = c.intcol# left join (SELECT bo#, obj# FROM sys.tabpart$ UNION ALL SELECT bo#, obj# FROM sys.tabcompart$) tp ON h.bo# = tp.bo# AND h.group# = tp.obj# \* 2 left join sys.obj$ p ON tp.obj# = p.obj# GROUP BY u.NAME, o.NAME, p.subname, c.NAME, h.analyzetime ORDER BY u.NAME, o.NAME, c.NAME; \[/sourcecode\]

## Test case

This is the test case I've been using to investigate the issue. It is hopefully self-documenting.

I've written a set of queries that examine the statistics in the data dictionary so that I can see how they get built up. USER\_TAB\_STATS\_HISTORY is good for seeing a chronological record of the stats gathers.

\[sourcecode language="sql"\] /\* http://rnm1978.wordpress.com/ \*/

\-- -- \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* -- test\_incr\_stats.sql -- -- Test incremental statistic gathering -- \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* --

set echo off set timing off set feedback on

prompt prompt \*\*\*\*\*\*\*\*\*\*\*\* prompt Check the current size of the synopsis table WRI$\_OPTSTAT\_SYNOPSIS$

select table\_name, num\_rows from dba\_tables where table\_name like 'WRI$\_OPTSTAT\_SYNOPSIS%';

select to\_char(min(h.analyzetime),'YYYY-MM-DD-HH24:MI:SS') "Earliest Synopsis" FROM SYS.WRI$\_OPTSTAT\_SYNOPSIS\_HEAD$ h;

prompt prompt \*\*\*\*\*\*\*\*\*\*\*\* prompt Create a simple test table

drop table BASE\_T1; CREATE TABLE BASE\_T1 ( day\_key INTEGER, store\_num INTEGER, fact\_01 NUMBER(38,4) DEFAULT 0) PARTITION BY RANGE ( "DAY\_KEY") ( PARTITION PART\_1 VALUES LESS THAN (2) NOCOMPRESS, PARTITION PART\_2 VALUES LESS THAN (3) NOCOMPRESS) PARALLEL;

prompt prompt \*\*\*\*\*\*\*\*\*\*\*\* prompt Set the table to INCREMENTAL stats exec dbms\_stats.set\_table\_prefs(pname=>'INCREMENTAL',ownname=>USER,tabname=>'BASE\_T1',pvalue=>'TRUE');

prompt prompt \*\*\*\*\*\*\*\*\*\*\*\* prompt Gather initial stats set timing on exec dbms\_stats.gather\_table\_stats( ownname=>USER, tabname=>'BASE\_T1', granularity=>'AUTO'); set timing off

prompt prompt \*\*\*\*\*\*\*\*\*\*\*\* prompt Add one row of data to partition 1 insert into base\_t1 (day\_key,store\_num,fact\_01) values (1, 1,10);

prompt prompt \*\*\*\*\*\*\*\*\*\*\*\* prompt Gather stats set timing on exec dbms\_stats.gather\_table\_stats( ownname=>USER, tabname=>'BASE\_T1', granularity=>'AUTO'); set timing off

prompt prompt \*\*\*\*\*\*\*\*\*\*\*\* prompt Add one row of data to partition 2 insert into base\_t1 (day\_key,store\_num,fact\_01) values (2, 1,10);

prompt prompt \*\*\*\*\*\*\*\*\*\*\*\* prompt Gather stats set timing on exec dbms\_stats.gather\_table\_stats( ownname=>USER, tabname=>'BASE\_T1', granularity=>'AUTO'); set timing off

prompt prompt \*\*\*\*\*\*\*\*\*\*\*\* prompt Add another row of data to partition 1, with a new store\_num value insert into base\_t1 (day\_key,store\_num,fact\_01) values (1, 2,10);

prompt prompt \*\*\*\*\*\*\*\*\*\*\*\* prompt Gather stats set timing on exec dbms\_stats.gather\_table\_stats( ownname=>USER, tabname=>'BASE\_T1', granularity=>'AUTO'); set timing off

set linesize 156 col table\_name for a12 col partition\_name for a14 col column\_name for a12 col high\_value for a8 col low\_value for a8 col global\_stats head "Global|Stats" for a7 col stale\_stats head "Stale|Stats" for a5

prompt prompt Incremental stats setting: select dbms\_stats.get\_prefs(ownname=>USER,pname=>'INCREMENTAL', tabname=>'BASE\_T1') from dual;

prompt prompt Actual data in the table: select day\_key,count(\*) from BASE\_T1 group by day\_key order by day\_key asc;

prompt prompt USER\_TAB\_STATISTICS: select table\_name,partition\_name,num\_rows,sample\_size, to\_char(last\_analyzed,'YYYY-MM-DD-HH24:MI:SS') "Last Analyzed",global\_stats,stale\_stats from user\_tab\_statistics where table\_name='BASE\_T1';

prompt prompt USER\_TAB\_STATS\_HISTORY: select table\_name,partition\_name,stats\_update\_time from user\_tab\_stats\_history where table\_name='BASE\_T1' order by stats\_update\_time asc ;

prompt prompt USER\_TAB\_COL\_STATISTICS: select table\_name,column\_name,sample\_size,to\_char(last\_analyzed,'YYYY-MM-DD-HH24:MI:SS') "Last Analyzed", global\_stats,num\_distinct,low\_value,high\_value from USER\_TAB\_COL\_STATISTICS where table\_name='BASE\_T1';

prompt prompt USER\_PART\_COL\_STATISTICS: select table\_name,partition\_name,column\_name,sample\_size,to\_char(last\_analyzed,'YYYY-MM-DD-HH24:MI:SS') "Last Analyzed", global\_stats,num\_distinct,low\_value,high\_value from USER\_PART\_COL\_STATISTICS where table\_name='BASE\_T1';

prompt prompt Synopsis data: SELECT o.name "TABLE\_NAME" ,p.subname "Part" ,c.name "Column" ,to\_char(h.analyzetime,'YYYY-MM-DD-HH24:MI:SS') "Analyse Time" ,count(\*) "Hash count" FROM SYS.WRI$\_OPTSTAT\_SYNOPSIS\_HEAD$ h left join sys.wri$\_optstat\_synopsis$ s on h.synopsis# = s.synopsis# left join sys.obj$ o on h.bo#=o.obj# left join sys.user$ u on o.owner#=u.user# left join sys.col$ c on h.bo#=c.obj# and h.intcol# = c.intcol# left join (select bo#,obj# from sys.tabpart$ union all select bo#,obj# from sys.tabcompart$) tp on h.bo#=tp.bo# and h.group#=tp.obj#\*2 left join sys.obj$ p on tp.obj#=p.obj# where u.name = USER and o.name = 'BASE\_T1' group by u.name,o.name ,p.subname,c.name,h.analyzetime order by u.name,o.name; \[/sourcecode\]

## Results

This was run on Oracle 11.1.0.7, on several different databases. I've edited the output slightly for brevity.

Where SYS.WRI$\_OPTSTAT\_SYNOPSIS is small, it can be seen that the stats gather is fast - as would be expected for a table so small:

\[sourcecode\] \*\*\*\*\*\*\*\*\*\*\*\* Check the current size of the synopsis table WRI$\_OPTSTAT\_SYNOPSIS$

TABLE\_NAME NUM\_ROWS ------------ ---------- WRI$\_OPTSTAT 0 WRI$\_OPTSTAT 1940 WRI$\_OPTSTAT 287236

Gather initial stats PL/SQL procedure successfully completed. Elapsed: 00:00:00.16 \*\*\*\*\*\*\*\*\*\*\*\* Add one row of data to partition 1 \*\*\*\*\*\*\*\*\*\*\*\* Gather stats PL/SQL procedure successfully completed. Elapsed: 00:00:00.27 \*\*\*\*\*\*\*\*\*\*\*\* Add one row of data to partition 2 \*\*\*\*\*\*\*\*\*\*\*\* Gather stats PL/SQL procedure successfully completed. Elapsed: 00:00:00.27 \*\*\*\*\*\*\*\*\*\*\*\* Add another row of data to partition 1, with a new store\_num value \*\*\*\*\*\*\*\*\*\*\*\* Gather stats PL/SQL procedure successfully completed. Elapsed: 00:00:00.34

Incremental stats setting: DBMS\_STATS.GET\_PREFS(OWNNAME=>USER,PNAME=>'INCREMENTAL',TABNAME=>'BASE\_T1') ------------------------------------------------------------------------------------------------ TRUE

Actual data in the table:

DAY\_KEY COUNT(\*) ---------- ---------- 1 2 2 1

2 rows selected.

USER\_TAB\_STATISTICS:

Global Stale TABLE\_NAME PARTITION\_NAME NUM\_ROWS SAMPLE\_SIZE Last Analyzed Stats Stats ------------ -------------- ---------- ----------- ------------------- ------- ----- BASE\_T1 3 3 2010-12-30-18:04:56 YES NO BASE\_T1 PART\_1 2 2 2010-12-30-18:04:56 YES NO BASE\_T1 PART\_2 1 1 2010-12-30-18:04:56 YES NO

3 rows selected.

USER\_TAB\_STATS\_HISTORY:

TABLE\_NAME PARTITION\_NAME STATS\_UPDATE\_TIME ------------ -------------- --------------------------------------------------------------------------- BASE\_T1 PART\_1 30-DEC-10 18.04.55.633710 +00:00 BASE\_T1 PART\_2 30-DEC-10 18.04.55.633710 +00:00 BASE\_T1 30-DEC-10 18.04.55.645162 +00:00 BASE\_T1 PART\_1 30-DEC-10 18.04.55.856920 +00:00 BASE\_T1 30-DEC-10 18.04.55.910722 +00:00 BASE\_T1 PART\_2 30-DEC-10 18.04.56.126645 +00:00 BASE\_T1 30-DEC-10 18.04.56.181336 +00:00 BASE\_T1 PART\_1 30-DEC-10 18.04.56.442624 +00:00 BASE\_T1 30-DEC-10 18.04.56.527702 +00:00

9 rows selected.

USER\_TAB\_COL\_STATISTICS:

Global TABLE\_NAME COLUMN\_NAME SAMPLE\_SIZE Last Analyzed Stats NUM\_DISTINCT LOW\_VALU HIGH\_VAL ------------ ------------ ----------- ------------------- ------- ------------ -------- -------- BASE\_T1 DAY\_KEY 3 2010-12-30-18:04:56 YES 2 C102 C103 BASE\_T1 STORE\_NUM 3 2010-12-30-18:04:56 YES 2 C102 C103 BASE\_T1 FACT\_01 3 2010-12-30-18:04:56 YES 1 C10B C10B

3 rows selected.

USER\_PART\_COL\_STATISTICS:

Global TABLE\_NAME PARTITION\_NAME COLUMN\_NAME SAMPLE\_SIZE Last Analyzed Stats NUM\_DISTINCT LOW\_VALU HIGH\_VAL ------------ -------------- ------------ ----------- ------------------- ------- ------------ -------- -------- BASE\_T1 PART\_1 DAY\_KEY 2 2010-12-30-18:04:56 YES 1 C102 C102 BASE\_T1 PART\_1 STORE\_NUM 2 2010-12-30-18:04:56 YES 2 C102 C103 BASE\_T1 PART\_1 FACT\_01 2 2010-12-30-18:04:56 YES 1 C10B C10B BASE\_T1 PART\_2 DAY\_KEY 1 2010-12-30-18:04:56 YES 1 C103 C103 BASE\_T1 PART\_2 STORE\_NUM 1 2010-12-30-18:04:56 YES 1 C102 C102 BASE\_T1 PART\_2 FACT\_01 1 2010-12-30-18:04:56 YES 1 C10B C10B

6 rows selected.

Synopsis data:

TABLE\_NAME Part Column Analyse Time Hash count ------------ ------------------------------ ------------------------------ ------------------- ---------- BASE\_T1 PART\_2 DAY\_KEY 2010-12-30-18:04:56 1 BASE\_T1 PART\_2 FACT\_01 2010-12-30-18:04:56 1 BASE\_T1 PART\_1 STORE\_NUM 2010-12-30-18:04:56 2 BASE\_T1 PART\_1 DAY\_KEY 2010-12-30-18:04:56 1 BASE\_T1 PART\_2 STORE\_NUM 2010-12-30-18:04:56 1 BASE\_T1 PART\_1 FACT\_01 2010-12-30-18:04:56 1

6 rows selected. \[/sourcecode\]

Note that there are two hash values for the synopsis for PART\_1 column STORE\_NUM, because there are two values in the column in that partition.

You can see clearly from USER\_TAB\_STATS\_HISTORY three things:

1. The order in which stats are gathered - partitions, and then table
2. That partitions that have not been updated are not re-analyzed
3. That global stats are updated each time the stats gather is run

Where SYS.WRI$\_OPTSTAT\_SYNOPSIS is large, stats gather is much slower: \[sourcecode\] Check the current size of the synopsis table WRI$\_OPTSTAT\_SYNOPSIS$

TABLE\_NAME NUM\_ROWS ------------------------------ ---------- WRI$\_OPTSTAT\_SYNOPSIS\_PARTGRP 0 WRI$\_OPTSTAT\_SYNOPSIS\_HEAD$ 64259 WRI$\_OPTSTAT\_SYNOPSIS$ 216854569

\*\*\*\*\*\*\*\*\*\*\*\* Gather initial stats Elapsed: 00:00:00.57 \*\*\*\*\*\*\*\*\*\*\*\* Add one row of data to partition 1 \*\*\*\*\*\*\*\*\*\*\*\* Gather stats Elapsed: 00:03:04.58 \*\*\*\*\*\*\*\*\*\*\*\* Add one row of data to partition 2 \*\*\*\*\*\*\*\*\*\*\*\* Gather stats Elapsed: 00:02:25.20 \*\*\*\*\*\*\*\*\*\*\*\* Add another row of data to partition 1, with a new store\_num value \*\*\*\*\*\*\*\*\*\*\*\* Gather stats Elapsed: 00:02:25.76 \*\*\*\*\*\*\*\*\*\*\*\*

Actual data in the table:

DAY\_KEY COUNT(\*) ---------- ---------- 1 2 2 1

USER\_TAB\_STATISTICS:

Global Stale TABLE\_NAME PARTITION\_NAME NUM\_ROWS SAMPLE\_SIZE Last Analyzed Stats Stats ------------ -------------- ---------- ----------- ------------------- ------- ----- BASE\_T1 3 3 2010-12-30-17:51:34 YES NO BASE\_T1 PART\_1 2 2 2010-12-30-17:50:53 YES NO BASE\_T1 PART\_2 1 1 2010-12-30-17:48:27 YES NO

USER\_TAB\_STATS\_HISTORY:

TABLE\_NAME PARTITION\_NAME STATS\_UPDATE\_TIME ------------ -------------- --------------------------------------------------------------------------- BASE\_T1 PART\_1 30-DEC-10 17.43.39.320426 +00:00 BASE\_T1 PART\_2 30-DEC-10 17.43.39.320426 +00:00 BASE\_T1 30-DEC-10 17.43.39.360753 +00:00 BASE\_T1 PART\_1 30-DEC-10 17.46.02.331166 +00:00 BASE\_T1 30-DEC-10 17.46.43.939090 +00:00 BASE\_T1 PART\_2 30-DEC-10 17.48.27.926559 +00:00 BASE\_T1 30-DEC-10 17.49.09.144722 +00:00 BASE\_T1 PART\_1 30-DEC-10 17.50.53.818049 +00:00 BASE\_T1 30-DEC-10 17.51.34.915096 +00:00

USER\_TAB\_COL\_STATISTICS:

Global TABLE\_NAME COLUMN\_NAME SAMPLE\_SIZE Last Analyzed Stats NUM\_DISTINCT LOW\_VALU HIGH\_VAL ------------ ------------ ----------- ------------------- ------- ------------ -------- -------- BASE\_T1 DAY\_KEY 3 2010-12-30-17:51:34 YES 2 C102 C103 BASE\_T1 STORE\_NUM 3 2010-12-30-17:51:34 YES 2 C102 C103 BASE\_T1 FACT\_01 3 2010-12-30-17:51:34 YES 1 C10B C10B

USER\_PART\_COL\_STATISTICS:

Global TABLE\_NAME PARTITION\_NAME COLUMN\_NAME SAMPLE\_SIZE Last Analyzed Stats NUM\_DISTINCT LOW\_VALU HIGH\_VAL ------------ -------------- ------------ ----------- ------------------- ------- ------------ -------- -------- BASE\_T1 PART\_1 DAY\_KEY 2 2010-12-30-17:50:53 YES 1 C102 C102 BASE\_T1 PART\_1 STORE\_NUM 2 2010-12-30-17:50:53 YES 2 C102 C103 BASE\_T1 PART\_1 FACT\_01 2 2010-12-30-17:50:53 YES 1 C10B C10B BASE\_T1 PART\_2 DAY\_KEY 1 2010-12-30-17:48:27 YES 1 C103 C103 BASE\_T1 PART\_2 STORE\_NUM 1 2010-12-30-17:48:27 YES 1 C102 C102 BASE\_T1 PART\_2 FACT\_01 1 2010-12-30-17:48:27 YES 1 C10B C10B

Synopsis data:

TABLE\_NAME Part Column Analyse Time Hash count ------------ ------------------------------ ------------------------------ ------------------- ---------- BASE\_T1 PART\_1 FACT\_01 2010-12-30-17:50:53 1 BASE\_T1 PART\_2 DAY\_KEY 2010-12-30-17:48:27 1 BASE\_T1 PART\_1 STORE\_NUM 2010-12-30-17:50:53 2 BASE\_T1 PART\_2 FACT\_01 2010-12-30-17:48:27 1 BASE\_T1 PART\_2 STORE\_NUM 2010-12-30-17:48:27 1 BASE\_T1 PART\_1 DAY\_KEY 2010-12-30-17:50:53 1 \[/sourcecode\]

## Why the worry?

My worry is that with wide tables and many partitions, the synopsis history could grow very large. In the same way that FTS of a big table to gather global stats the 'old' way is going to get slower as the size increases, is the same going to happen with incremental stats?

I've dug around on My Oracle Support but not hit any specific bugs on this.

I found [a posting on OTN](http://forums.oracle.com/forums/thread.jspa?threadID=862386) describing the same behaviour as I've found, but with the comment "Oracle \[...\] just tell me that it is normal, expected behaviour and that if I don't like it I should turn off Incremental global stats.".

Doing some back-of-a-fag-packet maths with some of our tables would have the synopsis information growing at 150k rows per day for one table. We've quite a few wide & big tables, and unless we can convince our users to make do with no history ;-) they're going to keep growing.

Hopefully someone will see this and point out something I've not understood about the functionality, or missed in the documentation. If not, then I'm going to do some larger-scale testing to try and put numbers around stats gather times using incremental vs non-incremental. If nothing else, to get a better understanding of how big this table could be growing.

I'd be really interested to know what other data warehousing sites on 11g do in terms of partitioned table statistics and whether they use incremental stats or not.

Comments most welcome, please! :)
