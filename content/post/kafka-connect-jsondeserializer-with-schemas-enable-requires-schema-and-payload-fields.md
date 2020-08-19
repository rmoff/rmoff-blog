+++
categories = ["kafka connect", "JsonDeserializer"]
date = 2017-09-06T12:00:25Z
description = ""
draft = false
slug = "kafka-connect-jsondeserializer-with-schemas-enable-requires-schema-and-payload-fields"
tag = ["kafka connect", "JsonDeserializer"]
title = "Kafka Connect - JsonDeserializer with schemas.enable requires \"schema\" and \"payload\" fields"

+++

An error that I see coming up frequently in the Kafka Connect community (e.g. [mailing list](https://groups.google.com/forum/#!forum/confluent-platform), [Slack group](https://slackpass.io/confluentcommunity), [StackOverflow](https://stackoverflow.com/questions/tagged/apache-kafka-connect)) is:

    JsonDeserializer with schemas.enable requires "schema" and "payload" fields and may not contain additional fields

or

    No fields found using key and value schemas for table: foo-bar

You can see an explanation, and solution, for the issue in my StackOverflow answer here: https://stackoverflow.com/a/45940013/350613

If you're using `schemas.enable` in the Connector configuration, you must have `schema` and `payload` as the root-level elements of your JSON message (
Which is pretty much verbatim what the error says 😁), like this: 

```JSON
{
    "schema": {
        "type": "struct",
        "fields": [{
            "type": "int32",
            "optional": true,
            "field": "c1"
        }, {
            "type": "string",
            "optional": true,
            "field": "c2"
        }, {
            "type": "int64",
            "optional": false,
            "name": "org.apache.kafka.connect.data.Timestamp",
            "version": 1,
            "field": "create_ts"
        }, {
            "type": "int64",
            "optional": false,
            "name": "org.apache.kafka.connect.data.Timestamp",
            "version": 1,
            "field": "update_ts"
        }],
        "optional": false,
        "name": "foobar"
    },
    "payload": {
        "c1": 10000,
        "c2": "bar",
        "create_ts": 1501834166000,
        "update_ts": 1501834166000
    }
}
```

So either make sure your JSON message adheres to this format, or tell the JSON Converter not to try and fetch a schema, by setting the following in the Connector config:

    "value.converter.schemas.enable": "false"
