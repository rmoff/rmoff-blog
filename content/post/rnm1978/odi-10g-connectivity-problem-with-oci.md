---
title: "ODI 10g connectivity problem with OCI"
date: "2011-08-04"
categories: 
  - "odi"
---

Trying to connect to a repository in ODI using OCI. Target database is Oracle 11.1.0.7. ![](/images/rnm1978/2011-08-04_1129_-0000.png "2011-08-04_1129_ 0000")

Throws this error: 
```
com.sunopsis.sql.l: Oracle Data Integrator Timeout: connection with URL jdbc:oracle:oci8:@ODIPRD and user ODI_USER.
	at com.sunopsis.sql.SnpsConnection.a(SnpsConnection.java)
	at com.sunopsis.sql.SnpsConnection.t(SnpsConnection.java)
	at com.sunopsis.sql.SnpsConnection.connect(SnpsConnection.java)
	at com.sunopsis.tools.connection.DwgRepositoryConnectionsCreator.a(DwgRepositoryConnectionsCreator.java)
	at com.sunopsis.tools.connection.DwgRepositoryConnectionsCreator.a(DwgRepositoryConnectionsCreator.java)
	at com.sunopsis.graphical.l.oi.a(oi.java)
[...]
```


Normally this error would be caused by a misconfigured Oracle client. For example, a missing or incorrect tnsnames.ora entry. I validated these and got a successful response using tnsping.

It turns out that there are two versions of the /drivers/ojdbc5.jar file, and only one of them would work. The difference in files is this: 
```
Bytes    Date modified  File
-------  -------------  ------------------
2030460  Mar 11 00:22   ojdbc5.notwork.jar
1879924  Jul 25  2007   ojdbc5.works.jar
```


Extracting the jar files and examining META-INF/manifest shows the difference: [![](/images/2011/08/2011-08-04_1119_-0000.webp "2011-08-04_1119_ 0000")](/images/2011/08/2011-08-04_1119_-0000.webp)

## Solution

Use the correct version of ojdbc5.jar.

Looking at the downloads for ojdbc5.jar, there are different versions of ojdbc5.jar for different versions of the database.

The version that worked for me was for [11.1.0.6](http://www.oracle.com/technetwork/database/enterprise-edition/jdbc-111060-084321.html) (1,879,860 bytes). The version that doesn't work for me is presumably one for 11.2. I've not tested with the 11.1.0.7 one.
