---
title: "DBMS_STATS - GATHER AUTO"
date: "2011-09-13"
categories: 
  - "dbms_stats"
  - "oracle"
---

In Oracle 11g, the [DBMS\_STATS](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_stats.htm) procedure [GATHER\_SCHEMA\_STATS](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_stats.htm#BEIBJJHC) takes a parameter 'options' which defines the scope of the objects processed by the procedure call, as well as the action. It can be either GATHER or LIST (gather the stats, or list out the objects to be touched, respectively), and AUTO, STALE or EMPTY (defining the object selection to process).

- **GATHER** on its own will gather stats on all objects in the schema
- **GATHER EMPTY / LIST EMPTY** is self-explanatory - objects with no statistics.
- **GATHER STALE / LIST STALE** is pretty obvious too - objects that have stale statistics (i.e. have had 10% change to them since statistics were last gathered). NB this 10% can be changed at an object/schema/DB level.
- However, the documentation is ambiguous as to the precise function of **GATHER AUTO / LIST AUTO**.

There's even a MOS note, ["Differences between GATHER STALE and GATHER AUTO (Doc ID 228186.1)"](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=228186.1), which strangely enough - given the precision of its title - doesn't really explain the difference.

I'm quite fastidious about these things, particular in the documentation which I believe ought to be beyond fault. The frustrating thing for me is the sprinkling of fairy dust approach to describing the parameter:

- _"Oracle implicitly determines which objects"_ -- ok, but **how** does it "implicitly determine", what algorithm sits behind it?
- _"Oracle\[...\]determines how to gather"_ -- does it intelligently determine how to gather the stats for each object's characteristics, or does it passively fallback to the defaults? There's a difference, since one is a good starting point and the other would be in theory an ideal.

Why does this matter? Because statistics matter so much, and so a stats gathering strategy that is accurate and efficient is important. We can only do this if we understand exactly what the product is doing. [GIGO](http://en.wikipedia.org/wiki/Garbage_In,_Garbage_Out), and all that.

Reading, and re-reading, the documentation, I think the explanation is this:

- GATHER AUTO gathers stats on **objects** with stats which are **either STALE or EMPTY**, i.e. the combined object list of
    - GATHER STALE
    - GATHER EMPTY
- GATHER AUTO automagically **defines all the other parameters** relating to how the statistics are gathered - method\_opt, estimate\_percent, etc. User-specified values for these parameters are just ignored.

I've raised an SR to try and get proper clarification, and will update here if/when I find out.

> **UPDATE** Oracle confirmed in an SR that _"Gather AUTO Processes stale objects + objects without statistics (empty)"_

Note [Doc ID 1073120.1](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=1073120.1&h=Y) which details method\_opt that will be used in GATHER AUTO.

Finally, don't forget that representative statistics != non-stale statistics. None other than [Ask Tom](http://asktom.oracle.com/pls/asktom/f?p=100:11:0::::P11_QUESTION_ID:2453570168793#tom1970996900346518558) points this out.

Just because statistics are not "stale", doesn't mean that are representative of your data. You should always understand your data and make sure you're giving the CBO the most accurate information you can about the data.
