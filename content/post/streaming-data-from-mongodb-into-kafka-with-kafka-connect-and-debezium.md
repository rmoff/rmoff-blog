+++
author = "Robin Moffatt"
categories = ["mongodb", "debezium", "kafka connect", "apache kafka", "replica set"]
date = 2018-03-27T18:52:00Z
description = ""
draft = false
image = "/images/2018/03/IMG_8714.JPG"
slug = "streaming-data-from-mongodb-into-kafka-with-kafka-connect-and-debezium"
tags = ["mongodb", "debezium", "kafka connect", "apache kafka", "replica set"]
title = "Streaming Data from MongoDB into Kafka with Kafka Connect and Debezium"

+++

_Disclaimer: I am not a MongoDB person. These steps may or may not be appropriate and proper. But they worked for me :) Feel free to post in comments if I'm doing something wrong_

### MongoDB config - enabling replica sets

For Debezium to be able to stream changes from MongoDB, Mongo needs to have replication configured:

Docs: [Replication](https://docs.mongodb.com/manual/replication/) / [Convert a Standalone to a Replica Set](https://docs.mongodb.com/manual/tutorial/convert-standalone-to-replica-set/)

Stop Mongo:

```
rmoff@proxmox01 ~> sudo service mongod stop
```

Add replica set config to `/etc/mongod.conf`:

```
[source,yaml]
----
replication:
   replSetName: mongo01
----
```

Optionally, also set the bindIp so that it listens on all IPs, not just loopback:

```
[source,yaml]
----
net:
  bindIp: 0.0.0.0
----
```

Start Mongo, and initiate the replica set:

```
rmoff@proxmox01 ~> sudo service mongod start
rmoff@proxmox01 ~> mongo --host 127.0.0.1:27017
MongoDB shell version v3.6.3
connecting to: mongodb://127.0.0.1:27017/
> rs.initiate()
{
        "info2" : "no configuration specified. Using a default configuration for the set",
        "me" : "127.0.0.1:27017",
        "ok" : 1,
        "operationTime" : Timestamp(1520428346, 1),
        "$clusterTime" : {
                "clusterTime" : Timestamp(1520428346, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        }
}
mongo01:PRIMARY>
```

Check `/var/log/mongodb/mongod.log`, should see replica set config success and oplog get created:

```
2018-03-07T13:12:26.007+0000 I REPL     [conn1] replSetInitiate admin command received from client
2018-03-07T13:12:26.007+0000 I REPL     [conn1] creating replication oplog of size: 2864MB...
2018-03-07T13:12:26.048+0000 I REPL     [conn1] New replica set config in use: { _id: "mongo01", version: 1, protocolVersion: 1, members: [ { _id: 0, host: "127.0.0.1:27017", arbiterOnly: false, buildIndexes: true, hidden: false, priority: 1.0, tags: {}, slaveDelay: 0, votes: 1 } ], settings: { chainingAllowed: true, heartbeatIntervalMillis: 2000, heartbeatTimeoutSecs: 10, electionTimeoutMillis: 10000, catchUpTimeoutMillis: -1, catchUpTakeoverDelayMillis: 30000, getLastErrorModes: {}, getLastErrorDefaults: { w: 1, wtimeout: 0 }, replicaSetId: ObjectId('5a9fe53ac81eed28a3bf207a') } }
```

### Setting up Debezium to stream changes from MongoDB into Apache Kafka

There's a [detailed explanation of how Debezium CDC works with Debezium](http://debezium.io/docs/connectors/mongodb/) on the Debezium doc site.

#### Install Debezium Mongo plugin

```
mkdir ~/connect-jars
cd ~/connect-jars/
wget https://repo1.maven.org/maven2/io/debezium/debezium-connector-mongodb/0.7.4/debezium-connector-mongodb-0.7.4-plugin.tar.gz
tar -xf debezium-connector-mongodb-0.7.4-plugin.tar.gz
```

Add the plugin folder (e.g. `/home/rmoff/connect-jars`) to the Connect worker config file (e.g. `./etc/schema-registry/connect-avro-distributed.properties`)

```
plugin.path=share/java,/home/rmoff/connect-jars
```

#### Configure Debezium MongoDB connector

Config file (`/home/rmoff/connect-config/mongodb.json`):

```
{
  "name": "mongodb-connector",
  "config": {
    "connector.class": "io.debezium.connector.mongodb.MongoDbConnector",
    "mongodb.hosts": "rs0/localhost:27017",
    "mongodb.name": "ubnt",
    "database.whitelist": "ace"
  }
}
```

Load connector:

```
curl -i -X POST -H "Accept:application/json" \
    -H  "Content-Type:application/json" http://localhost:8084/connectors/ \
    -d @/home/rmoff/connect-config/mongodb.json
```

Check Connect worker stdout:

```
[2018-03-07 13:33:35,303] INFO Beginning initial sync of 'mongo01' at {sec=1520429608, ord=1, h=-4885990198351632203} (io.debezium.connector.mongodb.Replicator:247)
[2018-03-07 13:33:35,324] INFO Preparing to use 1 thread(s) to sync 39 collection(s): mongo01.ace.wlangroup, mongo01.ace.extension, mongo01.ace.stat, mongo01.ace.networkconf, mongo01.ace.voucher, mongo01.ace.hotspotpackage, mongo01.ace.hotspotop, mongo01.ace.alarm, mongo01.ace.heatmap, mongo01.ace.map, mongo01.ace.dpigroup, mongo01.ace.setting, mongo01.ace.usergroup, mongo01.ace.verification, mongo01.ace.payment, mongo01.ace.heatmappoint, mongo01.ace.scheduletask, mongo01.ace.guest, mongo01.ace.admin, mongo01.ace.radiusprofile, mongo01.ace.portalfile, mongo01.ace.mediafile, mongo01.ace.device, mongo01.ace.firewallgroup, mongo01.ace.site, mongo01.ace.task, mongo01.ace.dynamicdns, mongo01.ace.portconf, mongo01.ace.wlanconf, mongo01.ace.rogue, mongo01.ace.routing, mongo01.ace.firewallrule, mongo01.ace.event, mongo01.ace.hotspot2conf, mongo01.ace.broadcastgroup, mongo01.ace.portforward, mongo01.ace.privilege, mongo01.ace.account, mongo01.ace.user (io.debezium.connector.mongodb.Replicator:276)
[2018-03-07 13:33:35,326] INFO Creating thread debezium-mongodbconnector-ubnt-copy-mongo01-0 (io.debezium.util.Threads:247)
[2018-03-07 13:33:35,327] INFO Starting initial sync of 'mongo01.ace.wlangroup' (io.debezium.connector.mongodb.Replicator:286)
```

Check topics:

```
rmoff@proxmox01 ~/connect-jars> kafka-topics --zookeeper localhost:2181 --list
ubnt.ace.admin
ubnt.ace.alarm
ubnt.ace.broadcastgroup
ubnt.ace.device
ubnt.ace.dpigroup
ubnt.ace.event
ubnt.ace.guest
ubnt.ace.map
ubnt.ace.networkconf
ubnt.ace.portconf
ubnt.ace.portforward
ubnt.ace.privilege
ubnt.ace.rogue
ubnt.ace.scheduletask
ubnt.ace.setting
ubnt.ace.site
ubnt.ace.user
ubnt.ace.usergroup
ubnt.ace.wlanconf
ubnt.ace.wlangroup
```

Check data

```$ kafka-avro-console-consumer  --bootstrap-server localhost:9092 --property schema.registry.url=http://localhost:8081 --topic ubnt.ace.device --from-beginning | jq '.'
{
  "after": {\"_id\" : {\"$oid\" : \"58385328e4b001431e4e497a\"},\"adopted\" : true,\"board_rev\" : 18,\"cfgversion\" : \"xxxxxxxxxxxxx\",\"config_network\" : {\"ip\" : \"192.168.10.12\",\"type\" : \"dhcp\"},\"ethernet_table\" : [{\"mac\" : \"xx:xx:xx:xx:xx:xx\",\"num_port\" : 1,\"name\" : \"eth0\"}],\"fw_caps\" : 75,\"has_eth1\" : false,\"has_speaker\" : false,\"inform_ip\" : \"192.168.10.172\",\"inform_url\" : \"http://192.168.10.172:8080/inform\",\"ip\" : \"192.168.10.68\",\"led_override\" : \"on\",\"mac\" : \"xx:xx:xx:xx:xx:xx\",\"model\" : \"BZ2\",\"name\" : \"Unifi AP - Study\",\"port_table\" : [],\"radio_table\" : [{\"radio\" : \"ng\",\"min_txpower\" : 5,\"max_txpower\" : 23,\"builtin_antenna\" : true,\"builtin_ant_gain\" : 0,\"nss\" : 2,\"name\" : \"wifi0\"}],\"serial\" : \"xxx\",\"site_id\" : \"xxx\",\"type\" : \"uap\",\"version\" : \"3.7.40.6115\",\"vwire_table\" : [],\"wifi_caps\" : 117,\"wlangroup_id_ng\" : \"xx\",\"x_authkey\" : \"xx\",\"x_fingerprint\" : \"xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:3e:39:08:45\",\"x_ssh_hostkey\" : \"xx/xx=\",\"x_ssh_hostkey_fingerprint\" : \"xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx\",\"x_vwirekey\" : \"xx\",\"map_id\" : \"xx\",\"x\" : 880.3939455186993,\"y\" : 966.2397514041841,\"locked\" : true,\"wlan_overrides\" : []}"
  },
  "patch": null,
  "source": {
    "version": {
      "string": "0.7.4"
    },
    "name": "ubnt",
    "rs": "mongo01",
    "ns": "ace.device",
```

Note that the MongoDB document is not as fields in the Kafka message, but instead everything is in the payload as a `string` field as escaped JSON.

Debezium does provide a [Single Message Transform (SMT) to flatten the MongoDB record](http://debezium.io/docs/configuration/mongodb-event-flattening/) out like this, but in using it I hit a bug ([DBZ-649](https://issues.jboss.org/browse/DBZ-649)) that seems to be down to the MongoDB collection documents having different fields between documents. The reported error was `org.apache.kafka.connect.errors.DataException: <field> is not a valid field name`.

However, using KSQL's `EXTRACTJSONFIELD` you can still work with the data as-is:

```sql
ksql> CREATE STREAM DEVICE (after VARCHAR) WITH (KAFKA_TOPIC='ubnt.ace.device-07',VALUE_FORMAT='JSON');
ksql> select EXTRACTJSONFIELD(after,'$.name'),EXTRACTJSONFIELD(after,'$.ip') from device;
Unifi AP - Study | 192.168.10.68
Unifi AP - Attic | 192.168.10.67
ubnt.moffatt.me | 77.102.5.159
Unifi AP - Pantry | 192.168.10.71
```
