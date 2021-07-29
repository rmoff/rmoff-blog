+++
categories = ["logstash", "timelion", "kibana", "elasticsearch", "monitoring", "ingest"]
date = 2016-05-13T05:45:19Z
description = ""
draft = false
image = "/images/2016/05/Visualize_-_Kibana_and_untitled_and_1__screen-1.png"
slug = "monitoring-logstash-ingest-rates-with-elasticsearch-kibana-and-timelion"
tag = ["logstash", "timelion", "kibana", "elasticsearch", "monitoring", "ingest"]
title = "Monitoring Logstash Ingest Rates with Elasticsearch, Kibana, and Timelion"

+++

Yesterday I wrote about [Monitoring Logstash Ingest Rates with InfluxDB and Grafana](/2016/05/12/monitoring-logstash-ingest-rates-with-influxdb-and-grafana/), in which InfluxDB provided the data store for the ingest rate data, and Grafana the frontend. 

[Mark Walkom](https://twitter.com/warkolm/) reminded me on twitter that the next release of Logstash will add more functionality in this area - and that it'll integrate back into the Elastic stack: 

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/rmoff">@rmoff</a> nice, LS 5.0 will have APIs exposing metrics too. they’ll be integrated back into Marvel/Monitoring! :)</p>&mdash; Mark Walkom (@warkolm) <a href="https://twitter.com/warkolm/status/730900473226485764">May 12, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Which then got me thinking -- why add in InfluxDB and Grafana, if you're already using another datastore and front end (Elasticsearch and Kibana)? Well, I touched on this yesterday, and I would still opt for InfluxDB & Grafana when deploying a metrics-based monitoring solution. But, if your primary focus is on text based data (such as log files), rather than metrics alone, Elastic stack will be just great for you. And so in this scenario, let's bring the ingest rate monitoring back in house!

### Logstash Configuration

This is the same [as before](/2016/05/12/monitoring-logstash-ingest-rates-with-influxdb-and-grafana/), except the **output** stanza points to Elasticsearch: 

```ruby
input {
    # Input code goes here
}
filter {
    # Any other filter code goes here
    # 
    # [...] 
    #
    metrics {
        meter => "events"
        add_tag => "metric"
    }
}

output {
    if "metric" in [tags] {
        elasticsearch { hosts => 'localhost'
                        index => "logstash-metrics"
        }
    } else {
    # Output code goes here
    # 
    # [...] 
    #
    }
}
```

After making this change, restart your Logstash agent. 

### Checking the data's arriving

I've been working with Elastic stack for a few years now, and can't believe that it's only recently I've discovered [Sense](https://www.elastic.co/guide/en/sense/current/installing.html). It's a plugin for Kibana, and makes working with the Elasticsearch REST API a real pleasure: 

![Sense](/images/2016/05/Sense_-_Kibana.png)

So we can see in the new Elasticsearch index **logstash-metrics** the data's coming through. All good - now onto the graphs!

### Graphing it in Kibana

You've two options for visualising the data here - the Line Chart, or [Timelion](https://www.elastic.co/blog/timelion-timeline). Timelion is still in beta, but longer-term will absolutely be the right choice for this kind of visualisation. So, let's do both!

The Line Chart is pretty simple. Set the metric aggregation to **Max** (instead of *Count*), and choose the relevant metric field. I've gone for `rate_1m` and added a second Y-axis metric for `rate_5m`. On the X-axis it's just split out as a date histogram: 

![Kibana Line Chart](/images/2016/05/lsir14.png)

The Timelion chart is a tad more complex to build, but ultimately better. Since I've got Timelion installed and am running Kibana 4.5, "Timeseries" shows up as a Visualisation option for me when I create a new one. To start with the blank configuration is a bit daunting: 

![](/images/2016/05/Visualize_-_Kibana.png)

Set the Interval to **other** and then `5s` in the box that appears. Amend the Timelion Expression to 

    .es(index=logstash-metrics)

Hit the play button: 

![](/images/2016/05/Visualize_-_Kibana-1.png)

Ah - not quite what we expected. That's because we're seeing by default a **Count**, which is generally 1 per Interval. Let's fix that: 

    .es(index=logstash-metrics,metric=max:events.rate_1m)

![Kibana Timelion](/images/2016/05/Visualize_-_Kibana-2.png)

Tada! 

But, let's not stop there, let's see what Timelion can do. A second series? Sure: 

    .es(index=logstash-metrics,metric=max:events.rate_1m), .es(index=logstash-metrics,metric=max:events.rate_5m)

![](/images/2016/05/Visualize_-_Kibana-3.png)

Looks good - but which is which? And how about a title for the chart? **label** and **title** functions to the rescue!

    .es(index=logstash-metrics,metric=max:events.rate_1m).label("1 minute moving average"), .es(index=logstash-metrics,metric=max:events.rate_5m).label("5 minute moving average").title("Events per second")

![](/images/2016/05/Visualize_-_Kibana_and_untitled_and_1__screen.png)

Let's save the visualisation, and include it on the dashboard with our actual data: 

![](/images/2016/05/Dashboard_-_Kibana.png)

--- 

So - ingest rate monitoring within the Elastic stack? Done. Ingest rate monitoring if you're also using InfluxDB & Grafana? [Done](/2016/05/12/monitoring-logstash-ingest-rates-with-influxdb-and-grafana/)! And just to round off all permutations - you want to store your data in Elasticsearch, but just love how Grafana looks? Not a problem, since [Grafana support Elasticsearch as a data source](http://docs.grafana.org/datasources/elasticsearch/): 

![Grafana visualising Elasticsearch data](/images/2016/05/Grafana_-_Twitter_Ingest_Monitor.png)

