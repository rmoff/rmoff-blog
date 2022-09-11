---
title: "Oracle BI Management / Systems Management MBeans"
date: "2009-07-22"
categories: 
  - "jmx"
  - "mbeans"
  - "performance"
---

Part of [looking at the various gubbins inside OBIEE](/2009/07/21/obiee-admin-tools-amp-hacks/) led me to realise that the Oracle BI Management application drives quite a few things. It exposes MBeans (Management Beans, a java term), accessible through [jmx](http://en.wikipedia.org/wiki/JMX). In the installation of OBIEE this component is referred to as "Systems Management".

The MBeans give us real-time performance information, along with access to all the configuration options that are normally done through config files (instanceconfig.xml etc). Bear in mind if using it for updating configuration instead of through the files you don't get any backup created, so for that reason alone I would suggest it should only be used for reading current values.

![](/images/rnm1978/Oracle+Enterprise+Manager+%28oc4jadmin%29+-+Application+MBeans_1248266844104.png) which you'll either be running directly or as part of OAS.

[@lex has details here](http://blogs.oracle.com/siebelessentials/2008/11/oracle_bi_ee_and_mbeans.html) about accessing through oc4j/OAS. It's worth noting if you have done separate BI Server and Presentation Services installations then on your PS server you'll already have an application server running, but on your BI Server you might need to start oc4j (on unix: obiee/oc4j\_bi/bin $nohup oc4j -start &) [](http://2.bp.blogspot.com/_RCx_EVJpczQ/SmcKwgveQuI/AAAAAAAAGbM/GI0wJmYDCzA/s1600/Oracle+Enterprise+Manager+%28oc4jadmin%29+-+Application+MBeans_1248266844104.png)[](http://2.bp.blogspot.com/_RCx_EVJpczQ/SmcKwgveQuI/AAAAAAAAGbM/GI0wJmYDCzA/s1600/Oracle+Enterprise+Manager+%28oc4jadmin%29+-+Application+MBeans_1248266844104.png)The MBeans are used as a source for both [perfmon](http://obiee101.blogspot.com/2009/07/obiee-perfmon-performance-monitor.html) and the [BI Management Pack in EM](http://www.oracle.com/technology/pub/articles/rittman-oem-bipack.html).[](http://2.bp.blogspot.com/_RCx_EVJpczQ/SmcKwgveQuI/AAAAAAAAGbM/GI0wJmYDCzA/s1600/Oracle+Enterprise+Manager+%28oc4jadmin%29+-+Application+MBeans_1248266844104.png)

jManage is an open-source tool that can also be used to access the MBeans: ![jmanage13](/images/rnm1978/jmanage13.png "jmanage13") See [this post](/2009/07/29/obiee-performance-monitoring-and-alerting-with-jmanage/) for information
