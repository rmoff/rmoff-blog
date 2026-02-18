---
title: "What am I missing here??? ORA-01017: invalid username/password; logon denied"
date: "2010-05-06"
categories: 
  - "dac"
  - "ora-01017"
  - "oracle"
---

What's going on here? The username/password is definitely valid, proved by the sqlplus connection.

Configuring DAC in OBIA 7.9.5.1:


```
What can I do for you?

1 - Enter repository connection information 2 - Test repository connection 3 - Enter email account information 4 - Send test email 5 - Save changes 6 - Exit

Please make your selection: 1

These are your connection type choices:

1 - MSSQL 2 - DB2 3 - Oracle (OCI8) 4 - Oracle (Thin) 5 - Keep current ( Oracle (Thin) )

Please make your selection: 4

Current value for Instance is MYDB. Press return to keep it or enter a new value. > MYDB

Current value for Database Host is server.company.com. Press return to keep it or enter a new value. > server.company.com

Current value for Database Port is 1521. Press return to keep it or enter a new value. > 1521

Current value for Table owner name is DAC\_REPO\_795. Press return to keep it or enter a new value. > DAC\_REPO\_795

Press return to keep current password, enter a new value otherwise. > HAS425Al

What can I do for you?

1 - Enter repository connection information 2 - Test repository connection 3 - Enter email account information 4 - Send test email 5 - Save changes 6 - Exit

Please make your selection: 2

Connecting to repository... Can't connect to the database. ORA-01017: invalid username/password; logon denied
```


Validate connectivity with SQLPLUS:


```
$sqlplus DAC\_REPO\_795/HAS425Al@MYDB

SQL\*Plus: Release 10.2.0.1.0 - Production on Thu May 6 16:08:44 2010

Copyright (c) 1982, 2005, Oracle. All rights reserved.

Connected to: Oracle Database 11g Enterprise Edition Release 11.1.0.7.0 - 64bit Production With the Partitioning, OLAP, Data Mining and Real Application Testing options

SQL>
```


Resolved by forcing the password to uppercase, but all our other DAC installations don't require this, and this DAC installation connects with a mixed-case password to a different Oracle instance with no problem.

sys.aud$ shows the connection coming in, so I'm definitely hitting the correct Oracle instance with the correct username. Presumably the password is getting corrupted somewhere, but why, and why only in this particular instance??

What on earth am I missing???

* * *

**Update:** Thanks for people's comments. 1) All the databases are 11.1.0.7 2) All databases are sec\_case\_sensitive\_logon = TRUE

The schema in question had been created through expdp/impdp of another schema on the same DB.

I've discovered an SR with similar symptoms for a different bit of Oracle software (SOA / OC4J), but in common both use JDBC drivers to connect to Oracle 11g. I'm confident that the problem must lie in here somewhere, but cannot replicate it even with many different JDBC versions: 11.1.0.7 10.2.0.1.0 10.1.0.5.0 9.0.2.0.0

\*scratches head\*
