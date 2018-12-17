+++
author = "Robin Moffatt"
categories = ["kafka", "kafka connect", "IncompatibleClassChangeError", "classpath"]
date = 2016-11-24T20:58:44Z
description = ""
draft = false
slug = "kafka-connect-java-lang-incompatibleclasschangeerror"
tag = ["kafka", "kafka connect", "IncompatibleClassChangeError", "classpath"]
title = "Kafka Connect - java.lang.IncompatibleClassChangeError"

+++

I hit this error running Kafka Connect HDFS connector from Confluent Platform v3.1.1 on BigDataLite 4.6: 

```
[oracle@bigdatalite ~]$ connect-standalone /etc/schema-registry/connect-avro-standalone.properties /etc/kafka-connect-hdfs/quickstart-hdfs.properties

[...]
Exception in thread "main" java.lang.IncompatibleClassChangeError: Implementing class
        at java.lang.ClassLoader.defineClass1(Native Method)
        at java.lang.ClassLoader.defineClass(ClassLoader.java:763)
        at java.security.SecureClassLoader.defineClass(SecureClassLoader.java:142)
        at java.net.URLClassLoader.defineClass(URLClassLoader.java:467)
        at java.net.URLClassLoader.access$100(URLClassLoader.java:73)
        at java.net.URLClassLoader$1.run(URLClassLoader.java:368)
        at java.net.URLClassLoader$1.run(URLClassLoader.java:362)
        at java.security.AccessController.doPrivileged(Native Method)
        at java.net.URLClassLoader.findClass(URLClassLoader.java:361)
        at java.lang.ClassLoader.loadClass(ClassLoader.java:424)
        at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:331)
        at java.lang.ClassLoader.loadClass(ClassLoader.java:357)
        at java.lang.ClassLoader.defineClass1(Native Method)
        at java.lang.ClassLoader.defineClass(ClassLoader.java:763)
```

The fix was to unset the `CLASSPATH` first: 

    unset CLASSPATH

