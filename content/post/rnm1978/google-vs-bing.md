---
draft: false
title: 'Google vs Bing'
date: "2009-08-05T07:42:06+0000"
categories:
- Google
---

There’s been a bit of hype about Bing recently, so I thought I’d try it out in trying to get to the bottom of [this question](http://forums.oracle.com/forums/thread.jspa?messageID=3668647) on the OBIEE forum.

<!--more-->
The question was around the nqschangepassword utility and the error it’s reporting:  
**nQSError: 46090 The odbc.ini file could not found or could not be accessed.**

I did a google for the error to see what other issues could cause the error.  
[Google showed up](http://www.google.co.uk/search?q=nQSError+46090) the forum posting in question, plus the Siebel 794 message reference PDF (no v10 reference guide yet 😦 )  
(in blogging this I’ll now probably show up on the list too!)

[Using Bing](http://www.bing.com/search?q=nQSError+46090), I got no results! (as of 0830 4-aug-09 BST)

That doesn’t really inspire confidence. I can understand missing the odd site or two, but the message reference guide is invaluable, and the forum posting is about 30 hours old and if Google can index it in that time why can’t Bing?

[edit]  
1) Google’s already indexed this posting and lists it for **nQSError: 46090**. Bing still has no results for that search  
2) The error in question has been solved by making sure to run the environment initialisation scripts:  
cd obiee/setup  
set +u  
. ./common.sh  
. ./sa-init64.sh  
[/edit]
