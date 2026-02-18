---
title: "Resolved: sawserver : Error loading security privilege /system/privs/catalog/ChangePermissionsPrivilege"
date: "2009-11-17"
categories: 
  - "config"
  - "sawserver"
---

Whilst installing OBIA 7.9.6.1 I hit this problem when firing up Presentation Services (sawserver):

> Error loading security privilege /system/privs/catalog/ChangePermissionsPrivilege.

A quick search on the forums threw up [two](http://forums.oracle.com/forums/thread.jspa?threadID=632090) [posts](http://forums.oracle.com/forums/thread.jspa?threadID=938275&tstart=0) suggesting a corrupted WebCat.

Since I'd got this webcat fresh out of the box I was puzzled how it could be corrupted.

I did a bit more tinkering (including [nosying around in the sawserver log](/categories/log/)), before realising it was indeed corrupt, and that I was indeed a muppet.

Here's what happened after copying EnterpriseBusinessAnalytics.zip to my (unix) Presentation Services box: 
```bash
$unzip EnterpriseBusinessAnalytics.zip 
Archive:  EnterpriseBusinessAnalytics.zip
   creating: root/
   creating: root/
   creating: root/shared/
   creating: root/shared/automotive/
   creating: root/shared/automotive/prompts/
  inflating: root/shared/automotive/prompts/gf_model+model+year+trim  
  inflating: root/shared/automotive/prompts/gf_model+model+year+trim.atr  
  inflating: root/shared/automotive/prompts.atr  
[...]
[ lots of files here ]
[...]
  inflating: root.atr                

$ls -l
total 110494
-rw-------   1 user   group    37655058 Oct  7 03:44 EnterpriseBusinessAnalytics.zip
drwx------   5 user   group       1024 Sep 18 01:06 root
-rw-------   1 user   group         60 Dec  6  2006 root.atr
```
 Huh? What gives? Where's my EnterpriseBusinessAnalytics web cat folder? Well, quite obviously it's unpacked it without a parent directory name. That's easily solved: 
```bash
$mkdir EnterpriseBusinessAnalytics
$mv root EnterpriseBusinessAnalytics
```


Then I started up Presentation Services and got the error "Error loading security privilege /system/privs/catalog/ChangePermissionsPrivilege."

If you can spot my snafu at this point the my only defence is that there was quite a lot of other gumf in the catalog folder, not just the files illustrated above :-D

## The solution

Whilst I'd moved the root folder into my webcat folder, I'd neglected to move root.atr - in effect corrupting the web catalog.

So simple, but so frustating!

The solution in this case was to move root.atr into the webcat folder, alongside root. It's worth noting that this may not be the solution in all occurrences of this error, it depends on where the corruption has occurred.

## Footnote

The silver lining being a good chance to poke around inside sawserver a bit more and discover gems like this in the logging:

> _The Oracle BI Presentation Server is proudly running under user: TODO\_implement\_this_

It's nice that it takes pride in its work, although shame we never get to find out the user's name ;-)
