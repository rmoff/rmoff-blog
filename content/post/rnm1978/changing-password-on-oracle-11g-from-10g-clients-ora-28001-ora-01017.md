---
title: "Changing password on Oracle 11g from 10g clients (ORA-28001 -&gt; ORA-01017)"
date: "2009-09-23"
categories: 
  - "oracle"
---

Bit of an odd one this. Oracle 11g database, a user's password has expired. But when I try to change it, I can't: 
```bash
$sqlplus MYUSER/oldPW@oraDBServer

SQL\*Plus: Release 10.2.0.1.0 - Production on Wed Sep 23 07:57:41 2009

Copyright (c) 1982, 2005, Oracle. All rights reserved.

ERROR: ORA-28001: the password has expired

Changing password for MYUSER New password: Retype new password: ERROR: ORA-01017: invalid username/password; logon denied

Password unchanged
```


After a bit of digging around I found [a post](http://www.experts-exchange.com/Database/Oracle/Q_24264349.html) ([cached](http://209.85.229.132/search?q=cache:hqJIemZFzTgJ:www.experts-exchange.com/Database/Oracle/Q_24264349.html+ora+expired+sqlplus+28001+01017&cd=1&hl=en&ct=clnk)) which says that this is a problem when you use 10g clients with 11g database. And sure enough:


```bash
C:\\Windows\\System32>C:\\instantclient\_11\_1\\sqlplus.exe MYUSER/oldPW@oraDBServer

SQL\*Plus: Release 11.1.0.7.0 - Production on Wed Sep 23 08:34:39 2009

Copyright (c) 1982, 2008, Oracle. All rights reserved.

ERROR: ORA-28001: the password has expired

Changing password for MYUSER New password: Retype new password: Password changed

Connected to: Oracle Database 11g Enterprise Edition Release 11.1.0.7.0 - 64bit Production With the Partitioning, OLAP, Data Mining and Real Application Testing options

SQL>
```

