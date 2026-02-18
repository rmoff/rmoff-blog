---
title: "Undocumented nqcmd parameters"
date: "2011-07-13"
categories: 
  - "documentation"
  - "hack"
  - "nqcmd"
  - "OBIEE"
---

I noticed on [Nico's wiki](http://gerardnico.com/wiki/dat/obiee/) (which is amazing by the way, it has **so** much information in it) a [bunch of additional parameters for nqcmd](http://gerardnico.com/wiki/dat/obiee/nqcmd) other than those which are displayed in the default helptext (nqcmd -h).

These are the additional ones: 
```
-b
-w
-c
-n
-r
-t
-T (a flag to turn on time statistics)
-SmartDiff (a flag to enable SmartDiff tags in output)
-P
-impersonate 
-runas
```


Most parameters don't appear to work in default call of nqcmd in 10g and 11g, throwing a **Argument error near:** error. 
```
-b
-w
-c
-n
-r
-t
-P
-SmartDiff (a flag to enable SmartDiff tags in output)
```
 I wonder if there's an [Open Sesame](http://www.phrases.org.uk/bulletin_board/42/messages/1049.html) type flag that needs to be used to enable these parameters by support. Or maybe they don't even exist.

This leaves this handful of additional parameters which do work (/don't throw an error) in the default invocation of nqcmd: 
```
-T (a flag to turn on time statistics)
-impersonate 
-runas
```


Oracle Support directed me to [the documentation](http://download.oracle.com/docs/cd/E21764_01/bi.1111/e10540.pdf) (Table 14-1), but this covers the standard parameters, not these extra ones.

**Oracle Support also pointed out that undocumented parameters are not supported except under direct instruction**

The -T flag looks very useful for [performance testing](/2010/05/24/performance-testing-and-obiee/) purposes, as it appends this information to the output from nqcmd: 
```
Clock time: batch start: 15:44:32.000 Query from: 15:44:32.000 to: 15:44:59.000 Row count: 0
 total: 27 prepare:  1 execute: 26 fetch:  0
Cumulative time(seconds): Batch elapsed: 26 Query total: 27 prepare:  1, execute: 26, fetch:  0, query count:  1, cumulative rows:  0
```


I'm intrigued to know where Nico got his list from (he couldn't remember when I asked him :-)). Has anyone else come across these and/or know what they do and how to invoke them? Stuff like SmartDiff sounds tantalisingly interesting.
