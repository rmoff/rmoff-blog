+++
author = "Robin Moffatt"
categories = ["goldengate", "kafka connect", "avro", "schema registry", "oracle"]
date = 2017-09-12T21:55:16Z
description = ""
draft = false
image = "/images/2017/09/1__screen__ssh_.png"
slug = "oracle-goldengate-kafka-connect-handler-troubleshooting"
tags = ["goldengate", "kafka connect", "avro", "schema registry", "oracle"]
title = "Oracle GoldenGate / Kafka Connect Handler troubleshooting"

+++

The Replicat was kapput: 

```
GGSCI (localhost.localdomain) 3> info rkconnoe

REPLICAT   RKCONNOE  Last Started 2017-09-12 17:06   Status ABENDED
Checkpoint Lag       00:00:00 (updated 00:46:34 ago)
Log Read Checkpoint  File /u01/app/ogg/dirdat/oe000000
                     First Record  RBA 0
```

So checking the OGG error log `ggserr.log` showed

```
2017-09-12T17:06:17.572-0400  ERROR   OGG-15051  Oracle GoldenGate Delivery, rkconnoe.prm:  Java or JNI exception:
                              oracle.goldengate.util.GGException: Error detected handling operation added event.
2017-09-12T17:06:17.572-0400  ERROR   OGG-01668  Oracle GoldenGate Delivery, rkconnoe.prm:  PROCESS ABENDING.
```

So checking the replicat log `dirrpt/RKCONNOE_info_log4j.log` showed:

<script src="https://gist.github.com/rmoff/3e1fe8153d3a72068af1fb612fe4b839.js"></script>

Something odd going on here. From the above stack trace I focussed on 

    java.lang.NullPointerException at io.confluent.kafka.schemaregistry.client.rest.RestService.sendHttpRequest

So something to do with the `sendHttpRequest` to the Schema Registry. Checking the Schema Registry log showed: 

```
[2017-09-12 16:50:59,372] WARN badMessage: 400 Unknown Version for HttpChannelOverHttp@27e54a61{r=0,c=false,a=IDLE,uri=} (org.eclipse.jetty.http.HttpParser:1317)
```

Most bizarre. A normal OGG Kafka Connect handler interaction with Schema Registry looks like this: 

```
[2017-09-12 18:26:14,058] INFO 127.0.0.1 - - [12/Sep/2017:18:26:13 -0400] "POST /subjects/ora-ogg-COUNTRIES-key/versions HTTP/1.1" 200 8  468 (io.confluent.rest-utils.requests:77)
```

Let's dig a bit deeper. Since the debug log of the OGG Kafka Connect handler doesn't tell us anything more, let's see if we can spot anything in what is being sent to the Schema Registry in that HTTP call. Enter `tcpdump`.

    [oracle@localhost ~]$ sudo tcpdump -i venet0 -i lo -nnA 'port 8081'

Firstly, here's what we get when a successful message is processed by the OGG Kafka Connect handler (matching the above `POST` seen in the schema registry log): 

```
18:26:13.496951 IP 127.0.0.1.10420 > 127.0.0.1.8081: Flags [P.], seq 1:312, ack 1, win 342, options [nop,nop,TS val 1779726 ecr 1779721], length 311
E..k6m@.@...........(....&.c.ZR....V._.....
..(...( POST /subjects/ora-ogg-COUNTRIES-key/versions HTTP/1.1
Content-Type: application/vnd.schemaregistry.v1+json
Cache-Control: no-cache
Pragma: no-cache
User-Agent: Java/1.8.0_131
Host: localhost:8081
Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
Connection: keep-alive
Content-Length: 23
```

and now here's what we see when the dodgy replicat abends and the schema registry logs `WARN badMessage: 400 Unknown Version`: 

```
17:06:17.533978 IP 127.0.0.1.10112 > 127.0.0.1.8081: Flags [P.], seq 1:314, ack 1, win 342, options [nop,nop,TS val 1147447 ecr 1147444], length 313
E..my0@.@..X........'...7W...#.^...V.a.....
...7...4POST /subjects/ora-ogg-SOE-LOGON  -key/versions HTTP/1.1
Content-Type: application/vnd.schemaregistry.v1+json
Cache-Control: no-cache
Pragma: no-cache
User-Agent: Java/1.8.0_131
Host: localhost:8081
Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
Connection: keep-alive
Content-Length: 23
```

