---
title: "Usage Tracking - only half the story ..."
date: "2009-10-06"
categories: 
  - "OBIEE"
  - "systemsmanagement"
  - "usagetracking"
---

OBIEE comes with a very useful usage tracking feature. For information about it and how to set it up see these links:

- [http://obiee101.blogspot.com/2008/08/obiee-setting-up-usage-tracking.html](http://obiee101.blogspot.com/2008/08/obiee-setting-up-usage-tracking.html)
- [http://www.oracle.com/technology/obe/obe\_bi/bi\_ee\_1013/usage\_tracking/usage\_tracking.htm](http://www.oracle.com/technology/obe/obe_bi/bi_ee_1013/usage_tracking/usage_tracking.htm)
- [http://108obiee.blogspot.com/2009/07/obiee-usage-tracking-setup-and-cloning.html](http://108obiee.blogspot.com/2009/07/obiee-usage-tracking-setup-and-cloning.html)

Usage Tracking captures the logical SQL of queries in a column called QUERY\_TEXT in the table S\_NQ\_ACCT. However, out of the box this column is defined as 1k (1024 bytes) long. In some situations this will limit its usefulness because the text will be truncated if necessary when it's inserted.

When it's truncated you may see this message in NQServer.log: 
```
\[59048\] Usage Tracking encountered an insert statement execution error. This error has occurred 1 times and resulted in the loss of 1 insert statements since this message was last logged. \[nQSError: 17001\] Oracle Error code: 12899, message: ORA-12899: value too large for column "OBIEE\_USAGE\_TRACKING"."S\_NQ\_ACCT"."QUERY\_TEXT" (actual: 1039, maximum: 1024
```


To increase the length of query captured to an Oracle DB do the following:

## Stop nqsserver

Unix: `run-sa.sh stop` Windows: Services -> Stop Oracle BI Server

## ALTER table to increase column length


```sql
alter table s\_nq\_acct modify query\_text varchar2(4000);
```


4000 is the maximum for a varchar2. You could define it as less if you wanted. 1024 is the default out of the OBIEE box.

## Amend RPD physical layer

### Manually - Admin Tool

Load the RPD in the Administration Tool, and edit the properties of the QUERY\_TEXT column in the S\_NQ\_ACCT table. [![1](/images/rnm1978/1.png "1")](/images/2009/10/1.webp) [![2](/images/rnm1978/2.png "2")](/images/2009/10/2.webp)

### Automatically - UDML

**NB this is NOT SUPPORTED by Oracle!!**

Copy this into a text file: 
```xml
DECLARE COLUMN "Oracle Analytics Usage"."Catalog"."dbo"."S\_NQ\_ACCT"."QUERY\_TEXT" AS "QUERY\_TEXT" TYPE "VARCHAR" PRECISION 4000 SCALE 0 NULLABLE PRIVILEGES ( READ);
```


Apply it to the RPD using nqUDMLExec. I've split the statement over multiple lines to make it more readable. `c:\OracleBI\server\Bin\nQUDMLExec.exe -U Administrator -P SADMIN -I c:\extend_query_text.udml -B c:\OrignalRPD.rpd -O c:\UpdatedRPD.rpd`

For more information on using UDML see [here](http://www.rittmanmead.com/2007/10/27/scripting-entries-in-the-oracle-bi-repository/) and [here](http://www.rittmanmead.com/files/andreas_nobbmann_udml_xml.pdf).

## Start nqsserver

Unix: `run-sa.sh start` _or_ `run-sa.sh start64` Windows: Services -> Start Oracle BI Server
