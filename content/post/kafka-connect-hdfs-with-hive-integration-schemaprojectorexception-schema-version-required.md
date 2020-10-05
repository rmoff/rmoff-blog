+++
categories = ["kafka", "avro", "kafka connect", "SchemaProjectorException"]
date = 2016-07-19T14:36:52Z
description = ""
draft = false
image = "/images/2016/07/photo-1466046690866-98181611563d.jpeg"
slug = "kafka-connect-hdfs-with-hive-integration-schemaprojectorexception-schema-version-required"
tag = ["kafka", "avro", "kafka connect", "SchemaProjectorException"]
title = "Kafka Connect - HDFS with Hive Integration - SchemaProjectorException - Schema version required"

+++

I've been doing some noodling around with Confluent's Kafka Connect recently, as part of gaining a wider understanding into Kafka. If you're not familiar with Kafka Connect [this page](http://docs.confluent.io/3.0.0/connect/design.html) gives a good idea of the thinking behind it. 

One issue that I hit defeated my Google-fu so I'm recording it here to hopefully help out fellow n00bs.

The pipeline that I'd set up looked like this: 

* [Eneco's Twitter Source](https://github.com/Eneco/kafka-connect-twitter) streaming tweets to a Kafka topic
* Confluent's [HDFS Sink](https://docs.confluent.io/current/connect/kafka-connect-hdfs/index.html) to stream tweets to HDFS and define Hive table automagically over them

It worked great, but only if I didn't enable the Hive integration part. For me the integration with Hive to automatically define schemas was one of the key interests for this platform, so I wanted to see if I could get it to work. The error I got was

```
org.apache.kafka.connect.errors.SchemaProjectorException: Schema version required for BACKWARD compatibility
```

The long and short of it was that I was using the wrong [`Converter` class](http://docs.confluent.io/2.0.0/connect/userguide.html#common-worker-configs) for the data that was being written and read by Kafka - instead of Avro I'd used Json.

I'd used `/etc/kafka/connect-standalone.properties`, just copying and pasting examples from the docs, and then gone off on my own config without thinking about it much further. This meant that instead of `io.confluent.connect.avro.AvroConverter` for `key.converter` and `value.converter` I was using `org.apache.kafka.connect.json.JsonConverter`. When you think about it, if you want a schema defined in Hive it's got to come from somewhere; the Avro schema registry that Kafka Connect provides. Once I switched my config to use `/etc/schema-registry/connect-avro-standalone.properties` everything worked just perfectly! 

You can find the configuration files [on gist here](https://gist.github.com/rmoff/a2a9fd1cf24a9cf0b3537c7e47360583).

---
(photo credit: https://unsplash.com/@dan_carl5on)
