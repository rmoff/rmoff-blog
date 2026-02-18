---
title: "A Poor Man's OBIEE EM/BI Management Pack"
date: "2010-11-04"
categories: 
  - "jmx"
  - "monitoring"
  - "OBIEE"
  - "systemsmanagement"
---

Folk from Yorkshire are tight, so the stereotype goes. So here's a cheap-ass way to monitor OBIEE 10g using nothing but the OBIEE built-in systemsmanagement component, the jmx agent, and jconsole (which is part of the standard Java distribution):

![](/images/rnm1978/poor-mans-em_3.png "poor-man's-EM_3")

From here you can also export to CSV the various counters, and then store history, plot it out with gnuplot or Excel, etc.

If anyone's interested let me know and I'll document a bit more about how I did this, but it's basically building on previous work [I've documented around jmx and OBIEE](/categories/jmx/).
