+++
author = "Robin Moffatt"
categories = ["obiee", "dms", "metrics", "jmanage", "jmx"]
date = 2016-02-26T17:54:54Z
description = ""
draft = false
image = "/images/2016/02/metrics05.png"
slug = "visualising-obiee-dms-metrics-over-the-years"
tags = ["obiee", "dms", "metrics", "jmanage", "jmx"]
title = "Visualising OBIEE DMS Metrics over the years"

+++

It struck me today when I was writing my most recent blog over at [Rittman Mead](http://ritt.md/obi-dms) that I've been playing with visualising OBIEE metrics for *years* now. 

* Back in 2009 I wrote about using something called JManage to pull metrics out of OBIEE 10g via JMX:  

    ![](https://rnm1978.files.wordpress.com/2009/07/jmanage08.png?w=900&h=760)

* Still with OBIEE 10g in 2011, I was using rrdtool and some [horrible-looking tcl hacking](https://rnm1978.wordpress.com/2010/12/06/collecting-obiee-systems-management-data-with-jmx/) to get the metrics out through jmx :

    ![](https://rnm1978.files.wordpress.com/2011/03/graph.png?w=2048&h=542)

* 2014 brought with it DMS and my first forays with Graphite for storing & visualising data: 

    ![](http://www.rittmanmead.com/wp-content/uploads/2014/03/2014-03-26_07-03-19.png)

* My current weapon of choice is [OBIEE DMS metrics -> obi-metrics-agent -> InfluxDB -> Grafana](http://ritt.md/obi-dms)

    ![](http://www.rittmanmead.com/wp-content/uploads/2016/02/metrics05.png)

Why's this interesting? I guess just that the numbers have always been there for the taking & use, but nowadays it is so easy to store them and interactively analyse them there is _no excuse_ not to be doing so!
