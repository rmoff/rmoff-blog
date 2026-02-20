---
title: "Misbehaving Informatica kills Oracle"
date: "2010-09-02"
categories: 
  - "bug"
  - "informatica"
  - "obia"
  - "ora-28001"
  - "oracle"
  - "security"
---

This problem, which in essence is bad behaviour from Informatica bringing down Oracle, is a good illustration of unintended consequences of an apparently innocuous security setting. Per our company's security standards, database passwords expire every 90 days. When this happens users are prompted to change their password before they can continue logging into Oracle. This applies to application user IDs too. It appears that Informatica 8.6.1 HF6 (part of OBIA 7.9.6.1) doesn't handle an expired password well, spawning multiple connections to the database, eventually bringing Oracle down through memory SWAP space exhaustion.

As a side note, one of our DBAs has been investigating how to prevent a client connection accidentally (through bad coding) or maliciously (DoS) bringing down Oracle in this way, his findings are [documented here](http://jhdba.wordpress.com/2010/09/02/using-the-connection_rate-parameter-to-stop-dos-attacks/).

## Investigation

As the introduction to any good IT horror story goes ... "Everything was running fine; nothing had changed".

Then our monitoring showed swap space usage on our Oracle 11g database server increasing, and soon after Oracle crashed. The DBAs restarted Oracle, but shortly after the swap space usage was on its way up. The unix tool Glance showed a lot of Oracle processes on the box.

### Database

Our Informatica repository user expired on the day on which this happened (Aug 27th):


```
select username, account_status, expiry_date from dba_users

USERNAME                       ACCOUNT_STATUS                   EXPIRY_DATE
------------------------------ -------------------------------- ---------
INF_REPO                       EXPIRED                          27-AUG-10
```


When a user ID expires an ORA-28001 is given at login:


```
sqlplus INF_REPO/password

SQL*Plus: Release 11.1.0.7.0 - Production on Thu Sep 2 08:40:17 2010

Copyright (c) 1982, 2008, Oracle.  All rights reserved.

ERROR:
ORA-28001: the password has expired

Changing password for INF_REPO
New password:
```


This is the throughput figures for Oracle from Enterprise Manager, note the Logons rate starting to increase at c.13:30 (The rate at 03:00AM is representative of the usual logon load on the database): ![](/images/2010/09/inf_repo_exp_03.webp "inf_repo_exp_03")

### Server

Note SWAP space increase (dark blue line) at c. midday (nb GMT/BST mean not all the graphs will align):

![Database server metrics](/images/rnm1978/inf_repo_exp_011.png "inf_repo_exp_01")

Note number of Alive Oracle processes (faint yellow line!):

![Database server metrics - Oracle application only](/images/rnm1978/inf_repo_exp_021.png "inf_repo_exp_02")

### Informatica

In the Informatica exceptions.log and node.log are the initial errors:


```
ERROR [Master Elect Data Writer] [DOM_10162] An exception occurred while updating the master election row.
java.sql.SQLException: [informatica][Oracle JDBC Driver]No more data available to read.

ERROR [Master Elect Data Writer] [DOM_10162] An exception occurred while updating the master election row.
java.sql.SQLException: [informatica][Oracle JDBC Driver][Oracle]ORA-01034: ORACLE not available
ORA-27101: shared memory realm does not exist
HPUX-ia64 Error: 2: No such file or directory

ERROR [Master Elect Data Writer] [DOM_10162] An exception occurred while updating the master election row.
java.sql.SQLException: [informatica][Oracle JDBC Driver][Oracle]ORA-28001: the password has expired
```


Followed by the repeated error approximately every ten seconds:


```
ERROR [Master Elect Data Writer] [DOM_10162] An exception occurred while updating the master election row.
java.sql.SQLException: [informatica][Oracle JDBC Driver][Oracle]ORA-28001: the password has expired
```


There are also final errors in the log, occuring once only just after midnight:


```
FATAL [Domain Monitor] [PCSF_10374] Failed to persist [CpuUsageSummary] with error [[informatica][Oracle JDBC Driver]No more data available to read.].
FATAL [Domain Monitor] [PCSF_10374] Failed to persist [RepoUsageSummary] with error [[informatica][Oracle JDBC Driver]No more data available to read.].
```


After these Informatica shut down.

## Theory

This is what I think is happening:

- Informatica has a polling component ("\[Master Elect Data Writer\]") that updates a database table (part of the Informatica repository) every minute
- Once the user has expired, Informatica gets **ORA-28001: the password has expired** when it tries to connect
- Informatica does not handle ORA-28001 correctly
- It appears that it leaves the connection open
- It then retries a few seconds later
- The connections stack up, each taking swap space allocated to the Oracle process that the connection spawns
- Eventually the server runs out of resource and Oracle crashes
- At midnight another Informatica component ("\[Domain Monitor\]") tries to update a database table (part of the Informatica repository), and gets the ORA-28001 error.
- This second component ("\[Domain Monitor\]") correctly takes the error as fatal and aborts the Informatica server process

## Resolution

In my opinion, Informatica should consistently treat ORA-28001 as fatal.

At the very least, if Informatica isn't treating ORA-28001 as fatal it should close the connection to the database correctly.

* * *

[An update from Informatica here](/2010/10/18/when-is-a-bug-not-a-bug-when-its-a-design-decision/)
