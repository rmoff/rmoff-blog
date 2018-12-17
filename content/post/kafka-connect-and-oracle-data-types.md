+++
author = "Robin Moffatt"
categories = ["kafka connect", "oracle", "number", "timestamp"]
date = 2018-05-21T08:59:00Z
description = ""
draft = false
image = "/images/2018/05/IMG_2759.jpg"
slug = "kafka-connect-and-oracle-data-types"
tags = ["kafka connect", "oracle", "number", "timestamp"]
title = "Kafka Connect and Oracle data types"

+++

The [Kafka Connect JDBC Connector](https://docs.confluent.io/current/connect/connect-jdbc/docs/source_connector.html) by default does not cope so well with: 

* `NUMBER` columns with no defined precision/scale. You may end up with apparent junk (`bytes`) in the output, or just errors. 
* `TIMESTAMP WITH LOCAL TIME ZONE`. Throws `JDBC type -102 not currently supported` warning in the log. 

Read more about `NUMBER` data type in the [Oracle docs](https://docs.oracle.com/database/121/SQLRF/sql_elements001.htm#SQLRF002220).

### tl;dr : How do I make it work? 

There are several options: 

#### New in Confluent Platform 4.1.1 : `numeric.mapping`

* In the connector configuration, set `"numeric.mapping":"best_fit"`
* New in Confluent Platform 4.1.1 ([Doc](https://docs.confluent.io/current/connect/connect-jdbc/docs/source_config_options.html#database))

#### Avoid the problem in the first place

* Change the DDL of the source object. For example: 
  * refine the `NUMBER` 's precision and scale
  * Use a `TIMESTAMP` type that is supported

#### CAST the datatypes in the `query`

* Pull from the object directly, and use `query` in the JDBC connector (instead of `table.whitelist`)—and cast the columns appropriately:

        curl -i -X POST -H "Accept:application/json" \
          -H  "Content-Type:application/json" http://localhost:8083/connectors/ \
          -d '{
                "name": "jdbc_source_oracle_soe_logon_07",
                "config": {
                        "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
                        "connection.url": "jdbc:oracle:thin:soe/soe@localhost:1521/ORCLPDB1",
                        "mode": "incrementing",
                        "query": "SELECT CAST(LOGON_ID AS NUMERIC(8,0)) AS LOGON_ID, CAST(CUSTOMER_ID AS NUMERIC(18,0)) AS CUSTOMER_ID, LOGON_DATE FROM LOGON",
                        "poll.interval.ms": "1000",
                        "incrementing.column.name":"LOGON_ID",
                        "topic.prefix": "ora-soe-07-LOGON",
                        "validate.non.null":false
                }
        }'

    Data: 
    
        Robin@asgard02 ~/cp> kafka-avro-console-consumer \
                                --bootstrap-server localhost:9092 \
                                --property schema.registry.url=http://localhost:8081 \
                                --topic ora-soe-07-LOGON --from-beginning --max-messages 1| jq '.'
        {
          "LOGON_ID": {
            "int": 2
          },
          "CUSTOMER_ID": {
            "long": 48645
          },
          "LOGON_DATE": {
            "long": 962854648000
          }
        }
        Processed a total of 1 messages

#### Use a View in the source database to cast the data types

* Define a view in the source DB that casts the columns appropriately, and then use the connector against this instead (make sure to include `"table.types":"VIEW"`)

        CREATE VIEW VW_LOGON AS SELECT CAST(LOGON_ID AS NUMERIC(8,0)) AS LOGON_ID, CAST(CUSTOMER_ID AS NUMERIC(18,0)) AS CUSTOMER_ID, LOGON_DATE FROM LOGON;

        curl -i -X POST -H "Accept:application/json" \
          -H  "Content-Type:application/json" http://localhost:8083/connectors/ \
          -d '{
                "name": "jdbc_source_oracle_soe_logon_05",
                "config": {
                        "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
                        "connection.url": "jdbc:oracle:thin:soe/soe@localhost:1521/ORCLPDB1",
                        "table.whitelist":"VW_LOGON",
                        "table.types":"VIEW",
                        "mode": "incrementing",
                        "poll.interval.ms": "1000",
                        "incrementing.column.name":"LOGON_ID",
                        "topic.prefix": "ora-soe-05-",
                        "validate.non.null":false
                }
        }'

    Happy data: 

        Robin@asgard02 ~/cp> kafka-avro-console-consumer \
                                --bootstrap-server localhost:9092 \
                                --property schema.registry.url=http://localhost:8081 \
                                --topic ora-soe-05-VW_LOGON --from-beginning --max-messages 1| jq '.'
        {
          "LOGON_ID": {
            "int": 2
          },
          "CUSTOMER_ID": {
            "long": 48645
          },
          "LOGON_DATE": {
            "long": 962854648000
          }
        }
        Processed a total of 1 messages

### What happens

    SQL> DESCRIBE LOGON;
     Name                                      Null?    Type
     ----------------------------------------- -------- ----------------------------
     LOGON_ID                                  NOT NULL NUMBER
     CUSTOMER_ID                               NOT NULL NUMBER
     LOGON_DATE                                         DATE

Using the ID column doesn't work: 

    curl -i -X POST -H "Accept:application/json" \
      -H  "Content-Type:application/json" http://localhost:8083/connectors/ \
      -d '{
            "name": "jdbc_source_oracle_soe_logon_01",
            "config": {
                    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
                    "connection.url": "jdbc:oracle:thin:soe/soe@localhost:1521/ORCLPDB1",
                    "table.whitelist":"LOGON",
                    "mode": "incrementing",
                    "poll.interval.ms": "1000",
                    "incrementing.column.name":"LOGON_ID",
                    "topic.prefix": "ora-soe-"
            }
    }'

The task fails with 

    org.apache.kafka.connect.errors.ConnectException: Scale of Decimal value for incrementing column must be 0

Using `timestamp` works but the data pulled through has the `NUMBER` columns as bytes, which is no use. 

    curl -i -X POST -H "Accept:application/json" \
      -H  "Content-Type:application/json" http://localhost:8083/connectors/ \
      -d '{
            "name": "jdbc_source_oracle_soe_logon_01",
            "config": {
                    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
                    "connection.url": "jdbc:oracle:thin:soe/soe@localhost:1521/ORCLPDB1",
                    "table.whitelist":"LOGON",
                    "mode": "timestamp",
                    "poll.interval.ms": "1000",
                    "timestamp.column.name":"LOGON_DATE",
                    "topic.prefix": "ora-soe-",
                    "validate.non.null":false
            }
    }'

