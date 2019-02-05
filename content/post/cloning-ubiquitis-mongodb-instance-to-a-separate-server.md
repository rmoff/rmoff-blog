+++
author = "Robin Moffatt"
categories = ["mongodb", "ubiquiti", "ubnt", "mongorestore", "mongodump"]
date = 2018-03-27T18:45:20Z
description = ""
draft = false
image = "/images/2018/03/IMG_4011-1.JPG"
slug = "cloning-ubiquitis-mongodb-instance-to-a-separate-server"
tag = ["mongodb", "ubiquiti", "ubnt", "mongorestore", "mongodump"]
title = "Cloning Ubiquiti's MongoDB instance to a separate server"

+++

DISCLAIMER: I am not a MongoDB person (even if it is [Web Scale](http://www.mongodb-is-web-scale.com/) X-D) - below instructions may work for you, they may not. Use with care!

For some work I've been doing I wanted to access the data in Ubiquiti's Unifi controller which it stores in MongoDB. Because I didn't want to risk my actual Unifi device by changing local settings to enable remote access, and also because the version of MongoDB on it is older than ideal, I wanted to clone the data elsewhere. This article shows you how.

### Dump data from source server (unifi)

To start with, SSH to the Unifi box (in my case, it's a CloudKey). Username and password are the same as Unifi web GUI login.

Inspect local MongoDB instance (`ace` is the database that unifi uses):

```
root@UniFi-CloudKey:~# mongo localhost:27117/ace
MongoDB shell version: 2.4.10
connecting to: localhost:27117/foo
Server has startup warnings:
Wed Nov  1 19:38:11.033 [initandlisten]
Wed Nov  1 19:38:11.033 [initandlisten] ** NOTE: This is a 32 bit MongoDB binary.
Wed Nov  1 19:38:11.033 [initandlisten] **       32 bit builds are limited to less than 2GB of data (or less with --journal).
Wed Nov  1 19:38:11.033 [initandlisten] **       Note that journaling defaults to off for 32 bit and is currently off.
Wed Nov  1 19:38:11.033 [initandlisten] **       See http://dochub.mongodb.org/core/32bit
Wed Nov  1 19:38:11.034 [initandlisten]

mongo01:PRIMARY> db.getCollection('device').find({},{name:1})
{ "_id" : ObjectId("58385328e4b001431e4e497a"), "name" : "Unifi AP - Study" }
{ "_id" : ObjectId("583854cde4b001431e4e4982"), "name" : "Unifi AP - Attic" }
```

Now run [`mongodump`](https://docs.mongodb.com/manual/reference/program/mongodump/#bin.mongodump) to dump the DB to file:

```
root@UniFi-CloudKey:~# mongodump --port 27117
connected to: 127.0.0.1:27117
Wed Mar  7 12:14:05.092 all dbs
Wed Mar  7 12:14:05.098 DATABASE: ace	 to 	dump/ace
Wed Mar  7 12:14:05.103 	ace.system.indexes to dump/ace/system.indexes.bson
Wed Mar  7 12:14:05.108 		 120 objects
Wed Mar  7 12:14:05.110 	ace.account to dump/ace/account.bson
Wed Mar  7 12:14:05.112 		 0 objects
Wed Mar  7 12:14:05.112 	Metadata for ace.account to dump/ace/account.metadata.json
Wed Mar  7 12:14:05.114 	ace.admin to dump/ace/admin.bson
Wed Mar  7 12:14:05.116 		 1 objects
Wed Mar  7 12:14:05.117 	Metadata for ace.admin to dump/ace/admin.metadata.json
Wed Mar  7 12:14:05.118 	ace.alarm to dump/ace/alarm.bson
Wed Mar  7 12:14:05.124 		 152 objects
```

### Install MongoDB locally

Ref: [Install docs](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/)

```shell
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.6 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

Check version:

```shell
rmoff@proxmox01 ~> mongo --host 127.0.0.1:27017
MongoDB shell version v3.6.3
connecting to: mongodb://127.0.0.1:27017/
```

### Restore data to new server

Copy dump file from CloudKey to local server:

```
rmoff@proxmox01 ~> scp -r robin@unifi.moffatt.me:/root/dump unifi-mongodump
```

Run [`mongorestore`](https://docs.mongodb.com/manual/reference/program/mongodump/#bin.mongodump) to restore dump to local MongoDB instance:

```
rmoff@proxmox01 ~> mongorestore unifi-mongodump/

----
connected to: 127.0.0.1
Wed Mar  7 12:17:31.910 unifi-mongodump/ace/alarm.bson
Wed Mar  7 12:17:31.910         going into namespace [ace.alarm]
152 objects found
Wed Mar  7 12:17:31.912         Creating index: { name: "_id_", key: { _id: 1 }, ns: "ace.alarm" }
Wed Mar  7 12:17:31.930         Creating index: { name: "datetime_1", key: { datetime: 1 }, ns: "ace.alarm" }
Wed Mar  7 12:17:31.931         Creating index: { name: "archived_1", key: { archived: 1 }, ns: "ace.alarm" }
Wed Mar  7 12:17:31.932 unifi-mongodump/ace/radiusprofile.bson
[...]
----
```

Done!

Using [Robo 3T](https://www.robomongo.org/) (formerly Robomongo) it's easy to explore the data in the restored instance: 

![](/images/2018/03/mongo01.png)
