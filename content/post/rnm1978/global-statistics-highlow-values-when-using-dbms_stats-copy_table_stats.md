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

Here's a script that demonstrates the two issues, written and commented based on execution on 11.1.0.7: 
```sql
/* copy_stats_1.sql

Illustrate apparent problem with high_val on partition statistics when using partition to partition statistics copy * Table global stats do not update high_value for partitioning key * high_value of one partition overlaps with low_value of the next.

Requires display_raw function by Greg Rahn, see here: http://tinyurl.com/display-raw

https://rmoff.net

*/

set echo off set timing off set feedback off set linesize 156 set pagesize 57 col owner for a10 col table_name for a30 col column_name for a30 col partition_name for a20 col low_val for a10 col high_val for a10 col num_rows for 999,999,999,999 col "sum of num_rows" for 999,999,999,999 break on stats_update_time skip 1 duplicates

clear screen

prompt ===== This script uses the DISPLAY_RAW function ======= prompt prompt Available here: http://structureddata.org/2007/10/16/how-to-display-high_valuelow_value-columns-from-user_tab_col_statistics/ prompt prompt ======================================================== prompt prompt prompt prompt =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prompt 1. Set up an partitioned table with data and examine the statistics prompt prompt set echo on pause -- Create fact table drop table BASE_DATA; CREATE table BASE_DATA ( day_key integer, store_key INTEGER, item_key INTEGER, fact_001 NUMBER(15,0), fact_002 NUMBER(15,0), fact_003 NUMBER(18,2)) PARTITION BY RANGE (DAY_KEY) SUBPARTITION BY HASH (store_key) SUBPARTITION TEMPLATE ( SUBPARTITION "SP1" , SUBPARTITION "SP2" , SUBPARTITION "SP3" , SUBPARTITION "SP4") ( PARTITION "PART_20110401" VALUES LESS THAN (20110402)) PARALLEL;

pause -- Create indexes CREATE UNIQUE INDEX BASE_DATA_PK ON BASE_DATA ("DAY_KEY", "STORE_KEY", "ITEM_KEY") LOCAL parallel; create bitmap index base_data_ix2 on base_data (store_key) local parallel; create bitmap index base_data_ix3 on base_data (item_key) local parallel;

pause

\-- Populate fact table exec DBMS_RANDOM.SEED('StraussCookPieterson'); insert into BASE_DATA values (20110401,101,2000, dbms_random.value(0,999) , dbms_random.value(0,999) , dbms_random.value(0,999) ); insert into BASE_DATA values (20110401,102,2000, dbms_random.value(0,999) , dbms_random.value(0,999) , dbms_random.value(0,999) ); commit;

pause

\-- Gather full stats on table set feedback on exec dbms_stats.gather_table_stats( ownname=>USER, tabname=>'BASE_DATA', granularity=>'AUTO'); set feedback off

pause

select * from base_data order by day_key; pause -- Examine statistics

set echo off prompt prompt DBA_PART_TABLES select partitioning_type, subpartitioning_type, partition_count from dba_part_tables where table_name='BASE_DATA' and owner=USER;

prompt prompt DBA_TAB_STATS_HISTORY SELECT table_name, partition_name, stats_update_time FROM dba_tab_stats_history WHERE owner = USER AND table_name = 'BASE_DATA' ORDER BY stats_update_time asc; pause

prompt prompt DBA_TAB_STATISTICS (table level only): prompt ************************************** select table_name,num_rows, to_char(LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED" from DBA_TAB_STATISTICS where table_name='BASE_DATA' and owner=USER and partition_name is null ;

pause

compute sum of num_rows on report prompt prompt DBA_TAB_STATISTICS (Partition level): prompt ************************************* select table_name,partition_name,num_rows, to_char(LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED" from DBA_TAB_STATISTICS where table_name='BASE_DATA' and owner=USER and partition_name is not null and subpartition_name is null order by table_name,partition_name ; clear computes

pause

prompt DBA_PART_COL_STATISTICS: prompt ************************ select a.partition_name,a.column_name,to_char(a.LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED", display_raw(a.low_value,b.data_type) as low_val,display_raw(a.high_value,b.data_type) as high_val from DBA_PART_COL_STATISTICS a inner join dba_tab_cols b on a.table_name=b.table_name and a.column_name=b.column_name and a.owner=b.owner where a.table_name='BASE_DATA' and a.owner=USER and a.partition_name is not null and a.column_name = 'DAY_KEY' ;

prompt prompt Observe: Partition high/low values for DAY_KEY - currently 1st April pause

prompt prompt DBA_TAB_COL_STATISTICS: prompt *********************** select a.column_name,to_char(a.LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED", display_raw(a.low_value,b.data_type) as low_val,display_raw(a.high_value,b.data_type) as high_val from DBA_TAB_COL_STATISTICS a inner join dba_tab_cols b on a.table_name=b.table_name and a.column_name=b.column_name and a.owner=b.owner where a.table_name='BASE_DATA' and a.owner=USER and a.column_name = 'DAY_KEY' ; prompt prompt Observe: Table high/low values for DAY_KEY - currently 1st April pause

prompt prompt prompt prompt =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prompt 2. Create new partition and use dbms_stats.copy_table_stats to set the stats for it. Leave data in the table unchanged. prompt prompt pause

set feedback on set echo on alter table base_data add PARTITION "PART_20110402" VALUES LESS THAN (20110403); exec dbms_stats.copy_table_stats(ownname=>USER, tabname=>'BASE_DATA',SRCPARTNAME=>'PART_20110401',DSTPARTNAME=>'PART_20110402'); pause set feedback off

select * from base_data order by day_key; pause -- Examine statistics

set echo off prompt prompt DBA_PART_TABLES select partitioning_type, subpartitioning_type, partition_count from dba_part_tables where table_name='BASE_DATA' and owner=USER;

prompt prompt DBA_TAB_STATS_HISTORY SELECT table_name, partition_name, stats_update_time FROM dba_tab_stats_history WHERE owner = USER AND table_name = 'BASE_DATA' ORDER BY stats_update_time asc; pause

prompt DBA_TAB_STATISTICS (table level only): prompt ************************************** select table_name,num_rows, to_char(LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED" from DBA_TAB_STATISTICS where table_name='BASE_DATA' and owner=USER and partition_name is null ;

compute sum of num_rows on report prompt prompt DBA_TAB_STATISTICS (Partition level): prompt ************************************* select table_name,partition_name,num_rows, to_char(LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED" from DBA_TAB_STATISTICS where table_name='BASE_DATA' and owner=USER and partition_name is not null and subpartition_name is null order by table_name,partition_name ; clear computes

prompt prompt Side note: Oracle doesn't aggregate the partition num_rows statistic up to global when doing a copy stats, prompt so whilst the sum of partition num_rows is four, the global num_rows is still two. prompt Of course, at this point, there are only actually two rows of data in the table. prompt prompt (also, observe that LAST_ANALYZED for the new partition is that of the partition from where the stats were copied, and isn't prompt the same as STATS_UPDATE_TIME for the partition on DBA_TAB_STATS_HISTORY - which makes sense when you think about it) pause

prompt prompt DBA_TAB_PARTITIONS: prompt ******************** select partition_name, high_value from dba_tab_partitions where table_name='BASE_DATA' and table_owner=USER; prompt prompt DBA_PART_COL_STATISTICS: prompt ************************ select a.partition_name,a.column_name,to_char(a.LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED", display_raw(a.low_value,b.data_type) as low_val,display_raw(a.high_value,b.data_type) as high_val from DBA_PART_COL_STATISTICS a inner join dba_tab_cols b on a.table_name=b.table_name and a.column_name=b.column_name and a.owner=b.owner where a.table_name='BASE_DATA' and a.owner=USER and a.partition_name is not null and a.column_name = 'DAY_KEY' ; prompt prompt See the Partition high/low values for DAY_KEY in the new partition (PART_20110402) into which we copied the stats: prompt --> low_value is correct prompt --> high_value is out of range for possible data in that partition prompt -----> high_value of the partition is < 20110403, ** not ** <= 20110403 prompt pause prompt prompt DBA_TAB_COL_STATISTICS: prompt *********************** select a.column_name,to_char(a.LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED", display_raw(a.low_value,b.data_type) as low_val,display_raw(a.high_value,b.data_type) as high_val from DBA_TAB_COL_STATISTICS a inner join dba_tab_cols b on a.table_name=b.table_name and a.column_name=b.column_name and a.owner=b.owner where a.table_name='BASE_DATA' and a.owner=USER and a.column_name = 'DAY_KEY' ; prompt prompt See the Table high/low values for DAY_KEY - currently 1st April, even though the stats on individual partitions has a (wrong) high_val of 3rd April. pause prompt prompt prompt prompt =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prompt 3. Add another new partition and use dbms_stats.copy_table_stats to set the stats for it. Leave data in the table unchanged. prompt prompt pause

set feedback on set echo on alter table base_data add PARTITION "PART_20110403" VALUES LESS THAN (20110404); exec dbms_stats.copy_table_stats(ownname=>USER, tabname=>'BASE_DATA',SRCPARTNAME=>'PART_20110401',DSTPARTNAME=>'PART_20110403'); pause set feedback off

select * from base_data order by day_key; pause -- Examine statistics

set echo off prompt prompt DBA_PART_TABLES select partitioning_type, subpartitioning_type, partition_count from dba_part_tables where table_name='BASE_DATA' and owner=USER;

prompt prompt DBA_TAB_STATS_HISTORY SELECT table_name, partition_name, stats_update_time FROM dba_tab_stats_history WHERE owner = USER AND table_name = 'BASE_DATA' ORDER BY stats_update_time asc; pause

prompt DBA_TAB_STATISTICS (table level only): prompt ************************************** select table_name,num_rows, to_char(LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED" from DBA_TAB_STATISTICS where table_name='BASE_DATA' and owner=USER and partition_name is null ;

compute sum of num_rows on report prompt prompt DBA_TAB_STATISTICS (Partition level): prompt ************************************* select table_name,partition_name,num_rows, to_char(LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED" from DBA_TAB_STATISTICS where table_name='BASE_DATA' and owner=USER and partition_name is not null and subpartition_name is null order by table_name,partition_name ; clear computes

pause

prompt prompt DBA_TAB_PARTITIONS: prompt ******************** select partition_name, high_value from dba_tab_partitions where table_name='BASE_DATA' and table_owner=USER; prompt prompt DBA_PART_COL_STATISTICS: prompt ************************ select a.partition_name,a.column_name,to_char(a.LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED", display_raw(a.low_value,b.data_type) as low_val,display_raw(a.high_value,b.data_type) as high_val from DBA_PART_COL_STATISTICS a inner join dba_tab_cols b on a.table_name=b.table_name and a.column_name=b.column_name and a.owner=b.owner where a.table_name='BASE_DATA' and a.owner=USER and a.partition_name is not null and a.column_name = 'DAY_KEY' ; prompt prompt You can see that the high_value for the new partition is again too high for the possible values the partition could contain prompt prompt But this time we can also see the overlapping high_value of previous column with low_value of the next. prompt PART_20110401 has real stats prompt PART_20110402 has copied stats, with a (wrong) high_value of 20110403 prompt PART_20110403 has copied stats, with a low_value of 20110403 - which is the same as the high_value of the previous partition

prompt pause prompt prompt DBA_TAB_COL_STATISTICS: prompt *********************** select a.column_name,to_char(a.LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED", display_raw(a.low_value,b.data_type) as low_val,display_raw(a.high_value,b.data_type) as high_val from DBA_TAB_COL_STATISTICS a inner join dba_tab_cols b on a.table_name=b.table_name and a.column_name=b.column_name and a.owner=b.owner where a.table_name='BASE_DATA' and a.owner=USER and a.column_name = 'DAY_KEY' ; prompt prompt Table high/low values for DAY_KEY - still 1st April, even though the stats on individual partitions has a (wrong) high_val of 4th April. pause

prompt prompt prompt prompt =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= prompt 4. Add data to the table, gather real statistics, examine them. prompt prompt pause

set echo on -- Populate fact table insert into BASE_DATA values (20110402,101,2000, dbms_random.value(0,999) , dbms_random.value(0,999) , dbms_random.value(0,999) ); insert into BASE_DATA values (20110403,101,2000, dbms_random.value(0,999) , dbms_random.value(0,999) , dbms_random.value(0,999) ); commit;

pause

\-- gather full stats exec dbms_stats.gather_table_stats( ownname=>USER, tabname=>'BASE_DATA', granularity=>'AUTO'); pause

select * from base_data order by day_key; pause -- Examine statistics

set echo off prompt prompt DBA_PART_TABLES select partitioning_type, subpartitioning_type, partition_count from dba_part_tables where table_name='BASE_DATA' and owner=USER;

prompt prompt DBA_TAB_STATS_HISTORY SELECT table_name, partition_name, stats_update_time FROM dba_tab_stats_history WHERE owner = USER AND table_name = 'BASE_DATA' ORDER BY stats_update_time asc; pause

prompt DBA_TAB_STATISTICS (table level only): prompt ************************************** select table_name,num_rows, to_char(LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED" from DBA_TAB_STATISTICS where table_name='BASE_DATA' and owner=USER and partition_name is null ; pause

compute sum of num_rows on report prompt prompt DBA_TAB_STATISTICS (Partition level): prompt ************************************* select table_name,partition_name,num_rows, to_char(LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED" from DBA_TAB_STATISTICS where table_name='BASE_DATA' and owner=USER and partition_name is not null and subpartition_name is null order by table_name,partition_name ; clear computes prompt prompt Table num_rows is now accurate pause

prompt prompt DBA_TAB_PARTITIONS: prompt ******************** select partition_name, high_value from dba_tab_partitions where table_name='BASE_DATA' and table_owner=USER; prompt prompt DBA_PART_COL_STATISTICS: prompt ************************ select a.partition_name,a.column_name,to_char(a.LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED", display_raw(a.low_value,b.data_type) as low_val,display_raw(a.high_value,b.data_type) as high_val from DBA_PART_COL_STATISTICS a inner join dba_tab_cols b on a.table_name=b.table_name and a.column_name=b.column_name and a.owner=b.owner where a.table_name='BASE_DATA' and a.owner=USER and a.partition_name is not null and a.column_name = 'DAY_KEY' ;

prompt prompt Partition high/low values for DAY_KEY in each partition is correct pause

prompt prompt DBA_TAB_COL_STATISTICS: prompt *********************** select a.column_name,to_char(a.LAST_ANALYZED,'YYYY-MM-DD-HH24:MI:SS') "LAST_ANALYZED", display_raw(a.low_value,b.data_type) as low_val,display_raw(a.high_value,b.data_type) as high_val from DBA_TAB_COL_STATISTICS a inner join dba_tab_cols b on a.table_name=b.table_name and a.column_name=b.column_name and a.owner=b.owner where a.table_name='BASE_DATA' and a.owner=USER and a.column_name = 'DAY_KEY' ; prompt prompt Table high/low values for DAY_KEY are now correct pause

/* #EOF */
```


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
