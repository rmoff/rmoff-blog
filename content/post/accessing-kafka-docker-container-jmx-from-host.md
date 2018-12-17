+++
author = "Robin Moffatt"
categories = ["jmx", "kafka", "docker"]
date = 2018-09-17T15:29:48Z
description = ""
draft = false
image = "/images/2018/09/2018-09-17_17-38-42.png"
slug = "accessing-kafka-docker-container-jmx-from-host"
tags = ["jmx", "kafka", "docker"]
title = "Accessing Kafka Docker containers' JMX from host"

+++

To help future Googlers… with the Confluent docker images for Kafka, KSQL, Kafka Connect, etc, if you want to access JMX metrics from within, you just need to pass two environment variables: 

* `KSQL_JMX_HOSTNAME` - the hostname/IP of the *host* machine. This is used by the JMX client to connect back into JMX, so must be accessible from the _host machine running the JMX client_. If you're just running your JMX client locally on the Docker host, you can set this to `127.0.0.1`
* `KSQL_JMX_PORT` - a port on which you want to access the metrics. Make sure you expose this port through Docker

If you don't set `KSQL_JMX_HOSTNAME` then the Docker launch script uses the _host details of the container_, which results in connectivity problems. 

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
