---
title: "Multiple RPDs on one server - Part 1 - the BI Server"
date: "2009-08-25"
categories: 
  - "obiee"
  - "sawserver"
  - "unix"
---

## Introduction

In this article I plan to get samplesales and paint repositories hosted on a single server, using one BI Server instance and two Presentation Services instances. This is on both Unix (OEL 4) and Windows, and both OC4J (OBIEE's "basic installation" option) and OAS ("Advanced Installation").

Both samplesales and paint are shipped with 10.1.3.4 of OBIEE, you'll find them in $OracleBI/OracleBI/server/Sample. This article assumes you've got the RPD of each into $OracleBI/OracleBI/server/Repository and unpacked the web cats for each into $OracleBIdata/web/catalog. It also assumes that you know your way around the architecture of BI and are familiar with NQSConfig.ini and instanceconfig.xml - if neither of those files mean anything to you then you will find some [background reading](http://obiee101.blogspot.com/2009/07/obiee-how-to-get-started.html) useful.

## Verify paint and samplesales RPDs

Check that both paint and samplesales both work independently before we start trying to get them to work alongside each other.

#### paint.rpd

Set NQSConfig.ini to

\[sourcecode language='shell'\] \[ REPOSITORY \] Star = paint.rpd ; \[/sourcecode\]

and instanceconfig.xml to

\[sourcecode language='xml'\] /data/web/catalog/paint \[/sourcecode\]

(assuming $OracleBIData is /data/web)

Restart BI Server and Presentation Services. Login and check you get something like this:

![Oracle BI Interactive Dashboards_1251110032149](http://rnm1978.files.wordpress.com/2009/08/oracle-bi-interactive-dashboards_1251110032149.png?w=300 "Oracle BI Interactive Dashboards_1251110032149")

#### samplesales.rpd

Set NQSConfig.ini to

\[sourcecode language='shell'\] \[ REPOSITORY \] Star = samplesales.rpd ; \[/sourcecode\]

and instanceconfig.xml to

\[sourcecode language='xml'\] /data/web/catalog/samplesales \[/sourcecode\]

(assuming $OracleBIData is /data/web)

Restart BI Server and Presentation Services. Login and check you get something like this:

![Oracle BI Interactive Dashboards_1251110222626](http://rnm1978.files.wordpress.com/2009/08/oracle-bi-interactive-dashboards_1251110222626.png?w=300 "Oracle BI Interactive Dashboards_1251110222626")

If you don't get these working then you need to before continuing. See [here](http://myobieeworld.blogspot.com/2009/02/how-to-use-samplesales-repository.html) for information on setting up samplesales

## Configuring both RPDs alongside each other

Edit the NQSConfig.ini file to :

\[sourcecode language='shell'\] \[ REPOSITORY \] samplesales = samplesales.rpd , DEFAULT; paint = paint.rpd ; \[/sourcecode\]

See page 201 of the [Installation and Configuratino guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31765.pdf) for the syntax, which is basically: <logical name> = <filename>.rpd; The default logical name is Star, but it doesn't have to be this. If just one repository is loaded in BI Server then it will be connected to for all incoming connections, assuming you have left the Repository= statement as default in the odbc.ini configuration file.

It's important to understand here how Presentation Services communicates with BI Server. The BI Server uses the ODBC protocol to communicate with all clients, and that includes Presentation Services. Don't confuse this ODBC with the the protocol that BI Server uses to communicate with the database, which may or may not be ODBC (or OCI, etc). The configuration for Presentation Services communicating with BI Server is in instanceconfig.xml which defines the ODBC DSN to use in the WebConfig > ServerInstance > DSN tag.

#### ODBC config - Unix

> The DSN is defined in $OracleBI/setup/odbc.ini. To test that BI Server is running both RPDs, add two new entries to your odbc.ini file, copying the existing AnalyticsWeb, and specifying the Repository in each:
> 
> \[sourcecode language='xml'\] \[...\]
> 
> \[AnalyticsWebPaint\] \[...\] Repository=Paint \[...\]
> 
> \[AnalyticsWebSampleSales\] \[...\] Repository=SampleSales \[...\] \[/sourcecode\]

#### ODBC config - Windows

> The DSN is defined in the GUI ODBC Data Source Administrator (odbcad32.exe) under System DSNs, Driver type Oracle BI Server. As above create two new DSNs, one for Paint and one for SampleSales, and put the repository name in the "Change the default repository to" box. If you've updated your NQSConfig.ini as above and restarted BI Server then you should be able to tick "Connect to Oracle BI Server to obtasin defaultsettings \[...\]" and click Next and get a successful connection.

#### Common errors

**nQSError: 43004 repository name: is invalid** : Review your NQSConfig.ini logical repository name (on the left of the config line, default is Star) **Path not found ... Error Codes: U9KP7Q94**: Check your CatalogPath is correct in instanceconfig.xml.

#### Testing the BI server with two RPDs

Update your instanceconfig.xml and change AnalyticsWeb for AnalyticsWebSampleSales, and make sure the CatalogPath is that of the samplesales webcat. Restart Presentation Services, and log in to Dashboards and verify that the samplesales repo is in use.

Do the same for Paint (update instanceconfig.xml to use AnalyticsWebPaint, and CatalogPath set to paint web repo).

## Next steps

You've now got a single BI server hosting two repositories. See [Part 2 - Presentation Services](/2009/08/25/multiple-rpds-on-one-server-part-2-presentation-services) for setting up multiple Presentation Services to work with these repositories.

## References / sources

- [Borkur Steingrimsson's article on Rittman Mead](http://www.rittmanmead.com/2007/09/11/managing-multiple-presentation-services-on-the-same-unix-box/)
- [OTN forum topic "can OBIEE run two rpd files at the same time?"](http://forums.oracle.com/forums/thread.jspa?threadID=607551)
- [Changa Reddy's blog posting](http://obi-experience.blogspot.com/2008/04/multiple-instances-of-obieecomponents.html)
- [OTN forum topic "Presentation Server port wont change"](http://forums.oracle.com/forums/thread.jspa?threadID=947711&tstart=0)
- [Giorgio's post on OTN](http://forums.oracle.com/forums/thread.jspa?threadID=714730&tstart=0)
- [John Minkjan's 10.1.3.4.1 config tags document](http://docs.google.com/fileview?id=0B8vnN_oQ0v04MTYwNzI1ODktYmZkNy00MzJlLTkwNGUtYmU3ZjgwMDc3OTQ4&hl=en)
- [B.Vellinger's blog posting](http://bvellinger.blogspot.com/2008/01/obiee-10132-and-multiple-presentation.html)
- [BI Server Administration Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31770.pdf)
- [Presentation Services Administration Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31766.pdf)
- [Installation and Configuratinon guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31765.pdf)
