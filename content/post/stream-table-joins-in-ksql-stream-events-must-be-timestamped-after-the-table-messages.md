+++
author = "Robin Moffatt"
categories = ["ksql", "stream", "table", "join"]
date = 2018-05-17T10:16:43Z
description = ""
draft = false
image = "/images/2018/05/IMG_8934.jpg"
slug = "stream-table-joins-in-ksql-stream-events-must-be-timestamped-after-the-table-messages"
tag = ["ksql", "stream", "table", "join"]
title = "Stream-Table Joins in KSQL: Stream events must be timestamped after the Table messages"

+++

(preserving [this StackOverflow](https://stackoverflow.com/questions/50371518/kafka-ksql-simple-join-does-not-work/50390022#50390022) answer for posterity and future Googlers)

**tl;dr** When doing a stream-table join, your *table* messages must already exist (and must be timestamped) _before_ the stream messages. If you re-emit your source stream messages, after the table topic is populated, the join will succeed.

### Example data

Use `kafakcat` to populate topics:

    kafkacat -b localhost:9092 -P -t sessionDetails <<EOF
    {"Media":"Foo","SessionIdTime":"2018-05-17 11:25:33 BST","SessionIdSeq":1}
    {"Media":"Foo","SessionIdTime":"2018-05-17 11:26:33 BST","SessionIdSeq":2}
    EOF

    kafkacat -b localhost:9092 -P -t voipDetails <<EOF
    {"SessionIdTime":"2018-05-17 11:25:33 BST","SessionIdSeq":1,"Details":"Bar1a"}
    {"SessionIdTime":"2018-05-17 11:25:33 BST","SessionIdSeq":1,"Details":"Bar1b"}
    {"SessionIdTime":"2018-05-17 11:26:33 BST","SessionIdSeq":2,"Details":"Bar2"}
    EOF

Validate topic contents:

    Robin@asgard02 ~> kafkacat -b localhost:9092 -C -t sessionDetails
    {"Media":"Foo","SessionIdTime":"2018-05-17 11:25:33 BST","SessionIdSeq":1}
    {"Media":"Foo","SessionIdTime":"2018-05-17 11:26:33 BST","SessionIdSeq":2}

    Robin@asgard02 ~> kafkacat -b localhost:9092 -C -t voipDetails
    {"SessionIdTime":"2018-05-17 11:25:33 BST","SessionIdSeq":1,"Details":"Bar1a"}
    {"SessionIdTime":"2018-05-17 11:25:33 BST","SessionIdSeq":1,"Details":"Bar1b"}
    {"SessionIdTime":"2018-05-17 11:26:33 BST","SessionIdSeq":2,"Details":"Bar2"}


### Declare source streams

    ksql> CREATE STREAM session_details_stream \
          (Media varchar ,SessionIdTime varchar,SessionIdSeq long) \
          WITH (KAFKA_TOPIC = 'sessionDetails', VALUE_FORMAT = 'json');

     Message
    ----------------
     Stream created
    ----------------
    ksql> CREATE STREAM voip_details_stream \
          (SessionIdTime varchar,SessionIdSeq long, Details varchar) \
          WITH (KAFKA_TOPIC = 'voipDetails', VALUE_FORMAT = 'json');

     Message
    ----------------
     Stream created
    ----------------
    ksql> select * from session_details_stream;
    1526553130864 | null | Foo | 2018-05-17 11:25:33 BST | 1
    1526553130865 | null | Foo | 2018-05-17 11:26:33 BST | 2
    ^CQuery terminated
    ksql> select * from voip_details_stream;
    1526553143176 | null | 2018-05-17 11:25:33 BST | 1 | Bar1a
    1526553143176 | null | 2018-05-17 11:25:33 BST | 1 | Bar1b
    1526553143176 | null | 2018-05-17 11:26:33 BST | 2 | Bar2
    ^CQuery terminated

### Repartition each topic on SessionIdTime+SessionIdSeq

    ksql> CREATE STREAM SESSION AS \
          SELECT Media, CONCAT(SessionIdTime,SessionIdSeq) AS root \
          FROM session_details_stream \
          PARTITION BY root;

     Message
    ----------------------------
     Stream created and running
    ----------------------------


    ksql> SELECT ROWTIME, ROWKEY, root, media FROM SESSION;
    1526553130864 | 2018-05-17 11:25:33 BST1 | 2018-05-17 11:25:33 BST1 | Foo
    1526553130865 | 2018-05-17 11:26:33 BST2 | 2018-05-17 11:26:33 BST2 | Foo


    ksql> CREATE STREAM VOIP AS \
          SELECT CONCAT(SessionIdTime,SessionIdSeq) AS root, details \
          FROM voip_details_stream \
          PARTITION BY root;

     Message
    ----------------------------
     Stream created and running
    ----------------------------
    ksql>

### Declare table

    ksql> CREATE TABLE VOIP_TABLE (root VARCHAR, details VARCHAR) \
          WITH (KAFKA_TOPIC='VOIP', VALUE_FORMAT='JSON', KEY='root');

     Message
    ---------------
     Table created
    ---------------
    ksql> SELECT ROWTIME, ROWKEY, root, details FROM VOIP;
    1526553143176 | 2018-05-17 11:26:33 BST2 | 2018-05-17 11:26:33 BST2 | Bar2
    1526553143176 | 2018-05-17 11:25:33 BST1 | 2018-05-17 11:25:33 BST1 | Bar1a
    1526553143176 | 2018-05-17 11:25:33 BST1 | 2018-05-17 11:25:33 BST1 | Bar1b

### Join SESSION stream to VOIP table

    ksql> SELECT s.ROWTIME, s.root, s.media, v.details \
          FROM SESSION s \
          LEFT OUTER JOIN VOIP_TABLE v ON S.root = V.root;
    1526553130864 | 2018-05-17 11:25:33 BST1 | Foo | null
    1526553130865 | 2018-05-17 11:26:33 BST2 | Foo | null

Leave the above JOIN query running. Re-emit SESSION message to the source topic (using `kafkacat` to send the same messages to `sessionDetails` as above):

    1526553862403 | 2018-05-17 11:25:33 BST1 | Foo | Bar1a
    1526553988639 | 2018-05-17 11:26:33 BST2 | Foo | Bar2

Per Rohan Desai on the [Confluent Community Slack](https://slackpass.io/confluentcommunity):

> The problem is that the rowtime of the record from your stream is earlier than the rowtime of the record in your table that you expect it to join with. So when the stream record is processed there is no corresponding record in the table

Looking at the message on the source table for one of the join keys using `ROWTIME` to look at the message timestamp (_not to be confused with the timestamp-based `root`_):

    ksql> SELECT TIMESTAMPTOSTRING(ROWTIME, 'yyyy-MM-dd HH:mm:ss') , ROWTIME, root, details from VOIP WHERE root='2018-05-17 11:26:33 BST2';
    2018-05-17 11:32:23 | 1526553143176 | 2018-05-17 11:26:33 BST2 | Bar2

Compare this to the message on the source session stream topic:

    ksql> SELECT TIMESTAMPTOSTRING(ROWTIME, 'yyyy-MM-dd HH:mm:ss') , ROWTIME, root, media from SESSION WHERE root='2018-05-17 11:26:33 BST2';
    2018-05-17 11:32:10 | 1526553130865 | 2018-05-17 11:26:33 BST2 | Foo
    2018-05-17 11:46:28 | 1526553988639 | 2018-05-17 11:26:33 BST2 | Foo

The *first* of these (at `11:32:10` / `1526553130865`) is prior to that of the corresponding `VOIP` message (shown above), and resulted in the `null` join result that we first saw. The *second* of these is dated later (`11:46:28` / `1526553988639`) is produced the successful join that we subsequently saw:

    1526553988639 | 2018-05-17 11:26:33 BST2 | Foo | Bar2
