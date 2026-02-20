---
title: "Querying SQL Server from OBIEE running on Unix"
date: "2009-08-21"
url: "/2009/08/21/querying-sql-server-from-obiee-running-on-unix/"
categories: 
  - "OBIEE"
  - "sqlserver"
  - "unix"
  - "windows"
---

A question that pops up on the [OBIEE OTN forum](http://forums.oracle.com/forums/adfAuthentication?success_url=/forum.jspa?forumID=378) quite often is how to use non-Oracle databases like MS SQL Server when the OBIEE server is running on a non-Windows OS such as Linux.

The answer in a nutshell is that since version 10.1.3.3.1 OBIEE has been bundled with ODBC drivers for unix/linux from a company called DataDirect. See the [release notes here](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/e10416/general_101331.htm#BABDHJAG) for more information and installation instructions (as well as a list of support databases).

The instructions are pretty simple but here's a step-by-step guide, in this instance for data on SQL Server. The steps vary a bit for other database so check the release notes.

- On **Windows** define a System DSN for your SQL Server database. Set the default database to the database you are working with
- Build and test your RPD, setting your connection pool to ODBC 3.5 and data source name to the DSN you defined in step (1).
- On your **Linux** (or unix, but from here on I'll just write Linux!) box, locate the fully-qualified path to the ODBC driver file, SEmsss23.so. It should be in $OracleBI/odbc/lib (or lib64)
- Backup $OracleBI/setup/odbc.ini
- Copy the entry from the [release notes](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/e10416/general_101331.htm#BABDHJAG) into odbc.ini.

> \[YourDSNHere\] Driver=/path/to/OracleBI/odbc/lib/SEmsss23.so Description=DataDirect 5.1 SQL Server Wire Protocol Address=0.0.0.0,1433 AlternateServers= AnsiNPW=Yes ConnectionRetryCount=0 ConnectionRetryDelay=3 Database=yourDB LoadBalancing=0 LogonID= Password= QuoteID=No ReportCodePageConversionErrors=0
> 
> Points to note:
> 
> - The header of the entry should correspond to your DSN you used on Windows:
> - The Address should be the IP (I've not tested with hostname) of the SQL Server, then a comma, then the port (default1433). It is a comma, not a colon!
> - Remember to set Database to the database that you're using
> - [Full documentation is on the DataDirect website](http://www.datadirect.com/download/docs/odbc/allodbc/help.htm)

- For SQL Server, backup $OracleBI/server/Config/DBFeatures.INI and then edit it to change
    
    \[ DATA\_SOURCE\_FEATURE = SQL\_SERVER\_70 \]
     \[...\]
    IDENTIFIER\_QUOTE\_CHAR = '"';
    \[...\]
    
    to
    
    \[ DATA\_SOURCE\_FEATURE = SQL\_SERVER\_70 \]
     \[...\]
    IDENTIFIER\_QUOTE\_CHAR = '';
    \[...\]
    
    (if your Database in the Physical Database data source definition is not SQL Server 7.0/2000 then you'll need to edit the relevant SQL\_SERVER section)
- Copy across your RPD to your linux server and start BI Server up.
- Use the Issue SQL Directly function of Answers to trial the connection (or through nqcmd, or Oracle ODBC client). If you get an error double check your odbc.ini configuration. Also, make your you have "Use Oracle BI Presentation Services Cache" **UNTICKED**, as it will cache the response to your query so even if everything's set up correctly after fixing an error you'll still get an apparent failure!![odbc02](/images/rnm1978/odbc021.png "odbc02")
- If everything works you should see your data returned:

![odbc01](/images/rnm1978/odbc011.png "odbc01")
