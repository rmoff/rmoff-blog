+++
author = "Robin Moffatt"
categories = ["ogg", "kafka connect", "avro"]
date = 2016-11-29T22:04:38Z
description = ""
draft = false
slug = "oracle-goldengate-kafka-connect-failed-to-serialize-avro-data"
tags = ["ogg", "kafka connect", "avro"]
title = "Oracle GoldenGate -> Kafka Connect - \"Failed to serialize Avro data\""

+++

**tl;dr** _Make sure that `key.converter.schema.registry.url` and `value.converter.schema.registry.url` are specified, and that there are no trailing whitespaces._

---
I've been building on [previous work](https://www.confluent.io/blog/streaming-data-oracle-using-oracle-goldengate-kafka-connect/) I've done with Oracle GoldenGate and Kafka Connect, looking at how to have the change records from the Oracle database come through to Kafka in Avro format rather than the default JSON that the [sample configuration](https://java.net/projects/oracledi/downloads/directory/GoldenGate/Oracle%20GoldenGate%20Adapter%20for%20Kafka%20Connect) gives. 

Simply changing the Kafka Connect OGG configuration file (`confluent.properties`) from 

    value.converter=org.apache.kafka.connect.json.JsonConverter
    key.converter=org.apache.kafka.connect.json.JsonConverter


to 

    value.converter=io.confluent.connect.avro.AvroConverter
    key.converter=io.confluent.connect.avro.AvroConverter

isn't enough - the OGG replicat abends with the error (in `ggserr.log`) : 

```
2016-11-29 20:50:23  ERROR   OGG-15051  Oracle GoldenGate Delivery, rconf.prm:  Java or JNI exception:
oracle.goldengate.util.GGException: org.apache.kafka.common.config.ConfigException: Missing Schema registry url!
```

A similar configuration attempt (OGG -> Kafka Connect Avro) can be found on the [Confluent Platform Google Group](https://groups.google.com/forum/#!msg/confluent-platform/hTaL0z9WJhA/ZA5fb-DJBAAJ), where the advice is to make sure that the schema registry URL is configured. I already had `schema.registry.url` in my config, but added the  [sample config given](https://groups.google.com/d/msg/confluent-platform/hTaL0z9WJhA/0Yf0c0GTBQAJ): 

```
key.converter.schema.registry.url=http://localhost:18081
value.converter.schema.registry.url=http://localhost:18081 
```

Note that my schema registry is running on 18081 (not 8081). 

I then got the replicat abending with a different error: 

`org.apache.kafka.connect.errors.DataException: Failed to serialize Avro data`. 

The replicat RPT (in OGG's `dirrpt` folder) shows
```
Exception in thread "main" org.apache.kafka.connect.errors.DataException: Failed to serialize Avro data:
        at io.confluent.connect.avro.AvroConverter.fromConnectData(AvroConverter.java:92)
        at oracle.goldengate.kafkaconnect.GGProducer.send(GGProducer.java:64)
        at oracle.goldengate.kafkaconnect.KafkaConnectHandler.processData(KafkaConnectHandler.java:337)
[...]
Caused by: org.apache.kafka.common.errors.SerializationException: Error serializing Avro message
Caused by: java.net.MalformedURLException: For input string: "18081 "
        at java.net.URL.<init>(URL.java:627)
        at java.net.URL.<init>(URL.java:490)
        at java.net.URL.<init>(URL.java:439)
        at io.confluent.kafka.schemaregistry.client.rest.RestService.sendHttpRequest(RestService.java:124)
[...]
Caused by: java.lang.NumberFormatException: For input string: "18081 "
        at java.lang.NumberFormatException.forInputString(NumberFormatException.java:65)
        at java.lang.Integer.parseInt(Integer.java:580)
        at java.lang.Integer.parseInt(Integer.java:615)
        at java.net.URLStreamHandler.parseURL(URLStreamHandler.java:216)
        at java.net.URL.<init>(URL.java:622)
        ... 21 more
```

The schema registry URL is evidently valid at some level, because in the schema registry stdout I can see a POST being made when the OGG replicat runs:

```
[2016-11-25 03:12:53,591] INFO 127.0.0.1 - - [25/Nov/2016:03:12:53 +0000] "POST /subjects/ORCL.SOE.LOGON-key/versions HTTP/1.1" 200 9  15 (io.confluent.rest-utils.requests:77)
```

Looking at the error in the above note `MalformedURLException: For input string: "18081 "` and the space suffix on 18081. 

Going back to the RPT output some more: 

```
  Contents of Kafka producer configuration file
    key [schema.registry.url]  value [http://localhost:18081]
    key [key.converter]  value [io.confluent.connect.avro.AvroConverter]
    key [value.converter]  value [io.confluent.connect.avro.AvroConverter]
    key [bootstrap.servers]  value [localhost:9092]
    key [value.serializer]  value [org.apache.kafka.common.serialization.ByteArraySerializer]
    key [value.converter.schema.registry.url]  value [http://localhost:18081 ]
    key [key.converter.schema.registry.url]  value [http://localhost:18081]
    key [key.serializer]  value [org.apache.kafka.common.serialization.ByteArraySerializer]
    key [internal.key.converter]  value [org.apache.kafka.connect.json.JsonConverter]
    key [internal.value.converter]  value [org.apache.kafka.connect.json.JsonConverter]
```

Note the **trailing space** on the configuration value for `value.converter.schema.registry.url`! After removing the trailing space from `confluent.properties`, all was well, and OGG successfully sends data to Kafka in Avro format.