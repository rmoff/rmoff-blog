---
title: "Troubleshooting OBIEE and ORA-12154: TNS:could not resolve the connect identifier"
date: "2009-10-22"
url: "/2009/10/22/troubleshooting-obiee-and-ora-12154-tnscould-not-resolve-the-connect-identifier/"
categories: 
  - "OBIEE"
  - "oracle"
---

A frequent question on the [OTN OBIEE forum](http://forums.oracle.com/forums/forum.jspa?forumID=378) is how to fix this error:

> \[nQSError: 17001\] Oracle Error code: 12154, message: ORA-12154: TNS:could not resolve the connect identifier specified at OCI call OCIServerAttach.
> \[nQSError: 17014\] Could not connect to Oracle database.

The error is simply OBIEE reporting that it tried to connect from the BI Server to an Oracle database and the Oracle client returned an error. Distilling it down gives us this error:

> ORA-12154: TNS:could not resolve the connect identifier specified at OCI call OCIServerAttach.

This generally means one of three things:

1. You've got the correct Data Source Name (DSN) in your connection pool configuration, but not in your tnsnames.ora file
2. You've got the correct DSN in your tnsnames.ora but you've not updated the connection pool, or connection pools
3. You've got the correct DSN in your connection pool and tnsnames.ora, but have multiple tnsnames.ora files and OBIEE is using a different one from the one you've got the correct DSN in.

To check your connection pool, open the RPD in Adminstration tool and go to the Physical Layer. Expand the Database, and double-click on the Connection Pool (if you're not sure which one, then check all of them!). ![admintool1](/images/rnm1978/admintool1.png "admintool1") In the connection pool check the Data Source Name and make sure it matches to what you have in your tnsnames.ora file: ![admintool2](/images/rnm1978/admintool2.png "admintool2")

To check your tnsnames.ora, first locate it. This ties in with the third point on my list too. Be aware that you may have several copies of this file, so make sure you're opening the correct one. I've not done extensive testing of this but until proven otherwise I would assume that OBIEE uses the tnsnames.ora in $ORACLE\_HOME/network/admin/ $ORACLE\_HOME should be set in \[OracleBI\]/setup/user.sh or your user profile. Note that it's the home for the connectivity (usually client), not necessarily your DB. Once you've located the correct tnsnames.ora file check that it has a valid entry for the DSN in your connection pool. You should use the tnsping utility to validate it:

$tnsping ORCL

TNS Ping Utility for HPUX: Version 10.2.0.1.0 - Production on 22-OCT-2009 12:38:33
Copyright (c) 1997, 2005, Oracle.  All rights reserved.
Used parameter files:
/app/oracle/product/10.2.0/network/admin/sqlnet.ora
Used TNSNAMES adapter to resolve the alias
Attempting to contact (DESCRIPTION = (ADDRESS\_LIST = (ADDRESS = (PROTOCOL = TCP)(HOST = myoracleserver)(PORT = 1521))) (CONNECT\_DATA = (SERVICE\_NAME = ORCL)))
OK (0 msec)

If you think you've eliminated these three possibilities then the next step would be to enable tracing in your Oracle Client so that you can see a bit more of what is going on. Add this to your $TNS\_NAMES/sqlnet.ora file:

> trace\_level\_client = 10 trace\_unique\_client = on trace\_file\_client = sqlnet.trc trace\_directory\_client = /tmp

([source](http://www.orafaq.com/wiki/SQL*Net_FAQ#I_have_some_trouble_with_SQL.2ANet._How_does_one_produce_a_trace_file.3F)) You don't have to use /tmp, just make sure it's a writeable directory with enough space.

Now run OBIEE until you get the error and inspect the .trc file you get in the directory you specifed (eg /tmp). You'll hopefully see something like this:

> (42) \[22-OCT-2009 11:12:32:271\] nnftrne: Original name: VALUE\_OF(OLAP\_DSN) (42) \[22-OCT-2009 11:12:32:271\] nnfttran: entry (42) \[22-OCT-2009 11:12:32:271\] nnfgrne: Query unsuccessful, skipping to next adapter (42) \[22-OCT-2009 11:12:32:271\] nnfgrne: exit (42) \[22-OCT-2009 11:12:32:271\] nnfun2a: address for name "VALUE\_OF(OLAP\_DSN)" not found

In this case it showed I'd been an idiot and put VALUE\_OF instead of VALUEOF. OBIEE was therefore trying to use the literal VALUE\_OF(OLAP\_DSN) instead of resolving the variable OLAP\_DSN to the correct DSN to use.

**Don't forget to disable tracing** as soon as you've finished with it, because you'll impact performance and end up with big trace files filling up your disks.
