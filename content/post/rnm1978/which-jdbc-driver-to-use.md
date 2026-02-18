---
title: "Which jdbc driver to use"
date: "2009-03-24"
categories: 
  - "bi-publisher"
  - "jdbc"
  - "OBIEE"
---

In setting the scheduler in Publisher I discovered a useful difference in jdbc drivers.  
Our repository is on Oracle 11g.  
According to the manual oracle.jdbc.driver.OracleDriver should be used, but previous installations have used oracle.bi.jdbc.AnaJdbcDriver so I tried this too.  
  
In experimenting with both I found you get more useful feedback from the second one. Here's the same problem reported by both drivers:  

> · Exception \[TOPLINK-4002\] (Oracle TopLink - 11g Release 1 (11.1.1.0.0) (Build 080319)): oracle.toplink.exceptions.DatabaseException Internal Exception: java.sql.SQLException: ORA-28000: the account is locked Error Code: 28000  
> 
>   
> 
> · Exception \[TOPLINK-4021\] (Oracle TopLink - 11g Release 1 (11.1.1.0.0) (Build 080319)): oracle.toplink.exceptions.DatabaseException Exception Description: Unable to acquire a connection from driver \[oracle.bi.jdbc.AnaJdbcDriver\], user \[OBIEE\_PUBL\_SCHED\] and URL \[jdbc:oracle:thin:@dbserver.company.com:1521:ORACLESID\]. Verify that you have set the expected driver class and URL. Check your login, persistence.xml or sessions.xml resource. The jdbc.driver property should be set to a class that is compatible with your database platform Internal Exception: java.sql.SQLException: ORA-28000: the account is locked Error Code: 28000

As you can see with the highlighting that I've added the second driver gives you the really useful stuff - which ID and server it's trying to connect to.  
  
Obviously I can check what's been configured to trace back which ID and server should be being used - but it's always useful to get confirmation of what it's actually doing just to rule out me having been stupid and typed the wrong options :)
