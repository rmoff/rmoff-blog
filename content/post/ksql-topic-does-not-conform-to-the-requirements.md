+++
author = "Robin Moffatt"
date = 2018-03-06T23:08:11Z
description = ""
draft = false
slug = "ksql-topic-does-not-conform-to-the-requirements"
title = "KSQL: Topic … does not conform to the requirements"

+++

```
io.confluent.ksql.exception.KafkaTopicException: Topic 'KSQL_NOTIFY' does not conform to the requirements Partitions:1 v 4. Replication: 1 v 1
```

Why? Because the topic KSQL creates to underpin a `CREATE STREAM AS SELECT` or `CREATE TABLE AS SELECT` already exists, and doesn't match what it expects. By default it will create partitions & replicas based on the same values of the input topic. 

Options: 

1. Use a different topic, via the `WITH (KAFKA_TOPIC='FOO')` syntax, e.g. 

        CREATE STREAM TEST WITH (KAFKA_TOPIC='FOO') AS SELECT * FROM BAR;

2. Tell KSQL to use values that match the existing topic, with the `PARTITIONS` and `REPLICAS` parameters. So if the existing topic only has one partition, then tell KSQL that's what you want: 

        CREATE STREAM TEST WITH (PARTITIONS=1) AS SELECT * FROM BAR;

