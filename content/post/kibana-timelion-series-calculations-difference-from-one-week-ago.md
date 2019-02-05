+++
author = "Robin Moffatt"
categories = ["timelion", "kibana", "offset", "formatting", "bar", "line"]
date = 2016-05-23T09:46:28Z
description = ""
draft = false
image = "/images/2016/05/Timelion_-_Kibana-6.png"
slug = "kibana-timelion-series-calculations-difference-from-one-week-ago"
tag = ["timelion", "kibana", "offset", "formatting", "bar", "line"]
title = "Kibana Timelion - Series Calculations - Difference from One Week Ago"

+++

I wrote recently about [Kibana's excellent Timelion feature](http://rmoff.net/2016/03/29/experiments-with-kibana-timelion-2/), which brings time-series visualisations to Kibana. In the comments Ben Huang asked: 

> do you know how to show whats the difference between this Friday and last Friday by Timelion?

So I thought I'd answer properly here. 

Timelion includes mathematical functions including `add` and `subtract`, as well as the ability to show data `offset` by an amount of time. So to answer Ben's query, we combine the two. 

First, our starter series, simply showing a count of all documents across all indices: 

    .es()

![](/images/2016/05/Timelion_-_Kibana.png)

Now let's check out the `offset` function, showing the same data but for the previous week: 

    .es(offset=-1w)

![](/images/2016/05/Timelion_-_Kibana-1.png)

We can combine the two on the same chart: 

    .es(*),.es(offset=-1w)

![](/images/2016/05/Timelion_-_Kibana-2.png)

And then we can subtract one from the other: 

    .es().subtract(.es(offset=-1w))

![](/images/2016/05/Timelion_-_Kibana-3.png)

Tarting it up a bit, we can show all three series, adding `label` for each, and formatting the difference series as bars instead of lines clearly to identify it better: 

    .es().label("Original"),.es(offset=-1w).label("One week offset"),.es().subtract(.es(offset=-1w)).label("Difference").bars()

![](/images/2016/05/Timelion_-_Kibana-4.png)

Mucking about with the `lines` syntax, setting a `fill` and zero-`width` lines, we can show bars but with width of each data point (1 day): 

    .es().label("Original"),.es(offset=-1w).label("One week offset"),.es().subtract(.es(offset=-1w)).label("Difference").lines(steps=1,fill=2,width=0)

![](/images/2016/05/Timelion_-_Kibana-5.png)

So there you have it - the difference calculation between two time points in Timelion, with a bit of formatting fun thrown in for a bonus.
