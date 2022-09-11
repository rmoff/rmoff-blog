---
title: "Global statistics high/low values when using DBMS_STATS.COPY_TABLE_STATS"
date: "2011-06-15"
categories: 
  - "copy_table_stats"
  - "dbms_stats"
  - "dwh"
  - "oracle"
  - "statistics"
---

There is a well-documented problem relating to DBMS\_STATS.COPY\_TABLE\_STATS between partitions where high/low values of the partitioning key column were just copied verbatim from the source partition. This particular problem has now been patched (see [8318020.8](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=8318020.8)). For background, see Doug Burns' [blog](http://oracledoug.com/serendipity/) and his [excellent paper](http://oracledoug.com/serendipity/index.php?/archives/1632-Symposium-2011-My-Presentation.html) which covers the whole topic of statistics on partitioned tables.

This post [Maintaining statistics on large partitioned tables](http://blogs.oracle.com/optimizer/2009/02/maintaining_statistics_on_large_partitioned_tables.html) on the Oracle Optimizer blog details what the dbms\_stats.copy\_table\_stats does with regards to the high/low values:

> _It adjusts the minimum and maximum values of the partitioning column as follows; it uses the high bound partitioning value as the maximum value of the first partitioning column (it is possible to have concatenated partition columns) and high bound partitioning value of the previous partition as the minimum value of the first partitioning column for range partitioned table_

However, two problems as I see them remain:

1. Table global stats don't update high\_value for partitioning key
2. high\_value of one partition overlaps with low\_value of the next.
    - Partition high-bound values are defined as **LESS THAN**, not **LESS THAN OR EQUAL TO** - therefore the maximum possible value of the column is **less** than this, not **equal** to it.
    - The minimum value of the partitioning column **is correct** using this method (although be aware of [10233186](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=10233186.8&h=Y) if you use a MAXVALUE in your range partitioning).

Here's a script that demonstrates the two issues, written and commented based on execution on 11.1.0.7: \[sourcecode language="sql"\] /\* copy\_stats\_1.sql

Illustrate apparent problem with high\_val on partition statistics when using partition to partition statistics copy \* Table global stats do not update high\_value for partitioning key \* high\_value of one partition overlaps with low\_value of the next.

Requires display\_raw function by Greg Rahn, see here: http://tinyurl.com/display-raw

http://rnm1978.wordpress.com/

\*/

set echo off set timing off set feedback off set linesize 156 set pagesize 57 col owner for a10 col table\_name for a30 col column\_name for a30 col partition\_name for a20 col low\_val for a10 col high\_val for a10 col num\_rows for 999,999,999,999 col "sum of num\_rows" for 999,999,999,999 break on stats\_update\_time skip 1 duplicates

clear screen

prompt ===== This script uses the DISPLAY\_RAW function ======= prompt prompt Available here: http://structureddata.org/2007/10/16/how-to-display-high\_valuelow\_value-columns-from-user\_tab\_col\_statistics/ prompt prompt ======================================================== prompt prompt prompt prompt =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prompt 1. Set up an partitioned table with data and examine the statistics prompt prompt set echo on pause -- Create fact table drop table BASE\_DATA; CREATE table BASE\_DATA ( day\_key integer, store\_key INTEGER, item\_key INTEGER, fact\_001 NUMBER(15,0), fact\_002 NUMBER(15,0), fact\_003 NUMBER(18,2)) PARTITION BY RANGE (DAY\_KEY) SUBPARTITION BY HASH (store\_key) SUBPARTITION TEMPLATE ( SUBPARTITION "SP1" , SUBPARTITION "SP2" , SUBPARTITION "SP3" , SUBPARTITION "SP4") ( PARTITION "PART\_20110401" VALUES LESS THAN (20110402)) PARALLEL;

pause -- Create indexes CREATE UNIQUE INDEX BASE\_DATA\_PK ON BASE\_DATA ("DAY\_KEY", "STORE\_KEY", "ITEM\_KEY") LOCAL parallel; create bitmap index base\_data\_ix2 on base\_data (store\_key) local parallel; create bitmap index base\_data\_ix3 on base\_data (item\_key) local parallel;

pause

\-- Populate fact table exec DBMS\_RANDOM.SEED('StraussCookPieterson'); insert into BASE\_DATA values (20110401,101,2000, dbms\_random.value(0,999) , dbms\_random.value(0,999) , dbms\_random.value(0,999) ); insert into BASE\_DATA values (20110401,102,2000, dbms\_random.value(0,999) , dbms\_random.value(0,999) , dbms\_random.value(0,999) ); commit;

pause

\-- Gather full stats on table set feedback on exec dbms\_stats.gather\_table\_stats( ownname=>USER, tabname=>'BASE\_DATA', granularity=>'AUTO'); set feedback off

pause

select \* from base\_data order by day\_key; pause -- Examine statistics

set echo off prompt prompt DBA\_PART\_TABLES select partitioning\_type, subpartitioning\_type, partition\_count from dba\_part\_tables where table\_name='BASE\_DATA' and owner=USER;

prompt prompt DBA\_TAB\_STATS\_HISTORY SELECT table\_name, partition\_name, stats\_update\_time FROM dba\_tab\_stats\_history WHERE owner = USER AND table\_name = 'BASE\_DATA' ORDER BY stats\_update\_time asc; pause

prompt prompt DBA\_TAB\_STATISTICS (table level only): prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select table\_name,num\_rows, to\_char(LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED" from DBA\_TAB\_STATISTICS where table\_name='BASE\_DATA' and owner=USER and partition\_name is null ;

pause

compute sum of num\_rows on report prompt prompt DBA\_TAB\_STATISTICS (Partition level): prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select table\_name,partition\_name,num\_rows, to\_char(LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED" from DBA\_TAB\_STATISTICS where table\_name='BASE\_DATA' and owner=USER and partition\_name is not null and subpartition\_name is null order by table\_name,partition\_name ; clear computes

pause

prompt DBA\_PART\_COL\_STATISTICS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select a.partition\_name,a.column\_name,to\_char(a.LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED", display\_raw(a.low\_value,b.data\_type) as low\_val,display\_raw(a.high\_value,b.data\_type) as high\_val from DBA\_PART\_COL\_STATISTICS a inner join dba\_tab\_cols b on a.table\_name=b.table\_name and a.column\_name=b.column\_name and a.owner=b.owner where a.table\_name='BASE\_DATA' and a.owner=USER and a.partition\_name is not null and a.column\_name = 'DAY\_KEY' ;

prompt prompt Observe: Partition high/low values for DAY\_KEY - currently 1st April pause

prompt prompt DBA\_TAB\_COL\_STATISTICS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select a.column\_name,to\_char(a.LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED", display\_raw(a.low\_value,b.data\_type) as low\_val,display\_raw(a.high\_value,b.data\_type) as high\_val from DBA\_TAB\_COL\_STATISTICS a inner join dba\_tab\_cols b on a.table\_name=b.table\_name and a.column\_name=b.column\_name and a.owner=b.owner where a.table\_name='BASE\_DATA' and a.owner=USER and a.column\_name = 'DAY\_KEY' ; prompt prompt Observe: Table high/low values for DAY\_KEY - currently 1st April pause

prompt prompt prompt prompt =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prompt 2. Create new partition and use dbms\_stats.copy\_table\_stats to set the stats for it. Leave data in the table unchanged. prompt prompt pause

set feedback on set echo on alter table base\_data add PARTITION "PART\_20110402" VALUES LESS THAN (20110403); exec dbms\_stats.copy\_table\_stats(ownname=>USER, tabname=>'BASE\_DATA',SRCPARTNAME=>'PART\_20110401',DSTPARTNAME=>'PART\_20110402'); pause set feedback off

select \* from base\_data order by day\_key; pause -- Examine statistics

set echo off prompt prompt DBA\_PART\_TABLES select partitioning\_type, subpartitioning\_type, partition\_count from dba\_part\_tables where table\_name='BASE\_DATA' and owner=USER;

prompt prompt DBA\_TAB\_STATS\_HISTORY SELECT table\_name, partition\_name, stats\_update\_time FROM dba\_tab\_stats\_history WHERE owner = USER AND table\_name = 'BASE\_DATA' ORDER BY stats\_update\_time asc; pause

prompt DBA\_TAB\_STATISTICS (table level only): prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select table\_name,num\_rows, to\_char(LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED" from DBA\_TAB\_STATISTICS where table\_name='BASE\_DATA' and owner=USER and partition\_name is null ;

compute sum of num\_rows on report prompt prompt DBA\_TAB\_STATISTICS (Partition level): prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select table\_name,partition\_name,num\_rows, to\_char(LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED" from DBA\_TAB\_STATISTICS where table\_name='BASE\_DATA' and owner=USER and partition\_name is not null and subpartition\_name is null order by table\_name,partition\_name ; clear computes

prompt prompt Side note: Oracle doesn't aggregate the partition num\_rows statistic up to global when doing a copy stats, prompt so whilst the sum of partition num\_rows is four, the global num\_rows is still two. prompt Of course, at this point, there are only actually two rows of data in the table. prompt prompt (also, observe that LAST\_ANALYZED for the new partition is that of the partition from where the stats were copied, and isn't prompt the same as STATS\_UPDATE\_TIME for the partition on DBA\_TAB\_STATS\_HISTORY - which makes sense when you think about it) pause

prompt prompt DBA\_TAB\_PARTITIONS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select partition\_name, high\_value from dba\_tab\_partitions where table\_name='BASE\_DATA' and table\_owner=USER; prompt prompt DBA\_PART\_COL\_STATISTICS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select a.partition\_name,a.column\_name,to\_char(a.LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED", display\_raw(a.low\_value,b.data\_type) as low\_val,display\_raw(a.high\_value,b.data\_type) as high\_val from DBA\_PART\_COL\_STATISTICS a inner join dba\_tab\_cols b on a.table\_name=b.table\_name and a.column\_name=b.column\_name and a.owner=b.owner where a.table\_name='BASE\_DATA' and a.owner=USER and a.partition\_name is not null and a.column\_name = 'DAY\_KEY' ; prompt prompt See the Partition high/low values for DAY\_KEY in the new partition (PART\_20110402) into which we copied the stats: prompt --> low\_value is correct prompt --> high\_value is out of range for possible data in that partition prompt -----> high\_value of the partition is < 20110403, \*\* not \*\* <= 20110403 prompt pause prompt prompt DBA\_TAB\_COL\_STATISTICS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select a.column\_name,to\_char(a.LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED", display\_raw(a.low\_value,b.data\_type) as low\_val,display\_raw(a.high\_value,b.data\_type) as high\_val from DBA\_TAB\_COL\_STATISTICS a inner join dba\_tab\_cols b on a.table\_name=b.table\_name and a.column\_name=b.column\_name and a.owner=b.owner where a.table\_name='BASE\_DATA' and a.owner=USER and a.column\_name = 'DAY\_KEY' ; prompt prompt See the Table high/low values for DAY\_KEY - currently 1st April, even though the stats on individual partitions has a (wrong) high\_val of 3rd April. pause prompt prompt prompt prompt =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prompt 3. Add another new partition and use dbms\_stats.copy\_table\_stats to set the stats for it. Leave data in the table unchanged. prompt prompt pause

set feedback on set echo on alter table base\_data add PARTITION "PART\_20110403" VALUES LESS THAN (20110404); exec dbms\_stats.copy\_table\_stats(ownname=>USER, tabname=>'BASE\_DATA',SRCPARTNAME=>'PART\_20110401',DSTPARTNAME=>'PART\_20110403'); pause set feedback off

select \* from base\_data order by day\_key; pause -- Examine statistics

set echo off prompt prompt DBA\_PART\_TABLES select partitioning\_type, subpartitioning\_type, partition\_count from dba\_part\_tables where table\_name='BASE\_DATA' and owner=USER;

prompt prompt DBA\_TAB\_STATS\_HISTORY SELECT table\_name, partition\_name, stats\_update\_time FROM dba\_tab\_stats\_history WHERE owner = USER AND table\_name = 'BASE\_DATA' ORDER BY stats\_update\_time asc; pause

prompt DBA\_TAB\_STATISTICS (table level only): prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select table\_name,num\_rows, to\_char(LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED" from DBA\_TAB\_STATISTICS where table\_name='BASE\_DATA' and owner=USER and partition\_name is null ;

compute sum of num\_rows on report prompt prompt DBA\_TAB\_STATISTICS (Partition level): prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select table\_name,partition\_name,num\_rows, to\_char(LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED" from DBA\_TAB\_STATISTICS where table\_name='BASE\_DATA' and owner=USER and partition\_name is not null and subpartition\_name is null order by table\_name,partition\_name ; clear computes

pause

prompt prompt DBA\_TAB\_PARTITIONS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select partition\_name, high\_value from dba\_tab\_partitions where table\_name='BASE\_DATA' and table\_owner=USER; prompt prompt DBA\_PART\_COL\_STATISTICS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select a.partition\_name,a.column\_name,to\_char(a.LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED", display\_raw(a.low\_value,b.data\_type) as low\_val,display\_raw(a.high\_value,b.data\_type) as high\_val from DBA\_PART\_COL\_STATISTICS a inner join dba\_tab\_cols b on a.table\_name=b.table\_name and a.column\_name=b.column\_name and a.owner=b.owner where a.table\_name='BASE\_DATA' and a.owner=USER and a.partition\_name is not null and a.column\_name = 'DAY\_KEY' ; prompt prompt You can see that the high\_value for the new partition is again too high for the possible values the partition could contain prompt prompt But this time we can also see the overlapping high\_value of previous column with low\_value of the next. prompt PART\_20110401 has real stats prompt PART\_20110402 has copied stats, with a (wrong) high\_value of 20110403 prompt PART\_20110403 has copied stats, with a low\_value of 20110403 - which is the same as the high\_value of the previous partition

prompt pause prompt prompt DBA\_TAB\_COL\_STATISTICS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select a.column\_name,to\_char(a.LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED", display\_raw(a.low\_value,b.data\_type) as low\_val,display\_raw(a.high\_value,b.data\_type) as high\_val from DBA\_TAB\_COL\_STATISTICS a inner join dba\_tab\_cols b on a.table\_name=b.table\_name and a.column\_name=b.column\_name and a.owner=b.owner where a.table\_name='BASE\_DATA' and a.owner=USER and a.column\_name = 'DAY\_KEY' ; prompt prompt Table high/low values for DAY\_KEY - still 1st April, even though the stats on individual partitions has a (wrong) high\_val of 4th April. pause

prompt prompt prompt prompt =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prompt 4. Add data to the table, gather real statistics, examine them. prompt prompt pause

set echo on -- Populate fact table insert into BASE\_DATA values (20110402,101,2000, dbms\_random.value(0,999) , dbms\_random.value(0,999) , dbms\_random.value(0,999) ); insert into BASE\_DATA values (20110403,101,2000, dbms\_random.value(0,999) , dbms\_random.value(0,999) , dbms\_random.value(0,999) ); commit;

pause

\-- gather full stats exec dbms\_stats.gather\_table\_stats( ownname=>USER, tabname=>'BASE\_DATA', granularity=>'AUTO'); pause

select \* from base\_data order by day\_key; pause -- Examine statistics

set echo off prompt prompt DBA\_PART\_TABLES select partitioning\_type, subpartitioning\_type, partition\_count from dba\_part\_tables where table\_name='BASE\_DATA' and owner=USER;

prompt prompt DBA\_TAB\_STATS\_HISTORY SELECT table\_name, partition\_name, stats\_update\_time FROM dba\_tab\_stats\_history WHERE owner = USER AND table\_name = 'BASE\_DATA' ORDER BY stats\_update\_time asc; pause

prompt DBA\_TAB\_STATISTICS (table level only): prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select table\_name,num\_rows, to\_char(LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED" from DBA\_TAB\_STATISTICS where table\_name='BASE\_DATA' and owner=USER and partition\_name is null ; pause

compute sum of num\_rows on report prompt prompt DBA\_TAB\_STATISTICS (Partition level): prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select table\_name,partition\_name,num\_rows, to\_char(LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED" from DBA\_TAB\_STATISTICS where table\_name='BASE\_DATA' and owner=USER and partition\_name is not null and subpartition\_name is null order by table\_name,partition\_name ; clear computes prompt prompt Table num\_rows is now accurate pause

prompt prompt DBA\_TAB\_PARTITIONS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select partition\_name, high\_value from dba\_tab\_partitions where table\_name='BASE\_DATA' and table\_owner=USER; prompt prompt DBA\_PART\_COL\_STATISTICS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select a.partition\_name,a.column\_name,to\_char(a.LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED", display\_raw(a.low\_value,b.data\_type) as low\_val,display\_raw(a.high\_value,b.data\_type) as high\_val from DBA\_PART\_COL\_STATISTICS a inner join dba\_tab\_cols b on a.table\_name=b.table\_name and a.column\_name=b.column\_name and a.owner=b.owner where a.table\_name='BASE\_DATA' and a.owner=USER and a.partition\_name is not null and a.column\_name = 'DAY\_KEY' ;

prompt prompt Partition high/low values for DAY\_KEY in each partition is correct pause

prompt prompt DBA\_TAB\_COL\_STATISTICS: prompt \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* select a.column\_name,to\_char(a.LAST\_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST\_ANALYZED", display\_raw(a.low\_value,b.data\_type) as low\_val,display\_raw(a.high\_value,b.data\_type) as high\_val from DBA\_TAB\_COL\_STATISTICS a inner join dba\_tab\_cols b on a.table\_name=b.table\_name and a.column\_name=b.column\_name and a.owner=b.owner where a.table\_name='BASE\_DATA' and a.owner=USER and a.column\_name = 'DAY\_KEY' ; prompt prompt Table high/low values for DAY\_KEY are now correct pause

/\* #EOF \*/ \[/sourcecode\]

From everything that I've read, representative stats are essential for Oracle to generate the most efficient explain plan to give the most optimal performance. Out of range problems caused by inaccurate statistics is something frequently referenced. However I'm out of my depth here to determine whether that's true for the global statistics of this partitioning column not getting updated.

Copying stats have never been intended as a replacement for real stats, that much is clear and frequently stated. They should be part of a carefully designed stats gathering method, based on your applications data and frequency of loading. Hopefully the above, along with the other articles about copy stats out there, will add to the understanding of the functionality and importantly, its limitations. Copying the stats will just buy you time in a critical load schedule, postponing the point at which you do a proper gather. All copy stats is doing is making the statistics a bit more representative of the data - it's not a proper sample of the data so the quality of the stats will never be as good as if you do a proper gather. When you do the real gather should be whichever comes first of:

- the point at which you have time in your batch schedule  
    or,
- the stats are too unrepresentative of your data for the Oracle optimizer to generate a sufficiently efficient explain plan in order for your queries to run in the time which the users require.

* * *

Maria Colgan from Oracle has kindly reviewed my script and findings, and commented:

> Your argument that copy stats sets the high\_value wrongly (to high), is correct. We do over estimate the high value by setting it to the partition definition. As you correctly point out no value in the partition will have reach that high\_value because a range partition is always specified as less than. We did this so that we can ensure there will be no greater value than this in the partition, otherwise we would have to guess what the max value is.

Maria also pointed out that with regards to the overlapping high/low values

> However, this is not the expected behavior. The goal of copy\_stats is to provide a temporary fix to the out of range problem by providing a representative set of statistics for a new partition. It is not supposed to be a replacement for statistics gathering.

* * *

Reading:

- Doug Burns' series of blog postings about [Statistics on Partitioned Tables](http://oracledoug.com/serendipity/index.php?/archives/1590-Statistics-on-Partitioned-Tables-Contents.html)
- [Greg Rahn - Choosing An Optimal Stats Gathering Strategy](http://structureddata.org/2008/03/26/choosing-an-optimal-stats-gathering-strategy/)
- [Oracle Optimizer - Maintaining statistics on large partitioned tables](http://blogs.oracle.com/optimizer/2009/02/maintaining_statistics_on_large_partitioned_tables.html)
- [Don Seiler - Dr. Statslove or: How I Learned to Stop Guessing and Love the 10053 Trace](http://seilerwerks.wordpress.com/2007/08/17/dr-statslove-or-how-i-learned-to-stop-guessing-and-love-the-10053-trace/)
- [Greg Rahn - Troubleshooting Bad Execution Plans](http://structureddata.org/2007/11/21/troubleshooting-bad-execution-plans/)
- [Greg Rahn - Oracle 11g: Enhancements to DBMS\_STATS](http://structureddata.org/2007/09/17/oracle-11g-enhancements-to-dbms_stats/)
- Amit Bansal has written about this problem here [here](http://askdba.org/weblog/?p=496) and includes a script for copying the statistics between partitions manually.

Watch out for these other bugs that I came across reference to:

- [10234419](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=10234419.8&h=Y) Extend dbms\_stats.copy\_table\_stats to all range partitioning key columns
- [Doc ID 1292269.1](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=1292269.1&h=Y)ORA-01422 While running dbms\_stats.copy\_table\_stats
    - " This issue would occur when there are more than one schema with same table name."

_Many thanks to Maria Colgan and Doug Burns for reviewing this post and providing useful feedback._
