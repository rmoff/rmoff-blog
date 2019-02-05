+++
author = "Robin Moffatt"
categories = ["lxc", "proxmox", "swapfree", "cdh", "cloudera", "yarn", "readProcMemInfoFile", "/proc/meminfo"]
date = 2016-06-15T17:52:00Z
description = ""
draft = false
image = "/images/2016/06/cdh-yarn-01-2.png"
slug = "swapfree-on-lxc-causes-problems-with-cdh-install"
tag = ["lxc", "proxmox", "swapfree", "cdh", "cloudera", "yarn", "readProcMemInfoFile", "/proc/meminfo"]
title = "Erroneous SwapFree on LXC causes problems with CDH install"

+++

Installing CDH 5.7 on Linux Containers (LXC) hosted on Proxmox 4. Everything was going well until **Cluster Setup**, and which point it failed on **Start YARN (MR2 included)**

    Completed only 0/1 steps. First failure: Failed to execute command Start on service YARN (MR2 Included)

![](/images/2016/06/cdh-yarn-01-1.png)

Log `/var/log/hadoop-yarn/hadoop-cmf-yarn-NODEMANAGER-cdh57-01-node-02.moffatt.me.log.out` showed:

    org.apache.hadoop.service.AbstractService: Service containers-monitor failed in state INITED; cause: java.lang.NumberFormatException: For input string: "18446744073709550364"
    java.lang.NumberFormatException: For input string: "18446744073709550364"

Looking down the stack trace, this came from `org.apache.hadoop.yarn.util.LinuxResourceCalculatorPlugin.readProcMemInfoFile`, which the [source code](http://grepcode.com/file/repo1.maven.org/maven2/org.apache.hadoop/hadoop-yarn-common/0.23.1/org/apache/hadoop/yarn/util/LinuxResourceCalculatorPlugin.java#LinuxResourceCalculatorPlugin.readProcMemInfoFile%28boolean%29) shows is reading `/proc/meminfo`. Looking at this file on each node showed:

```
[root@cdh57-01-node-02 hadoop-yarn]# cat /proc/meminfo
MemTotal:       24576000 kB
MemFree:        22123008 kB
MemAvailable:   22123008 kB
Buffers:               0 kB
Cached:          1194376 kB
SwapCached:            0 kB
Active:         73536116 kB
Inactive:       21903364 kB
Active(anon):   64138128 kB
Inactive(anon): 11784916 kB
Active(file):    9397988 kB
Inactive(file): 10118448 kB
Unevictable:    26832052 kB
Mlocked:        26832052 kB
SwapTotal:             0 kB
SwapFree:       18446744073709550384 kB
Dirty:              2008 kB
[...]
```

Erm ... **SwapFree** is 16 **million petabytes**???

In my LXC configuration in Proxmox I'd set zero swap, thinking that disabling swap would be a good idea. Evidently not.

![](/images/2016/06/cdh-yarn-02.png)

As soon as I updated the container Swap to 128Mb, the SwapFree looked better:

```
[root@cdh57-01-node-02 hadoop-yarn]# cat /proc/meminfo
[...]
SwapTotal:        131072 kB
SwapFree:         129840 kB
[...]
```

To apply this to all the six container nodes, I could have used the Proxmox web GUI, but took advantage of the CLI to save some time with a little bash iteration over the six container IDs (111 to 116) and the `pct set` command

```bash
for i in 11{1..6}; do pct set $i -swap 512;done
```

To check the value across each node at once, I used [pdsh](http://www.rittmanmead.com/2014/12/linux-cluster-sysadmin-parallel-command-execution-with-pdsh/) from my laptop to run the same command on each node directly:

```bash
rmoff@asgard:~> pdsh -l root -w cdh57-01-node-0[1-6] "grep Swap /proc/meminfo"|sort
cdh57-01-node-01: SwapCached:            0 kB
cdh57-01-node-01: SwapFree:         515496 kB
cdh57-01-node-01: SwapTotal:        524288 kB
cdh57-01-node-02: SwapCached:            0 kB
cdh57-01-node-02: SwapFree:         523056 kB
cdh57-01-node-02: SwapTotal:        524288 kB
cdh57-01-node-03: SwapCached:            0 kB
cdh57-01-node-03: SwapFree:         523476 kB
cdh57-01-node-03: SwapTotal:        524288 kB
cdh57-01-node-04: SwapCached:            0 kB
cdh57-01-node-04: SwapFree:         523760 kB
cdh57-01-node-04: SwapTotal:        524288 kB
cdh57-01-node-05: SwapCached:            0 kB
cdh57-01-node-05: SwapFree:         522272 kB
cdh57-01-node-05: SwapTotal:        524288 kB
cdh57-01-node-06: SwapCached:            0 kB
cdh57-01-node-06: SwapFree:         519456 kB
cdh57-01-node-06: SwapTotal:        524288 kB
```

From the Cloudera Manager **Cluster Setup** page I then clicked **Retry** and YARN came up successfully.
