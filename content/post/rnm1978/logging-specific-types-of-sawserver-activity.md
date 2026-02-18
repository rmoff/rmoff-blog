---
draft: false
title: 'Logging specific types of sawserver activity'
date: "2009-08-20T13:13:14+0000"
categories:
- config
- log
- sawserver
---

As well as tinkering with the sawserver (Presentation Services) [logging level](/post/rnm1978/sawserver-logging-configuration-logconfig-xml//) and [format](/post/rnm1978/sawserver-log-short-format//), we can specific which bits of the log we’re interested in. This is useful for two reasons:

<!--more-->
1. We can enable detailed logging for a specific area, without impacting performance as much as detailed logging throughout would cause
2. By only logging in detail the area of interest we can more easily read the log output and not have to wade through pages of irrelevant information

Chapter 9 (“Using the Oracle BI Presentation Services Logging Facility”) of the [Presentation Services Administration Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31766.pdf) details the log configuration.

To capture, for example, only inbound and outbound HTTP logs, you would amend your logconfig.xml to include this in the <Filters> section, where **path** is the restriction you want to apply.

```

<FilterRecord writerClassGroup="File" path="saw.httpserver.request" information="51" warning="100" error="100" security="41" />
<FilterRecord writerClassGroup="File" path="saw.httpserver.response" information="51" warning="100" error="100" security="41" />
```

If you want to write the information to a separate file, define a new **Writer**:

```

<Writers>
[...]
<Writer implementation="FileLogWriter" name="Global File Logger" writerClassId="7" dir="/tmp" filePrefix="sawodbc"/>
[...]
</Writers>
```

(use an unused writerClassId)  
and **WriterClassGroup**:

```

 <WriterClassGroups>
[...]
<WriterClassGroup name="FileODBC">7</WriterClassGroup>
[...]
 </WriterClassGroups>
```

and use the newly defined WriterClassGroup in the Filter:

```

 <FilterRecord writerClassGroup="FileODBC" path = "saw.odbc" information="51" warning="100" error="100" security="41"/>
```

All of the odbc logging will now be written to a file in /tmp called sawodbc0.log.

To get a list of all possible path values, run sawserver with the -logsources commandline option

```

$ . ./common.sh
$ . ./sa-init.sh
$ sawserver -logsources
saw
saw.SOAP
saw.SOAP.JobManagementService
saw.answers
saw.answers.search
saw.authconfigmanager
saw.authconfigmanager.initialize
saw.cacheseeding
saw.catalog
saw.catalog.archive
saw.catalog.archive.merge
saw.catalog.archive.read
saw.catalog.archive.write
saw.catalog.archive.write.singleobject
saw.catalog.file
saw.catalog.filelock
saw.catalog.impl
saw.catalog.impl.cleanup
saw.catalog.impl.explainPermissions
[...etc etc...]
```
