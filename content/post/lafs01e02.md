---
draft: false
title: 'Learning Apache Flink S01E02: What *is* Flink?'
date: "2023-10-02T15:12:14Z"
image: "/images/2023/10/h_IMG_5510.webp"
thumbnail: "/images/2023/10/t_IMG_5412.webp"
credit: "https://twitter.com/rmoff/"
categories:
- Apache Flink
- LAF
---


My [journey](/2023/09/29/learning-apache-flink-s01e01-where-do-i-start/) with [Apache Flink](https://flink.apache.org) begins with an overview of *what Flink actually is*. 

What better place to start than the [Apache Flink website itself](https://nightlies.apache.org/flink/flink-docs-release-1.17/#apache-flink-documentation): 

> **Apache Flink** is a framework and distributed processing engine for stateful computations over _unbounded_ and _bounded_ data streams. Flink has been designed to run in _all common cluster environments_, perform computations at _in-memory_ speed and at _any scale_.

<!--more-->

![An image of a squirrel making notes with a big pile of books and papers behind him](/images/2023/10/lafs01e02.webp)

In this post, I'm going to summarise my current—possibly naïve—understanding of: 

* [What Flink is](#so-what-is-flink)
* [What Flink is used for](#use-cases)
* [Who uses Flink](#users-of-flink)
* [How do you run Flink](#how-do-you-run-flink)
* [Where to find the Flink community](#the-flink-community)

## So: What is Flink?

I found a couple of [excellent](https://www.dataengineeringpodcast.com/apache-flink-with-fabian-hueske-episode-57) [podcasts](https://overcast.fm/+BAj84H3884) from [Fabian Heuske](https://www.linkedin.com/in/fhueske/) and my [Decodable](https://decodable.co/) colleague [Robert Metzger](https://www.linkedin.com/in/metzgerrobert/?originalSubdomain=de) respectively that gave some really useful background on the project:

* Flink started life as a research project in 2011, called [_Stratosphere_](https://scholar.google.com/citations?view_op=view_citation&hl=en&user=Q1LJyvQAAAAJ&citation_for_view=Q1LJyvQAAAAJ:_FxGoFyzp5QC). 
* It was donated to [Apache Software Foundation](https://www.apache.org/) in 2014. 
* Version 1.0 released 2016, latest version is [1.17](https://flink.apache.org/downloads/#apache-flink-1171) .
* Whilst it was originally designed for batch, it always used streaming principles, making its move into stream processing a logical one
* Hadoop revolutionised the distributed processing of data at scale, but was "dumb". Flink aimed to use some of the principles whilst bringing in important learnings from the RDBMS world that had been missed in Hadoop. Flink includes a bunch of things that you'd have to build for yourself in Hadoop, such as pipelined execution (e.g. all stages run concurrently and stream data), native join operators, and it re-use of data properties such as the data being sorted or partitioned already in a certain way.
* JVM-based. [SQL](https://nightlies.apache.org/flink/flink-docs-master/docs/dev/table/sql/overview/) and [PyFlink](https://nightlies.apache.org/flink/flink-docs-master/docs/dev/python/overview/) added in recent years.
* Flink is a Distributed system. [Each](https://overcast.fm/+H1YOnxO3I/05:50 ) worker stores state. 
* It [supports](https://overcast.fm/+H1YOnxO3I/23:29) exactly once state guarantee with checkpointing across workers that stores the processing state (such as aggregations), as well as the metadata of input sources (e.g. Kafka topics offsets) all on a distributed filesystem (e.g. S3)
* Event time processing. [Uses](https://overcast.fm/+H1YOnxO3I/21:42) watermarks (same as Google data flow), which enable you to trade off between completeness and latency.
* 🤯 Everything is a stream; it's just some streams are bounded, whilst others are unbounded.
	* _**Wait, What? Everything is a Stream?**_
	* From my background with Apache Kafka and the [stream-table duality](https://www.michael-noll.com/blog/2018/04/05/of-stream-and-tables-in-kafka-and-stream-processing-part1/), this source-agnostic framing of events is different, and I can't wait to explore it further. I'm interested to see if it's just a matter of semantics, or if there is something fundamentally different in how Flink reasons about streams of events vs state for given keys. 

## Uses & Users of Flink

### Use Cases

The documentation for Flink lays out [three distinct use cases](https://flink.apache.org/use-cases/) for Flink. Under each are linked several examples, mostly from the Flink Forward conference. 

- [**Event-driven Applications**](https://flink.apache.org/use-cases/#event-driven-applications-a-nameeventdrivenappsa), e.g.
	- [Fraud detection](https://www.youtube.com/watch?v=Do7C4UJyWCM/)
	- [Anomaly detection](https://www.youtube.com/watch?v=rJNH5WhWAj4/)
	- [Rule-based alerting](https://www.youtube.com/watch?v=_yHds9SvMfE/)
	- [Business process monitoring](https://jobs.zalando.com/tech/blog/complex-event-generation-for-business-process-monitoring-using-apache-flink/)
	- [Web application (social network)](https://www.youtube.com/watch?v=0cJ565r2FVI/)
- [**Data Analytics Applications**](https://flink.apache.org/use-cases/#data-analytics-applicationsa-nameanalyticsa), e.g.
	- [Quality monitoring of Telco networks](https://www.youtube.com/watch?v=izYsMQWeUbE/)
	- [Analysis of product updates & experiment evaluation](https://www.youtube.com/watch?v=17tUR4TsvpM/) 
	- [Ad-hoc analysis of live data](https://eng.uber.com/athenax/) 
	- Large-scale graph analysis
- [**Data Pipeline Applications**](https://flink.apache.org/use-cases/#data-pipeline-applications-a-namepipelinesa), e.g. 
	- [Real-time search index building](https://ververica.com/blog/blink-flink-alibaba-search) 
	- [Continuous ETL](https://jobs.zalando.com/tech/blog/apache-showdown-flink-vs.-spark/)  (a.k.a. "Streaming ETL")

One thing that's interesting about the linked examples is that they are all from 6-7 years ago. One can look at this two ways. Put positively, it demonstrates what a long history and proof of success Flink has when it comes to experience in stream processing. Being snarky, one would cast it in the light that Flink is a technology of the past, on its way out with the Hadoops of this world. 

I'd strongly reject the latter view. You may say that is obvious given that I now work for a company offering [a managed Flink service](https://decodable.co/) 😉. But this in itself is a point to counter the snark. There are multiple companies *launching* Flink as a service—including companies which already had stream processing offerings based on other technology. Flink is a well-established technology with a strong [roadmap](https://flink.apache.org/roadmap/) and a [modern and cloud-native vision](https://flink.apache.org/roadmap/#scenarios-we-focus-on) for its future direction. 
### Users of Flink

Whilst the rise of managed Flink services is one proof-point demonstrating Flink's popularity, the other irrefutable one is its _continued use_ in a wide range of companies and use cases (and not just those from 6-7 years ago). A quick look through the back issues of [Data Engineering Weekly](https://www.dataengineeringweekly.com/) and past sessions of [Flink Forward](https://www.flink-forward.org/events) and other conferences demonstrates this. 

Users with **recent** (in the last ~two years) published use cases include: 

* [Alibaba Cloud](https://alibaba-cloud.medium.com/four-billion-records-per-second-f8eeabce934d)
* [Amazon](https://www.flink-forward.org/sf-2022/conference-program#alexa--be-quiet---end-to-end-near-real-time-model-building-and-evaluation-in-amazon-alexa)
* [Apple](https://www.infoq.com/presentations/apache-iceberg-streaming/)
* [Booking.com](https://www.youtube.com/watch?v=-wSbb4JSuZU)
* [Capital One](https://medium.com/capital-one-tech/exploring-apache-flink-aws-kda-realtime-data-streaming-7201ed4ed197)
* [DoorDash](https://doordash.engineering/2021/07/14/open-source-search-indexing/)
* [ING Bank](https://www.flink-forward.org/seattle-2023/agenda#model-inference-in-flink-sql-using-a-custom-http-connector)
* [Instacart](https://tech.instacart.com/building-a-flink-self-serve-platform-on-kubernetes-at-scale-c11ef19aef10)
* [JP MorganChase](https://www.flink-forward.org/seattle-2023/agenda#quality-scale-with-flink)
* [LinkedIn](https://www.slideshare.net/FlinkForward/building-a-fully-managed-stream-processing-platform-on-flink-at-scale-for-linkedin-252866883)
* [Lyft](https://eng.lyft.com/wheres-my-data-a-unique-encounter-with-flink-streaming-s-kinesis-connector-6da3b11b164a)
* [Netflix](https://netflixtechblog.com/data-mesh-a-data-movement-and-processing-platform-netflix-1288bcab2873) ([ad](https://netflixtechblog.com/keystone-real-time-stream-processing-platform-a3ee651812a) [infinitum](https://www.google.com/search?q=site:netflixtechblog.com+flink))
* [Pintrest](https://medium.com/pinterest-engineering/lessons-from-debugging-a-tricky-direct-memory-leak-f638c722d9f2) (this [older article](https://medium.com/pinterest-engineering/unified-flink-source-at-pinterest-streaming-data-processing-c9d4e89f2ed6) lists more of their use cases)
* [Reddit](https://www.flink-forward.org/seattle-2023/agenda#protecting-reddit-users-at-scale-with-flink-stateful-functions)
* [Shopify](https://shopify.engineering/optimizing-apache-flink-applications-tips)
* [Stripe](https://speakerdeck.com/jeffchao/flink-forward-2022-squirreling-away-640-dollars-billion-how-stripe-leverages-flink-for-change-data-capture)
* [TikTok](https://www.flink-forward.org/seattle-2023/agenda#self-service-data-ingestion-platform-at-tiktok--powering--foryoupage-for--b--users)
* [Uber](https://www.uber.com/en-GB/blog/real-time-exactly-once-ad-event-processing/)
* [Vinted](https://vinted.engineering/2023/09/25/search-indexing-pipeline/)

See also the Powered By Flink [highlights](https://flink.apache.org/powered-by/) and [complete list](https://cwiki.apache.org/confluence/display/FLINK/Powered+by+Flink).

## How do you run Flink?

### Self-Managed

Flink is a distributed system, which means that you don't just buy one great big box and scale it up and up for capacity. Instead, you deploy it across multiple instances for both scalability and fault-tolerance. 

The Flink documentation has a clear set of instructions for running Flink using the [binaries directly](https://nightlies.apache.org/flink/flink-docs-release-1.17/docs/deployment/resource-providers/standalone/overview/), under [Docker](https://nightlies.apache.org/flink/flink-docs-release-1.17/docs/deployment/resource-providers/standalone/docker/), and with [Kubernetes](https://nightlies.apache.org/flink/flink-docs-release-1.17/docs/deployment/resource-providers/native_kubernetes/). Betraying its Big Data history, is also still supports [YARN](https://nightlies.apache.org/flink/flink-docs-release-1.17/docs/deployment/resource-providers/yarn/).

### Managed Service

Did I mention yet that [Decodable](https://decodable.co/) offers a fully-managed Apache Flink service? :-D 

You can find a list of other vendors that offer Apache Flink as a managed service in [the Flink documentation](https://nightlies.apache.org/flink/flink-docs-release-1.17/docs/deployment/overview/#vendor-solutions). 

## The Flink Community

Just like any healthy open-source project, there is a good community around Flink. Per the Apache motto:

> If it didn’t happen on a mailing list, it didn’t happen.

The [community](https://flink.apache.org/community/) page on the Flink site lists numerous mailing lists. `news@` and `community@` are both pretty stagnant, but [users@](https://lists.apache.org/list.html?user@flink.apache.org) is well-used with half a dozen posts per day. If you're contributing to Flink (rather than just using it) you'll want the `dev@` list too.

Alongside the mailing lists, there is a [Slack group](https://join.slack.com/t/apache-flink/shared_invite/zt-22mklt3r5-89MjX41gqHsBk81ZoTDqXg) with 3k members. It has a good layout of channels, and a handful of messages per day

You'll also find a steady stream of Flink questions and answers on [StackOverflow](https://stackoverflow.com/questions/tagged/apache-flink).
## What's next for Flink?

There's a [comprehensive and well-maintained roadmap](https://flink.apache.org/roadmap/) for Flink. Changes are made through FLIPs (***FL**ink **I**mprovement **P**roposals*). 

As well as what's coming there's also a clear list of [features that are being phased out](https://flink.apache.org/roadmap/#feature-radar). This level of insight into the project is really useful for a newbie—given how long Flink has been around (aeons, in internet years) there is going to be a lot of material published that is out of date and this chart will hopefully be a quick way to navigate that.

The roadmap page is notable for not only a list of planned features but also the [general strategy](https://flink.apache.org/roadmap/#scenarios-we-focus-on) (which should help inform users as to whether their use cases are within sensible bounds) and even something close to my own heart: [developer experience](https://flink.apache.org/roadmap/#developer-experience). One particularly interesting bit that caught my eye is the idea of built-in dynamic table storage, described in [FLIP-188](https://cwiki.apache.org/confluence/display/FLINK/FLIP-188%3A+Introduce+Built-in+Dynamic+Table+Storage) and—if I understand correctly—spun out into its own Apache Incubator project, [Apache Paimon](https://paimon.apache.org/). Paimon describes itself as a "_Streaming data lake platform_" and is definitely on my list to go and check out particularly after [my work last year on mapping out the data engineering landscape](https://rmoff.net/2022/09/14/data-engineering-in-2022-storage-and-access/) as at first glance I'm not sure where it fits.

## Flink Resources

The [Apache Flink project website](https://flink.apache.org) itself is an excellent resource. Especially when compared to some other Apache projects (*cough*), it's extremely well laid out, thoughtfully organised, and easy to use. 

Some other good places for Flink information include: 

* The [Flink Forward](https://www.flink-forward.org/) conference ([previous events](https://www.flink-forward.org/events))
* Podcasts
	* [Stateful, Distributed Stream Processing on Flink with Fabian Hueske](https://overcast.fm/itunes1193040557/data-engineering-podcast)
	* [Inside Apache Flink: A Conversation with Robert Metzger](https://overcast.fm/+BAj84H3884)
	* [Diving Deep into Apache Flink with Robert Metzger](https://overcast.fm/+BAj87Wiuo4)
* [Apache Flink presentations on SpeakerDeck](https://cse.google.com/cse?cx=010150859881542981030:hqhxyxpwtc4&ie=UTF-8&q=Apache+Flink+&sa=Search)
