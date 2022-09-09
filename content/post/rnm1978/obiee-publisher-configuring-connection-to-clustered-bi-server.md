---
title: "OBIEE Publisher - configuring connection to clustered BI Server"
date: "2009-03-23"
categories: 
  - "bi-publisher"
  - "cluster"
  - "obiee"
---

I'm setting up a clustered OBIEE 10.1.3.4 production environment. There are four servers; two BI Server + Cluster Controller + Scheduler and two OAS + Presentation Services + Publisher. Clustering of BI is configured, now I'm setting up the other bits. Today is Publisher.  
  
  
On publisher instance A connections to the BI Servers directly work fine:  
jdbc:oraclebi://serverA.fqdn.company.net:9703/ jdbc:oraclebi://serverB.fqdn.company.net:9703/  
both work individually as Connection Strings (with database driver class of oracle.bi.jdbc.AnaJdbcDriver) - verified with "Test Connection" button.  
Connections also work when specifying the hostname only (i.e. no FQDN).  
  
In [Oracle Business Intelligence Enterprise Edition Deployment Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b40058.pdf) p.40 the connection string to use for a cluster is specified:  
jdbc:oraclebi://:9706/PrimaryCCS= Cluster Controller Host>;PrimaryCCSPort=9706;SecondaryCCS= Controller Host>;SecondaryCCSPort=9706  
This doesn't work straight out of the box. Both attempts fail with Could not establish connection.  
1 - documented suggestion :  
jdbc:oraclebi://serverA:9706/PrimaryCCS=serverA;PrimaryCCSPort=9706;SecondaryCCS=serverB;SecondaryCCSPort=9706  
  
2 - adding FQDN to the first instance of the cluster controller host had been suggested by a doc I read :  
jdbc:oraclebi://serverA.fqdn.company.net:9706/PrimaryCCS=serverA;PrimaryCCSPort=9706;SecondaryCCS=serverB;SecondaryCCSPort=9706  
  
3 - add FQDN to all hostnames just for good measure : jdbc:oraclebi://serverA.fqdn.company.net:9706/PrimaryCCS=serverA.fqdn.company.net;PrimaryCCSPort=9706;SecondaryCCS=serverB.fqdn.company.net;SecondaryCCSPort=9706  
  
Thought - we've proved that BI Server is up and running by specifying them as direct connections above, but we've not proved that the Cluster Controller is running. Logging into BI Administrator and using the Cluster Manager proves that all the components are up and running:  
[![](/images/rnm1978/cluster+manager.JPG)](http://3.bp.blogspot.com/_RCx_EVJpczQ/Sceagoj7zUI/AAAAAAAAE1Y/O77f2HeR3tI/s1600/cluster+manager.JPG)  
  
  
  
  
  
  
Since things weren't working as expected, I went looking for some log files.  
It's useful to remember that all J2EE/OAS logs for xmlpserver, analytics, etc can be viewed easily through Enterprise Manager. Log in to EM (in my case it's at http://serverC:7777/em) and then navigate to OC4J home (under the 'Members' section) and then click 'Logs' in the top right of the page.  
In this instance I found the xmlpserver logs under Components - OC4J - home:1 - Application xmlpserver  
NB this also gives you the file path to the log if you prefer not to use the web interface each time: \[OAS home\]/j2ee/home/application-deployments/xmlpserver/home\_default\_group\_1/application.log  
  
There was nothing in the log since startup, so no smoking guns there.  
  
Back to google for a look to see if there's more information on the syntax for the JDBC connection. Searching for jdbc:oraclebi PrimaryCCS threw up the [Oracle Business Intelligence Publisher Administrator's and Developer's Guide](http://download.oracle.com/docs/cd/E12844_01/doc/bip.1013/e12188/T421739T514578.htm)  
From this the connection string can be clearly explained:  

>   
> <URL>:= <Prefix>: \[//<Host>:<Port>/\]\[<Property Name>=<Property Value>;\]\*  
>   
> where  
>   
> <Prefix>: is the string jdbc:oraclebi  
>   
> <Host>: is the hostname of the analytics server. It can be an IP Address or hostname. The default is localhost.  
>   
> <Port> is he port number that the server is listening on. The default is 9703. 
> \[...\]  
>   
> <PrimaryCCS> -(For clustered configurations) specifies the primary CCS machine name instead of using the “host” to connect. If this property is specified, the “host” property value is ignored. The jdbc driver will try to connect to the CCS to obtain the load-balanced machine. Default is localhost.  

From the syntax in the doco I added LogLevel and LogFilePath to jdbc connection string, but didn't get any logs produced.  
Changed the Publisher logging level to Debug (Admin>System Maintenance>Server Configuration) and through OAS restarted xmlpublisher. Tested clustered connection string again but got no more detailed log. Changed logging level back to Exception.  
  
Resorted to searching Metalink and Metalink 3 (because one support system would be too obvious). Hit straight away in Metalink 3 doc ID 559795.1 "BI Publisher does not accept cluster jdbc connection strings" - a semi colon is missing from the end of the statement!  

[![](/images/rnm1978/success%21.JPG)](http://2.bp.blogspot.com/_RCx_EVJpczQ/ScetqudeQsI/AAAAAAAAE1o/uGn78OGUSfc/s1600/success%21.JPG)  

  
This now works fine:  
jdbc:oraclebi://serverA:9706/PrimaryCCS=serverA;PrimaryCCSPort=9706;SecondaryCCS=serverB;SecondaryCCSPort=9706;  
For reference, this also works fine:  
jdbc:oraclebi://badgerbadgerbadger:9706/PrimaryCCS=serverA;PrimaryCCSPort=9706;SecondaryCCS=serverB;SecondaryCCSPort=9706;  
(i.e. the first hostname is ignored, as stated in the documentation)  
  
This documentation error is listed as bug 7499504  
  
Moral of the lessons is - check Metalink for bugs first!
