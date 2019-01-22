+++
author = "Robin Moffatt"
categories = ["jmx", "kafka", "docker"]
date = 2018-09-17T15:29:48Z
description = ""
draft = false
image = "/images/2018/09/2018-09-17_17-38-42.png"
slug = "accessing-kafka-docker-container-jmx-from-host"
tag = ["jmx", "kafka", "docker"]
title = "Accessing Kafka Docker containers' JMX from host"

+++

_See also [docs](https://docs.confluent.io/current/installation/docker/docs/operations/monitoring.html)._

To help future Googlers… with the Confluent docker images for Kafka, KSQL, Kafka Connect, etc, if you want to access JMX metrics from within, you just need to pass two environment variables: `<x>_JMX_HOSTNAME` and `<x>_JMX_PORT`, prefixed by a component name. Here it's illustrated for KSQL: 

* `KSQL_JMX_HOSTNAME` - the hostname/IP of the *host* machine. This is used by the JMX client to connect back into JMX, so must be accessible from the _host machine running the JMX client_. If you're just running your JMX client locally on the Docker host, you can set this to `127.0.0.1`
* `KSQL_JMX_PORT` - a port on which you want to access the metrics. Make sure you expose this port through Docker

For Kafka, Kafka Connect, and Zookeeper use the prefix `KAFKA`, i.e.

* `KAFKA_JMX_HOSTNAME`
* `KAFKA_JMX_PORT`

TODO: Confirm values to use for Schema Registry and REST Proxy

If you don't set `<x>_JMX_HOSTNAME` then the Docker launch script uses the _host details of the container_, which results in connectivity problems. 

From [jmxterm](http://wiki.cyclopsgroup.org/jmxterm/) you'll get errors like: 

```
$ java -jar ~/Downloads/jmxterm-1.0.0-uber.jar
Welcome to JMX terminal. Type "help" for available commands.
$>open localhost:18088
#RuntimeIOException: Runtime IO exception: Connection refused to host: 192.168.144.4; nested exception is:
        java.net.ConnectException: Operation timed out (Connection timed out)
```

or 

```
$ java -jar ~/Downloads/jmxterm-1.0.0-uber.jar
Welcome to JMX terminal. Type "help" for available commands.
$>open localhost:18088
#RuntimeIOException: Runtime IO exception: Failed to retrieve RMIServer stub: javax.naming.CommunicationException [Root exception is java.rmi.ConnectIOException: error during JRMP connection establishment; nested exception is:
        java.io.EOFException]
```

For JConsole it'll just hang/timeout, or appear to work but disconnected.

To validate your connection easily you can use `jmxterm`: 

{{< highlight shell >}}
$ echo 'domains' | java -jar ~/Downloads/jmxterm-1.0.0-uber.jar  -l localhost:18088 -n -v silent
JMImplementation
com.sun.management
java.lang
java.nio
java.util.logging
kafka.connect
kafka.consumer
kafka.producer

$ echo 'domains' | java -jar ~/Downloads/jmxterm-1.0.0-uber.jar  -l localhost:18086 -n -v silent
JMImplementation
com.sun.management
java.lang
java.nio
java.util.logging
log4j
org.apache.ZooKeeperService

{{< /highlight >}}

Read more about [jxmterm here](https://rmoff.net/2018/09/19/exploring-jmx-with-jmxterm/)