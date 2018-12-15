+++
author = "Robin Moffatt"
categories = ["kafka", "key", "spelling", "pebcak"]
date = 2017-05-12T00:52:41Z
description = ""
draft = false
image = "/images/2017/05/1__screen_and_3__oracle_vbgeneric____ssh_.png"
slug = "kafka-common-kafkaexception-no-key-found-on-line-1"
tags = ["kafka", "key", "spelling", "pebcak"]
title = "kafka.common.KafkaException: No key found on line 1"

+++

A very silly [PEBCAK](https://en.wiktionary.org/wiki/PEBCAK) problem this one, but Google hits weren't so helpful so here goes. 

Running a console producer, specifying keys: 

    kafka-console-producer \
    --broker-list localhost:9092 \
    --topic test_topic \
    --property parse.key=true \
    --property key.seperator=,

Failed when I entered a key/value: 

```
1,foo
kafka.common.KafkaException: No key found on line 1: 1,foo
        at kafka.tools.ConsoleProducer$LineMessageReader.readMessage(ConsoleProducer.scala:314)
        at kafka.tools.ConsoleProducer$.main(ConsoleProducer.scala:55)
        at kafka.tools.ConsoleProducer.main(ConsoleProducer.scala)
```

**kafka.common.KafkaException: No key found on line** ... but I specified the key, didn't I? 

It would help if I could spell ...  `key.sep`**e**`rator` isn't a valid property to configure. `sep`**a**`rator` on the other hand, is: 

    kafka-console-producer \
    --broker-list localhost:9092 \
    --topic test_topic \
    --property parse.key=true \
    --property key.separator=,

Much better.