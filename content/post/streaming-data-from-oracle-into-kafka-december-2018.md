+++
author = "Robin Moffatt"
categories = ["oracle", "cdc", "debezium", "goldengate", "xstream", "logminer", "flashback", "licence", "ksql"]
date = 2018-12-12T09:49:04Z
description = ""
draft = false
image = "/images/2018/12/IMG_7464.jpg"
slug = "streaming-data-from-oracle-into-kafka-december-2018"
tag = ["oracle", "cdc", "debezium", "goldengate", "xstream", "logminer", "flashback", "licence", "ksql"]
title = "Streaming data from Oracle into Kafka (December 2018)"

+++

_This is a short summary discussing what the options are for integrating Oracle RDBMS into Kafka, as of December 2018. For a more detailed background to why and how at a broader level for all databases (not just Oracle) see [this blog](http://cnfl.io/kafka-cdc) and [these slides](https://speakerdeck.com/rmoff/no-more-silos-integrating-databases-and-apache-kafka)._

### What techniques & tools are there? 

As of December 2018, this is what the line-up looks like: 

* **Query-based CDC**
  * The [JDBC Connector](https://docs.confluent.io/current/connect/kafka-connect-jdbc/source-connector/source_config_options.html) for Kafka Connect, polls the database for new or changed data based on an incrementing ID column and/or update timestamp
* **Log-based CDC**
  * **Oracle GoldenGate for Big Data** (license [$20k per CPU](https://www.oracle.com/assets/technology-price-list-070617.pdf)). Supports three "handlers":
      * [Kafka](https://docs.oracle.com/goldengate/bd123110/gg-bd/GADBD/using-kafka-handler.htm#GADBD449)
      * [Kafka Connect](https://docs.oracle.com/goldengate/bd123110/gg-bd/GADBD/using-kafka-connect-handler.htm#GADBD-GUID-81730248-AC12-438E-AF82-48C7002178EC) (runs in the OGG runtime, not a Connect worker. It doesn't support the full Connect API, including Single Message Transforms.) 
      * [Kafka REST Proxy](https://docs.oracle.com/goldengate/bd123210/gg-bd/GADBD/using-kafka-rest-proxy-handler.htm)

  * **Oracle XStream**  (requires **Oracle GoldenGate** license [$17.5k per CPU](https://www.oracle.com/assets/technology-price-list-070617.pdf)).
      * Built on top of LogMiner. Oracle's API for third-party applications wanting to stream events from the database. 
      * Currently beta implementation by [**Debezium**](https://debezium.io/docs/connectors/oracle/) (0.9) with Kafka Connect
  * **Oracle Log Miner** No special license required (even available in Oracle XE).
      * [Being](https://issues.jboss.org/browse/DBZ-20) [considered](https://issues.jboss.org/browse/DBZ-137?_sscc=t) by Debezium, and also implemented by [community connector here](https://github.com/erdemcer/kafka-connect-oracle)
      * Available commercially from Attunity, SQData, HVR, StreamSets, Striim etc
      * DBVisit Replicate is no longer developed. 
* **Triggers** to capture changes made to a table, write details of those changes to another database table, ingest that table into Kafka (e.g. with JDBC connector).
* **Flashback** to show all changes to a given table between two points in time. [Implemented as a PoC by Stewart Bryson and Björn Rost](https://blog.pythian.com/streaming-oracle-kafka-stories-message-bus-stop/).

### What do they look like in action? 

I did a recent talk at UK Oracle User Group TECH18 conference, presenting my talk "[No More Silos: Integrating Databases and Apache Kafka](https://speakerdeck.com/rmoff/no-more-silos-integrating-databases-and-apache-kafka)". As part of this I did a live demo showing the difference between using the JDBC Connector (query-based CDC) and the new Debezium/XStream option (log-based CDC). Here I'll try and replicate the discussion and examples. You can also see previous articles that I've written showing [GoldenGate in action](https://rmoff.net/tag/goldengate/).

You can find all of the code on the [demo-scene](https://github.com/confluentinc/demo-scene/blob/master/no-more-silos-oracle/no-more-silos-oracle.adoc) repository, runnable through Docker and Docker Compose. Simply clone the repo, and then run 

    cd docker-compose
    ./scripts/setup.sh

The setup script does all of the rest, including bringing up Confluent Platform, and configuring the connectors. _You do have to [build the Oracle database docker image](https://github.com/oracle/docker-images/blob/master/OracleDatabase/SingleInstance/README.md) first_.

#### Setup

Some notes on setup of each option: 

* JDBC connector
  * The main thing you need here is the Oracle JDBC driver in the correct folder for the Kafka Connect JDBC connector. 
    * In the Docker Compose I use a pass-through volume (`db-leach`) mounted from the database container to [copy the JDBC driver directly from the database container onto the Kafka Connect container](https://github.com/confluentinc/demo-scene/blob/master/no-more-silos-oracle/docker-compose/docker-compose.yml#L77-L83).
  * You also need to make sure that the source table has an incrementing ID column and/or update timestamp column that can be used to identify changed rows. Without that you can only do a bulk load of the data each time. 
* Debezium connector
  * Requires a bunch of libraries (instant client and others), [copied from the database container using the same pass-through volume as above](https://github.com/confluentinc/demo-scene/blob/master/no-more-silos-oracle/docker-compose/docker-compose.yml#L146-L165). 
  * This requires config work on the database, covered by the [Debezium docs](https://github.com/debezium/debezium-examples/blob/master/tutorial/README.md#using-oracle) and done by the Docker script [here](https://github.com/confluentinc/demo-scene/blob/master/no-more-silos-oracle/docker-compose/ora-setup-scripts/01_xstreams-setup.sh)
  * Each table needs to be configured (script [here](https://github.com/confluentinc/demo-scene/blob/master/no-more-silos-oracle/docker-compose/ora-startup-scripts/01_create_customers.sh#L36-L37))
  * I hit problems with the Capture stopping with permission errors so [automated its restart](https://github.com/confluentinc/demo-scene/blob/master/no-more-silos-oracle/docker-compose/ora-startup-scripts/03_restart_capture.sh) (hacky, I know)

The actual config of the two connectors is done in separate calls to Kafka Connect's REST API ([JDBC](https://github.com/confluentinc/demo-scene/blob/master/no-more-silos-oracle/docker-compose/scripts/create-ora-source-jdbc.sh) / [Debezium](https://github.com/confluentinc/demo-scene/blob/master/no-more-silos-oracle/docker-compose/scripts/create-ora-source-debezium-xstream.sh)). I run separate instances of Kafka Connect (in distributed mode, single node) just to keep troubleshooting simple, but in theory they could be in the same worker. 

The invocation of the above REST configuration scripts is managed by the master `setup.sh` script, with [some logic in it](https://github.com/confluentinc/demo-scene/blob/master/no-more-silos-oracle/docker-compose/scripts/setup.sh#L14-L18) to wait until Kafka Connect is available before launching the config.

You can validate that each connector is running by querying the REST API for the two Kafka Connect worker instances: 

    $ curl -s "http://localhost:18083/connectors"| jq '.[]'| xargs -I{connector_name} curl -s "http://localhost:18083/connectors/"{connector_name}"/status"| jq -c -M '[.name,.connector.state,.tasks[].state]|join(":|:")'| column -s : -t| sed 's/\"//g'| sort
    ora-source-jdbc  |  RUNNING  |  RUNNING


    $ curl -s "http://localhost:8083/connectors"| jq '.[]'| xargs -I{connector_name} curl -s "http://localhost:8083/connectors/"{connector_name}"/status"| jq -c -M '[.name,.connector.state,.tasks[].state]|join(":|:")'| column -s : -t| sed 's/\"//g'| sort
    ora-source-debezium-xstream  |  RUNNING  |  RUNNING

#### Initial data load

In Oracle, check the source data: 

    COL FIRST_NAME FOR A15
    COL LAST_NAME FOR A15
    COL ID FOR 999
    COL CLUB_STATUS FOR A12
    COL UPDATE_TS FOR A29
    SET LINESIZE 200
    SELECT ID, FIRST_NAME, LAST_NAME, CLUB_STATUS, UPDATE_TS FROM CUSTOMERS;

      ID FIRST_NAME      LAST_NAME       CLUB_STATUS  UPDATE_TS
    ---- --------------- --------------- ------------ -----------------------------
      1 Rica            Blaisdell       bronze       11-DEC-18 05.16.00.000000 PM
      2 Ruthie          Brockherst      platinum     11-DEC-18 05.16.00.000000 PM
      3 Mariejeanne     Cocci           bronze       11-DEC-18 05.16.00.000000 PM
      4 Hashim          Rumke           platinum     11-DEC-18 05.16.00.000000 PM
      5 Hansiain        Coda            platinum     11-DEC-18 05.16.00.000000 PM

Now let's see what's in Kafka. I'm using KSQL here to inspect the data; you could use other Kafka console consumers if you'd rather. 

Launch KSQL: 

    docker-compose exec ksql-cli ksql http://ksql-server:8088

Inspect the topics on the Kafka cluster: 

    ksql> LIST TOPICS;

    Kafka Topic               | Registered | Partitions | Partition Replicas | Consumers | ConsumerGroups
    -------------------------------------------------------------------------------------------------------
    asgard.DEBEZIUM.CUSTOMERS | false      | 1          | 1                  | 0         | 0
    ora-CUSTOMERS-jdbc        | false      | 1          | 1                  | 0         | 0
    …

The two topics listed are for the same table (`CUSTOMERS`) from the Debezium and JDBC connectors respectively. 

Dump the contents: 

* Debezium/XStreams: 

        ksql> PRINT 'asgard.DEBEZIUM.CUSTOMERS' FROM BEGINNING;
        Format:AVRO
        12/11/18 5:16:40 PM UTC, , {"before": null, "after": {"ID": 1, "FIRST_NAME": "Rica", "LAST_NAME": "Blaisdell", "EMAIL": "rblaisdell0@rambler.ru", "GENDER": "Female", "CLUB_STATUS": "bronze", "COMMENTS": "Universal optimal hierarchy", "CREATE_TS": 1544548560283613, "UPDATE_TS": 1544548560000000}, "source": {"version": "0.9.0.Alpha2", "connector": "oracle", "name": "asgard", "ts_ms": 1544548595164, "txId": null, "scn": 3014605, "snapshot": true}, "op": "r", "ts_ms": 1544548595189, "messagetopic": "asgard.DEBEZIUM.CUSTOMERS", "messagesource": "Debezium CDC from Oracle on asgard"}
        …

* JDBC connector

        ksql> PRINT 'ora-CUSTOMERS-jdbc' FROM BEGINNING;
        Format:AVRO
        12/11/18 5:16:55 PM UTC, null, {"ID": 1, "FIRST_NAME": "Rica", "LAST_NAME": "Blaisdell", "EMAIL": "rblaisdell0@rambler.ru", "GENDER": "Female", "CLUB_STATUS": "bronze", "COMMENTS": "Universal optimal hierarchy", "CREATE_TS": 1544548560283, "UPDATE_TS": 1544548560000, "messagetopic": "ora-CUSTOMERS-jdbc", "messagesource": "JDBC Source Connector from Oracle on asgard"}
        …

Each has the full contents of the source table (5 records, only first is shown above). We can actually use KSQL to easily query the topic directly if we want. First we declare each topic as the source for a stream: 

    SET 'auto.offset.reset' = 'earliest';
    CREATE STREAM CUSTOMERS_STREAM_DBZ_SRC WITH (KAFKA_TOPIC='asgard.DEBEZIUM.CUSTOMERS', VALUE_FORMAT='AVRO');
    CREATE STREAM CUSTOMERS_STREAM_JDBC_SRC WITH (KAFKA_TOPIC='ora-CUSTOMERS-jdbc', VALUE_FORMAT='AVRO');

and then query the JDBC-sourced Kafka topic: 

    ksql> SELECT ID, FIRST_NAME, LAST_NAME, CLUB_STATUS FROM CUSTOMERS_STREAM_JDBC_SRC LIMIT 5;
    1 | Rica | Blaisdell | bronze
    2 | Ruthie | Brockherst | platinum
    5 | Hansiain | Coda | platinum
    4 | Hashim | Rumke | platinum
    3 | Mariejeanne | Cocci | bronze

and the one from Debezium: 

    ksql> SELECT AFTER->ID AS ID, AFTER->FIRST_NAME AS FIRST_NAME, AFTER->LAST_NAME AS LAST_NAME, AFTER->CLUB_STATUS AS CLUB_STATUS FROM CUSTOMERS_STREAM_DBZ_SRC;
    1 | Rica | Blaisdell | bronze
    2 | Ruthie | Brockherst | platinum
    3 | Mariejeanne | Cocci | bronze
    4 | Hashim | Rumke | platinum
    5 | Hansiain | Coda | platinum

Note that I'm accessing nested attributes of the `AFTER` object here using the `->` operator.

The schema for both topics come from the Schema Registry, in which Kafka Connect automatically stores the schema for the data coming from Oracle and serialises the data into Avro. The great thing about this is in a consuming application, such as KSQL, the schema is already available and doesn't have to be manually entered. 

#### INSERT

Insert a row in the Oracle database: 

    SQL> SET AUTOCOMMIT ON;
    SQL>
    SQL> INSERT INTO CUSTOMERS (FIRST_NAME,LAST_NAME,CLUB_STATUS) VALUES ('Rick','Astley','Bronze');

    1 row created.

    Commit complete.

Straight away in the Kafka topics you'll see a new row (in fact, if you have left the above `SELECT` running you won't need to rerun this, it'll show the new row already): 

* JDBC 

        ksql> SELECT ID, FIRST_NAME, LAST_NAME, CLUB_STATUS FROM CUSTOMERS_STREAM_JDBC_SRC;
        1 | Rica | Blaisdell | bronze
        2 | Ruthie | Brockherst | platinum
        5 | Hansiain | Coda | platinum
        4 | Hashim | Rumke | platinum
        3 | Mariejeanne | Cocci | bronze
        42 | Rick | Astley | Bronze

* Debezium/XStream 

        ksql> SELECT AFTER->ID AS ID, AFTER->FIRST_NAME AS FIRST_NAME, AFTER->LAST_NAME AS LAST_NAME, AFTER->CLUB_STATUS AS CLUB_STATUS FROM CUSTOMERS_STREAM_DBZ_SRC;
        1 | Rica | Blaisdell | bronze
        2 | Ruthie | Brockherst | platinum
        3 | Mariejeanne | Cocci | bronze
        4 | Hashim | Rumke | platinum
        5 | Hansiain | Coda | platinum
        42 | Rick | Astley | Bronze


So far, so same. Each captures an insert. Debezium from XStream and the database's redo log, JDBC by polling the database for any rows with a newer `UPDATE_TS` or higher `ID` than the previous request.

#### UPDATE

This is where things get interesting. Let's update the row in Oracle that we just created: 

    SQL> UPDATE CUSTOMERS SET CLUB_STATUS = 'Platinum' where ID=42;

    1 row updated.

    Commit complete.
    SQL>

Now check out the data in Kafka.

* JDBC is as before; the changed data row is available to us: 

        ksql> SELECT ID, FIRST_NAME, LAST_NAME, CLUB_STATUS FROM CUSTOMERS_STREAM_JDBC_SRC;
        1 | Rica | Blaisdell | bronze
        2 | Ruthie | Brockherst | platinum
        5 | Hansiain | Coda | platinum
        4 | Hashim | Rumke | platinum
        3 | Mariejeanne | Cocci | bronze
        42 | Rick | Astley | Bronze
        42 | Rick | Astley | Platinum

* Debezium/XStream now comes into its own. As well as the new row of data, we can see what it was previously, through the `BEFORE` nested object: 

        ksql> SELECT OP, AFTER->ID, BEFORE->CLUB_STATUS, AFTER->CLUB_STATUS FROM CUSTOMERS_STREAM_DBZ_SRC;
        r | 1 | null | bronze
        r | 2 | null | platinum
        r | 3 | null | bronze
        r | 4 | null | platinum
        r | 5 | null | platinum
        c | 42 | null | Bronze
        u | 42 | Bronze | Platinum

      I'm just showing the before/after `CLUB_STATUS` but all the other fields are also available. There's also metadata about the change, including the type of operation in the `OP` field (`r`=read, i.e the initial snapshot, `c`=create, `u`=update)

      Let's look at the full payload of each message sent to Kafka: 

        {
          "before": {
            "ID": 42,
            "FIRST_NAME": "Rick",
            "LAST_NAME": "Astley",
            "EMAIL": null,
            "GENDER": null,
            "CLUB_STATUS": "Bronze",
            "COMMENTS": null,
            "CREATE_TS": 1544000706681769,
            "UPDATE_TS": 1544000706000000
          },
          "after": {
            "ID": 42,
            "FIRST_NAME": "Rick",
            "LAST_NAME": "Astley",
            "EMAIL": null,
            "GENDER": null,
            "CLUB_STATUS": "Platinum",
            "COMMENTS": null,
            "CREATE_TS": 1544000706681769,
            "UPDATE_TS": 1544000742000000
          },
          "source": {
            "version": "0.9.0.Alpha2",
            "connector": "oracle",
            "name": "asgard",
            "ts_ms": 1544000742000,
            "txId": "6.26.734",
            "scn": 2796831,
            "snapshot": false
          },
          "op": "u",
          "ts_ms": 1544000745823,
          "messagetopic": "asgard.DEBEZIUM.CUSTOMERS",
          "messagesource": "Debezium CDC from Oracle on asgard"
        }

      So each time a change is made in the database, you get a full before/after snapshot of the record, plus a bunch of other metadata. This is great for applications processing inbound changes that need to know not just that something changed (_here's the new record_) but also exactly _what_ changed (before/after payloads) as well as _how_ (insert/update/etc.)

#### DELETE

Delete a record from the source system

    SQL> DELETE FROM CUSTOMERS WHERE ID=42;

    1 row deleted.

    Commit complete.

Now check out the data in Kafka.

JDBC is unchanged; it's not captured any change to the source table. If you think about it, this is perfectly reasonable. How you query a database for a row that doesn't exist? 
Debezium/XStream, on the other hand, reports the data change precisely: 

    ksql> SELECT OP, AFTER->ID, BEFORE->CLUB_STATUS, AFTER->CLUB_STATUS FROM CUSTOMERS_STREAM_DBZ_SRC;
    r | 1 | null | bronze
    r | 2 | null | platinum
    r | 3 | null | bronze
    r | 4 | null | platinum
    r | 5 | null | platinum
    c | 42 | null | Bronze
    u | 42 | Bronze | Platinum
    d | null | Platinum | null

Note the `d` record on the last row. This has captured the `DELETE` operation perfectly. The `null` in the right-most column is the current value for `AFTER->CLUB_STATUS`, and since the record is deleted, it has no value. We can see this even more clearly if we look at the raw payload for the whole record: 

    {
      "before": {
        "ID": 42,
        "FIRST_NAME": "Rick",
        "LAST_NAME": "Astley",
        "EMAIL": null,
        "GENDER": null,
        "CLUB_STATUS": "Platinum",
        "COMMENTS": null,
        "CREATE_TS": 1544562543660463,
        "UPDATE_TS": 1544562791000000
      },
      "after": null,
      "source": {
        "version": "0.9.0.Alpha2",
        "connector": "oracle",
        "name": "asgard",
        "ts_ms": 1544563479000,
        "txId": "9.32.712",
        "scn": 3042804,
        "snapshot": true
      },
      "op": "d",
      "ts_ms": 1544563482682,
      "messagetopic": "asgard.DEBEZIUM.CUSTOMERS",
      "messagesource": "Debezium CDC from Oracle on asgard"
    }

The full record that has been deleted is present in the `BEFORE` object, but `AFTER` is null—it's been deleted, it no longer exists. It is an ex-record. 

---- 

Bonus KSQL : 

We're working with data in a Kafka topic. As it happens, KSQL is kinda useful for interogating that data, but at the end of the day it's still just a Kafka topic. We can use KSQL to also help monitor the lag between the event in the source system (`source->ms_ms` as provided by Debezium) and the time recorded on the Kafka broker (the Kafka message timestamp, exposed in `ROWTIME`): 

    ksql> SELECT TIMESTAMPTOSTRING(ROWTIME, 'yyyy-MM-dd HH:mm:ss Z'), \
    >         OP, \
    >         ROWTIME - SOURCE->TS_MS AS LAG_MS \
    > FROM CUSTOMERS_STREAM_DBZ_SRC;
    2018-12-11 17:16:40 +0000 | r | 5829
    2018-12-11 17:16:40 +0000 | r | 5806
    2018-12-11 17:16:40 +0000 | r | 5802
    2018-12-11 17:16:41 +0000 | r | 5805
    2018-12-11 17:16:41 +0000 | r | 5805
    2018-12-11 21:09:07 +0000 | c | 4104
    2018-12-11 21:13:51 +0000 | u | 40734
    2018-12-11 21:28:10 +0000 | d | 211438

Some of these lag times are pretty high; [DBZ-1018 Oracle connector is laggy](https://issues.jboss.org/projects/DBZ/issues/DBZ-1018) is a JIRA currently tracking it. 

You can get the same data out of the JDBC connector, based on the `UPDATE_TS` of the record itself: 

    ksql> SELECT TIMESTAMPTOSTRING(ROWTIME, 'yyyy-MM-dd HH:mm:ss Z'), \
    >          ROWTIME - UPDATE_TS AS LAG_MS \
    > FROM CUSTOMERS_STREAM_JDBC_SRC;
    2018-12-11 17:16:55 +0000 | 55612
    2018-12-11 17:16:55 +0000 | 55613
    2018-12-11 17:16:55 +0000 | 55614
    2018-12-11 17:16:55 +0000 | 55615
    2018-12-11 17:16:55 +0000 | 55615
    2018-12-11 21:09:04 +0000 | 1330
    2018-12-11 21:13:12 +0000 | 1384

You'll note here no available `OP` information, and no row for the corresponding `DELETE` action in the source database.

----

### Ecosystem

When you're bringing data into Kafka, you need to remember the bigger picture. Dumping it into a topic alone is not enough. Well, it is, but your wider community of developers won't thank you. 

You want to ensure that the schema of the source data is preserved, and that you're using a serialisation method for the data that is suitable. Doing this means that developers can use the data without being tightly coupled to the producer of the data to understand how to use it. 

However you do this, it should be in a way that integrates with the broader Kafka and Confluent Platform ecosystem. One option is the Schema Registry and Avro. **If you're using Kafka Connect then this is available by default**, since you just select the Avro converter when you set up Kafka Connect. 

----


### Overview of the Pros and Cons of each technique

_Some of these are objective, others subjective. Others may indeed be plain false ;-) Discussion, comments, and corrections in the comment function below welcomed!_

* **Query-based CDC**
  * Pros:
      * Easy to set up 
      * Minimal privileges required
  * Cons: 
      * No capture of DELETEs
      * No capture of before-state in an UPDATE
      * No guarantee that _all_ events are captured; only the state at the time of polling
      * Increased load on the source DB due to polling (and/or unacceptable latency in capturing the events if polling interval too high)

  <blockquote class="twitter-tweet" data-conversation="none" data-lang="en"><p lang="en" dir="ltr">Another con one could add to query-based CDC is that it needs support by the model (update column); I&#39;ve blogged about here: <a href="https://t.co/DDYV62DIVF">https://t.co/DDYV62DIVF</a>. Log-based CDC also can give you additional metadata like TX ids, causing queries (for some DBs) etc.</p>&mdash; Gunnar Morling (@gunnarmorling) <a href="https://twitter.com/gunnarmorling/status/1073323155370987521?ref_src=twsrc%5Etfw">December 13, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

* **Log-based CDC**
  * Oracle GoldenGate for Big Data ("OGGBD")

      * Pros: 
          * Low latency
          * Minimal impact on the source
          * Captures every event
          * Capture before/after state in UPDATEs
          * Captures DELETEs include prior state

      * Cons: 

          * Requires sysadmin privileges to install 
          * Relatively complex to set up (compared to JDBC connector)
          * License cost
          * Kafka Connect support is not fully compliant with the Kafka Connect API which may matter if you want to use things like custom converters, Single Message Transform, and so on.



  * Oracle XStream

      * Pros:

          * Marginally cheaper than OGGBD 
          * Debezium is open source and is under active development
          * Low latency
          * Minimal impact on the source
          * Captures every event
          * Capture before/after state in UPDATEs
          * Captures DELETEs include prior state

      * Cons: 

          * Requires sysadmin privileges to install 
          * Relatively complex to set up (compared to JDBC connector)
          * License cost
          * Some issues with current Debezium implementation: 
              * [DBZ-1022 org.apache.kafka.connect.errors.DataException: Only Map objects supported in absence of schema for field insertion, found: null](https://issues.jboss.org/projects/DBZ/issues/DBZ-1022)
              * [DBZ-1019 java.lang.IllegalArgumentException: timeout value is negative](https://issues.jboss.org/projects/DBZ/issues/DBZ-1019)
              * [DBZ-1018 Oracle connector is laggy](https://issues.jboss.org/projects/DBZ/issues/DBZ-1018)
              * [DBZ-1014 Oracle connector requires libaio to be installed](https://issues.jboss.org/projects/DBZ/issues/DBZ-1014)
              * [DBZ-1013 Include Instant Client in Docker build for Oracle](https://issues.jboss.org/projects/DBZ/issues/DBZ-1013)
              * [DBZ-1012 Debezium doesn't report absence of Instant Client](https://issues.jboss.org/projects/DBZ/issues/DBZ-1012)

  * Oracle Log Miner

      * Pros: 

          * No additional license cost
          * Full access to events?

      * Cons

          * Relatively complex to set up (compared to JDBC connector)
          * Requires code to parse events. How infallible is this? 
          * Could be inefficient if only capturing events from a small proportion of the DB activity (has to scan all REDO log still). Is this also a problem with XStream? 

* **Triggers**

  * Pros:
      * No licence cost
      * Entirely customisable

  * Cons:
      * Completely bespoke code to develop and maintain.
      * Tightly coupled to source application

    ----

    A contribution from reader **ynux** about triggers:

    > Thanks for your article which I found very helpful. Many people are interested, and many underestimate the complexity of this.
    > 
    > I'd like to add some "cons" to the self-built trigger solution because I was part of a team that built one (originally to feed changes into Elasticsearch).
    > 
    > * Can only be done per table
    > * Creates load on the Oracle database, because there are more writes and, more importantly, more locks. We had to put the trigger on the central table that had a very high change rate, and the locks it produced were small but summing up, especially as more applications asking for changes were added.
    > * People have to be very cautious if they want to retain the order of events. I don't remember the details, but we put a materialized view on top of the table filled by the trigger, and I think the reasoning was: If you have the source table -> change table -> application, consider this case. There's a commit to the source table, and change 1, say, "insert item A", asks for a timestamp t1 and updates the change table at time t1'. Change 2, "update item A", gets timestamp t2 and updates the change table at time t2', but overtakes change 1: t1 < t2, but t1' > t2' . (Can that happen? Does Oracle guarantee that it won't?). As Murphy rules, between t2' and t1' the application fetches the changes. And is understandably confused since it has to update an item that doesn't exist.
    > So I assume the materialized view between the change table and the application was added to fix this.
    > Note that the source table had both a date and an incrementing ID per item.
    > 
    > My takeaway from this experience was:
    > - Streams and Tables may be dual, but reconstructing a stream from a table is expensive
    > - When you think of ordering and consistency, think hard


* **Flashback**

  * Pro + Con:

      * Requires EE licence—but this is something users are more likely to have already than OGG/OGGBD 

  * Unknown: 
      * What granularity of data can be retrieved?
      * Impact on the DB from polling?
      * Unclear how much bespoke coding this would require per integration?

  <blockquote class="twitter-tweet" data-conversation="none" data-lang="en"><p lang="en" dir="ltr">There are 2 flashback features:<br>Flashback transaction query shows transactions from redo, similar to log miner.<br>Flashback version query shows previous versions, from undo, within undo_retention. Allowed in all editions. I think this is the one you mention.</p>&mdash; Franck Pachot (@FranckPachot) <a href="https://twitter.com/FranckPachot/status/1073323013750317056?ref_src=twsrc%5Etfw">December 13, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

### References

* Oracle GoldenGate for Big Data
  * https://www.oracle.com/middleware/data-integration/goldengate/big-data/
  * https://rmoff.net/tag/goldengate/
  * https://www.confluent.io/blog/streaming-data-oracle-using-oracle-goldengate-kafka-connect/
  * https://www.confluent.io/connector/oracle-goldengate/

* Oracle XStream / Debezium

  * https://docs.oracle.com/en/database/oracle/oracle-database/18/xstrm/index.html
  * https://github.com/debezium/debezium-examples/blob/master/tutorial/README.md#using-oracle

* LogMiner

  * https://docs.oracle.com/en/database/oracle/oracle-database/18/sutil/oracle-logminer-utility.html#GUID-2EAA593B-DC09-4D30-87EB-34819FC68B3D

### Try it out! 

You can find all of the code used in this article [on github here](https://github.com/confluentinc/demo-scene/blob/master/no-more-silos-oracle/). 

### Feedback?

Some of these are objective, others subjective. Others may indeed be plain false ;-) Discussion, comments, and corrections in the comment function below welcomed!

For _help_ in getting this working, the best place to head is the Confluent Community:

* Mailing list: https://groups.google.com/forum/#!forum/confluent-platform
* Slack group: https://slackpass.io/confluentcommunity

There's also a good Debezium community: 

* Mailing list: https://groups.google.com/forum/#!forum/debezium
* Gitter: https://gitter.im/debezium/user

### Updates & Comments

* Adam Leszczyński has built a (non-Kafka Connect) source: https://www.bersler.com/blog/openlogreplicator-first-log-based-open-source-oracle-to-kafka-replication/

* From Tanel Poder: 

    <blockquote class="twitter-tweet" data-conversation="none" data-lang="en"><p lang="en" dir="ltr">1) Materialized view logs<br><br>2) JDBC table change notifications (limited use as it only stores a few rowids at fine grained before switching to table level notifications)<br><br>Btw i thought attunity had a binary reader?</p>&mdash; Tanel Poder (@TanelPoder) <a href="https://twitter.com/TanelPoder/status/1073335673455894531?ref_src=twsrc%5Etfw">December 13, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