Sample message: 

    {"LOGON_ID": {"bytes": "\u0000ÖÝ³pÌ\u0081ä\u008E8\u0005µì4påI\u008DÍO;Ê¶÷SI1½éoUÙv\u0099\f\u0003ð5j|\u0080\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000"}, "CUSTOMER_ID": {"bytes": "\t±Ó\u001Cluº\u000B|8åÆM0jzÏXFioF.\u0084\u008B,\f%ïYÝ\u0011\u0082À*\fjÑ\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000"}, "LOGON_DATE": 1526388662000}

Using 4.1.1 and `"numeric.mapping":"best_fit",`, no joy

    curl -i -X POST -H "Accept:application/json" \
      -H  "Content-Type:application/json" http://localhost:8083/connectors/ \
      -d '{
            "name": "jdbc_source_oracle_soe_logon_04",
            "config": {
                    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
                    "connection.url": "jdbc:oracle:thin:soe/soe@localhost:1521/ORCLPDB1",
                    "table.whitelist":"LOGON",
                    "mode": "timestamp",
                    "poll.interval.ms": "1000",
                    "timestamp.column.name":"LOGON_DATE","numeric.mapping":"best_fit",
                    "topic.prefix": "ora-soe-04-","validate.non.null":false,"numeric.mapping":"best_fit"
            }
    }'

same bytes output: 

    Robin@asgard02 ~/cp> kafka-avro-console-consumer \
                            --bootstrap-server localhost:9092 \
                            --property schema.registry.url=http://localhost:8081 \
                            --topic ora-soe-04-LOGON --from-beginning --max-messages 1| jq '.'
    {
      "LOGON_ID": "'ñK\u0001³èò~¯x6\"¤É^ãñ&Ý\u001cÐÀl)\u001f\u0019W¤¦ ­b»;ç\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
      "CUSTOMER_ID": "\u001e©/@sy/\tÍ`j;±èÂÃAâ#,ú1\u0003\u0017Ùg|ÙóNwEj\u001cH\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
      "LOGON_DATE": {
        "long": 946687534000
      }
    }
    Processed a total of 1 messages

### Why does it happen?

The source data is defined as `NUMERIC`: 

> `NUMBER` means "store the value as given", and the JDBC metadata for the column returns a precision of 38 and scale of non-zero. The connector has to trust the metadata, so it maps that to smallest type it can: `Decimal` logical type  (or `java.math.BigDecimal`).

    SQL> DESCRIBE LOGON;
     Name                                      Null?    Type
     ----------------------------------------- -------- ----------------------------
     LOGON_ID                                  NOT NULL NUMBER
     CUSTOMER_ID                               NOT NULL NUMBER
     LOGON_DATE                                         DATE

 
Compare this to when a scale is given, e.g. : 

    SQL> DESCRIBE WAREHOUSES;
     Name                                      Null?    Type
     ----------------------------------------- -------- ----------------------------
     WAREHOUSE_ID                                       NUMBER(6)
     WAREHOUSE_NAME                                     VARCHAR2(35)
     LOCATION_ID                                        NUMBER(4)

This works fine: 

    Robin@asgard02 ~/cp> kafka-avro-console-consumer \
                            --bootstrap-server localhost:9092 \
                            --property schema.registry.url=http://localhost:8081 \
                            --topic ora-soe-03-WAREHOUSES --from-beginning --max-messages 1| jq '.'
    {
      "WAREHOUSE_ID": {
        "int": 712
      },
      "WAREHOUSE_NAME": {
        "string": "bFLB2"
      },
      "LOCATION_ID": {
        "int": 1564
      }
    }
    Processed a total of 1 messages
