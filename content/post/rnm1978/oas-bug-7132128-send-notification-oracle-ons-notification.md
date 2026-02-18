---
draft: false
title: 'OAS bug 7132128 – Send notification: oracle.ons.Notification'
date: "2009-04-02T10:27:00+0000"
categories:
- OAS
---

I noticed that the j2ee server.log file was filling up with these entries:

<!--more-->
> oracle.ons.Notification@afba5d  
> 09/04/02 10:15:12.207 Send notification:  
> oracle.ons.Notification@17ca0f5  
> 09/04/02 10:15:42.217 Send notification:  
> oracle.ons.Notification@1a28842  
> 09/04/02 10:16:12.227 Send notification:  
> oracle.ons.Notification@5144d5  
> 09/04/02 10:16:42.237 Send notification:  
> oracle.ons.Notification@19078ed  
> 09/04/02 10:17:12.247 Send notification:  
> oracle.ons.Notification@fcc268  
> 09/04/02 10:17:42.257 Send notification:  
> oracle.ons.Notification@16df388

A quick google turned up [this page](http://forums.oracle.com/forums/thread.jspa?messageID=2550518&#2550518) in which bug 7132128 (“OC4J EMITS “SEND NOTIFICATION” MESSAGES THAT FILL SERVER.LOG”) is identified.

The server.log is currently only 6MB and given the size of the server it will be a while before it causes us problems, but it’s worth being aware of.
