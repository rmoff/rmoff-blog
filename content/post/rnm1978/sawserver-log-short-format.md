---
title: "sawserver log - short format"
date: "2009-08-19"
categories: 
  - "config"
  - "hack"
  - "log"
  - "sawserver"
---

[I posted a while ago](/2009/07/23/sawserver-logging-configuration-logconfig.xml/) about the sawserver (Presentation Services) log configuration file. Today I'm doing some work digging around why sawserver's throwing an error and so increased the log detail. This parameter is really helpful to use:

**fmtName="short"**

Consider in these two screenshots, the first is with the default log format and shows about six entries. The second is short log format and is about ten times as much data.

![sawlog01](/images/rnm1978/sawlog01.png "sawlog01")

![sawlog02](/images/rnm1978/sawlog02.png "sawlog02")

Horses for courses, but on a "fishing expedition" through a log I'd say the short format is definitely easier to work with.

To implement it update $OracleBIData/web/config/logconfig.xml and change the Writer definition: 
```xml
\[...\] \[...\]
```



```xml
\[...\] \[...\]
```


and restart Presentation Services. On a tangent, a lazy way to do this on unix whilst leaving time for ports to free up before restarting is: 
```bash
run-saw.sh stop;sleep 60;run-saw.sh start64
```

