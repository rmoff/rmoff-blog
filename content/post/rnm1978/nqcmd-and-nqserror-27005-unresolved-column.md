---
draft: false
title: 'nqcmd and [nQSError: 27005] Unresolved column'
date: "2009-05-28T16:23:00+0000"
categories:
- obiee
---

I’m working on a scripted load test for OBIEE using nqcmd to run reports multiple times. I hit this interesting issue.

<!--more-->
Cut and pasting the logical SQL that Presentation Services sends to BI Server from Manage Sessions -> Statement, I kept getting this error when I ran it through nqcmd:

> [10058][State: S1000] [NQODBC] [SQL\_STATE: S1000] [nQSError: 10058] A general error has occurred.  
> [nQSError: 27005] Unresolved column: “Natural Account (COA)”.”Account Parent1 Code”.  
> Statement preparation failed

Eventually I tracked it down after looking at the logical SQL behind the report in Answers itself and comparing it to what I’d copied out of the Session statement:  
  
SELECT “Natural Account (COA)”.”Account Parent1 Code” saw\_0, “Natural Account (COA)”.”Account Parent5 Code”  […]  
SELECT “Natural Account  (COA)”.”Account Parent1 Code” saw\_0, “Natural Account  (COA)”.”Account Parent5 Cod […]

The “Natual Account (COA)” prefix had two spaces in it, but because I was copying it out of a web browser where multiple spaces are rendered as single unless escaped, the supposedly verbatim copy wasn’t such.

More details of the load testing script to follow…
