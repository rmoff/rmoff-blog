+++
author = "Robin Moffatt"
categories = ["obiee", "jdbc", "jisql", "logical sql"]
date = 2016-03-28T21:01:00Z
description = ""
draft = false
image = "/images/2016/03/2016-03-28_22-53-18.png"
slug = "connecting-to-obiee-via-jdbc-with-jisql"
tags = ["obiee", "jdbc", "jisql", "logical sql"]
title = "Connecting to OBIEE via JDBC - with jisql"

+++

OBIEE supports JDBC as a connection protocol, using the driver available on all installations of OBIEE, [bijdbc.jar](https://docs.oracle.com/middleware/11119/biee/BIEIT/odbc_data_source.htm#BIEIT1738). This makes connecting to OBIEE from custom or third-party applications very easy. Once connected, you issue "Logical SQL" against the "tables" of the Presentation Layer. An example of logical SQL is: 

```sql
SELECT "Time"."T05 Per Name Year" saw_0 FROM "A - Sample Sales"
```
To find more Logical SQL simply inspect your nqquery.log (obis-query.log in 12c), or Usage Tracking. 

You can use JDBC from the command line with [`jisql`](http://www.xigole.com/software/jisql/jisql.jsp), which is a useful command-line JDBC client. This is a handy way to explore and validate the JDBC connectivity of OBIEE.

You'll find the OBIEE JDBC driver in `$FMW_HOME/Oracle_BI1/bifoundation/jdbc` (11g) or `$ORACLE_HOME/bi/bifoundation/jdbc/` (12c)

Invoke `jisql` under java, passing `jisql` and `bijdbc` in the `classpath`, followed by the library name, and then the OBIEE server connection details: 

```
java \
-classpath jisql-2.0.11.jar:jopt-simple-3.2.jar:lib/javacsv.jar:bijdbc.jar \
com.xigole.util.sql.Jisql \
-driver oracle.bi.jdbc.AnaJdbcDriver \
-cstring jdbc:oraclebi://obieesampleapp:9703/
-user Prodney \
-password Admin123 \
```
To find out the port that the BI Server is listening on one quick method is with `netstat`: 

```
[oracle@demo biee]$ netstat -plnt|grep nqsserver
(Not all processes could be identified, non-owned process info
 will not be shown, you would have to be root to see it all.)
tcp        0      0 :::7792                     :::*                        LISTEN      14740/nqsserver
tcp        0      0 :::7793                     :::*                        LISTEN      14740/nqsserver
```

This is an example from SampleApp v511 (OBIEE 12c) - the BI Server listens on two ports, one for ODBC/JDBC inbound, the other for Cluster Controller 'heartbeats'. In this case it's 7792 and 7793 respectively, and you'd be able to confirm for definite by checking the config/log files. 

So back to the connection example, using an older version of SampleApp, in which the BI Server is listening on port 9703. Here's an example of connecting, and by using `-driverinfo` as well it show's some additional information about the connection before exiting: 

```
[oracle@obieesampleapp jisql-2.0.11]$ ~/obiee/Oracle_BI1/jdk/bin/java -classpath lib/jisql-2.0.11.jar:lib/jopt-simple-3.2.jar:lib/javacsv.jar:/home/oracle/obiee/Oracle_BI1/bifoundation/jdbc/bijdbc.jar com.xigole.util.sql.Jisql -user Prodney -password Admin123 -driver oracle.bi.jdbc.AnaJdbcDriver -driverinfo -debug -cstring  jdbc:oraclebi://obieesampleapp:9703/
Feb 6, 2013 10:10:39 PM oracle.bi.jdbc.AnaJdbcDriver connect
INFO: connect to SECONDARYCCSPORT=9706;MAXRECONNECTATTEMPTS=3;TRUSTANYSERVER=true;PRIMARYCCSPORT=9706;MAXRPCCLIENTCREATEATTEMPTS=3;USER=Prodney;HEARTBEATINTERVAL=60;MAXHEARTBEATATTEMPTS=3;MAXRPCCLIENTCOUNT=100;SSL=false;TRUSTSTOREPASSWORD=***;PASSWORD=***;SECONDARYCCS=;PORT=9703;CATALOG=;HOST=obieesampleapp;PRIMARYCCS=;SSLKEYSTOREPASSWORD=***;RPCCLIENTEXPIRATIONTIME=60;
driver.getMajorVersion() is 1
driver.getMinorVersion() is 0
driver is not JDBC compliant
metaData.getDatabaseProductName(): "Oracle Business Intelligence"
metaData.getDatabaseProductVersion(): "11.1.1.6.2"
metaData.getDriverName(): "Oracle Business Intelligence"
metaData.getDriverVersion(): "11.1.1.6.2"
```

Run the same as above, but without `-driverinfo` to get a query prompt. To issue a command in `jisql`, use `go` as command terminator: 
	
	Enter a query:
	1 > SELECT 0 s_0, "Airlines Traffic"."Month"."Month of Year" s_1,   "Airlines Traffic"."Route"."Route" s_2, "Airlines Traffic"."Traffic Facts"."# Depts Performed" s_3 FROM "Airlines Traffic" ORDER BY 1, 2 ASC NULLS LAST, 3 ASC NULLS LAST fetch first 5 rows only
	2 > go
	         s_0 |          s_1 |      s_2 |                    s_3 | 
	-------------+--------------+----------+------------------------|
	           0 |            1 |  ABE-ATL |                   51.0 | 
	           0 |            1 |  ABE-AVP |                   22.0 | 
	           0 |            1 |  ABE-CLE |                   42.0 | 
	           0 |            1 |  ABE-CLT |                   85.0 | 
	           0 |            1 |  ABE-DTW |                   65.0 | 
	
	Enter a query:
	1 > 
	
You can also pass an input file that holds the commands to run. Remember the command terminator - by default it's `go` so that needs to be in your input file.
	
	[oracle@obieesampleapp jisql-2.0.11]$ time ~/obiee/Oracle_BI1/jdk/bin/java -classpath lib/jisql-2.0.11.jar:lib/jopt-simple-3.2.jar:lib/javacsv.jar:/home/oracle/obiee/Oracle_BI1/bifoundation/jdbc/bijdbc.jar com.xigole.util.sql.Jisql -user Prodney -password Admin123 -driver oracle.bi.jdbc.AnaJdbcDriver -cstring  jdbc:oraclebi://obieesampleapp:9703/ -input ~/test_report.lsql | tail
	Feb 6, 2013 10:16:46 PM oracle.bi.jdbc.AnaJdbcDriver connect
	INFO: connect to SECONDARYCCSPORT=9706;MAXRECONNECTATTEMPTS=3;TRUSTANYSERVER=true;PRIMARYCCSPORT=9706;MAXRPCCLIENTCREATEATTEMPTS=3;USER=Prodney;HEARTBEATINTERVAL=60;MAXHEARTBEATATTEMPTS=3;MAXRPCCLIENTCOUNT=100;SSL=false;TRUSTSTOREPASSWORD=***;PASSWORD=***;SECONDARYCCS=;PORT=9703;CATALOG=;HOST=obieesampleapp;PRIMARYCCS=;SSLKEYSTOREPASSWORD=***;RPCCLIENTEXPIRATIONTIME=60;
	           0 |           12 |  XNA-LAX |                    9.0 | 
	           0 |           12 |  XNA-LEX |                    1.0 | 
	           0 |           12 |  XNA-LGA |                   54.0 | 
	           0 |           12 |  XNA-MEM |                   85.0 | 
	           0 |           12 |  XNA-MSP |                   52.0 | 
	           0 |           12 |  XNA-OKC |                    1.0 | 
	           0 |           12 |  XNA-ORD |                  186.0 | 
	           0 |           12 |  YUM-IPL |                   31.0 | 
	           0 |           12 |  YUM-LAX |                  116.0 | 
	           0 |           12 |  YUM-PHX |                  186.0 | 
	
	real    0m5.732s
	user    0m0.849s
	sys     0m2.761s
	
