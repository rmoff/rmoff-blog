---
title: "Data Warehousing and Statistics in Oracle 11g - Automatic Optimizer Statistics Collection"
date: "2011-05-26"
url: "/2011/05/26/data-warehousing-and-statistics-in-oracle-11g-automatic-optimizer-statistics-collection/"
categories: 
  - "dbms_stats"
  - "dwh"
  - "oracle"
  - "statistics"
---

## Chucking a stick in the spokes of your carefully-tested ETL/BI ...

My opinion is that automated stats gathering for non-system objects should be disabled on Oracle Data Warehouses across all environments.

All it does it cover up poor design or implementation which has omitted to consider statistics management. Once you get into the realms of millions or billions of rows of data, the automated housekeeping may well not have time to stat all of your tables on each run. And then it becomes a quasi-lottery when your tables will get processed. Or what if you're working with intra-day loads (eg. near real-time) - the housekeeping job only runs once a day by default.

Even if you have a suitable window and are happy that the job gathers all that it needs to all of the time, what if you want to run your batch at the same time as the task window defined? If you want to run your batch highly parallel (and why wouldn't you?) then will the stats gather suffer? or affect your batch by running stats highly parallel too?

Suppose you are relying on the auto stats job, and don't want to run it at the same time as your batch, so you come up with a suitable schedule for them to run at different times. What happens when your DW grows and you need to add a new batch process, and so have to move the window again? How do you know that moving it won't affect the previous batch's stats?

If you're building on an existing system and want to test the performance of your new batch, how are you going to simulate the behaviour of your auto stats job? Even if you trigger it manually, are you going to accurately simulate the statistics that it may or may not need to gather each night? How do you factor in the magical 10% staleness to trigger a stats gather? That is one serious test rig if you want to reproduce all of that.

If you have stats management in place, then turning the auto stats off (for non-system objects) won't hurt. And if you're not, then the auto stats job will cover this up in your environments all the way from Dev through to Prod. The first time someone will ask about stats management is when you're scratching your head over a report or ETL stage "that used to work fine". And then the horrible truth will dawn that _you screwed up, and should have built it into your design from the beginning_.

As we say around here, if you want a job done properly, [do it tha' sen](http://en.wikipedia.org/wiki/Yorkshire_dialect). Or rather, [as Greg Rahn more articulately says:](http://structureddata.org/2008/03/26/choosing-an-optimal-stats-gathering-strategy/)

> _I tend to advise people that for a DW the stats gathering should be part of the data flow (ETL/ELT) process and to disable the default job \[...\] If you wish to collect your statistics manually, then you should change the value of AUTOSTATS\_TARGET to ORACLE instead of AUTO ([DBMS\_STATS.SET\_PARAM](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_stats.htm#sthref8767)('AUTOSTATS\_TARGET','ORACLE')). This will keep the dictionary stats up to date and allow you to manually gather stats on your schemas_

Julian Dyke says something supporting this view too in [his presentation here](http://www.juliandyke.com/Presentations/OptimzerStatistics.ppt):

> _In complex databases do not rely on Auto job - Unpredictable collection behaviour / duration - Unpredictable execution plan changes_

If you can't disable the autostats job for whatever reason (maybe another application on the same DB would require changes to accommodate it), then you can shield yourself from its nefarious influences by using [LOCK\_SCHEMA\_STATS](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_stats.htm#i1043184) to lock the stats on your schema(s). When you manually maintain the stats yourself, you either unlock them first, or use the FORCE option of the stats procedures.

## Stabilisers on a high-performance motorbike

It's easy enough to understand why Oracle built the Automated Stats job, and why it's enabled by default. In an effort to move towards the [Self Managing Database](http://www.google.co.uk/search?sourceid=chrome&ie=UTF-8&q=oracle+self-managing+database), it makes sense to automate whatever you can, so that the scope for poor performance is reduced. Abstracting things slightly, the optimizer is just part of the DB code, and stats reason for being is to support the optimizer, so why not keep it under the covers where possible? The trouble with this is that it might be fine for the middle of the road. The bog standard, quick-win, fire it and run project doing nicely standard OLTP work. One fewer thing for the developer to worry about. It's probably quite good for lots of things. But Oracle RDBMS is a big beast, and an expensive bit of kit. Do you really want to meander along in the slow lane all the time, content to be using a one-size-fits-all approach? [![Kawasaki motorbike with stabilisers](/images/rnm1978/stabilisers.jpg "This is your application relying on auto stats job for statistics management")](/images/2011/05/stabilisers.webp)

If you're serious about exploiting the power of Oracle for your data warehouse, then you need to understand what needs to be done to get it to perform. One of the big factors is accurate, representative statistics. And to get these you have to take the stabilisers off and learn how to do it properly yourself, because you're the one that understands your data. Data loads are going to be different, data distribution is going to be different, reporting is going to be different. There's a finite set of patterns that you'll find in standard DW methodology, but it's up to you to read about them (Greg Rahn, Doug Burns, et al) and understand how they apply to **your system**, and not rely on Oracle's approximation of a stats method for an **average** system.

## Why do I need to manage the stats myself? Doesn't Oracle do it automagically when they're stale?

_Doesn't Oracle gather stats automagically when they're stale?_ Yes, it does, **BUT**:

- Only if the window allocated to it allows for time
- **not stale ≠ representative stats** . Or to rearrange the equation: your stats can be unrepresentative of your data, and the stats not be 'stale'.

So even whilst they're not "stale", that's not to say the global statistics for your table are still **representative**. After one day, the statistics are already becoming **unrepresentative** of the data (think max value of date, transaction number, etc), but are still _not_ **"stale"**. Oracle will, by default, consider a table "stale" once 10% has changed. But most DWs are going to be loading many millions of rows a day, so the 10% (default) change for a table to be considered stale is going to be quite high. A table loading 20 million rows per day will hit c.1 billion rows in total after less than two months. But of a billion rows, a hundred million (10%) need to change before the table's statistics are "stale". 20 into 100 goes 5 ... so your statistics would only become "stale" roughly every five days.

There's a good presentation from OpenWorld 2008 by Oracle's Real World Performance Group, entitled [Real-World Database Performance Techniques and Methods](http://structureddata.org/files/oow2008/S298792_RWPMT_slides.pdf). In it they discuss statistics management in detail, including the following "Six Challenges to the Cost Based Optimizer":

> _1\. Data skew 2. Bind peeking 3. Column low/high values 4. Data correlation between columns 5. Cardinality Approximations 6. The debugging process_

At least two of these (data skew, and column low/high values - out-of-range) can occur (which is bad, mm'kay?) with statistics which are STALE=FALSE.

The point is, if you're serious about getting the best explain plan from the CBO, you can't rely on STALE as a sole indicator of how representative your statistics are of your data.

Let's remember **why** we even care about good statistics. Some people seem to think that it's optional. That it's the geek equivalent of spending every weekend lovingly polishing the exterior of one's favourite car - nice to have and ideally should be done, but ultimately _just for show and won't make it go any faster_. The DB is there to support the users of whatever application it is. And users being users, want their answers **now**. This gives us our starting point, and a logical flow of conclusions drawn from this:

- **Our requirement is for performance, and repeatable, consistent performance**.

- To get this we want Oracle to execute the query as efficiently as possible.
- To do this, Oracle needs to understand the data that it's being asked to query.
- If it doesn't understand the data, how can we expect to access it in the most efficient way?
- This understanding is imparted to Oracle through statistics.
- So statistics need to be **representative** of the data.

As soon as you are changing data (eg a DW batch load), **you** need to consider whether the stats are still going to give the CBO the best chance of getting the right plan. If they aren't as representative of your data as they could be then you can't expect the CBO to come up with the best plan. If your data doesn't change much and once a week works for you then great. But the point is **you** need to **understand your data**, so that you can plan your statistics strategy around it so that Oracle can understand it.

## Reading & References

- Greg Rahn
    - [Choosing An Optimal Stats Gathering Strategy](http://structureddata.org/2008/03/26/choosing-an-optimal-stats-gathering-strategy/)
    - [Incremental Global Statistics On Partitioned Tables](http://structureddata.org/2008/07/16/oracle-11g-incremental-global-statistics-on-partitioned-tables/)
    - [Extended Statistics](http://structureddata.org/2007/10/31/oracle-11g-extended-statistics/)
    - [All Statistics blog posts](http://structureddata.org/category/oracle/statistics/)
- Doug Burns - [Statistics on Partitioned Tables](http://oracledoug.com/serendipity/index.php?/archives/1590-Statistics-on-Partitioned-Tables-Contents.html)
- Julian Dyke - [Optimizer Statistics](http://www.juliandyke.com/Presentations/OptimzerStatistics.ppt)
- Oracle Optimizer team blog
    - [Maintaining statistics on large partitioned tables](http://blogs.oracle.com/optimizer/entry/maintaining_statistics_on_large_partitioned_tables)
    - [Concurrent Statistics Gathering](http://blogs.oracle.com/optimizer/entry/gathering_optimizer_statistics_is_one)
- [Luis Moreno Campos - Best Practices for Statistics Gathering on Oracle 11g](http://ocpdba.wordpress.com/2010/05/13/best-practices-for-statistics-gathering-on-oracle-11g/)
- [Oracle DB Statistics - What do they actually do and why do I care about the details](http://www.powershow.com/view/d4ea4-M2MxO/Oracle_DB_Statistics_What_do_they_actually_do_and_why_do_I_care_about_the_details_flash_ppt_presentation) (author unknown)

_Thanks to Greg Rahn for reviewing my post and suggesting some changes_
