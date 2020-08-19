+++
categories = ["apache drill"]
date = 2016-06-20T19:04:18Z
description = ""
draft = false
slug = "apache-drill-not-connected"
tag = ["apache drill"]
title = "Apache Drill - conflicting jar problem - \"No current connection\""

+++

Vanilla download of Apache Drill 1.6, attempting to follow the Followed the [Drill in 10 Minutes](https://drill.apache.org/docs/drill-in-10-minutes/) tutorial - but kept just getting the error `No current connection`. Here's an example: 

```bash
[oracle@bigdatalite apache-drill-1.6.0]$ ./bin/drill-embedded
Java HotSpot(TM) 64-Bit Server VM warning: ignoring option MaxPermSize=512M; support was removed in 8.0
com.fasterxml.jackson.databind.JavaType.isReferenceType()Z
apache drill 1.6.0
"the only truly happy people are children, the creative minority and drill users"
0: jdbc:drill:zk=local> SELECT version FROM sys.version;
No current connection
0: jdbc:drill:zk=local>
```

Whether `SELECT version FROM sys.version;` or any other command - same result - `No current connection`. Trying to run Drill in distributed mode also failed, with a class error

```
Exception in thread "main" java.lang.NoSuchMethodError: com.fasterxml.jackson.databind.JavaType.isReferenceType()Z
        at com.fasterxml.jackson.databind.deser.DeserializerCache._createDeserializer2(DeserializerCache.java:400)
        at com.fasterxml.jackson.databind.deser.DeserializerCache._createDeserializer(DeserializerCache.java:352)
        at com.fasterxml.jackson.databind.deser.DeserializerCache._createAndCache2(DeserializerCache.java:264)
        at com.fasterxml.jackson.databind.deser.DeserializerCache._createAndCacheValueDeserializer(DeserializerCache.java:244)
        at com.fasterxml.jackson.databind.deser.DeserializerCache.findValueDeserializer(DeserializerCache.java:142)
        at com.fasterxml.jackson.databind.DeserializationContext.findRootValueDeserializer(DeserializationContext.java:477)
```

---
It turned out that there's a conflicting jar on my machine, as **starting with a clean shell, it worked just fine**: 

```bash
[oracle@bigdatalite ~]$ env -i HOME="$HOME" LC_CTYPE="${LC_ALL:-${LC_CTYPE:-$LANG}}" PATH="$PATH" USER="$USER" /opt/apache-drill-1.6.0/bin/drill-embedded
Java HotSpot(TM) 64-Bit Server VM warning: ignoring option MaxPermSize=512M; support was removed in 8.0
Jun 18, 2016 11:01:00 PM org.glassfish.jersey.server.ApplicationHandler initialize
INFO: Initiating Jersey application, version Jersey: 2.8 2014-04-29 01:25:26...
apache drill 1.6.0
"start your sql engine"
0: jdbc:drill:zk=local>
0: jdbc:drill:zk=local>
0: jdbc:drill:zk=local> SELECT version FROM sys.version;
+----------+
| version  |
+----------+
| 1.6.0    |
+----------+
```