Check out the space between `LOGON` and `-key/versions` in the `POST` shown in the `tcpdump` output above – I'm pretty sure that shouldn't be there. Where did it come from, and importantly, how do we get rid of it?

The OGG Kafka Connect handler takes its configuration from the properties file that you define ([syntax here](http://docs.oracle.com/goldengate/bd123110/gg-bd/GADBD/using-kafka-connect-handler.htm#GADBD-GUID-23F5CCE3-845C-43F0-A08E-42C2BD1824FB)). New in 12.3.1 is the ability to define key and topic [_templates](http://docs.oracle.com/goldengate/bd123110/gg-bd/GADBD/using-kafka-connect-handler.htm#GADBD-GUID-A87CAFFA-DACF-43A0-8C6C-5C64B578D606)_. Here's the snippet from my properties file: 

```
gg.handler.kafkaconnect.topicMappingTemplate=ora-ogg-${schemaName}-${tableName}
gg.handler.kafkaconnect.keyMappingTemplate=${primaryKeys}
```

Looks pretty innocuous right? It's the same that I used for the replicat that _was_ working. Or at least, I thought it was. Check out what it looks like in `vi` if I issue a `:set list` : 

```
gg.handler.kafkaconnect.topicMappingTemplate=ora-ogg-${schemaName}-${tableName}  $
gg.handler.kafkaconnect.keyMappingTemplate=${primaryKeys}$
``` 

Each of those dollar `$` are end of line characters; and you'll notice that on the first line there are spaces after the configuration value and before the end of line! Working backwards from this we can actually spot in the `dirrpt/RKCONNOE.rpt` this: 

    DEBUG [main] (PropertyWrapper.java:375) - Setting property on 'class oracle.goldengate.handler.kafkaconnect.KafkaConnectHandler': 'topicMappingTemplate'='ora-ogg-${schemaName}-${tableName}  '

Note the trailing spaces! (to get DEBUG in the replicat log/report file, set `gg.log.level=DEBUG` in the handler properties configuration). 

---

To fix the problem, I just used some regex in vi: 

    :%s/ .$//g

(throughout the document, replace one or more spaces immediately before the end of line, with nothing - i.e. remove them.)

Having updated the handler properties, I then restarted the replicat

```
GGSCI (localhost.localdomain) 2> start rkconnoe

Sending START request to MANAGER ...
REPLICAT RKCONNOE starting
```

The replicat stayed running

```
GGSCI (localhost.localdomain) 4> info rkconnoe

REPLICAT   RKCONNOE  Last Started 2017-09-12 18:45   Status RUNNING
Checkpoint Lag       00:00:00 (updated 00:00:03 ago)
Process ID           19129
Log Read Checkpoint  File /u01/app/ogg/dirdat/oe000000001
                     2017-09-12 16:48:33.849941  RBA 1482
```

And I got my data in Kafka Connect, streaming through from Oracle GoldenGate!

```
kafka-avro-console-consumer \
--bootstrap-server localhost:9092 \
--property schema.registry.url=http://localhost:8081 \
--property print.key=true \
--from-beginning \
--topic ora-ogg-SOE-LOGON | jq '.'

"42_42_2017-09-12 16:21:48"
{
  "table": {
    "string": "ORCL.SOE.LOGON"
  },
  "op_type": {
    "string": "I"
  },
  "op_ts": {
    "string": "2017-09-12 20:21:59.000000"
  },
  "current_ts": {
    "string": "2017-09-12 18:45:09.244000"
  },
  "pos": {
    "string": "00000000000000001940"
  },
  "LOGON_ID": {
    "double": 42
  },
  "CUSTOMER_ID": {
    "double": 42
  },
  "LOGON_DATE": {
    "string": "2017-09-12 16:21:48"
  }
}
```