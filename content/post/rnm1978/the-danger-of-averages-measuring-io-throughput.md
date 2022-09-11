---
title: "The danger of averages - Measuring I/O throughput"
date: "2010-09-14"
categories: 
  - "io"
  - "oracle"
---

[This query](http://www.jameskoopmann.com/scripts/wrh_sysstat_ioworkload_ALL.sql), based on AWR snapshots on sys.wrh$\_sysstat, includes in its metrics the I/O read throughput for a given snapshot duration.

However it's important to realise the huge limitation to this figure - it's an average. It completely shoots you in the foot if you're looking at capacity requirements.

Consider this real-life example extracted from the above query:

\[sourcecode\] Timestamp Total Read MBPS =========================================== 14-SEP-10 05.15.12.660 113.748 14-SEP-10 06.00.40.953 202.250 14-SEP-10 06.45.52.750 34.649 14-SEP-10 07.30.03.394 10.953 14-SEP-10 08.15.15.243 57.833 14-SEP-10 09.00.27.180 30.177 \[/sourcecode\] So, it looks like early in the morning we're using about 200 MB/s throughput, and by about 9am somewhere around 30-50 MB/s ?

Let's have a look at [V$SYSMETRIC\_HISTORY](http://download.oracle.com/docs/cd/B28359_01/server.111/b28320/dynviews_3084.htm#REFRN30344) (which gives numbers every minute for the last hour) for the samples corresponding to the last AWR sample in the above resultset (08:15 - 09:00): \[[io2.sql](http://rnm1978.wordpress.com/io2-sql/)\] \[sourcecode\] BEGIN\_TIME VALUE\_MB ------------------- -------- 2010-09-14-08:14:55 0.7 2010-09-14-08:15:54 0.0 2010-09-14-08:16:54 0.1 2010-09-14-08:17:55 0.0 2010-09-14-08:18:54 0.0 2010-09-14-08:19:55 318.5 2010-09-14-08:20:54 258.5 2010-09-14-08:21:54 183.6 2010-09-14-08:22:55 24.8 2010-09-14-08:23:54 0.0 2010-09-14-08:24:55 0.0 2010-09-14-08:25:54 0.0 2010-09-14-08:26:54 0.0 2010-09-14-08:27:55 0.0 2010-09-14-08:28:54 0.0 2010-09-14-08:29:55 0.0 2010-09-14-08:30:54 0.0 2010-09-14-08:31:54 0.1 2010-09-14-08:32:55 0.0 2010-09-14-08:33:54 0.0 2010-09-14-08:34:55 0.0 2010-09-14-08:35:54 0.1 2010-09-14-08:36:54 3.0 2010-09-14-08:37:54 0.0 2010-09-14-08:38:54 0.0 2010-09-14-08:39:55 0.0 2010-09-14-08:40:54 0.0 2010-09-14-08:41:55 0.1 2010-09-14-08:42:54 0.0 2010-09-14-08:43:54 0.0 2010-09-14-08:44:55 0.0 2010-09-14-08:45:54 0.0 2010-09-14-08:46:55 0.1 2010-09-14-08:47:54 156.9 2010-09-14-08:48:54 413.1 2010-09-14-08:49:55 0.1 2010-09-14-08:50:54 0.0 2010-09-14-08:51:55 3.1 2010-09-14-08:52:54 0.0 2010-09-14-08:53:54 0.0 2010-09-14-08:54:55 0.0 2010-09-14-08:55:54 0.0 2010-09-14-08:56:55 0.0 2010-09-14-08:57:54 0.0 2010-09-14-08:58:54 0.0 2010-09-14-08:59:55 0.6 \[/sourcecode\] (METRIC\_ID = 2093 "Physical Read Total Bytes Per Sec") If you average out the numbers in this 45-minute sample, you get 30MB/s - which ties in with what AWR shows too. But it is clearly wrong to say that the IO throughput for the period is 30 MB/s. In terms of capacity the system is at times utilising over 400 MB/s - albeit for a short period of time:

![](/images/rnm1978/io_011.png "io_01")

(As a side note - this is a good illustration of why a bar chart is more appropriate here, rather than a line graph which is what I initially opted for. A line chart joins the data points giving a incorrect assumption of the value at points in between samples. A bar chat shows what it was when we sampled it, and only then. For planning capacity, it's important to be considering only what we know to be true.)

For estimating something like disk _space_ requirements, an average per _x_ time slice extrapolated up may work, because the peaks will balance out the troughs - kind of what the point of an average is. But when thinking about capacity and the size of pipes a system requires, an average can wildly distort things. It's the peaks that are important because it's those that will bottleneck the system.

[This script from Kevin Closson](http://kevinclosson.wordpress.com/2009/04/28/how-to-produce-raw-spreadsheet-ready-physical-io-data-with-plsql-good-for-exadata-good-for-traditional-storage/) is good for recording granular IO throughput over a period of time.
