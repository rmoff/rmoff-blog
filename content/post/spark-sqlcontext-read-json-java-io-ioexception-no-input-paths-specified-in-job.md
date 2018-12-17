+++
author = "Robin Moffatt"
categories = ["spark", "sparksql", "json"]
date = 2016-07-13T04:50:16Z
description = ""
draft = false
slug = "spark-sqlcontext-read-json-java-io-ioexception-no-input-paths-specified-in-job"
tags = ["spark", "sparksql", "json"]
title = "Spark sqlContext.read.json - java.io.IOException: No input paths specified in job"

+++

Trying to use [SparkSQL to read a JSON file](http://spark.apache.org/docs/latest/sql-programming-guide.html#json-datasets), from either pyspark or spark-shell, I got this error: 

    java.io.IOException: No input paths specified in job

```
scala> sqlContext.read.json("/u02/custom/twitter/twitter.json")
java.io.IOException: No input paths specified in job
        at org.apache.hadoop.mapred.FileInputFormat.listStatus(FileInputFormat.java:202)
```

Despite the reference articles that I found using this local path syntax (`/u02/custom/twitter/twitter.json`), it turned out that I needed to prefix it with `file://`: 

```
scala> sqlContext.read.json("file:///u02/custom/twitter/twitter.json")
res3: org.apache.spark.sql.DataFrame = [@timestamp: string, @version: string, contributors: string, coordinates: string, created_at: string, entities: struct<hashtags:array<struct<indices:array<bigint>,text:string>>,media:array<struct<display_url:string,expanded_url:string,id:bigint,id_str:string,indices:array<bigint>,media_url:string,media_url_https:string,sizes:struct<large:struct<h:bigint,resize:string,w:bigint>,medium:struct<h:bigint,resize:string,w:bigint>,small:struct<h:bigint,resize:string,w:bigint>,thumb:struct<h:bigint,resize:string,w:bigint>>,source_status_id:bigint,source_status_id_str:string,source_user_id:bigint,source_user_id_str:string,type:string,url:string>>,symbols:array<struct<indices:array<bigint>,text:string>>,urls:array<struct<display_url:string,expanded_url:string...
scala>
```

An alternative to `file://` is `hdfs://`, assuming you have some data residing there too: 

```
scala> sqlContext.read.json("hdfs:///user/oracle/incoming/twitter/2016/07/12/FlumeData.1468339844123")
res5: org.apache.spark.sql.DataFrame = [@timestamp: string, @version: string, contributors: string, coordinates: struct<coordinates:array<double>,type:string>, created_at: string, entities: struct<hashtags:array<struct<indices:array<bigint>,text:string>>,media:array<struct<display_url:string,expanded_url:string,id:bigint,id_str:string,indices:array<bigint>,media_url:string,media_url_https:string,sizes:struct<large:struct<h:bigint,resize:string,w:bigint>,medium:struct<h:bigint,resize:string,w:bigint>,small:struct<h:bigint,resize:string,w:bigint>,thumb:struct<h:bigint,resize:string,w:bigint>>,source_status_id:bigint,source_status_id_str:string,source_user_id:bigint,source_user_id_str:string,type:string,url:string>>,symbols:array<struct<indices:array<bigint>,text:string>>,urls:array<struct...
```
