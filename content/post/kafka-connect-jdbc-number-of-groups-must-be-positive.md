+++
categories = ["kafka", "kafka connect", "jdbc", "oracle", "log4j"]
date = 2016-07-27T15:23:14Z
description = ""
draft = false
slug = "kafka-connect-jdbc-number-of-groups-must-be-positive"
tag = ["kafka", "kafka connect", "jdbc", "oracle", "log4j"]
title = "Kafka Connect JDBC - Oracle - Number of groups must be positive"

+++

There are [various reasons for this error](https://groups.google.com/forum/#!searchin/confluent-platform/%22Number$20of$20groups$20must$20be$20positive%22), but the one I hit was that **the table name is case sensitive**, and returned from Oracle by the JDBC driver in uppercase. 

If you specify the tablename in your connecter config in lowercase, it won't be matched, and this error is thrown. You can validate this by setting debug logging (edit `etc/kafka/connect-log4j.properties` to set `log4j.rootLogger=DEBUG, stdout`), and observe:  (*I've truncated some of the output for legibility*)

```
[2016-07-27 17:00:26,594] DEBUG Got the following tables: [...], SRSNAMESPACE_TABLE, ADDRESSES, CARD_DETAILS, CUSTOMERS, INVENTORIES, KAFKATEST, KAFKA_TEST, LOGON,[...] (io.confluent.connect.jdbc.TableMonitorThread:108)

[2016-07-27 17:00:26,594] DEBUG After filtering we got tables: [] (io.confluent.connect.jdbc.TableMonitorThread:135)
```

Changing the connector config from 

```
[...]
table.whitelist=kafka_test
```

to

```
[...]
table.whitelist=KAFKA_TEST
```

Resolved this particular problem.
