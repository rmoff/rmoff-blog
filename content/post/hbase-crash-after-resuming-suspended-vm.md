+++
author = "Robin Moffatt"
categories = ["hbase", "bigdatalite", "virtualbox", "ova"]
date = 2017-01-20T09:36:00Z
description = ""
draft = false
image = "/images/2017/01/2017-01-20_09-44-02.png"
slug = "hbase-crash-after-resuming-suspended-vm"
tags = ["hbase", "bigdatalite", "virtualbox", "ova"]
title = "HBase crash after resuming suspended VM"

+++

I use [BigDataLite](http://www.oracle.com/technetwork/database/bigdata-appliance/oracle-bigdatalite-2104726.html) for a lot of my sandboxing work. This is a `OVA` provided by Oracle which can be run on VirtualBox, VMWare, etc and has the Cloudera Hadoop platform (CDH) along with all of Oracle's Big Data goodies including Big Data Discovery and Big Data Spatial and Graph (BDSG). 

Something that kept tripping me up during my work with BDSG was that HBase would become unavailable. Not being an HBase expert and simply using it as a data store for my property graph data, I wrote it off as mistakes on my part. But, the issue kept reoccuring enough for me to dig into it. 

```bash
[oracle@bigdatalite ~]$ sudo service hbase-master status;sudo service hbase-regionserver status;sudo service hbase-thrift status;sudo service zookeeper-server status
HBase master daemon is not running                         [FAILED]
hbase-regionserver is not running.
HBase thrift daemon is running                             [  OK  ]
zookeeper-server is running
```

Turns out that HBase throws its toys out when I suspend the VM. I don't know if it's the clock jumping too much, or simply a session expiring and it not exiting gracefully. I don't know if this is a VirtualBox fault, host machine (Mac), Hbase, or even Zookeeper; nor do I especially care now that I've found the cause and know to look for it whilst doing sandbox work ;-)

This is the log from the HBase master: 

