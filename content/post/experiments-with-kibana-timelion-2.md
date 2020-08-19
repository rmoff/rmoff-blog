+++
categories = ["kibana", "timelion", "quandl", "topbeat"]
date = 2016-03-29T21:07:00Z
description = ""
draft = false
image = "/images/2016/03/2016-03-30_00-07-36-1.png"
slug = "experiments-with-kibana-timelion-2"
tag = ["kibana", "timelion", "quandl", "topbeat"]
title = "Experiments with Kibana Timelion"

+++

[Timelion](https://www.elastic.co/blog/timelion-timeline) was released in November 2015 and with the 4.4.2 release of [Kibana](https://www.elastic.co/products/kibana) is available as a native visualisation once installed. It adds some powerful capabilities to Kibana as an timeseries analysis tool, using its own data manipulation language. 

Installing Timelion is a piece of cake: 

    ./bin/kibana plugin -i kibana/timelion

After restarting Kibana, you'll see it as an option from the application picker 

![](/images/2016/03/2016-03-29_23-13-49.png)

There's a bit of a learning curve with Timelion, but it's worth it. [The blog](https://www.elastic.co/blog/timelion-timeline) gives some basics, and the built-in help is really good too: 

![](/images/2016/03/2016-03-29_23-12-28-1.png)

Best of all is the built-in context completion when you're building up your expression:

![](/images/2016/03/2016-03-29_23-16-18.png)

The default expression, `.es(*)` shows a count of everything in Elasticsearch: 

![](/images/2016/03/2016-03-29_23-31-40.png)

We can access metrics and perform aggregations on them. In this example I'm using OS data collected from [Topbeat](https://www.elastic.co/products/beats/topbeat), and showing the system 1-minute load average: 

    .es(metric='max:load.load1')

![](/images/2016/03/2016-03-29_23-37-23.png)

You can specify multiple metrics to plot, by comma-separating each expression: 

    .es(metric='max:load.load1'), .es(metric='max:load.load5')

![](/images/2016/03/2016-03-29_23-39-53.png)

It starts to get really cool when you consider the chaining you can do with the Timelion functions within each expression. For example, adding a moving average to the data is as simple as including the function on the end of the expression: 

    .es(index=logstash-*).movingaverage(12)

![](/images/2016/03/2016-03-29_23-43-44.png)

As well as data manipulation you can do formatting and labelling too, for example here with the `.label` function, and combined with the second time series to plot the actual and the moving average: 

    .es(index=logstash-*),.es(index=logstash-*).movingaverage(12).label('12hr moving average')

In this syntax you can also see how you restrict the timeseries to a given set of Elasticsearch indices. 

![](/images/2016/03/2016-03-29_23-45-18.png)

So that's data from Elasticsearch - but Timelion does more than that. It has support for pulling in data from other sources, including [Quandl](https://www.quandl.com/). This is useful as it provides a great way to access complex datasets for experimenting with Timelion. 

Quandl gives free access to a whole bunch of time series data, including financial, economic and commodity prices. There's a paid option too for the most recent or intra-day data, but plenty of free stuff to play with. To get started simply sign up, which gives you access to your API key. Take this, and add it to the Timelion configuration file

```bash
cd my-kibana-install-folder
cd installedPlugins/timelion/
cp timelion.json timelion.json.bak
vi timelion.json
```

Add your API key into the `quandl` part of the configuration: 

```json
{
  "quandl": {
    "key": "nevergonnagiveyouup"
  },
[...]
```

Restart Kibana, and you're good to go. To use Quandl find the timeseries of interest on the Quandl website. In this example we've got the stock price of [Heineken](https://www.quandl.com/data/EURONEXT/HEIA). In the top-right you'll see the Quandl API code (in this example, it's `EURONEXT/HEIA`): 

![](/images/2016/03/2016-03-30_00-00-13.png)

Head over to Timelion and create a new timeseries expression, using the Quandl API code you just got and the Timelion `.quandl` function: 

    .quandl('EURONEXT/HEIA')

![](/images/2016/03/2016-03-30_00-03-25.png)

As before, you can plot multiple series on the same chart (note the use of the `.yaxis` function here to put the second series on the right-hand y-axis: 

    .quandl('EURONEXT/HEIA'), .quandl('DY2/I3020000060').yaxis(2)

![](/images/2016/03/2016-03-30_00-07-36.png)

Multiple charts can be included on the same sheet, using the "Add Chart" button available from the options menu on the top-right of the page: 

![](/images/2016/03/2016-03-30_00-08-28-1.png)

With multiple charts note that the hover-over cursor is mirrored on all charts for aiding comprehension:

![](/images/2016/03/timelion01.gif)

---

The Timelion plugin as seen above is a good place to start for trying it out, but as of 4.4.2 release of Kibana once you've installed Timelion it's available within Kibana itself: 

![](/images/2016/03/2016-03-30_00-22-33.png)

You can build up the visualisation using the same syntax as before: 

    .quandl('EURONEXT/HEIA'),.quandl('GOOG/NASDAQ_MLHR')

![](/images/2016/03/2016-03-30_00-23-18-1.png)

Since it's a native visualisation object in Kibana, this means that you can include Timelion in your Kibana dashboards too: 

![](/images/2016/03/2016-03-30_00-26-39-1.png)

(_Just in case you ever want to show CPU performance against the stock price of a beer company..._)

---

So I think Timelion is pretty damned neat. It's worth taking the time to figure out the syntax, as its potential is great - and its close integration with Kibana bodes well for its future in the product. 

What are you waiting for? Even if you've not got any data in Elasticsearch, you can use Quandl to start exploring the potential for Timelion. [Go get it now](https://www.elastic.co/blog/timelion-timeline)!
