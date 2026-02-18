---
draft: false
title: 'Finding config files in unix'
date: "2009-03-23T16:09:00+0000"
categories:
- BI publisher
- unix
---

Following my previous work on configuring Publisher, I wanted to note down where the changes were written to.

<!--more-->
The -mname syntax of the unix find command comes in handy here:

> find /app/oracle/product/obiee -mtime -1

Shows me all files under the specified path which were modified in the last 1 day

and helpfully throws up:

> /app/oracle/product/obiee/xmlp/XMLP/Admin/DataSource/datasources.xml
