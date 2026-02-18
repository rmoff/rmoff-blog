---
title: "RTFAL!"
date: "2010-04-24"
categories: 
  - "ora-00845"
  - "oracle"
---

This is a note-to-self really. When playing around with Oracle and something's not working - RTFAL: Read The Flippin Alert Log!

After resizing a VM I was getting this problem: 
```
\[oracle@RNMVM01 ~\]$ sqlplus / as sysdba

SQL\*Plus: Release 11.2.0.1.0 Production on Sat Apr 24 17:44:44 2010

Copyright (c) 1982, 2009, Oracle. All rights reserved.

Connected to an idle instance.

SQL> startup nomount ORA-00845: MEMORY\_TARGET not supported on this system SQL>
```


I spent longer than I should have reading around on google, hitting various pages which all talked around memory management and /dev/shm

If I'd followed the logical process, I'd have checked the alert log: 
```
Starting ORACLE instance (normal) WARNING: You are trying to use the MEMORY\_TARGET feature. This feature requires the /dev/shm file system to be mounted for at least 536870912 bytes. /dev/shm is either not mounted or is mounted with available space less than this size. Please fix this so that MEMORY\_TARGET can work as expected. Current available is 529969152 and used is 0 bytes. Ensure that the mount point is /dev/shm for this directory. memory\_target needs larger /dev/shm
```


Following the syntax from [here](http://arjudba.blogspot.com/2009/01/ora-00845-memorytarget-not-supported-on.html) I duly allocated the space as Oracle requested: 
```
\[root@RNMVM01 ~\]# mount -t tmpfs shmfs -o size=536870912 /dev/shm
```


and now Oracle was happy: 
```
SQL> startup nomount ORACLE instance started.

Total System Global Area 535662592 bytes Fixed Size 1337720 bytes Variable Size 402654856 bytes Database Buffers 125829120 bytes Redo Buffers 5840896 bytes
```


As a 'hack' when it comes to Oracle server stuff, I have to say it's a pleasure to work with most of the time, lots of helpful logs & documentation :-)
