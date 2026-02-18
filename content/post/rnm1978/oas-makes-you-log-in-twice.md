---
draft: false
title: 'OAS makes you log in twice'
date: "2009-04-02T12:27:00+0000"
categories:
- Apache
- OAS
---

A very minor irritation, but an irritation nonetheless, is when I go to Application Server Control in OAS I have to login twice.

<!--more-->
Reading around I found this is an Apache feature, and is actually designed behaviour.

For reasons I’ve not explored our servers have several different hostnames which resolve to the same IP, e.g.:  
myserver  
myserver-app  
myserver-data

When you request a page from Apache using a hostname other than that configured as ServerName in Apache’s httpd.conf, it redirects you to the version of the page using the ServerName.

If I go to <http://myserver.company.fqdn.net:7777/em/> I get the login page as expected. Having typed the password I get sent to the login page again – but this time at  <http://myserver>-app.company.fqdn.net:7777/em/, and this ties in with httpd.conf in which ServerName is myserver-app.

Per the [Apache FAQ](http://httpd.apache.org/docs/1.3/misc/FAQ.html#prompted-twice) this can be resolved in several ways. ServerName can either be altered (not sure if this would impact other functions), or change UseCanonicalName from On to Off. Obviously you could also just login at a URL which corresponded with the ServerName in httpd.conf 🙂

Ref: [Apache UseCanonicalName documentation](http://httpd.apache.org/docs/2.2/mod/core.html#usecanonicalname)

After changing httpd.conf, don’t forget to bounce Apache:

```

opmnctl restartproc ias-component=HTTP_Server
```
