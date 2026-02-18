---
draft: false
title: 'Oracle – tnsping – Message 3513 not found;  product=NETWORK; facility=TNS'
date: "2011-09-26T11:38:10+0100"
image: "/images/2011/09/2011-09-26_1140_-0000.webp"
categories:
- windows
- XE 11gR2
---

Short note to record this, as Google drew no hits on it.

<!--more-->
Windows XP machine with existing Oracle 11.1 client installation, all working fine.

Installed Oracle 11.2 XE, and started getting these errors:

```

C:\Windows\System32>tnsping DBNAME

TNS Ping Utility for 32-bit Windows: Version 11.2.0.2.0 - Production on 26-SEP-2011 11:01:11

Copyright (c) 1997, 2010, Oracle.  All rights reserved.

Used parameter files:
C:\app\userid\product\11.1.0\client_1\network\admin\sqlnet.ora


Used TNSNAMES adapter to resolve the alias
Message 3513 not found;  product=NETWORK; facility=TNS
OK (20 msec)
```

Also got these errors from a previously-functioning ODBC query in Excel when I tried to refresh it:

- [Microsoft][ODBC driver for Oracle][Oracle]
- [Microsoft][ODBC Driver Manager] Driver’s SQLSetConnectAttr failed

Google drew a blank on “Message 3513 not found”, but with a bit of guidance from [Ed Stevens’](http://edstevensdba.wordpress.com/2011/02/16/sqlnet_client_cfg/) and [Charles Hooper’s](http://hoopercharles.wordpress.com/2010/08/30/finding-a-new-home-for-a-client-on-windows/) blogs I checked my PATH variable and found this:

```

C:\Windows\System32>set
[...]
ORACLE_HOME=C:\app\userid\product\11.1.0\client_1\
[...]
Path=C:\oraclexe\app\oracle\product\11.2.0\server\bin;C:\app\userid\product\11.1.0\client_1\bin;C:\Python27\;C:\Python27\Scripts;C:\OracleBI\server\Bin;C:\OracleBI\web\bin;C:\OracleBI\web\catalogmanager;C:\Program Files\Java\jdk1.6.0_26\bin;C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;[...]
[...]
TNS_ADMIN=C:\app\userid\product\11.1.0\client_1\network\admin
[...]
```

PATH is evaluated in order, left to right. Note that the 11.2 XE binaries are now listed before the 11.1 client binaries.

So whilst the TNS\_NAMES and ORACLE\_HOME are still for the 11.1 client, it looks like I’m invoking the 11.2 binaries for tnsping and presumably ODBC driver too.

## How to fix

Moving the path of 11.2 XE bin to the end of the PATH variable fixed the problem. Presumably also removing the 11.2 XE path would have worked.

I don’t know if there are going to be other ramifications of changing this path variable around (presumably XE would start hitting 11.1 binaries??), but it fixed my immediate problem both with TNSPing and the ODBC queries.

## Screenshot

[![](/images/2011/09/2011-09-26_1140_-0000.webp "2011-09-26_1140_ 0000")](/images/2011/09/2011-09-26_1140_-0000.webp)
