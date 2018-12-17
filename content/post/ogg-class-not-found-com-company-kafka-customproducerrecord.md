+++
author = "Robin Moffatt"
categories = ["ogg", "goldengate", "kafka"]
date = 2016-07-28T16:34:37Z
description = ""
draft = false
image = "/images/2016/07/download.jpg"
slug = "ogg-class-not-found-com-company-kafka-customproducerrecord"
tag = ["ogg", "goldengate", "kafka"]
title = "OGG -  Class not found: \"com.company.kafka.CustomProducerRecord\""

+++

In the documentation for the current release of Oracle GoldenGate for Big Data (12.2.0.1.1.011) there's a [helpful sample configuration](https://docs.oracle.com/goldengate/bd1221/gg-bd/GADBD/GUID-2561CA12-9BAC-454B-A2E3-2D36C5C60EE5.htm#GADBD457), which isn't so helpful ... 


```
[...]
gg.handler.kafkahandler.ProducerRecordClass = com.company.kafka.CustomProducerRecord
[...]
```

This value for `gg.handler.kafkahandler.ProducerRecordClass` will cause a failure when you start the replicat: 

    [...]
    Class not found: "com.company.kafka.CustomProducerRecord"
    [...]

If you comment this configuration item out, it'll use [the default](https://docs.oracle.com/goldengate/bd1221/gg-bd/GADBD/GUID-2561CA12-9BAC-454B-A2E3-2D36C5C60EE5.htm#GADBD455) (`oracle.goldengate.handler.kafka.DefaultProducerRecord`) and work swimingly!


---

(Image credit: https://unsplash.com/@vanschneider)
