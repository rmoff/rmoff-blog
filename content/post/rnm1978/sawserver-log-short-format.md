---
draft: false
title: 'sawserver log – short format'
date: "2009-08-19T14:02:07+0000"
image: "/images/2009/08/sawlog01.webp"
categories:
- config
- hack
- log
- sawserver
---

[I posted a while ago](/post/rnm1978/sawserver-logging-configuration-logconfig-xml//) about the sawserver (Presentation Services) log configuration file.  
Today I’m doing some work digging around why sawserver’s throwing an error and so increased the log detail. This parameter is really helpful to use:

<!--more-->
**fmtName=”short”**

Consider in these two screenshots, the first is with the default log format and shows about six entries. The second is short log format and is about ten times as much data.

![sawlog01](/images/2009/08/sawlog01.webp "sawlog01")

default log format

![sawlog02](/images/2009/08/sawlog02.webp "sawlog02")

short log format

Horses for courses, but on a “fishing expedition” through a log I’d say the short format is definitely easier to work with.

To implement it update $OracleBIData/web/config/logconfig.xml and change the Writer definition:

```

[...]
	<Writers>
		<Writer implementation="CoutWriter" name="Global Output  Logger" writerClassId="2"/>
[...]
```

```

[...]
	<Writers>
		<Writer fmtName="short" implementation="CoutWriter" name="Global Output  Logger" writerClassId="2"/>
[...]
```

and restart Presentation Services. On a tangent, a lazy way to do this on unix whilst leaving time for ports to free up before restarting is:

```
run-saw.sh stop;sleep 60;run-saw.sh start64
```
