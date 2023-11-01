+++
categories = ["Apache Kafka", "schema registry", "kafka-avro-console-producer"]
date = 2016-12-02T11:35:57Z
description = ""
draft = false
slug = "kafka-schema-registry-error-registering-avro-schema-io-confluent-kafka-schemaregistry-client-rest-exceptions-restclientexception"
title = "kafka-avro-console-producer - Error registering Avro schema / io.confluent.kafka.schemaregistry.client.rest.exceptions.RestClientException"

+++

By default, the `kafka-avro-console-producer` will assume that the schema registry is on port 8081, and happily connect to it. Unfortunately, this can lead to some weird errors if another process happens to be listening on port 8081 _already_!

```
[oracle@bigdatalite tmp]$ kafka-avro-console-producer \
>  --broker-list localhost:9092 --topic kudu_test \
>  --property value.schema='{"type":"record","name":"myrecord","fields":[{"name":"id","type":"int"},{"name":"random_field", "type": "string"}]}'

{"id": 999, "random_field": "foo"}

org.apache.kafka.common.errors.SerializationException: Error registering Avro schema: {"type":"record","name":"myrecord","fields":[{"name":"id","type":"int"},{"name":"random_field","type":"string"}]}
Caused by: io.confluent.kafka.schemaregistry.client.rest.exceptions.RestClientException: Unexpected character ('<' (code 60)): expected a valid value (number, String, array, object, 'true', 'false' or 'null')
 at [Source: sun.net.www.protocol.http.HttpURLConnection$HttpInputStream@4e0ae11f; line: 1, column: 2]; error code: 50005
        at io.confluent.kafka.schemaregistry.client.rest.RestService.sendHttpRequest(RestService.java:170)
        at io.confluent.kafka.schemaregistry.client.rest.RestService.httpRequest(RestService.java:187)
        at io.confluent.kafka.schemaregistry.client.rest.RestService.registerSchema(RestService.java:238)
        at io.confluent.kafka.schemaregistry.client.rest.RestService.registerSchema(RestService.java:230)
        at io.confluent.kafka.schemaregistry.client.rest.RestService.registerSchema(RestService.java:225)
        at io.confluent.kafka.schemaregistry.client.CachedSchemaRegistryClient.registerAndGetId(CachedSchemaRegistryClient.java:59)
        at io.confluent.kafka.schemaregistry.client.CachedSchemaRegistryClient.register(CachedSchemaRegistryClient.java:91)
        at io.confluent.kafka.serializers.AbstractKafkaAvroSerializer.serializeImpl(AbstractKafkaAvroSerializer.java:72)
        at io.confluent.kafka.formatter.AvroMessageReader.readMessage(AvroMessageReader.java:158)
        at kafka.tools.ConsoleProducer$.main(ConsoleProducer.scala:55)
        at kafka.tools.ConsoleProducer.main(ConsoleProducer.scala)
```

Solution? Make sure you specify the schema URL when you launch the producer, using `--property schema.registry.url=http://localhost:18081` : 

```
kafka-avro-console-producer \
--broker-list localhost:9092 --topic kudu_test \
--property value.schema='{"type":"record","name":"myrecord","fields":[{"name":"id","type":"int"},{"name":"random_field", "type": "string"}]}' \
--property schema.registry.url=http://localhost:18081
```
