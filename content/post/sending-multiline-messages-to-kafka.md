+++
author = "Robin Moffatt"
categories = ["kafkacat", "kafka", "multiline"]
date = 2018-09-04T08:26:51Z
description = ""
draft = false
image = "/images/2018/09/2018-09-04_10-25-48-1.png"
slug = "sending-multiline-messages-to-kafka"
tags = ["kafkacat", "kafka", "multiline"]
title = "Sending multiline messages to Kafka"

+++

([SO answer repost](https://stackoverflow.com/questions/52151816/push-multiple-line-text-as-one-message-in-a-kafka-topic/52162998#52162998))

You can use [`kafkacat`](https://docs.confluent.io/current/app-development/kafkacat-usage.html) to send messages to Kafka that include line breaks. To do this, use its `-D` operator to specify a custom message delimiter (in this example `/`): 

    kafkacat -b kafka:29092 \
            -t test_topic_01 \
            -D/ \
            -P <<EOF
    this is a string message 
    with a line break/this is 
    another message with two 
    line breaks!
    EOF

_Note that the delimiter **must** be a single byte - multi-byte chars will end up getting included in the resulting message [See issue #140](https://github.com/edenhill/kafkacat/issues/140)_

Resulting messages, inspected also using kafkacat: 

    $ kafkacat -b kafka:29092 -C \
             -f '\nKey (%K bytes): %k\t\nValue (%S bytes): %s\n\Partition: %p\tOffset: %o\n--\n' \
             -t test_topic_01

    Key (-1 bytes):
    Value (43 bytes): this is a string message
    with a line break
    Partition: 0    Offset: 0
    --

    Key (-1 bytes):
    Value (48 bytes): this is
    another message with two
    line breaks!

    Partition: 0    Offset: 1
    --
    % Reached end of topic test_topic_01 [0] at offset 2

Inspecting using `kafka-console-consumer`: 

    $ kafka-console-consumer \
        --bootstrap-server kafka:29092 \
        --topic test_topic_01 \
        --from-beginning

    this is a string message
    with a line break
    this is
    another message with two
    line breaks!

(_thus illustrating why `kafkacat` is nicer to work with than `kafka-console-consumer` because of its optional verbosity :)_ )

---

_[Read more about kafkacat here](https://docs.confluent.io/current/app-development/kafkacat-usage.html)_