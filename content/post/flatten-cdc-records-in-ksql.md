+++
categories = ["cdc", "ksql", "kafka", "jdbc sink"]
date = 2018-10-11T15:13:59Z
description = ""
draft = false
image = "/images/2018/10/IMG_6257--1--1.jpg"
slug = "flatten-cdc-records-in-ksql"
tag = ["cdc", "ksql", "kafka", "jdbc sink"]
title = "Flatten CDC records in KSQL"

+++

### The problem - nested messages in Kafka

Data comes into Kafka in many shapes and sizes. Sometimes it's from CDC tools, and may be nested like this: 

<!--more-->


```
{
  "SCN": 12206116841348,
  "SEG_OWNER": "KFKUSER",
  "TABLE_NAME": "CDCTAB2",
  "TIMESTAMP": 1539162785000,
  "SQL_REDO": "insert into \"KFKUSER\".\"CDCTAB2\"(\"ID\",\"CITY\",\"NATIONALITY\") values (634789,'AHMEDABAD','INDIA')",
  "OPERATION": "INSERT",
  "data": {
    "value": {
      "ID": 634789,
      "CITY": {
        "string": "AHMEDABAD"
      },
      "NATIONALITY": {
        "string": "INDIA"
      }
    }
  },
  "before": null
}
```

Note that the 'payload' is nested under `data`->`value`. A user on the [Confluent Community mailing list](https://groups.google.com/forum/#!forum/confluent-platform) recently posted [a question](https://groups.google.com/d/msg/confluent-platform/vWle1i3TibI/a9sgDWzAAgAJ) in which they wanted to use the Kafka Connect JDBC Sink connector to stream this data to a target database. The problem was that the field they wanted to use as the primary key (`ID`) was nested (as you can see above). This caused the error: 

    Caused by: org.apache.kafka.connect.errors.ConnectException: PK mode for table 'CDCTAB2' is RECORD_VALUE with configured PK fields [ID], but record value schema does not contain field: ID

The key(!) thing here is `record value schema does not contain field ID`. The connector cannot find the field `ID` in the source message—because it's nested. 

### The solution - KSQL to flatten messages

You can use [KSQL](https://www.confluent.io/ksql) to transform every record on the source topic as it arrives, writing to a new topic and using _that_ topic as the source for the JDBC Sink. 

In KSQL, register the topic in KSQL: 

```
CREATE STREAM CDC_SOURCE_DATA \
    (SCN BIGINT, TABLE_NAME VARCHAR, OPERATION VARCHAR, \
     DATA STRUCT<VALUE STRUCT<\
       ID BIGINT, \
       CITY STRUCT<string VARCHAR>, \
       NATIONALITY STRUCT<string VARCHAR>>>\
    ) \
    WITH (KAFKA_TOPIC='asif_test2', VALUE_FORMAT='JSON');
```

Verify the schema—observe that it is nested

```
ksql> describe CDC_SOURCE_DATA;

Name                 : CDC_SOURCE_DATA
 Field      | Type
-------------------------------------------------------------------------------------------------------------------------------
 ROWTIME    | BIGINT           (system)
 ROWKEY     | VARCHAR(STRING)  (system)
 SCN        | BIGINT
 TABLE_NAME | VARCHAR(STRING)
 OPERATION  | VARCHAR(STRING)
 DATA       | STRUCT<VALUE STRUCT<ID BIGINT, CITY STRUCT<STRING VARCHAR(STRING)>, NATIONALITY STRUCT<STRING VARCHAR(STRING)>>>
-------------------------------------------------------------------------------------------------------------------------------
For runtime statistics and query details run: DESCRIBE EXTENDED <Stream,Table>;
```

Create a flattened topic: 

```
CREATE STREAM FLATTENED_DATA AS \
  SELECT SCN, TABLE_NAME, OPERATION, \
          DATA->VALUE->ID AS ID, \
          DATA->VALUE->CITY->string AS CITY, \
          DATA->VALUE->NATIONALITY->string AS NATIONALITY \
  FROM CDC_SOURCE_DATA;
```

Verify the new schema - note there are no nested fields

```
ksql> DESCRIBE FLATTENED_DATA;

Name                 : FLATTENED_DATA
 Field       | Type
-----------------------------------------
 ROWTIME     | BIGINT           (system)
 ROWKEY      | VARCHAR(STRING)  (system)
 SCN         | BIGINT
 TABLE_NAME  | VARCHAR(STRING)
 OPERATION   | VARCHAR(STRING)
 ID          | BIGINT
 CITY        | VARCHAR(STRING)
 NATIONALITY | VARCHAR(STRING)
-----------------------------------------
For runtime statistics and query details run: DESCRIBE EXTENDED <Stream,Table>;
ksql>
```

Query the new topic, e.g. using kafkacat: 

```
kafkacat -b kafka:29092 -t FLATTENED_DATA -C

{"SCN":12206116841348,"TABLE_NAME":"CDCTAB2","OPERATION":"INSERT","ID":634789,"CITY":"AHMEDABAD","NATIONALITY":"INDIA"}
```

Now you can use the target topic (`FLATTENED_DATA`) as the source for the JDBC sink, with `ID` and other columns exposed as top-level elements. 

KSQL is a continuous query language and so every new event on the source topic will automatically be processed and written to the target topic. 
