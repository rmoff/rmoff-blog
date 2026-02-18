---
title: "sawserver charts crash"
date: "2009-07-23"
categories: 
  - "bug"
  - "OBIEE"
  - "sawserver"
---

By a strange co-incidence after following [this thread on OTN forums](http://forums.oracle.com/forums/thread.jspa?threadID=931547&tstart=0) about a BI crash and struggling to understand the actual problem, I think I've encountered it myself!

I've got a test install of OBIEE running on my Windows XP laptop, and whilst building a report in Answers got this:

![](/images/rnm1978/image_lost.png)](http://2.bp.blogspot.com/_RCx_EVJpczQ/SmiDrEorbbI/AAAAAAAAGcg/OPGwTLXXg8k/s1600/crash1.png)[![](/images/rnm1978/crash2.png) was:

> szAppName : sawserver.exe szAppVer : 10.1.3.4 szModName : kernel32.dll szModVer : 5.1.2600.3119 offset : 000097a3

Going to the sawserver log at c:\\OracleBIData\\web\\log\\sawlog0.log disappointingly showed no error entries :(

A [suggestion here](http://forums.oracle.com/forums/thread.jspa?messageID=3182076) of a bug but it relates to pivot tables, which I wasn't doing.

\[update\] I've been able to reproduce this error. It's on a report with a table and chart. It works fine with the original dataset of 97 rows returned, but when I remove a filter and 22,000 rows are returned sawserver barfs when rendering it.

I've [increased the logging level in sawserver](/2009/07/23/sawserver-logging-configuration-logconfig-xml/), but still can't see anything helpful in the log.

It's definitely something to do with the chart, because I've now whittled the report down to just the chart and the large dataset query, and it crashes PS every time it's run.

I've upped the javahost logging (see \[OracleBI\]\\web\\javahost\\config\\logconfig.txt), nothing to be seen there. I dug around in CORDA, the chart generation software, but failed to get any logs out.

The only bit of firm diagnostic is that when a chart is successfully rendered there are two files created in C:\\WINDOWS\\TEMP: Charts\_150001\_63825.javahost.in Charts\_150001\_63825.javahost.out (where 150001\_63825 varies). The .in file is XML, I think as sent to Corda for rendering. The .out I binary and I assume is the flash file. When I run my dodgy report, neither of these two files gets created. For successful charts the javahost log shows:

> 23-Jul-2009 23:30:33 ChartRpcCall processMessage INFO: Saved request to C:\\WINDOWS\\TEMP\\Charts\_150001\_63825.javahost.in. Saving response to C:\\WINDOWS\\TEMP\\Charts\_150001\_63825.javahost.out

In the javahost log is a WARNING: Unexpected exception. Connection will be closed message, presumably from sawserver barfing out and dropping the connection.

So if the sawserver "sends" graphs to corda via javahost, and javahost isn't logging the request -and it's sawserver process that's crashing- the fault's presumably somewhere in sawserver, my guess is when it tries to render a chart with too many data points? \[/update\]

\[update 2\] After upgrading to 10.1.3.4.1 I now get this error displayed in Answers when I try to render the chart:

> A fatal error occurred while processing the request. The server responded with: Error while executing ChartRpcCall.processMessage com.siebel.analytics.utils.InputStreamWithLimit$ReadOverTheLimitException at com.siebel.analytics.utils.InputStreamWithLimit.incTotalBytes(InputStreamWithLimit.java:58) at com.siebel.analytics.utils.InputStreamWithLimit.read(InputStreamWithLimit.java:41) at com.siebel.analytics.utils.IOUtils.copyStreams(IOUtils.java:38) at com.siebel.analytics.utils.IOUtils.copyStreams(IOUtils.java:28) at com.siebel.analytics.web.javahostrpccalls.corda.ChartRpcCall.ensureSafeAttrs(ChartRpcCall.java:84) at com.siebel.analytics.web.javahostrpccalls.corda.ChartRpcCall.processUnidi(ChartRpcCall.java:225) at com.siebel.analytics.web.javahostrpccalls.corda.ChartRpcCall.processMessageInternal(ChartRpcCall.java:265) at com.siebel.analytics.javahost.AbstractRpcCall.processMessage(AbstractRpcCall.java:107) at com.siebel.analytics.javahost.MessageProcessorImpl.processMessage(MessageProcessorImpl.java:175) at com.siebel.analytics.javahost.Listener$Job.run(Listener.java:223) at com.siebel.analytics.javahost.standalone.SAJobManagerImpl.threadMain(SAJobManagerImpl.java:205) at com.siebel.analytics.javahost.standalone.SAJobManagerImpl$1.run(SAJobManagerImpl.java:153) at java.lang.Thread.run(Thread.java:619) . Error Codes: AGEGTYVF
