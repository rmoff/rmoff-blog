+++
author = "Robin Moffatt"
categories = ["influxdb", "metrics", "bash", "awk", "sed", "du", "curl", "grafana"]
date = 2016-02-27T21:05:00Z
description = ""
draft = false
image = "/images/2016/02/2016-02-27_21-01-43-1.png"
slug = "quick-and-hacky-way-to-get-any-data-you-want-into-influxdb"
tags = ["influxdb", "metrics", "bash", "awk", "sed", "du", "curl", "grafana"]
title = "Streaming data to InfluxDB from any bash command"

+++

[InfluxDB](https://influxdata.com/time-series-platform/influxdb/) is a great time series database, that's recently been rebranded as part of the "[TICK](https://influxdata.com/)" stack, including data collectors, visualisation, and ETL/Alerting. I've yet to really look at the other components, but InfluxDB alone works just great with my favourite visualisation/analysis tool for time series metrics, [Grafana](http://grafana.org/). 

Getting data into InfluxDB is easy, with many tools supporting the native InfluxDB [line input protocol](https://docs.influxdata.com/influxdb/v0.10/guides/writing_data/), and those that don't often supporting the [carbon protocol](https://docs.influxdata.com/influxdb/v0.10/write_protocols/graphite/) (from Graphite), which InfluxDB also supports ([along with others](https://docs.influxdata.com/influxdb/v0.10/write_protocols/)). So for collecting broad ranges of OS stats, for example, [collectl](http://collectl.sourceforge.net/) via carbon and nmon via [nmon2influxdb](https://github.com/adejoux/nmon2influxdb) are both viable options. 

Using the power of *nix, we can set up a hacky, but effective, way of streaming **additional** data into InfluxDB. For example, tracking the the amount of disk space used by a set of particular folders on disk can be really useful as part of system monitoring & troubleshooting. We can get the raw information easily enough at the commandline: 

```language-bash
[oracle@demo ~]$ du -s /app/oracle/biee/user_projects/domains/bi/servers/*/tmp
417764	/app/oracle/biee/user_projects/domains/bi/servers/AdminServer/tmp
2061740	/app/oracle/biee/user_projects/domains/bi/servers/bi_server1/tmp
8	/app/oracle/biee/user_projects/domains/bi/servers/obiccs1/tmp
277484	/app/oracle/biee/user_projects/domains/bi/servers/obips1/tmp
636	/app/oracle/biee/user_projects/domains/bi/servers/obis1/tmp
12	/app/oracle/biee/user_projects/domains/bi/servers/obisch1/tmp
```

By using tools like `sed` and `awk` to reformat the data and construct the InfluxDB input message, and then send it over using `curl`:

```language-bash
while [ 1 -eq 1 ]; do
        du -s /app/oracle/biee/user_projects/domains/bi/servers/*/tmp| \
        sed 's/\/app\/oracle\/biee\/user_projects\/domains\/bi\/servers\///g'| \
        sed 's/\/tmp//g'| \
        awk '{print "DiskTemp,component="$2" value="$1}'| \
        curl -i -XPOST 'http://localhost:8086/write?db=obi' --data-binary @-
        sleep 10
done
```

Note the `\` line continuation characters - the `du` pipes to `sed` (twice), then to `awk` and finally to `curl`. 

Heading over to InfluxDB's admin interface we can see the data's been received: 

![](/content/images/2016/02/2016-02-27_20-52-09.png)

And from there on into displaying it in Grafana: 

![](/content/images/2016/02/2016-02-27_20-55-10.png)

Similarly, for collecting `iotop` data, this time as a one-liner: 

```language-bash
while [ 1 -eq 1 ]; do sudo iotop -n 1 -k -qqq -o|awk '{print "io_read_kbs,pid="$1",process="$12" value="$4"\nio_write_kbs,pid="$1",process="$12" value="$6}'|curl -i -XPOST 'http://localhost:8086/write?db=io' --data-binary @-;sleep 1;done
```
![](/content/images/2016/02/2016-02-27_21-01-43.png)

Even if proper metrics collection tools like `collectl` can get this information, for point-in-time digging without needing to reconfigure and restart services, this is a handy trick to have up one's sleeve.
