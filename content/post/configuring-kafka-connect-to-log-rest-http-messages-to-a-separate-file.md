+++
categories = ["Apache Kafka", "log4j", "kafka connect"]
date = 2017-06-12T15:28:15Z
description = ""
draft = false
image = "/images/2017/05/1__screen.png"
slug = "configuring-kafka-connect-to-log-rest-http-messages-to-a-separate-file"
title = "Configuring Kafka Connect to log REST HTTP messages to a separate file"

+++

Kafka's Connect API is a wondrous way of easily bringing data in and out of Apache Kafka without having to write a line of code. By choosing a Connector from [the many available](https://www.confluent.io/product/connectors/), it's possible to set up and end-to-end data pipeline with just a few lines of configuration. You can configure this by hand, or you can use the [Confluent Control Center](https://www.confluent.io/product/control-center/), for both management and monitoring: 

![](/images/2017/05/Control_Center.png)

BUT ... there are times when not all goes well - perhaps your source has gone offline, or one of your targets has been misconfigured. What then? Well of course, it's diagnostics time! And for diagnostics, you need logs. When you launch Kafka Connect it logs everything to `stdout`, and this output includes content from the Kafka Connect [REST interface](http://docs.confluent.io/current/connect/restapi.html). This REST interface is for configuration and control of the connectors (status/pause/resume) - and whilst Control Center is being used on the Connect configuration screens, you'll notice that the REST interface gets polled frequently - every couple of seconds, with a greater number of requests the more connectors you have. All of this goes into the log: 


![](/images/2017/05/1__screen-1.png)

This logging is great, but it does make it tricky to spot errors in the Connect log that you might get as a result of, say, misconfiguring a connector. 

![](/images/2017/05/1__screen_and_3__oracle_vbgeneric____ssh_-1.png)


To filter out REST logs from Connect's `stdout` into their own file, we'll add some manual overrides to the configuration for the log4j logging system. You can validate which log4j configuration is in use by examining `ps -ef` and looking at the value of `-Dlog4j.configuration`:

![](/images/2017/05/1__screen-2.png)

Add the following to `etc/kafka/connect-log4j.properties`. 
```bash

log4j.appender.kafkaConnectRestAppender=org.apache.log4j.DailyRollingFileAppender
log4j.appender.kafkaConnectRestAppender.DatePattern='.'yyyy-MM-dd-HH
log4j.appender.kafkaConnectRestAppender.File=${kafka.logs.dir}/connect-rest.log
log4j.appender.kafkaConnectRestAppender.layout=org.apache.log4j.PatternLayout
log4j.appender.kafkaConnectRestAppender.layout.ConversionPattern=[%d] %p %m (%c)%n

log4j.logger.org.apache.kafka.connect.runtime.rest=INFO, kafkaConnectRestAppender
log4j.additivity.org.apache.kafka.connect.runtime.rest=false
```

As a result of this, you get a cleaner Connect `stdout`, and a new file in the Kafka logs folder with all of the REST logs on their own. Now you have no excuses for not examining the logs when troubleshooting Connect!
