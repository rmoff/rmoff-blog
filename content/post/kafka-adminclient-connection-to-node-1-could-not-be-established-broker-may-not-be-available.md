+++
categories = ["Apache Kafka", "adminclient", "networking"]
date = 2018-01-03T11:26:00Z
description = ""
draft = false
image = "/images/2018/01/cow-and-calf.jpg"
slug = "kafka-adminclient-connection-to-node-1-could-not-be-established-broker-may-not-be-available"
title = "Kafka - AdminClient - Connection to node -1 could not be established. Broker may not be available"

+++


----
**See also [Kafka Listeners - Explained](/2018/08/02/kafka-listeners-explained/)**

----


A short post to help Googlers. On a single-node sandbox Apache Kafka / Confluent Platform installation, I was getting this error from Schema Registry, Connect, etc: 

    WARN [AdminClient clientId=adminclient-3] Connection to node -1 could not be established. Broker may not be available. (org.apache.kafka.clients.NetworkClient)

KSQL was throwing a similar error: 

    KSQL cannot initialize AdminCLient.

I had correctly set the machine's hostname in my Kafka `server.properties`: 

    listeners=PLAINTEXT://proxmox01.moffatt.me:9092

but in Schema Registry, Connect etc I had not, and so they were using the default (`localhost`). The [`AdminClient`](https://kafka.apache.org/0110/javadoc/index.html?org/apache/kafka/clients/admin/AdminClient.html) bit comes in because when they launch each creates its own internal topics. 

Based on my `/etc/hosts` we can see `localhost` has a different IP from the hostname (`proxmox01`): 

```
rmoff@proxmox01 ~> cat /etc/hosts
127.0.0.1 localhost.localdomain localhost
192.168.10.250 proxmox01.moffatt.me proxmox01 
```

Thus, Kafka was listening on one IP (192.168.10.250): 

```
rmoff@proxmox01 ~> sudo netstat -plnt|grep 9092
tcp6       0      0 192.168.10.250:9092     :::*                    LISTEN      30345/java
```

But Schema Registry and Kafka Connect were trying (and failing) to connect to it on another (`localhost` → `127.0.0.1`). With the appropriate files fixed (`connect-avro-distributed.properties`, `schema-registry.properties`) all was well with the world!

---

I also hit a hostname/networking related error earlier in this process, which stopped Kafka launching entirely: 

    kafka.common.KafkaException: Socket server failed to bind to proxmox01.moffatt.me:9092: Cannot assign requested address.

Turns out my `/etc/hosts` was fubar - it had the wrong IP address listed for the hostname. Instead of 

    192.168.10.250 proxmox01.moffatt.me proxmox01 

it had

    192.168.1.250 proxmox01.moffatt.me proxmox01 

which was wrong. Fixing this solved the problem.
