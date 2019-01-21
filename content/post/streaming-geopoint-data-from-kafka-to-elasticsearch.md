+++
author = "Robin Moffatt"
categories = ["elasticsearch", "kafka", "kafkaconnect", "geopoint"]
date = 2018-10-05T15:22:51Z
description = ""
draft = false
image = "/images/2018/10/IMG_5972.jpg"
slug = "streaming-geopoint-data-from-kafka-to-elasticsearch"
tag = ["elasticsearch", "kafka", "kafkaconnect", "geopoint"]
title = "Streaming geopoint data from Kafka to Elasticsearch"

+++

Using the [Elasticsearch Kafka Connect connector](https://www.confluent.io/connector/kafka-connect-elasticsearch/) to stream events from a Kafka topic to Elasticsearch. 

<!--more-->


```
curl -X "POST" "http://kafka-connect:8083/connectors/" \
     -H "Content-Type: application/json" \
     -d '{
  "name": "es_sink_ATM_POSSIBLE_FRAUD",
  "config": {
    "topics": "ATM_POSSIBLE_FRAUD",
    "key.converter": "org.apache.kafka.connect.storage.StringConverter",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter.schemas.enable": false,
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "key.ignore": "true",
    "schema.ignore": "true",
    "type.name": "type.name=kafkaconnect",
    "topic.index.map": "ATM_POSSIBLE_FRAUD:atm_possible_fraud",
    "connection.url": "http://elasticsearch:9200"
  }
}'
```

Dynamic mapping setup in Elasticsearch (before running the Connector) to force columns to a given type: 

```
curl -XPUT "http://elasticsearch:9200/_template/kafkaconnect/" -H 'Content-Type: application/json' -d'
{
  "index_patterns": "*",
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "_default_": {
      "dynamic_templates": [
        {
          "dates": {
            "match": "*TIMESTAMP",
            "mapping": {
              "type": "date"
            }
          }
        },
        {
          "geopoint": {
            "match": "*LOCATION",
            "mapping": {
              "type": "geo_point"
            }
          }
        },
        {
          "geopoint2": {
            "match": "location",
            "mapping": {
              "type": "geo_point"
            }
          }
        },
        {
          "non_analysed_string_template": {
            "match": "account_id, atm, transaction_id",
            "match_mapping_type": "string",
            "mapping": {
              "type": "keyword"
            }
          }
        }
      ]
    }
  }
}'
```

Sample JSON message from Kafka: (pretty-printed)

```
{
  "ACCOUNT_ID": "a898",
  "TXN1_TIMESTAMP": 1538733229153,
  "TXN2_TIMESTAMP": 1538733200285,
  "TXN1_LOCATION": {
    "LON": -122.4026113,
    "LAT": 37.7911278
  },
  "TXN2_LOCATION": {
    "LON": -121.4943199,
    "LAT": 38.5320738
  },
  "TXN1_AMOUNT": 400,
  "TXN2_AMOUNT": 50,
  "DISTANCE_BETWEEN_TXNS": 114.42848872962888,
  "MS_DIFFERENCE": -28868
}
```

Note that the case of all columns is uppercase which causes problems trying to stream this to Elasticsearch. Kafka Connect worker log shows: 

    WARN Failed to execute batch 5560 of 19 records with attempt 2/6, will attempt retry after 111 ms. Failure reason: Bulk request failed: [{"type":"mapper_parsing_exception","reason":"failed to parse","caused_by":{"type":"parse_exception","reason":"field must be either [lat], [lon] or [geohash]"}}

Taking the JSON message from the Kafka topic and manually sending it to Elasticsearch replicates the probem: 

    curl -XPOST "http://elasticsearch:9200/atm_possible_fraud/kafkaconnect" -H 'Content-Type: application/json' -d'
    {"ACCOUNT_ID":"a898","TXN1_TIMESTAMP":1538733229153,"TXN2_TIMESTAMP":1538733200285,"TXN1_LOCATION":{"LON":-122.4026113,"LAT":37.7911278},"TXN2_LOCATION":{"LON":-121.4943199,"LAT":38.5320738},"TXN1_AMOUNT":400,"TXN2_AMOUNT":50,"DISTANCE_BETWEEN_TXNS":114.42848872962888,"MS_DIFFERENCE":-28868}'
    
    {
    "error": {
        "root_cause": [
        {
            "type": "parse_exception",
            "reason": "field must be either [lat], [lon] or [geohash]"
        }
        ],
        "type": "mapper_parsing_exception",
        "reason": "failed to parse",
        "caused_by": {
        "type": "parse_exception",
        "reason": "field must be either [lat], [lon] or [geohash]"
        }
    },
    "status": 400
    }

So Elasticsearch is sensitive to the _case_ of the `lat`, `lon` columns. The fix (https://www.elastic.co/guide/en/elasticsearch/reference/current/geo-point.html[per the examples here]) is to force the column names to lower case, or concatenate the lat/long into a single string): 

    curl -XPOST "http://elasticsearch:9200/atm_possible_fraud/kafkaconnect" -H 'Content-Type: application/json' -d'
    {"ACCOUNT_ID":"a898",
    "TXN1_TIMESTAMP":1538733229153,
    "TXN2_TIMESTAMP":1538733200285,
    "TXN1_LOCATION":"37.7911278,-122.4026113",
    "TXN2_LOCATION":{"lon":-121.4943199,"lat":38.5320738},
    "TXN1_AMOUNT":400,
    "TXN2_AMOUNT":50,
    "DISTANCE_BETWEEN_TXNS":114.42848872962888,
    "MS_DIFFERENCE":-28868}'

To implement this, I used KSQL to wrangle the data from a `STRUCT` (with uppercase names) to a lat/long string: 

    CREATE STREAM ATM_POSSIBLE_FRAUD_02 AS \
    SELECT CAST(X.location->lat AS STRING) + ',' + CAST(X.location->lon AS STRING) AS TXN1_LOCATION
    [...]
    FROM   ATM_TXNS X 

Now the JSON messages look like this: 

```
{
  "ACCOUNT_ID": "a182",
  "TXN1_TIMESTAMP": 1538735677504,
  "TXN2_TIMESTAMP": 1538735677528,
  "TXN1_LOCATION": "37.8002247,-122.2160293",
  "TXN2_LOCATION": "37.764931,-122.4232384",
  "TXN1_AMOUNT": 400,
  "TXN2_AMOUNT": 20,
  "DISTANCE_BETWEEN_TXNS": 18.628023818908343,
  "MS_DIFFERENCE": 24
}
```

And the Kafka Connect -> Elasticsearch pipeline works just great. Here's the resulting Elasticsearch index and sample document: 

```
{
  "atm_possible_fraud": {
    "aliases": {},
    "mappings": {
[...]
      "type.name=kafkaconnect": {
[...]
        "properties": {
          "ACCOUNT_ID": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "DISTANCE_BETWEEN_TXNS": {
            "type": "float"
          },
          "MS_DIFFERENCE": {
            "type": "long"
          },
          "TXN1_AMOUNT": {
            "type": "long"
          },
          "TXN1_LOCATION": {
            "type": "geo_point"
          },
          "TXN1_TIMESTAMP": {
            "type": "date"
          },
          "TXN2_AMOUNT": {
            "type": "long"
          },
          "TXN2_LOCATION": {
            "type": "geo_point"
          },
          "TXN2_TIMESTAMP": {
            "type": "date"
          }
        }
      }
    },
    "settings": {
      "index": {
        "creation_date": "1538735883573",
        "number_of_shards": "1",
        "number_of_replicas": "0",
        "uuid": "ppXU3hFvS-CU9kKlFaK-NA",
        "version": {
          "created": "6040299"
        },
        "provided_name": "atm_possible_fraud"
      }
    }
  }
}
```


      {
        "_index": "atm_possible_fraud",
        "_type": "type.name=kafkaconnect",
        "_id": "ATM_POSSIBLE_FRAUD2+0+7742",
        "_score": 1,
        "_source": {
          "TXN2_TIMESTAMP": 1538735677573,
          "TXN2_AMOUNT": 300,
          "ACCOUNT_ID": "a874",
          "TXN1_TIMESTAMP": 1538735677515,
          "MS_DIFFERENCE": 58,
          "TXN1_AMOUNT": 300,
          "DISTANCE_BETWEEN_TXNS": 57.33495049372549,
          "TXN1_LOCATION": "37.7923185,-122.3940464",
          "TXN2_LOCATION": "37.3540655,-122.0512763"
        }
      }
