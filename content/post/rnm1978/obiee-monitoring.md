---
title: "OBIEE monitoring"
date: "2010-12-06"
categories: 
  - "hack"
  - "jmx"
  - "mbeans"
  - "monitoring"
  - "obiee"
  - "systemsmanagement"
---

Those of you who read my blog regularly may have noticed I have a slight obsession with the OBIEE systems management capability which is exposed through [JMX](/category/jmx/). Venkat has [blogged this week about JMX in OBI11g](http://www.rittmanmead.com/2010/11/29/oracle-bi-ee-11g-systems-management-api-jmx-mbeans-dynamic-user-generation/), and it's clearly a technology worth understanding properly. I've recently been tinkering with how to make use of it for monitoring purposes, most recently using JConsole and [discussed here](/2010/11/04/a-poor-mans-obiee-embi-management-pack/). What follows is an extension of this idea, cobbled together with a bit of shell scripting, awk, gnuplot, and [sticky backed plastic](http://www.google.co.uk/search?q=blue+peter+sticky+backed+plastic). It's built on OBIEE 10g - for OBI11g it may differ (although I understand that Performance MBeans still exist).

Whether you collect metrics for day-to-day monitoring of OBIEE, capacity planning, or investigative work, it's valuable data (in my humble opinion) that will help you understand the usage of the application by the users that you support.

To whet your appetite, here's a sample of what you can produce, in realtime:

![](/images/rnm1978/snag-2010-12-03-14-57-19-0000.png "SNAG-2010-12-03-14.57.19-0000")

![](/images/rnm1978/summary-6hr.png "summary.6hr")

Before you start this, I recommend reading [how to secure your jmx agent](/2010/03/05/securing-obiee-systems-management-jmx-for-remote-access/) if you're working with production systems.

## Overview

There are three parts to my monitoring application, and you can pretty much pick and mix as you want. Obviously without any data collected then graphing it will be pretty dull, but you may opt to collect the data and then work with it another way (Excel, OBIEE, etc). I've broken the details down into three separate blog posts:

1. **[Metric collection](/2010/12/06/collecting-obiee-systems-management-data-with-jmx/)** from a remote BI Server, using jmxsh
2. **[Graph rendering](/2010/12/06/charting-obiee-performance-data-with-gnuplot/)** of the collected data, using gnuplot
3. **[Web page serving](/2010/12/06/adding-obiee-monitoring-graphs-into-oas/)** of the rendered graphs, bolted onto the OAS already in place for Presentation Services.
