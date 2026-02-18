---
draft: false
title: 'Oracle BI Management / Systems Management MBeans'
date: "2009-07-22T12:50:00+0000"
image: "/images/2009/07/jmanage13_134a37.webp"
categories:
- jmx
- mbeans
- performance
---

Part of [looking at the various gubbins inside OBIEE](/post/rnm1978/obiee-admin-tools-hacks/) led me to realise that the Oracle BI Management application drives quite a few things. It exposes MBeans (Management Beans, a java term), accessible through [jmx](http://en.wikipedia.org/wiki/JMX).  
In the installation of OBIEE this component is referred to as “Systems Management”.

<!--more-->
The MBeans give us real-time performance information, along with access to all the configuration options that are normally done through config files (instanceconfig.xml etc).  
Bear in mind if using it for updating configuration instead of through the files you don’t get any backup created, so for that reason alone I would suggest it should only be used for reading current values.

*(Image no longer available)*  
They can be accessed directly through jconsole, a java GUI distributed with java jdks, or oc4j (Oracle Containers For Java) which you’ll either be running directly or as part of OAS.

[@lex has details here](http://blogs.oracle.com/siebelessentials/2008/11/oracle_bi_ee_and_mbeans.html) about accessing through oc4j/OAS.  
It’s worth noting if you have done separate BI Server and Presentation Services installations then on your PS server you’ll already have an application server running, but on your BI Server you might need to start oc4j (on unix: obiee/oc4j\_bi/bin $nohup oc4j -start &)  
The MBeans are used as a source for both [perfmon](http://obiee101.blogspot.com/2009/07/obiee-perfmon-performance-monitor.html) and the [BI Management Pack in EM](http://www.oracle.com/technology/pub/articles/rittman-oem-bipack.html).

jManage is an open-source tool that can also be used to access the MBeans:  
![jmanage13](/images/2009/07/jmanage13_134a37.webp "jmanage13")  
See [this post](/post/rnm1978/oracle-bi-management-jmanage//) for information
