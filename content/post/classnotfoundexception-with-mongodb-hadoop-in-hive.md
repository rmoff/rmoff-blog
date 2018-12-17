+++
author = "Robin Moffatt"
categories = ["mogodb", "hive", "jar", "classnotfoundexception"]
date = 2016-06-15T17:58:19Z
description = ""
draft = false
image = "/images/2016/06/1__screen__ssh_.png"
slug = "classnotfoundexception-with-mongodb-hadoop-in-hive"
tags = ["mogodb", "hive", "jar", "classnotfoundexception"]
title = "ClassNotFoundException with MongoDB-Hadoop in Hive"

+++

I wasted *literally* two hours on this one, so putting down a note to hopefully help future Googlers. 

### Symptom
Here's all the various errors that I got in the `hive-server2.log` during my attempts to get a `CREATE EXTERNABLE TABLE` to work against a MongoDB table in Hive: 

```
Caused by: java.lang.ClassNotFoundException: com.mongodb.hadoop.io.BSONWritable
Caused by: java.lang.ClassNotFoundException: com.mongodb.util.JSON
Caused by: java.lang.ClassNotFoundException: org.bson.conversions.Bson
Caused by: java.lang.ClassNotFoundException: org.bson.io.OutputBuffer
```

Whilst Hive would throw errors along the lines of: 

```
Error: Error while processing statement: FAILED: Execution Error, return code 1 from org.apache.hadoop.hive.ql.exec.DDLTask. org/bson/io/OutputBuffer (state=08S01,code=1)
```

### Solution

If you're using the [MongoDB-Hadoop](https://github.com/mongodb/mongo-hadoop/) connector with Hive, you need three JARs: 

* mongo-java-driver
* mongo-hadoop-core
* mongo-hadoop-hive

The latter two are part of the Mongo-Hadoop package and can be [downloaded pre-compiled here](http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22org.mongodb.mongo-hadoop%22). It's the first one on the list, `mongo-java-driver`, that caused me much gnashing of teeth and wailing -- because I mistakenly downloaded `mongodb-driver` instead. Stupid me, right? Because to be fair, [the documentation](https://github.com/mongodb/mongo-hadoop/wiki/Hive-Usage) does say: 

> The connector requires at least version 3.0.0 of the driver "uber" jar (called "**mongo-java-driver.jar**").

(my emphasis)

But the link to the download leads to http://mongodb.github.io/mongo-java-driver/, on which `mongodb-driver` is the default, not `mongo-java-driver`. 

Hey ho, lesson learnt...
