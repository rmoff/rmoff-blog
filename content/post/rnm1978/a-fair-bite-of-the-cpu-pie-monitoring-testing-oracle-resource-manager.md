---
draft: false
title: 'A fair bite of the CPU pie? Monitoring & Testing Oracle Resource Manager'
date: "2010-09-10T22:35:44+0100"
categories:
- oracle
- performance
- Resource Manager
- unix
---

## Introduction

<!--more-->
We’re in the process of implemention [Resource Manager](http://download.oracle.com/docs/cd/B28359_01/server.111/b28310/dbrm.htm#i1010776) (RM) on our Oracle 11gR1 Data Warehouse. We’ve currently got one DW application live, but have several more imminent. We identified RM as a suitable way of – as the name would suggest – managing the resources on the server.

In the first instance we’re looking at simply protecting CPU for, and from, future applications. At some point it would be interesting to use some of the more granular and precise functions to demote long-running queries, have nighttime/daytime plans, etc.  
I’d also like to explore the [management of IO](http://www.oracle-base.com/articles/11g/ResourceManagerEnhancements_11gR1.php#per_session_io_limits) but for us the pain is in bandwidth that a query consumes, and it looks like RM can only work with total session MB, or IOPS. Reading about Exadata it sounds like the Exadata I/O Resource Management might do this ([…][It allows intra and inter-database I/O bandwidth to be defined and managed](http://blogs.sun.com/Samson/entry/oracle_exadata_storage_server_a)[..]). But for that I’ll have to write to Santa and promise to be a good boy this year.

Here are some good resources for learning about Resource Manager:

- [Overview of the Database Resource Manager](http://download.oracle.com/docs/cd/B28359_01/server.111/b28318/mgmt_db.htm#i42692) – Oracle documentation- [Managing Resource Allocation with Oracle Database Resource Manager](http://download.oracle.com/docs/cd/B28359_01/server.111/b28310/dbrm.htm#i1010776) – Oracle documentation of RM- [Using Oracle Database Resource Manager](http://www.oracle.com/technetwork/database/features/performance/resource-manager-twp-133705.pdf) – A very useful whitepaper about RM, with lots of detail about the workings of it.- [Resource Manager Data Dictionary Views](http://download.oracle.com/docs/cd/B28359_01/server.111/b28310/dbrm011.htm#i1008772)- [Control Your Environment with the Resource Manager](https://www.seouc.com/presentations_09/Resource_Manager_Norman.pdf) – A good set of slides from a presentation by Margaret Norman- [Oracle Database Resource Manager and OBIEE](http://www.rittmanmead.com/2010/01/08/oracle-database-resource-manager-and-obiee/) – A good article by Mark Rittman- [Resource Manager Enhancements in Oracle Database 11g Release 1](http://www.oracle-base.com/articles/11g/ResourceManagerEnhancements_11gR1.php) – by Tim Hall- [Further Oracle documentation on Resource Manager](http://www.oracle.com/pls/db111/search?remark=quick_search&word=resource+manager)

## Our implementation of RM

Our initial aim with RM is to do nothing more than ensure that everything we need to run does not do so at the expense of other applications on the server. A 64-way parallel beast of a query should not be allowed to freeze out lightweight workload from application backend processes (such as Usage Tracking, Informatica and DAC Repositories, etc).

We’ve implemented this by grouping schema IDs from the four projects into consumer groups (PROJ\_A\_GRP, PROJ\_B\_GRP, PROJ\_C\_GRP, PROJ\_D\_GRP). The other group where users are explicitly defined is SYS\_GROUP, for the SYS and SYSTEM users. All other users (i.e. those from application backend processes) go in the OTHER\_GROUP.

Our Resource Plan is this: CPU priority is allocated entirely to SYSTEM\_GROUP. If any is remaining, it is allocated to OTHER\_GROUP. Any CPU remaining after that gets divided up in quarters to the four project groups. It’s worth pointing out that Oracle itself manages Oracle core processes, in a group called \_ORACLE\_BACKGROUND\_GROUP\_.

Here’s the contents of V$RSRC\_PLAN, DBA\_RSRC\_PLANS, and DBA\_RSRC\_PLAN\_DIRECTIVES for the current active plan:

```

        ID NAME                             IS_TOP_PLAN CPU_MANAGED
---------- -------------------------------- ----------- -----------
   1020578 DW_PLAN                          TRUE        ON


                       NUM_PLAN                                                                                                                      SUB
  PLAN_ID PLAN       DIRECTIVES CPU_METHOD       MGMT_METHOD      ACTIVE_SESS_POOL_MTH             PARALLEL_DEGREE_LIMIT_MTH        QUEUEING_MTH     PLAN
--------- ---------- ---------- ---------------- ---------------- -------------------------------- -------------------------------- ---------------- ------
  1020578 DW_PLAN             6 EMPHASIS         EMPHASIS         ACTIVE_SESS_POOL_ABSOLUTE        PARALLEL_DEGREE_LIMIT_ABSOLUTE   FIFO_TIMEOUT     NO


PLAN       GROUP_OR_SUBPLAN     TYPE           CPU_P1 CPU_P2 CPU_P3 MGMT_P1 MGMT_P2 MGMT_P3
---------- -------------------- -------------- ------ ------ ------ ------- ------- -------
DW_PLAN    SYS_GROUP            CONSUMER_GROUP    100      0      0     100       0       0
DW_PLAN    OTHER_GROUPS         CONSUMER_GROUP      0    100      0       0     100       0
DW_PLAN    PROJ_A_GRP           CONSUMER_GROUP      0      0     25       0       0      25
DW_PLAN    PROJ_B_GRP           CONSUMER_GROUP      0      0     25       0       0      25
DW_PLAN    PROJ_C_GRP           CONSUMER_GROUP      0      0     25       0       0      25
DW_PLAN    PROJ_D_GRP           CONSUMER_GROUP      0      0     25       0       0      25

```

My understanding of RM’s control of CPU is that in essence it does nothing, until the database is under CPU pressures. Once queries are being constrained by CPU, RM will enforce the allocation of CPU between the various consumer groups as defined in the currently active Resource Plan.

Note that RM is only within the Oracle context – it cannot do anything about non-Oracle processes on the same server using lots of CPU. An example of this that we’ve seen is ODI agents running local to the database – if these are doing lots of work then they may impact Oracle but we cannot use RM to control it.

Here’s my understanding of how we’ll see RM in action – and as you’ll see from the tests that I run, I’m not sure that it is entirely correct. Generally, there will be no SYSTEM\_GROUP activity, and very minimal OTHER\_GROUP activity. This leaves the lion’s share for our application queries/ETL. Until the CPU on the box hits 100%, no throttling will be done. This is important to note. Our allocation of 25% CPU to PROJ\_A\_GRP only means that it is the minimum it can expect (see below – this doesn’t seem to be correct). If nothing else is running, it will get 100%. Conversely, if an application backend process (in the OTHER\_GROUP consumer group) is using lots of CPU, let’s say 60%, and all four project groups are demanding CPU, then each will get 25% of the remaining 40% of the box’s capacity, i.e. 10% host CPU.

## Scripts to Monitor and Test RM

It’s important to know that RM is doing what we think it is, and to also be able to determine the current state of a system in terms of resources. If a system is at 100% CPU and users are demanding why RM “isn’t working” it will be useful to prove that it is non-Oracle processes creating the CPU demand.

I’ve been working on some queries to both validate and monitor RM. [This excellent whitepaper on RM](http://www.oracle.com/technetwork/database/features/performance/resource-manager-twp-133705.pdf) has some queries illustrating how to use [v$rsrcmgrmetric\_history](http://download.oracle.com/docs/cd/B28359_01/server.111/b28320/dynviews_2155.htm#REFRN30483) to report on RM behaviour. I built on this to incorporate [V$SYSMETRIC\_HISTORY](http://download.oracle.com/docs/cd/B28359_01/server.111/b28320/dynviews_3084.htm#I1030344) to source host CPU %, creating this query which infers the workload on the system.

We’re looking at system statistics per minute slice (which is the level that v$rsrcmgrmetric\_history is at, and then GROUP\_ID=2 on V$SYSMETRIC\_HISTORY).

The source metrics are :

- **CPU count** – From v$osstat where stat\_name = 'NUM\_CPUS'.- **Host CPU utilisation (%)** – From V$SYSMETRIC\_HISTORY where metric\_id = 2057. This number should match the CPU usage as reported by the host (e.g. through sar, top, glance etc)- **Used Oracle Seconds** – From V$RSRCMGRMETRIC\_HISTORY.cpu\_consumed\_time. The number of CPU seconds that Oracle thinks it has consumed

From this are derived:

- **Total Available CPU Seconds** – The number of CPU seconds per minute slice available is going to be 60 seconds multiplied by the number of CPUs that in theory could be running Oracle work. Obviously in practice Oracle can’t use 100% of this CPU time, but this number’s a useful starting point for the following derivations- **Total Used Seconds** – Total CPU time, divided by the host CPU utilisation. So if the CPU is at 50% utilisation and there are 480 CPU seconds available per minute, then logically 240 CPU seconds must have been used over that minute. Note that this is the total number of CPU seconds used, both Oracle and Non-Oracle.- **Non-Oracle Seconds Used** – Total CPU time, divided by the host CPU utilisation, minus the number of CPU seconds Oracle has used.

From the above derived figures percentages are calculated too.

**rm\_cpu\_01.sql**:

```

/* System CPU and Resource Manager impact over time

Based on : http://www.oracle.com/technetwork/database/features/performance/resource-manager-twp-133705.pdf
and http://download.oracle.com/docs/cd/B28359_01/server.111/b28320/dynviews_3084.htm#I1030344

https://rmoff.net
*/
set linesize 160
set pagesize 50
set colsep '  ' -- thanks @Boneist 🙂
column "Total Available CPU Seconds"    head "Total Available|CPU Seconds"      format 990
column "Used Oracle Seconds"            head "Used Oracle|Seconds"              format 990.9
column "Used Host CPU %"                head "Used Host|CPU %"                  format 990.9
column "Idle Host CPU %"                head "Idle Host|CPU %"                  format 990.9
column "Total Used Seconds"             head "Total Used|Seconds"               format 990.9
column "Idle Seconds"                   head "Idle|Seconds"                     format 990.9
column "Non-Oracle Seconds Used"        head "Non-Oracle|Seconds Used"          format 990.9
column "Oracle CPU %"                   head "Oracle|CPU %"                     format 990.9
column "Non-Oracle CPU %"               head "Non-Oracle|CPU %"                 format 990.9
column "throttled"                      head "Oracle Throttled|Time (s)"        format 990.9

select to_char(rm.BEGIN_TIME,'YYYY-MM-DD HH24:MI:SS') as BEGIN_TIME
        ,60 * (select value from v$osstat where stat_name = 'NUM_CPUS') as "Total Available CPU Seconds"
        ,sum(rm.cpu_consumed_time) / 1000 as "Used Oracle Seconds"
        ,min(s.value) as "Used Host CPU %"
        ,(60 * (select value from v$osstat where stat_name = 'NUM_CPUS')) * (min(s.value) / 100) as "Total Used Seconds"
        ,((100 - min(s.value)) / 100) * (60 * (select value from v$osstat where stat_name = 'NUM_CPUS')) as "Idle Seconds"
        ,((60 * (select value from v$osstat where stat_name = 'NUM_CPUS')) * (min(s.value) / 100)) - sum(rm.cpu_consumed_time) / 1000 as "Non-Oracle Seconds
Used"
        ,100 - min(s.value) as "Idle Host CPU %"
        ,((((60 * (select value from v$osstat where stat_name = 'NUM_CPUS')) * (min(s.value) / 100)) - sum(rm.cpu_consumed_time) / 1000) / (60 * (select valu
e from v$osstat where stat_name = 'NUM_CPUS')))*100 as "Non-Oracle CPU %"
        ,(((sum(rm.cpu_consumed_time) / 1000) / (60 * (select value from v$osstat where stat_name = 'NUM_CPUS'))) * 100) as "Oracle CPU %"
        , sum(rm.cpu_wait_time) / 1000 as throttled
from    gv$rsrcmgrmetric_history rm
        inner join
        gV$SYSMETRIC_HISTORY s
        on rm.begin_time = s.begin_time
where   s.metric_id = 2057
  and   s.group_id = 2
group by rm.begin_time,s.begin_time
order by rm.begin_time
/
```

This is my server when Oracle is at rest:

```

                     Total Available  Used Oracle  Used Host  Total Used     Idle    Non-Oracle  Idle Host  Non-Oracle  Oracle  Oracle Throttled
BEGIN_TIME               CPU Seconds      Seconds      CPU %     Seconds  Seconds  Seconds Used      CPU %       CPU %   CPU %          Time (s)
-------------------  ---------------  -----------  ---------  ----------  -------  ------------  ---------  ----------  ------  ----------------
2010-09-10 14:45:51              480          3.0        1.8         8.4    471.6           5.4       98.2         1.1     0.6               0.0
2010-09-10 14:46:50              480          3.0        1.7         8.0    472.0           5.0       98.3         1.0     0.6               0.0
2010-09-10 14:47:50              480          3.4        3.9        18.6    461.4          15.2       96.1         3.2     0.7               0.0
2010-09-10 14:48:50              480          0.7        2.1        10.1    469.9           9.4       97.9         2.0     0.1               0.0
2010-09-10 14:49:50              480          0.3        1.3         6.3    473.7           6.0       98.7         1.2     0.1               0.0
2010-09-10 14:50:51              480          0.2        2.2        10.8    469.2          10.6       97.8         2.2     0.0               0.0
```

N.B. at high CPU usage I’ve seen errors appear in the derived numbers, with negative values for non-oracle time and percentage. I’d speculate that this is because we’re dealing with percentage (CPU) figures averaged out over a minute, but cumulative figures (used Oracle seconds) over the same period.

The CPU figure is validated by output from sar (give or take a percentage point):

```

HP-UX myserver B.11.31 U ia64    09/10/10

14:45:47    %usr    %sys    %wio   %idle
14:46:47       1       1       0      98
14:47:47       1       1       0      98
14:48:47       3       1       0      96
14:49:47       1       1       0      98
14:50:47       1       1       0      98
```

CPU usage by consumer group can be examined in more detail using this script, **rm\_05.sql**:

```

/* CPU usage and RM impact over time, by consumer group, per minute

Derived from : http://www.oracle.com/technetwork/database/features/performance/resource-manager-twp-133705.pdf

https://rmoff.net
*/

set linesize 160
set pagesize 60
set colsep '  '

column total                    head "Total Available|CPU Seconds"      format 990
column consumed                 head "Used|Oracle Seconds"              format 990.9
column consumer_group_name      head "Consumer|Group Name"              format a25      wrap off
column "throttled"              head "Oracle Throttled|Time (s)"        format 990.9
column cpu_utilization          head "% of Host CPU" 	                format 990.9
break on time skip 2 page

select to_char(begin_time, 'YYYY-DD-MM HH24:MI:SS') time,
consumer_group_name,
60 * (select value from v$osstat where stat_name = 'NUM_CPUS') as total,
cpu_consumed_time / 1000 as consumed,
cpu_consumed_time / (select value from v$parameter where name = 'cpu_count') / 600 as cpu_utilization,
cpu_wait_time / 1000 as throttled
from v$rsrcmgrmetric_history
order by begin_time,consumer_group_name
/
```

```

                                                     Total Available            Used                      Oracle Throttled
TIME                 CONSUMER_GROUP_NAME                 CPU Seconds  Oracle Seconds  % of Host CPU          Time (s)
-------------------  ------------------------------  ---------------  --------------  ------------------  ----------------
2010-10-09 14:37:50  PROJ_C_GRP                                  480            40.4                 8.4               0.0
                     PROJ_A_GRP                                  480             0.0                 0.0               0.0
                     PROJ_B_GRP                                  480             0.0                 0.0               0.0
                     OTHER_GROUPS                                480             5.0                 1.0               0.0
                     PROJ_D_GRP                                  480             0.0                 0.0               0.0
                     SYS_GROUP                                   480             0.0                 0.0               0.0
                     _ORACLE_BACKGROUND_GROUP_                   480             0.0                 0.0               0.0
```

For details of each session within a consumer group I use script **rm\_02.sql**:

```

/*
Resource Manager / Session details

 V$RSRC_SESSION_INFO
    http://download.oracle.com/docs/cd/B28359_01/server.111/b28320/dynviews_2153.htm#REFRN30404

https://rmoff.net
*/
SET pagesize 50
SET linesize 155
SET wrap off
COLUMN name format a11 head "Consumer|Group"
COLUMN sid format 9999
COLUMN username format a16
COLUMN CONSUMED_CPU_TIME head "Consumed|CPU time|(s)" format 999999.9
COLUMN IO_SERVICE_TIME head "I/O time|(s)" format 9999.9
COLUMN CPU_WAIT_TIME head "CPU Wait|Time (s)" FOR 99999
COLUMN CPU_WAITS head "CPU|Waits" format 99999
COLUMN YIELDS head "Yields" format 99999
COLUMN state format a10
COLUMN osuser format a8
COLUMN machine format a16
COLUMN PROGRAM format a12

SELECT
          rcg.name
        , rsi.sid
        , s.username
        , rsi.state
        , rsi.YIELDS
        , rsi.CPU_WAIT_TIME / 1000 AS CPU_WAIT_TIME
        , rsi.CPU_WAITS
        , rsi.CONSUMED_CPU_TIME / 1000 AS CONSUMED_CPU_TIME
        , rsi.IO_SERVICE_TIME /1000 AS IO_SERVICE_TIME
        , s.osuser
        , s.program
        , s.machine
        , sw.event
FROM V$RSRC_SESSION_INFO rsi INNER JOIN v$rsrc_consumer_group rcg
ON rsi.CURRENT_CONSUMER_GROUP_ID = rcg.id
INNER JOIN v$session s ON rsi.sid=s.sid
INNER JOIN v$session_wait sw ON s.sid = sw.sid
WHERE rcg.id !=0 -- _ORACLE_BACKGROUND_GROUP_
and (sw.event != 'SQL*Net message from client' or rsi.state='RUNNING')
ORDER BY rcg.name, s.username,rsi.cpu_wait_time + rsi.IO_SERVICE_TIME + rsi.CONSUMED_CPU_TIME ASC, rsi.state, sw.event, s.username, rcg.name,s.machine,s.osuser
/
```

N.B. When quoting the output from this query I cut sessions such as the one running the query itself, and other non-relevant processes (eg non-active monitoring etc):

```

                                                                      Consumed
Consumer                                             CPU Wait    CPU  CPU time I/O time
Group         SID USERNAME         STATE      Yields Time (s)  Waits       (s)      (s) OSUSER   PROGRAM      MACHINE          EVENT
----------- ----- ---------------- ---------- ------ -------- ------ --------- -------- -------- ------------ ---------------- ----------------------------
PROJ_A_GRP   1089 PROJA_USR       RUNNING        53        3     53     426.0       .0 myuser0 sqlplus@aser aserver          resmgr:cpu quantum
PROJ_B_GRP    523 PROJB_USR       RUNNING       284       17    284     412.4       .0 myuser0 sqlplus@aser aserver          latch free
PROJ_B_GRP    508 PROJB_USR       RUNNING       272       18    272     410.7       .0 myuser0 sqlplus@aser aserver          latch free
PROJ_B_GRP   1090 PROJB_USR       RUNNING        52        3     52     426.0       .0 myuser0 sqlplus@aser aserver          latch free
```

To generate load on the database I’ve got a script, **hit\_cpu.sql**, that is based on one [provided by one of our DBAs](http://jhdba.wordpress.com/2009/11/19/maxing-out-cpus-script/):

```

/* Generate CPU load

Based on http://jhdba.wordpress.com/2009/11/19/maxing-out-cpus-script/

https://rmoff.net
*/

set timing on

select to_char(sysdate,'YYYY-MM-DD HH24:MI:SS') as start_time from dual

/
declare a number := 1;
begin for i in 1..1000000000
loop a := ( a + i )/11;
end loop;
end;
/
select to_char(sysdate,'YYYY-MM-DD HH24:MI:SS') as end_time from dual;
/
```

## Test 01

I started the hit\_cpu script at 15:38:32. You can see its impact :

```

                     Total Available  Used Oracle  Used Host  Oracle Throttled
BEGIN_TIME               CPU Seconds      Seconds      CPU %          Time (s)
-------------------  ---------------  -----------  ---------  ----------------
2010-09-10 15:37:50              480         17.8        5.7               0.0
2010-09-10 15:38:50              480         58.5       14.3               0.0
2010-09-10 15:39:50              480         59.5       14.3               0.0
2010-09-10 15:40:50              480         60.3       15.3               0.0
2010-09-10 15:41:50              480         58.3       15.4               0.0
2010-09-10 15:42:50              480         59.3       14.7               0.0
2010-09-10 15:43:50              480         58.4       13.9               0.0
2010-09-10 15:44:50              480         59.3       14.3               0.0
2010-09-10 15:45:50              480         58.6       13.8               0.0
2010-09-10 15:46:50              480         58.4       14.0               0.0
2010-09-10 15:47:50              480         31.8       10.0               0.0
2010-09-10 15:48:50              480          0.1        1.3               0.0
```

(for the purposes of this article the derived measures are a distraction, and possibly inaccurate too, so I’ve omitted them from here on)

Very satisfyingly, for each 60-second slice Oracle is using just under 60 seconds of CPU – i.e. my script is loading one CPU.

```

                                                     Total Available            Used                      Oracle Throttled
TIME                 CONSUMER_GROUP_NAME                 CPU Seconds  Oracle Seconds  % of Host CPU          Time (s)
-------------------  ------------------------------  ---------------  --------------  ------------------  ----------------
2010-10-09 15:38:50  PROJ_C_GRP                                  480             0.0                 0.0               0.0
                     PROJ_A_GRP                                  480             0.0                 0.0               0.0
                     PROJ_B_GRP                                  480             0.0                 0.0               0.0
                     OTHER_GROUPS                                480            58.5                12.2               0.0
                     PROJ_D_GRP                                  480             0.0                 0.0               0.0
                     SYS_GROUP                                   480             0.0                 0.0               0.0
                     _ORACLE_BACKGROUND_GROUP_                   480             0.0                 0.0               0.0
```

sar matches up with the CPU figures from Oracle:

```

            %usr    %sys    %wio   %idle
15:38:47       4       1       0      95
15:39:47      14       1       0      85
15:40:47      14       1       0      85
15:41:47      14       1       0      84
15:42:47      15       1       0      84
15:43:47      14       1       0      85
15:44:47      14       1       0      86
15:45:47      14       1       0      85
15:46:47      14       1       0      86
15:47:47      14       1       0      86
15:48:47      10       1       0      89
15:49:47       1       1       0      98
```

## Test 02

I added two more scripts into the test, initiating them from a shell script using the ampersand operator to create them as background jobs running in parallel:

```

/app/oracle/product/11.1.0/db_1/bin/sqlplus USER/PW @hit_cpu &
/app/oracle/product/11.1.0/db_1/bin/sqlplus USER/PW @hit_cpu &
/app/oracle/product/11.1.0/db_1/bin/sqlplus USER/PW @hit_cpu &
```

(The sqlplus path is specified because I’ve got an alias for ‘sqlplus’ to use ied, and it doesn’t like running concurrently from the same shell)

The scripts started at 2010-09-10 15:57:54. Monitoring showed three CPUs being utilised (“Used Oracle Seconds” – c.178 seconds = 3 x c.60 seconds) by Oracle:

```

                     Total Available  Used Oracle  Used Host  
BEGIN_TIME               CPU Seconds      Seconds      CPU %  
-------------------  ---------------  -----------  ---------  
2010-09-10 15:56:50              480          0.8        1.6  
2010-09-10 15:57:50              480        156.9        3.5  
2010-09-10 15:58:50              480        175.1        1.8  
2010-09-10 15:59:50              480        190.9       11.1  
2010-09-10 16:00:50              480        177.8        4.2  
2010-09-10 16:01:51              480        174.9        2.8  
2010-09-10 16:02:50              480        175.3        3.8  
2010-09-10 16:03:50              480        185.8        5.9  
2010-09-10 16:04:50              480        174.9        2.4  
2010-09-10 16:05:50              480        175.2        6.8  
2010-09-10 16:06:50              480        174.1        2.4  
2010-09-10 16:07:50              480          4.9        2.2  
```

However notice the “Used Host CPU %” value – a very low value, and not matching with sar for the same period:

```

            %usr    %sys    %wio   %idle
15:57:47       1       1       0      97
15:58:47      33       1       0      65
15:59:47      39       1       0      60
16:00:47      45       1       0      54
16:01:47      40       1       0      59
16:02:47      40       1       0      60
16:03:47      40       1       0      59
16:04:47      41       1       0      57
16:05:47      39       1       0      60
16:06:47      41       2       0      57
16:07:47      39       1       0      60
16:08:47       4       1       0      95
```

I can’t explain (explanations welcome!) why V$SYSMETRIC\_HISTORY is [apparently] incorrect for this period.

I re-ran the test and Host CPU was picked up correctly by Oracle. The results on the second run matched the first:

```

                     Total Available  Used Oracle  Used Host  
BEGIN_TIME               CPU Seconds      Seconds      CPU %  
-------------------  ---------------  -----------  ---------  
2010-09-10 21:52:50              480          0.1        1.6       
2010-09-10 21:53:50              480          0.2        1.3       
2010-09-10 21:54:50              480        140.2       32.6       
2010-09-10 21:55:50              480        177.9       41.1       
2010-09-10 21:56:50              480        174.9       42.1       
2010-09-10 21:57:50              480        177.6       40.4       
2010-09-10 21:58:50              480        174.8       39.6       
2010-09-10 21:59:50              480        189.0       43.0       
2010-09-10 22:00:50              480        177.7       40.0       
2010-09-10 22:01:50              480        174.5       42.2       
2010-09-10 22:02:50              480        178.0       40.8       
2010-09-10 22:03:51              480        180.8       41.3       
2010-09-10 22:04:50              480         12.3        4.0       
2010-09-10 22:05:50              480          0.1        1.7       
2010-09-10 22:06:50              480          0.2        1.8       
```

## Test 03

The next test I ran used the hit\_cpu script and was called once from a user in one each of the four consumer groups, plus a user not allocated a consumer group and therefore in OTHER\_GROUP. Five scripts in total, so should expect to see CPU usage around (5 x c.60) = c.300 seconds, and machine CPU at something like (5/8)\*100 so c.60-70%

Test started at 2010-09-10 16:20:20. CPU immediately hit about 64% – which based on my calculation above was satisfying 🙂

Using rm\_05 (see above), the breakdown of Oracle CPU time could be seen:

```

                                                     Total Available            Used                      Oracle Throttled
TIME                 CONSUMER_GROUP_NAME                 CPU Seconds  Oracle Seconds  % of Host CPU          Time (s)
-------------------  ------------------------------  ---------------  --------------  ------------------  ----------------
2010-10-09 16:20:50  PROJ_C_GRP                                  480            58.2                12.1               0.0
                     PROJ_A_GRP                                  480            58.2                12.1               0.0
                     PROJ_B_GRP                                  480            58.2                12.1               0.0
                     OTHER_GROUPS                                480            58.8                12.3               0.0
                     PROJ_D_GRP                                  480            58.4                12.2               0.0
                     SYS_GROUP                                   480             0.0                 0.0               0.0
                     _ORACLE_BACKGROUND_GROUP_                   480             0.0                 0.0               0.0
```

rm\_cpu\_01 showed Oracle using c.290 CPU seconds per minute (again inline with estimate – yeah!), and this time the Host CPU % looked accurate:

```

                     Total Available  Used Oracle  Used Host  Oracle Throttled
BEGIN_TIME               CPU Seconds      Seconds      CPU %          Time (s)
-------------------  ---------------  -----------  ---------  ----------------
2010-09-10 16:20:50              480        291.9       66.1               0.0
2010-09-10 16:21:50              480        291.5       65.0               0.0
```

sar matched up :

```

            %usr    %sys    %wio   %idle
16:21:47      65       2       0      34
16:22:47      64       1       0      35
```

(note that sar’s timestamp is the END of a sample, whereas the BEGIN\_TIME in my Oracle queries is the BEGINNING of a sample)

## Test 04

Having seen that RM is correctly assigning our different users to the appropriate consumer groups, we can start testing how RM behaves once the host CPU hits capacity and RM has to start throttling its allocation to the groups.

In theory eight instances of the script should be enough to load the CPU entirely (since there are eight CPUs on the server). I ran four as a user from PROJ\_B\_GRP and four from PROJ\_A\_GRP, starting at 2010-09-10 18:27:53

As predicated CPU usage hits about 100%, according to sar:

```

            %usr    %sys    %wio   %idle
18:27:38       2       1       0      97
18:28:38      69       2       0      29
18:29:38      92       1       0       7
18:30:38      99       1       0       0
18:31:38      96       1       0       3
18:32:38      99       1       0       0
18:33:38      96       1       0       3
```

and this is reflected by Oracle too (rm\_cpu\_01):

```

                     Total Available  Used Oracle  Used Host  Oracle Throttled
BEGIN_TIME               CPU Seconds      Seconds      CPU %          Time (s)
-------------------  ---------------  -----------  ---------  ----------------
2010-09-10 18:26:50              480          1.0        2.3               0.0
2010-09-10 18:27:51              480        444.2       89.5               8.8
2010-09-10 18:28:50              480        472.9       95.0               0.0
2010-09-10 18:29:50              480        465.5       99.1               5.5
2010-09-10 18:30:50              480        462.1       97.0              32.2
2010-09-10 18:31:49              480        473.6      100.0               0.1
2010-09-10 18:32:50              480        458.5       95.2              24.7
```

We can see that of the 480 CPU seconds available in every minute slice, Oracle is using almost all of it – around 470 seconds.

Looking at Resource Manager, we can see that it kicks in – in the time slice beginning at 18:30:50, Oracle constrained one or some of the queries by a total of 30 seconds. Using rm\_02 we can see how this divides up among the sessions. “CPU Wait Time (s)” corresponds to the “Oracle Throttled Time (s)” in rm\_cpu\_01 and rm\_05(bearing in mind different levels of granularity since one is per minute / consumer group and one is per session total).

```

Consumer                                             CPU Wait    CPU  CPU time I/O time
Group         SID USERNAME         STATE      Yields Time (s)  Waits       (s)      (s) OSUSER   PROGRAM      MACHINE          EVENT
----------- ----- ---------------- ---------- ------ -------- ------ --------- -------- -------- ------------ ---------------- ----------------------------
PROJ_A_GRP   1094 PROJA_USR       RUNNING        61        2     61     960.5       .0 myuser0 sqlplus@aser aserver          resmgr:cpu quantum
PROJ_A_GRP    553 PROJA_USR       RUNNING       302       16    302     946.8       .0 myuser0 sqlplus@aser aserver          latch free
PROJ_A_GRP    498 PROJA_USR       RUNNING       310       19    310     945.2       .0 myuser0 sqlplus@aser aserver          latch free
PROJ_A_GRP   1089 PROJA_USR       RUNNING        61        3     61     960.5       .0 myuser0 sqlplus@aser aserver          resmgr:cpu quantum
PROJ_B_GRP   1078 PROJB_USR       RUNNING        56        4     56     959.5       .0 myuser0 sqlplus@aser aserver          latch free
PROJ_B_GRP    523 PROJB_USR       RUNNING       301       17    301     946.7       .0 myuser0 sqlplus@aser aserver          latch free
PROJ_B_GRP    508 PROJB_USR       RUNNING       290       19    290     945.1       .0 myuser0 sqlplus@aser aserver          latch free
PROJ_B_GRP   1090 PROJB_USR       RUNNING        61        3     61     960.4       .0 myuser0 sqlplus@aser aserver          latch free
```

and aggregated to consumer group level (script rm\_05):

```

                                                     Total Available            Used                      Oracle Throttled
TIME                 CONSUMER_GROUP_NAME                 CPU Seconds  Oracle Seconds  % of Host CPU          Time (s)
-------------------  ------------------------------  ---------------  --------------  ------------------  ----------------
2010-10-09 18:30:50  PROJ_C_GRP                                  480             0.0                 0.0               0.0
                     PROJ_A_GRP                                  480           217.7                45.4              13.1
                     PROJ_B_GRP                                  480           215.8                45.0              15.0
                     OTHER_GROUPS                                480            28.6                 6.0               4.1
                     PROJ_D_GRP                                  480             0.0                 0.0               0.0
                     SYS_GROUP                                   480             0.0                 0.0               0.0
                     _ORACLE_BACKGROUND_GROUP_                   480             0.0                 0.0               0.0
```

Note that the throttling is applied pretty much equally to both consumer groups. In plan terms, CPU for level 1 (100% to SYS\_GROUP) is unused, so passes to level 2 (100% to OTHER\_GROUP). OTHER\_GROUP consumes a small amount, and note that it is not [really] throttled. The remaining CPU (96%, from rm\_cpu\_01, minus 6% shown in rm\_05 output = c.90%), is passed onto level 3 of the plan. Whilst the four projects are defined an allocation of 25% each in the plan, two of the consumer groups are not consuming their chunk, so it is divided up amongst the groups that are, according to the ratio of their allocations. Hence, PROJ\_A\_GRP and PROJ\_B\_GRP are using c.45% of host CPU.  
**N.B.** see below for discussion around allocation of CPU, as this statement about ratio may not be true.

## Test 05

Test 04 above showed that RM applies throttling evenly to consumer groups, but it could have been influenced by an equal number of sessions for each consumer group running (that is, if it had throttled in a round-robin manner the result could have been the same).

This test will run a similar workload, but with a skewed number of sessions; 1 PROJ\_A\_GRP and 7 PROJ\_B\_GRP.

The test began at 2010-09-10 19:03:22.

Total CPU usage is about 84%, which on an eight-CPU box is c.1 CPU unused. Script rm\_cpu\_01 shows:

```

                     Total Available  Used Oracle  Used Host  Oracle Throttled
BEGIN_TIME               CPU Seconds      Seconds      CPU %          Time (s)
-------------------  ---------------  -----------  ---------  ----------------
2010-09-10 19:00:51              480          0.2        3.9               0.0
2010-09-10 19:01:50              480          0.2        1.4               0.0
2010-09-10 19:02:51              480        182.9       41.7              37.8
2010-09-10 19:03:50              480        398.5       85.0              83.0
2010-09-10 19:04:51              480        383.1       83.2              82.4
2010-09-10 19:05:50              480        388.7       83.4              83.7
2010-09-10 19:06:51              480        388.0       84.8              80.8
2010-09-10 19:07:51              480        386.8       84.7              81.0
2010-09-10 19:08:50              480        383.4       83.1              83.4
2010-09-10 19:09:50              480        388.4       83.7              79.2
2010-09-10 19:10:50              480        383.0       83.4              85.4
2010-09-10 19:11:50              480        390.6       83.5              85.4
2010-09-10 19:12:51              480        378.7       85.3              83.1
2010-09-10 19:13:50              480        392.5       83.4              81.1
2010-09-10 19:14:51              480        384.9       82.9              82.9
2010-09-10 19:15:50              480        373.0       81.1              79.8
2010-09-10 19:16:50              480        303.3       67.1              66.2
2010-09-10 19:17:50              480        293.9       65.8              59.2
2010-09-10 19:18:50              480        293.7       66.7              59.0
2010-09-10 19:19:50              480        242.4       55.0              58.3
2010-09-10 19:20:50              480        237.2       53.8              59.3
2010-09-10 19:21:51              480        233.1       53.0              58.4
2010-09-10 19:22:50              480        219.7       50.5              48.8
2010-09-10 19:23:50              480          0.8        1.6               0.0
```

This breaks down according to rm\_05 into:

```

                                                     Total Available            Used                 Oracle Throttled
TIME                 CONSUMER_GROUP_NAME                 CPU Seconds  Oracle Seconds  % of Host CPU          Time (s)
-------------------  ------------------------------  ---------------  --------------  -------------  ----------------
2010-10-09 19:13:50  PROJ_C_GRP                                  480             0.0            0.0               0.0
                     PROJ_A_GRP                                  480            59.2           12.3               0.0
                     PROJ_B_GRP                                  480           333.2           69.4              81.1
                     OTHER_GROUPS                                480             0.1            0.0               0.0
                     PROJ_D_GRP                                  480             0.0            0.0               0.0
                     SYS_GROUP                                   480             0.0            0.0               0.0
                     _ORACLE_BACKGROUND_GROUP_                   480             0.0            0.0               0.0
```

(all the minute time slices have same approximate CPU / seconds values)

rm\_02 shows the individual sessions:

```

                                                                             Consumed
Consumer                                                  CPU Wait     CPU   CPU time  I/O time
Group          SID  USERNAME          STATE       Yields  Time (s)   Waits        (s)       (s)  PROGRAM       EVENT
-----------  -----  ----------------  ----------  ------  --------  ------  ---------  --------  ------------  --------------------------------------------
PROJ_A_GRP     521  PROJA_USR        RUNNING          2         0       2      766.9        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_B_GRP    1084  PROJB_USR        RUNNING       5385       225    5385      574.0        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_B_GRP    1082  PROJB_USR        RUNNING       5416       228    5416      571.1        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_B_GRP    1098  PROJB_USR        WAITING FO    5373       224    5373      575.3        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_B_GRP    1070  PROJB_USR        RUNNING       5405       224    5405      575.0        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_B_GRP    1075  PROJB_USR        RUNNING       5424       222    5424      577.3        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_B_GRP     498  PROJB_USR        RUNNING          0         0       0      799.7        .0  sqlplus@aser  latch free
PROJ_B_GRP     508  PROJB_USR        RUNNING          1         0       1      799.7        .0  sqlplus@aser  resmgr:internal state change
OTHER_GROUP    491  myuser0          RUNNING          0         0       1         .4        .0  sqlplus@aser  SQL*Net message to client
```

So – PROJ\_A\_GRP is getting all the CPU that it needs (since it is shown as having zero CPU Wait Time (rm\_02) and zero throttled time (rm\_05). The session is also shown (in rm\_05) as consuming almost 60 CPU seconds in a 60 second time slice.

The PROJ\_B\_GRP has two sessions that apparently run unconstrained, and five that are throttled by RM. The output from rm\_cpu\_01 above shows that RM throttles the queries by roughly 80 seconds of CPU time per minute. Over five sessions (and rm\_02 above shows the constraining being applied equally) that equates to c.16 seconds of CPU time per session.

Even once the first queries complete c.19:17 and the CPU usage drops further, RM still appears to throttle the PROJ\_B\_GRP queries.

**So here is my first major puzzlement with RM:**

- I would have expected to see all seven PROJ\_B\_GRP sessions constrained at the same rate.- Why were the PROJ\_B\_GRP queries throttled even when there was idle CPU? From 19:17 onwards there was around 35% idle.

FWIW the scripts were started from a shell script similar to above, with the PROJ\_B\_GRP sessions first, and then PROJ\_A\_GRP session.

## Test 06

In Test 05 PROJ\_A\_GRP was running only one process, so would not be demanding as much or more than its theoretical 25% allocation. This test will run three PROJ\_A\_GRP sessions and which would (based on Test 02 above) require c.36% host CPU to run. In addition I will run six PROJ\_B\_GRP sessions, theoretical CPU requirement of c.72% host CPU. The total CPU should be driven above 100% and RM kick in.

My understanding (which could be wrong) of RM is that it will do as it did above when there were equal numbers of sessions in each consumer group to throttle; it will allocate the resource 50:50 to the two consumer groups, even though the ratio of sessions will be 1:2.

The test started at 2010-09-10 19:43:51. The results were different from what I had expected.

CPU didn’t hit 100%, staying around 85%. Overall it looked like this (rm\_cpu\_01):

```

                     Total Available  Used Oracle  Used Host  Oracle Throttled
BEGIN_TIME               CPU Seconds      Seconds      CPU %          Time (s)
-------------------  ---------------  -----------  ---------  ----------------
2010-09-10 19:40:50              480          0.4        0.9               0.0
2010-09-10 19:41:50              480          0.2        1.1               0.0
2010-09-10 19:42:50              480          2.5        3.8               0.1
2010-09-10 19:43:51              480        424.7       85.5             101.6
2010-09-10 19:44:50              480        420.0       84.4             101.3
2010-09-10 19:45:50              480        422.6       84.1             105.7
2010-09-10 19:46:50              480        423.4       84.0             106.7
2010-09-10 19:47:50              480        425.3       83.2             107.4
```

sar reports pretty much the same cpu (the figure of 68% here is because of the time at which the test started versus the point in the minute at which sar is recording from):

```

            %usr    %sys    %wio   %idle
19:41:38       1       1       0      99
19:42:38       1       1       0      98
19:43:38       1       1       0      98
19:44:38      68       1       0      31
19:45:38      85       1       0      14
19:46:38      84       1       0      15
19:47:38      83       1       0      17
19:48:38      83       1       0      16
```

RM throttled both consumer groups – but by a different amount to what I had expected. Taking a minute slice (and all were almost the same) using rm\_05:

```

                                                     Total Available            Used                 Oracle Throttled
TIME                 CONSUMER_GROUP_NAME                 CPU Seconds  Oracle Seconds  % of Host CPU          Time (s)
-------------------  ------------------------------  ---------------  --------------  -------------  ----------------
2010-10-09 19:44:50  PROJ_C_GRP                                  480             0.0            0.0               0.0
                     PROJ_A_GRP                                  480           135.2           28.2              38.4
                     PROJ_B_GRP                                  480           284.7           59.3              62.8
                     OTHER_GROUPS                                480             0.1            0.0               0.2
                     PROJ_D_GRP                                  480             0.0            0.0               0.0
                     SYS_GROUP                                   480             0.0            0.0               0.0
                     _ORACLE_BACKGROUND_GROUP_                   480             0.0            0.0               0.0
```

So RM appears to guarenteeing PROJ\_A\_GRP at least 25% CPU (per the resource plan), but after than it allocates twice as much CPU to PROJ\_B\_GRP

Individual sessions (rm\_02):

```

                                                                             Consumed
Consumer                                                  CPU Wait     CPU   CPU time  I/O time
Group          SID  USERNAME          STATE       Yields  Time (s)   Waits        (s)       (s)  PROGRAM       EVENT
-----------  -----  ----------------  ----------  ------  --------  ------  ---------  --------  ------------  --------------------------------------------
PROJ_A_GRP     508  PROJA_USR        RUNNING       1600       128    1600      255.5        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_A_GRP     553  PROJA_USR        RUNNING       1599       122    1599      262.2        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_A_GRP    1098  PROJA_USR        RUNNING          8         0       8      384.1        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_B_GRP    1070  PROJB_USR        RUNNING          4         0       4      383.4        .0  sqlplus@aser  latch free
PROJ_B_GRP     523  PROJB_USR        WAITING FO    1844       146    1844      237.8        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_B_GRP    1084  PROJB_USR        RUNNING          2         0       2      384.2        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_B_GRP     496  PROJB_USR        RUNNING       1843       148    1843      236.2        .0  sqlplus@aser  resmgr:cpu quantum
PROJ_B_GRP    1075  PROJB_USR        RUNNING          0         0       0      384.4        .0  sqlplus@aser  latch free
PROJ_B_GRP     489  PROJB_USR        RUNNING       1836       146    1836      238.7        .0  sqlplus@aser  resmgr:cpu quantum
```

**So here is my next puzzlement with RM:**

- Is it possible that CPU isn’t hitting 100% because RM is throttling the queries *too* much?

I suspect I’m misunderstanding something about how RM is supposed to work and/or how it is implemented to do what it does.

## Test 07

Leaving to one side my inability to explain the above observations with RM, I then wantd to add more load so that the machine would be under serious CPU pressure, and see how RM dealt with it.

I would run:

- 2 x OTHER\_GROUP sessions- 5 x PROJ\_A\_GRP sessions- 1 x PROJ\_B\_GRP session- 10 x PROJ\_C\_GRP sessions- 1 x PROJ\_D\_GRP session

I would hope to see something like this:

- OTHER\_GROUP unthrottled – c.20% CPU, leaving c.80% for the four project consumer groups (thus 20% each)
  - PROJ\_B\_GRP unthrottled – only generating load on one CPU so c.12% host CPU (leaving c.8% available for use by other consumer groups)- PROJ\_D\_GRP unthrottled – only generating load on one CPU so c.12% host CPU (leaving c.8% available for use by other consumer groups)- This leaves 56% (100 – 20 – 12 – 12) of a theoretical 100% CPU available for two consumer groups which between them require more than that. Based on the above results I would expect the 1:2 session balance to play out in CPU allocation too, so roughly:
        - PROJ\_C\_GRP throttled to c.<40%- PROJ\_A\_GRP throttled to c.<20%

The test began at 2010-09-10 20:21:49, taking a total of three seconds for all 17 scripts to start.

As before, CPU did not hit 100%, but instead hovered around 87%. We’re quite clearly generating load sufficient to hit 100%, but RM is throttling it back. Whether it’s the effect of swapping queries on and off CPU that means there’s an efficiency loss, or whether RM deliberately holds it back to that level deliberately I don’t know.

The total Oracle and host CPU/time looks like this: (rm\_cpu\_01):

```

                     Total Available  Used Oracle  Used Host  Oracle Throttled
BEGIN_TIME               CPU Seconds      Seconds      CPU %          Time (s)
-------------------  ---------------  -----------  ---------  ----------------
2010-09-10 20:18:50              480          0.1        1.1               0.0
2010-09-10 20:19:50              480          0.1        3.1               0.0
2010-09-10 20:20:50              480         14.5        5.8               9.5
2010-09-10 20:21:51              480        421.4       88.1             675.4
2010-09-10 20:22:50              480        431.9       88.6             690.4
2010-09-10 20:23:50              480        433.6       88.7             685.5
2010-09-10 20:24:50              480        427.0       89.3             686.1
2010-09-10 20:25:50              480        424.2       89.5             683.1
```

The CPU allocation within RM breaks down as follows (rm\_05):

```

                                                     Total Available            Used                 Oracle Throttled
TIME                 CONSUMER_GROUP_NAME                 CPU Seconds  Oracle Seconds  % of Host CPU          Time (s)
-------------------  ------------------------------  ---------------  --------------  -------------  ----------------
2010-10-09 20:22:50  PROJ_C_GRP                                  480           138.8           28.9             451.9
                     PROJ_A_GRP                                  480           115.0           24.0             179.7
                     PROJ_B_GRP                                  480            27.9            5.8              31.1
                     OTHER_GROUPS                                480           115.7           24.1               3.4
                     PROJ_D_GRP                                  480            34.5            7.2              24.4
                     SYS_GROUP                                   480             0.0            0.0               0.0
                     _ORACLE_BACKGROUND_GROUP_                   480             0.0            0.0               0.0
```

- OTHER\_GROUP gets c.25%, and isn’t throttled- PROJ\_C\_GRP gets c.25%, and is throttled- PROJ\_A\_GRP gets c.25%, and is throttled- PROJ\_B\_GRP gets c.6%, and is throttled- PROJ\_D\_GRP gets c.6%, and is throttled

(I’m taking a slight liberty with OTHER\_GROUP and stating that it’s not throttled; but relative to the other groups it isn’t really)

rm\_02 shows the amount of CPU wait time each session is subject to:

```

                                                                      Consumed
Consumer                                             CPU Wait    CPU  CPU time I/O time
Group         SID USERNAME         STATE      Yields Time (s)  Waits       (s)      (s) PROGRAM      EVENT
----------- ----- ---------------- ---------- ------ -------- ------ --------- -------- ------------ ------------------------------------------------------
PROJ_C_GRP    521 PROJC_USR       WAITING FO    954      581    954     103.0       .0 sqlplus@aser resmgr:cpu quantum
PROJ_C_GRP   1090 PROJC_USR       RUNNING      2269      451   2269     232.6       .0 sqlplus@aser resmgr:cpu quantum
PROJ_C_GRP   1070 PROJC_USR       WAITING FO   2254      452   2254     232.3       .0 sqlplus@aser resmgr:cpu quantum
PROJ_C_GRP    524 PROJC_USR       WAITING FO    950      583    952     100.9       .0 sqlplus@aser resmgr:cpu quantum
PROJ_C_GRP    486 PROJC_USR       WAITING FO    957      583    960     101.3       .0 sqlplus@aser resmgr:cpu quantum
PROJ_C_GRP    512 PROJC_USR       WAITING FO    958      582    961     102.4       .0 sqlplus@aser resmgr:cpu quantum
PROJ_C_GRP    496 PROJC_USR       WAITING FO    960      581    960     103.6       .0 sqlplus@aser resmgr:cpu quantum
PROJ_C_GRP   1098 PROJC_USR       WAITING FO   2263      451   2263     233.9       .0 sqlplus@aser resmgr:cpu quantum
PROJ_C_GRP    508 PROJC_USR       WAITING FO    954      581    954     104.0       .0 sqlplus@aser resmgr:cpu quantum
PROJ_C_GRP   1082 PROJC_USR       RUNNING      2272      451   2272     234.1       .0 sqlplus@aser resmgr:cpu quantum
PROJ_A_GRP    499 PROJA_USR       WAITING FO   2314      451   2315     233.2       .0 sqlplus@aser resmgr:cpu quantum
PROJ_A_GRP    509 PROJA_USR       RUNNING      2296      449   2296     235.3       .0 sqlplus@aser resmgr:cpu quantum
PROJ_A_GRP   1084 PROJA_USR       RUNNING      2138      263   2138     422.0       .0 sqlplus@aser latch free
PROJ_A_GRP    553 PROJA_USR       WAITING FO   2296      450   2296     235.5       .0 sqlplus@aser resmgr:cpu quantum
PROJ_A_GRP    491 PROJA_USR       RUNNING      2295      449   2295     236.1       .0 sqlplus@aser resmgr:cpu quantum
PROJ_B_GRP    498 PROJB_USR       RUNNING      2168      358   2170     326.7       .0 sqlplus@aser resmgr:cpu quantum
OTHER_GROUP   490 myuser0         RUNNING       853       36    853     648.6       .0 sqlplus@aser resmgr:cpu quantum
OTHER_GROUP  1075 myuser0         RUNNING        60        2     60     683.9       .0 sqlplus@aser resmgr:cpu quantum
PROJ_D_GRP   1079 PROJD_USR       WAITING FO   2131      269   2131     414.9       .0 sqlplus@aser resmgr:cpu quantum
```

**So, I’m puzzled** – I thought that RM was supposed to allocate a guarenteed amount of CPU to each consumer group. But here we’re seeing consumer groups with only one session getting apparently muscled out by those with multiple sessions. If OTHER\_GROUPS is taking 25%, that leaves a hypothetical 75% between four consumer groups to split 25% each (so c.18% each). Instead two of the four get 25% total host CPU and two get about 6% host CPU – not 25% of the remainder of the pie left by OTHER\_GROUPS.

**Update:** I re-ran Test 07, but observed the same behaviour:

```

                                                     Total Available            Used                 Oracle Throttled
TIME                 CONSUMER_GROUP_NAME                 CPU Seconds  Oracle Seconds  % of Host CPU          Time (s)
-------------------  ------------------------------  ---------------  --------------  -------------  ----------------
2010-13-09 07:53:42  PROJ_C_GRP                                  480           145.0           30.2             448.5
                     PROJ_A_GRP                                  480           132.8           27.7             163.9
                     PROJ_B_GRP                                  480            21.3            4.4              38.3
                     OTHER_GROUPS                                480           115.8           24.1               3.2
                     PROJ_D_GRP                                  480            21.9            4.6              37.5
                     SYS_GROUP                                   480             0.0            0.0               0.0
                     _ORACLE_BACKGROUND_GROUP_                   480             0.0            0.0               0.0
```

*Why aren’t and PROJ\_B\_GRP PROJ\_D\_GRP getting an equal share of CPU as PROJ\_A\_GRP and PROJ\_C\_GRP?*

## What’s next?

I’m going to re-run some of the above tests to check that the same behaviour is seen. I’m also planning to test with non-Oracle processes using lots of CPU to see how RM deals with that.  
We’re considering how RM fits into Performance Testing our applications, as it introduces quite a possible varience in the response times the users could see in Production.  
Finally, it will be interesting to observe RM in action against real DW workloads where there may be lots of I/O waits and not pure CPU demand.

## Summmary

It’s been very interesting running these tests and looking closely at what RM appears to be doing. Some of my understanding & assumptions have been challenged, and I would love to hear from people with more experience and knowlegde of RM and Oracle to explain what I’m observing and where I’ve gone wrong.  
All of the query results quoted here are representative of the steady-state seen during each test.  
I’m sure I’ve just misunderstood part of the principle of RM, but I would like to know in what way 🙂 and also if there is a way to implement what I thought we had – a way of ensuring that of four consumer groups they all get a fair and equal bite of the pie.
