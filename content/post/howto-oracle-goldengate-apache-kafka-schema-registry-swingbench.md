+++
author = "Robin Moffatt"
categories = ["apache kafka", "schema registry", "swingbench", "goldengate", "oracle"]
date = 2018-02-01T23:15:00Z
description = ""
draft = false
image = "/images/2018/02/IMG_8617.JPG"
slug = "howto-oracle-goldengate-apache-kafka-schema-registry-swingbench"
tag = ["apache kafka", "schema registry", "swingbench", "goldengate", "oracle"]
title = "HOWTO: Oracle GoldenGate + Apache Kafka + Schema Registry + Swingbench"

+++

_This is the detailed step-by-step if you want to recreate the process I describe in the [Confluent blog here](https://www.confluent.io/blog/ksql-in-action-real-time-streaming-etl-from-oracle-transactional-data)_

---
I used Oracle's [Oracle Developer Days VM](http://www.oracle.com/technetwork/database/enterprise-edition/databaseappdev-vm-161299.html), which comes preinstalled with Oracle 12cR2. You can see the notes on [how to do this here](https://rmoff.net/2017/11/21/installing-oracle-goldengate-for-big-data-12.3.1-with-kafka-connect-and-confluent-platform/). These notes take you through installing and configuring:

* Swingbench, to create a sample "Order Entry" schema and simulate events on the Oracle database
* Oracle GoldenGate (OGG, forthwith) and Oracle GoldenGate for Big Data (OGG-BD, forthwith)
    * I'm using Oracle GoldenGate 12.3.1 which includes the Kafka Connect handler as part of its distribution. A connector for earlier versions can be [found here](http://www.oracle.com/technetwork/middleware/goldengate/oracle-goldengate-exchange-3805527.html). Some of the syntax may differ in the configuration below - if you hit problems then check out [an article that I wrote]() with an earlier version of the tool.
* OGG `extract` from the Order Entry schema
* Confluent Platform
* KSQL
* Elasticsearch

From this point, I'll now walk through configuring OGG-BD with the Kafka Connect handler

### Configuring the Kafka Connect replicat ##

The OGG-BD replicat takes the trail file of events written by the `extract` job, and replays those events to the target. In our case, the target is the Kafka Connect handler.

![](/images/2018/02/oggkaf01sm.jpg)

You can find full documentation for the OGG-BD replicat [here](http://docs.oracle.com/goldengate/bd123110/gg-bd/GADBD/using-kafka-connect-handler.htm#GADBD-GUID-81730248-AC12-438E-AF82-48C7002178EC). Each replicat has three configuration files:

* A **parameter** file, which can be used to specify configuration including the selection of specific tables or schemas from the Extract trail file. This file also points to the primary **properties** file
* The **properties** file is where we tell OGG-BD to use the Kafka Connect handler (`gg.handler.kafkaconnect.type=kafkaconnect`), as well as the **topic name format** and **Kafka message key**. These latter two items are new and improved in 12.3.1, and are template-driven. You can see the full syntax for them [here](http://docs.oracle.com/goldengate/bd123110/gg-bd/GADBD/using-kafka-connect-handler.htm#GUID-A87CAFFA-DACF-43A0-8C6C-5C64B578D606). Another useful configuration item in this file is `gg.log.level` which you can set to `DEBUG` if you need to dig into what's going on.
* The **Kafka Connect configuration** file, which points to the Kafka brokers, and the Converters that we want to use (Json or Avro). If we're using Avro, the URL for the Schema Registry is also defined here.

In this article we're going to use OGG-BD to populate a topic for each table, using Avro encoding. [Here are](https://gist.github.com/rmoff/221b4a1903a85568042e3a1b9b07ab95) the three configuration files you should put in `/u01/app/ogg-bd/dirprm`.

**Be very careful with copying & pasting these configuration files, as trailing whitespace can cause problems, [detailed here](https://rmoff.net/2017/09/12/oracle-goldengate-kafka-connect-handler-troubleshooting/).**

### Starting the replicat ##

From the bash shell, start the OGG-BD `ggsci` tool:

    # set to orcl12c when prompted
    . oraenv

    export LD_LIBRARY_PATH=$JAVA_HOME/jre/lib/amd64/server/

    cd /u01/app/ogg-bd
    rlwrap ./ggsci

and then from the `ggsci>` prompt run the following to start each replicat:

    add replicat rkafavro, exttrail /u01/app/ogg/dirdat/oe
    start rkafavro

Having done this, we'll want to do a little smoke test just to see that data modified in the SOE schema streams through via OGG-BD into Kafka.

Insert row to an SOE table

    [oracle@localhost ~]$ rlwrap sqlplus SYS/oracle@orcl as sysdba

    SQL*Plus: Release 12.2.0.1.0 Production on Mon Sep 11 10:14:28 2017

    Copyright (c) 1982, 2016, Oracle.  All rights reserved.


    Connected to:
    Oracle Database 12c Enterprise Edition Release 12.2.0.1.0 - 64bit Production

    SQL> insert into soe.logon values(42,42,sysdate);

    1 row created.

    SQL> commit;

    Commit complete.

    SQL>

Check that the topics have been created:

    $ kafka-topics --zookeeper localhost:2181 --list
    __confluent.support.metrics
    __consumer_offsets
    _schemas
    connect-configs
    connect-offsets
    connect-statuses
    ora-ogg-SOE-LOGON-avro

View the record

    kafka-avro-console-consumer \
    --bootstrap-server localhost:9092 \
    --property schema.registry.url=http://localhost:8081 \
    --property print.key=true \
    --from-beginning \
    --topic ora-ogg-SOE-LOGON-avro | jq '.'

```json
"42_42_2017-09-11 10:14:30"
{
  "table": {
    "string": "ORCL.SOE.LOGON"
  },
  "op_type": {
    "string": "I"
  },
  "op_ts": {
    "string": "2017-09-11 14:14:39.000000"
  },
  "current_ts": {
    "string": "2017-09-11 10:14:43.164000"
  },
  "pos": {
    "string": "00000000010000002172"
  },
  "LOGON_ID": {
    "double": 42
  },
  "CUSTOMER_ID": {
    "double": 42
  },
  "LOGON_DATE": {
    "string": "2017-09-11 10:14:30"
  }
}
```

Having confirmed that the replication is working, we can now run Swingbench to simulate some work on our source transactional system.

    /opt/swingbench/bin/charbench -cs localhost:1521/orcl -u soe -p soe -v trans,users -c /opt/swingbench/configs/SOE_Client_Side.xml

Output:

    Author  :        Dominic Giles
    Version :        2.6.0.1046

    Results will be written to results.xml.
    Hit Return to Terminate Run...

    Time            NCR     UCD     BP      OP      PO      BO      SQ      WQ      WA      Users
    09:01:04        0       0       0       0       0       0       0       0       0       [0/4]
    09:01:06        0       0       0       0       0       0       0       0       0       [0/4]
    09:01:08        15      7       68      28      3       12      1       0       0       [4/4]
    09:01:10        47      15      179     75      9       31      2       0       0       [4/4]
    09:01:12        74      20      248     119     11      45      3       2       0       [4/4]
    [...]

Hit Ctrl-C when you want to quit Swingbench. I've shown the command line version (`charbench`) above; there is also a GUI version that you can use if you want to easily tweak the simulation characteristics.

---
_To read more about this, and see the awesome KSQL in action, head over to the [Confluent blog](https://www.confluent.io/blog/)_
