---
draft: false
title: 'OBIEE Systems Management – dodgy counter behaviour'
date: "2011-03-08T10:59:41+0000"
image: "/images/2011/03/jmx_connpool_all2.webp"
categories:
- bi
- bug
- jmx
- mbeans
- obiee
- systemsmanagement
---

Over the last few months I’ve been doing a lot of exploring of OBIEE Systems Management data, covered in a mini-series of blog posts, [Collecting OBIEE systems management data](/post/rnm1978/collecting-obiee-systems-management-data-with-jmx//).

<!--more-->
There are a vast number of counters exposed, ranging from the very interesting (Active Sessions, Cache Hits, etc) to the less so (Total Query Piggybacks, although for some seriously hardcore performance tuning even this may be of interest).

This short blog post is about a couple of counters which I’ve been monitoring but which looks to not be entirely reliable. Both are in the Oracle BI DB Connection Pool, and are:

- **Current Connection Count** – The current number of open connections in the thread pool.
- **Current Busy Connection Count** – The current number of connections assigned to process a query or processing a query in the DB Connection pool.

A picture tells a thousand words in this case:  

![](/images/2011/03/jmx_connpool_all2.webp "jmx_connpool_all")

OBIEE Connection Pool data

We can clearly see :

- **Current Busy Connection Count** (“*The current number of connections assigned to process a query or processing a query in the DB Connection pool.*“) goes negative!
- **Current Connection Count** (“*The current number of open connections in the thread pool.*“) accumulates. Either the counter is buggy, or there really are thousands of open connections in the thread pool which sounds worrying in itself.

These two counters reset and correct themselves only on a BI Server restart, which can be seen by the red vertical lines on the graph.

A snapshot of the current figures (via JConsole) backs up these numbers and puts “Current Connection Count” in context next to the ‘Peak’ and ‘Accumulated’ figures:  

![](/images/2011/03/snag-2011-03-08-10-32-06-0000.webp "SNAG-2011-03-08-10.32.06-0000")

OBIEE Systems Management data, viewed through JConsole
