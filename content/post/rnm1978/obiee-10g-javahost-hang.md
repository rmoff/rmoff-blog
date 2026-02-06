---
title: "OBIEE 10g - javahost hang"
date: "2010-12-03"
categories: 
  - "javahost"
  - "OBIEE"
  - "sawserver"
---

Hot on the heels of [one problem](/2010/12/02/troubleshooting-obiee-ldap-adsi-authentication), another has just reared its head.

Users started reporting an error with reports that included charts: \[sourcecode\] Chart server does not appear to be responding in a timely fashion. It may be under heavy load or unavailable. \[/sourcecode\]

![](/images/rnm1978/snag-2010-12-03-09-51-31-0000.png "SNAG-2010-12-03-09.51.31-0000")

Set up is a OBIEE 10.1.3.4.1 two-server deployment with BI/PS/Javahost clustered and loadbalanced throughout.

## Diagnostics

Javahost was running, and listening, on both servers: \[sourcecode\] $ps -ef|grep javahost obieeadm 14076 1 0 Nov 25 ? 9:23 /app/oracle/product/OracleAS\_1/jdk/bin/IA64N/java -server -classpath /app/oracle/product/obiee/web/javahost/lib/core/sautils.ja $netstat -a|grep 9810|grep LISTEN tcp 0 0 \*.9810 \*.\* LISTEN \[/sourcecode\]

In Javahost log file on both servers there were these errors reported, but since javahost had started over a week ago: \[sourcecode\] Nov 30, 2010 8:08:36 AM MessageProcessorImpl processMessage WARNING: Unexpected exception. Connection will be closed java.io.EOFException at com.siebel.analytics.web.sawconnect.sawprotocol.SAWProtocol.readInt(SAWProtocol.java:167) at com.siebel.analytics.javahost.MessageProcessorImpl.processMessage(MessageProcessorImpl.java:133) at com.siebel.analytics.javahost.Listener$Job.run(Listener.java:223) at com.siebel.analytics.javahost.standalone.SAJobManagerImpl.threadMain(SAJobManagerImpl.java:205) at com.siebel.analytics.javahost.standalone.SAJobManagerImpl$1.run(SAJobManagerImpl.java:153) at java.lang.Thread.run(Thread.java:595) \[/sourcecode\]

Charts are written to a temp folder, but none have been written since yesterday afternoon: \[sourcecode\] $ls -lrt /data/bi/tmp/sawcharts/ |tail -n 2 -rw-r----- 1 obieeadm biadmin 13611 Dec 2 16:30 saw4cee1a27-7.tmp -rw-r----- 1 obieeadm biadmin 0 Dec 2 16:31 saw4cee1a27-32.tmp

$ls -lrt /data/bi/tmp/sawcharts/ |tail -n 2 -rw-r----- 1 obieeadm biadmin 7454 Dec 2 15:25 saw4cee219b-1.tmp -rw-r----- 1 obieeadm biadmin 0 Dec 2 15:28 saw4cee219b-6.tmp \[/sourcecode\]

First time the error was seen: (from sawserver.out.log) \[sourcecode\] server01: Fri Dec 3 09:40:23 2010 server02: Thu Dec 2 15:44:38 2010 \[/sourcecode\]

## Resolution

It looked like javahost was up, but not responding to requests -- which is pretty much what the error message said on the tin. The solution was that of many a computer problem - turn it off and turn it back on again.

Since the rest of the (production!) OBIEE service was up and in use, I didn't want to use the normal shutdown script run-saw.sh as this would also kill Presentation Services. Therefore I extracted the following from run-saw.sh and ran it manually on server01: \[sourcecode\] set +u ANA\_INSTALL\_DIR=/app/oracle/product/obiee . ${ANA\_INSTALL\_DIR}/setup/common.sh ./shutdown.sh -service \[/sourcecode\]

This successfully killed javahost. I restarted it using : \[sourcecode\] nohup ./run.sh -service >> /data/bi/web/log/javahost.out.log 2>&1 & \[/sourcecode\]

But - the error remained when I refreshed the reports (on both servers).

I then killed javahost on server02 using the same method. At this point, Charts started working again. Presumably Presentation Services had been using javahost on server02 and not recognising it had hung saw no reason to switch to javahost on server01. Once it was killed on server02 it switched and thus started working again. To complete the work I restarted javahost on server02.

## Investigation

The only hit on MOS and Google I found was this: [OBIEE Chart Server Error When Showing Charts (Doc ID 944139.1)](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=944139.1) which details some parameters to tweak, although more to do with javahost being busy (which it wasn't in this case).
