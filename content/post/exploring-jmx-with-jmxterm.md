+++
categories = ["kafka", "ksql", "jmx", "jmxterm"]
date = 2018-09-19T08:11:00Z
description = ""
draft = false
image = "/images/2018/09/IMG_5520.jpg"
slug = "exploring-jmx-with-jmxterm"
tag = ["kafka", "ksql", "jmx", "jmxterm"]
title = "Exploring JMX with jmxterm"

+++

* Check out the [jmxterm repository](https://github.com/jiaqi/jmxterm/)
* Download jmxterm from [https://docs.cyclopsgroup.org/jmxterm](https://docs.cyclopsgroup.org/jmxterm)

<!--more-->


Launch: 

    java -jar ~/Downloads/jmxterm-1.0.0-uber.jar --url localhost:30002

You can pass the jmx host/port directly, or use the `open` command once jmxterm launches. 

Once connected, use `domains` to list available domains

    $>domains
    #following domains are available
    JMImplementation
    com.sun.management
    io.confluent.ksql.metrics
    io.confluent.rest
    java.lang
    java.nio
    java.util.logging
    kafka.admin.client
    kafka.consumer
    kafka.producer
    kafka.streams
    [...]

Switch to a particular domain: 

    $>domain io.confluent.ksql.metrics
    #domain is set to io.confluent.ksql.metrics

List the available MBeans in a the selected domain (you can also run this without choosing a `domain` first, to see every MBean, but it's a long list): 

    $>beans
    #domain = io.confluent.ksql.metrics:
    io.confluent.ksql.metrics:id=_confluent-ksql-confluent_rmoff_01query_CSAS_GOOD_RATINGS_0-11,key=ratings,type=consumer-metrics
    io.confluent.ksql.metrics:id=_confluent-ksql-confluent_rmoff_01query_CSAS_GOOD_RATINGS_0-6904389f-5901-4b89-b331-53a6933d8ce0-StreamThread-4-producer,key=good_ratings,type=producer-metrics
    io.confluent.ksql.metrics:type=kafka-metrics-count
    io.confluent.ksql.metrics:type=ksql-engine-query-stats

Switch to a particular bean of interest: 

    $>bean io.confluent.ksql.metrics:type=ksql-engine-query-stats
    #bean is set to io.confluent.ksql.metrics:type=ksql-engine-query-stats

List the available attributes: 

    $>info
    #mbean = io.confluent.ksql.metrics:type=ksql-engine-query-stats
    #class name = org.apache.kafka.common.metrics.JmxReporter$KafkaMbean
    # attributes
    %0   - bytes-consumed-total (double, r)
    %1   - error-rate (double, r)
    %2   - messages-consumed-avg (double, r)
    %3   - messages-consumed-max (double, r)
    %4   - messages-consumed-min (double, r)
    %5   - messages-consumed-per-sec (double, r)
    %6   - messages-consumed-total (double, r)
    %7   - messages-produced-per-sec (double, r)
    %8   - num-active-queries (double, r)
    %9   - num-idle-queries (double, r)
    %10  - num-persistent-queries (double, r)
    #there's no operations
    #there's no notifications
    $>

Read the value of an attribute: 

    $>get messages-consumed-total
    #mbean = io.confluent.ksql.metrics:type=ksql-engine-query-stats:
    messages-consumed-total = 251329.0;

Note that jmxterm support tab-completion for all the commands, which makes it much easier to use. 