```
2017-01-20 09:19:05,430 ERROR [master/bigdatalite.localdomain/127.0.0.1:60000] zookeeper.ZooKeeperWatcher: master:60000-0x159b8f3800e0014, quorum=localhost:2181, baseZNode=/hbase Received unexpected KeeperException, re-throwing exception
org.apache.zookeeper.KeeperException$SessionExpiredException: KeeperErrorCode = Session expired for /hbase/master
        at org.apache.zookeeper.KeeperException.create(KeeperException.java:127)
        at org.apache.zookeeper.KeeperException.create(KeeperException.java:51)
        at org.apache.zookeeper.ZooKeeper.getData(ZooKeeper.java:1151)
        at org.apache.hadoop.hbase.zookeeper.RecoverableZooKeeper.getData(RecoverableZooKeeper.java:359)
        at org.apache.hadoop.hbase.zookeeper.ZKUtil.getData(ZKUtil.java:623)
        at org.apache.hadoop.hbase.zookeeper.MasterAddressTracker.getMasterAddress(MasterAddressTracker.java:148)
        at org.apache.hadoop.hbase.master.ActiveMasterManager.stop(ActiveMasterManager.java:267)
        at org.apache.hadoop.hbase.master.HMaster.stopServiceThreads(HMaster.java:1150)
        at org.apache.hadoop.hbase.regionserver.HRegionServer.run(HRegionServer.java:1092)
        at java.lang.Thread.run(Thread.java:745)
2017-01-20 09:19:05,431 ERROR [master/bigdatalite.localdomain/127.0.0.1:60000] master.ActiveMasterManager: master:60000-0x159b8f3800e0014, quorum=localhost:2181, baseZNode=/hbase Error deleting our own master address node
org.apache.zookeeper.KeeperException$SessionExpiredException: KeeperErrorCode = Session expired for /hbase/master
        at org.apache.zookeeper.KeeperException.create(KeeperException.java:127)
        at org.apache.zookeeper.KeeperException.create(KeeperException.java:51)
        at org.apache.zookeeper.ZooKeeper.getData(ZooKeeper.java:1151)
        at org.apache.hadoop.hbase.zookeeper.RecoverableZooKeeper.getData(RecoverableZooKeeper.java:359)
        at org.apache.hadoop.hbase.zookeeper.ZKUtil.getData(ZKUtil.java:623)
        at org.apache.hadoop.hbase.zookeeper.MasterAddressTracker.getMasterAddress(MasterAddressTracker.java:148)
        at org.apache.hadoop.hbase.master.ActiveMasterManager.stop(ActiveMasterManager.java:267)
        at org.apache.hadoop.hbase.master.HMaster.stopServiceThreads(HMaster.java:1150)
        at org.apache.hadoop.hbase.regionserver.HRegionServer.run(HRegionServer.java:1092)
        at java.lang.Thread.run(Thread.java:745)
2017-01-20 09:19:05,432 INFO  [master/bigdatalite.localdomain/127.0.0.1:60000] hbase.ChoreService: Chore service for: bigdatalite.localdomain,60000,1484898484413_splitLogManager_ had [] on shutdown
2017-01-20 09:19:05,432 INFO  [master/bigdatalite.localdomain/127.0.0.1:60000] flush.MasterFlushTableProcedureManager: stop: server shutting down.
2017-01-20 09:19:05,432 INFO  [master/bigdatalite.localdomain/127.0.0.1:60000] ipc.RpcServer: Stopping server on 60000
2017-01-20 09:19:05,434 INFO  [RpcServer.listener,port=60000] ipc.RpcServer: RpcServer.listener,port=60000: stopping
2017-01-20 09:19:05,440 INFO  [RpcServer.responder] ipc.RpcServer: RpcServer.responder: stopped
2017-01-20 09:19:05,440 INFO  [RpcServer.responder] ipc.RpcServer: RpcServer.responder: stopping
2017-01-20 09:19:20,449 ERROR [master/bigdatalite.localdomain/127.0.0.1:60000] zookeeper.RecoverableZooKeeper: ZooKeeper delete failed after 4 attempts
2017-01-20 09:19:20,449 WARN  [master/bigdatalite.localdomain/127.0.0.1:60000] regionserver.HRegionServer: Failed deleting my ephemeral node
org.apache.zookeeper.KeeperException$SessionExpiredException: KeeperErrorCode = Session expired for /hbase/rs/bigdatalite.localdomain,60000,1484898484413
        at org.apache.zookeeper.KeeperException.create(KeeperException.java:127)
        at org.apache.zookeeper.KeeperException.create(KeeperException.java:51)
        at org.apache.zookeeper.ZooKeeper.delete(ZooKeeper.java:873)
        at org.apache.hadoop.hbase.zookeeper.RecoverableZooKeeper.delete(RecoverableZooKeeper.java:178)
        at org.apache.hadoop.hbase.zookeeper.ZKUtil.deleteNode(ZKUtil.java:1236)
        at org.apache.hadoop.hbase.zookeeper.ZKUtil.deleteNode(ZKUtil.java:1225)
        at org.apache.hadoop.hbase.regionserver.HRegionServer.deleteMyEphemeralNode(HRegionServer.java:1431)
        at org.apache.hadoop.hbase.regionserver.HRegionServer.run(HRegionServer.java:1100)
        at java.lang.Thread.run(Thread.java:745)
2017-01-20 09:19:20,511 INFO  [master/bigdatalite.localdomain/127.0.0.1:60000] regionserver.HRegionServer: stopping server bigdatalite.localdomain,60000,1484898484413; zookeeper connection closed.
2017-01-20 09:19:20,511 INFO  [master/bigdatalite.localdomain/127.0.0.1:60000] regionserver.HRegionServer: master/bigdatalite.localdomain/127.0.0.1:60000 exiting
```

The solution, crude as it is, is just to turn it off and on again - HBase, that is: 

    sudo service hbase-master restart;sudo service hbase-regionserver restart;sudo service hbase-thrift restart

Happy days. 

And if anyone can tell me the proper resolution to this (other than not suspending my VM), I'm all ears!