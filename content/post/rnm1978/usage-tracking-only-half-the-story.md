---
draft: false
title: 'Usage Tracking – only half the story …'
date: "2009-10-06T10:28:38+0100"
image: "/images/2009/10/1.webp"
categories:
- obiee
- systemsmanagement
- usagetracking
---

OBIEE comes with a very useful usage tracking feature. For information about it and how to set it up see these links:

<!--more-->
- <http://obiee101.blogspot.com/2008/08/obiee-setting-up-usage-tracking.html>
- <http://www.oracle.com/technology/obe/obe_bi/bi_ee_1013/usage_tracking/usage_tracking.htm>
- <http://108obiee.blogspot.com/2009/07/obiee-usage-tracking-setup-and-cloning.html>

Usage Tracking captures the logical SQL of queries in a column called QUERY\_TEXT in the table S\_NQ\_ACCT. However, out of the box this column is defined as 1k (1024 bytes) long. In some situations this will limit its usefulness because the text will be truncated if necessary when it’s inserted.

When it’s truncated you may see this message in NQServer.log:

```

     [59048] Usage Tracking encountered an insert statement execution error.  This error has occurred 1 times and resulted in the loss of 1 insert statements
 since this message was last logged.
     [nQSError: 17001] Oracle Error code: 12899, message: ORA-12899: value too large for column "OBIEE_USAGE_TRACKING"."S_NQ_ACCT"."QUERY_TEXT" (actual: 1039, maximum: 1024
```

To increase the length of query captured to an Oracle DB do the following:

## Stop nqsserver

Unix: `run-sa.sh stop`  
Windows: Services -> Stop Oracle BI Server

## ALTER table to increase column length

```

alter table s_nq_acct modify query_text varchar2(4000);
```

4000 is the maximum for a varchar2. You could define it as less if you wanted. 1024 is the default out of the OBIEE box.

## Amend RPD physical layer

### Manually – Admin Tool

Load the RPD in the Administration Tool, and edit the properties of the QUERY\_TEXT column in the S\_NQ\_ACCT table.  
[![1](/images/2009/10/1.webp "1")](/images/2009/10/1.webp)  
[![2](/images/2009/10/2.webp "2")](/images/2009/10/2.webp)

### Automatically – UDML

**NB this is NOT SUPPORTED by Oracle!!**

Copy this into a text file:

```

DECLARE COLUMN "Oracle Analytics Usage"."Catalog"."dbo"."S_NQ_ACCT"."QUERY_TEXT" AS "QUERY_TEXT" TYPE "VARCHAR" PRECISION 4000 SCALE 0  NULLABLE PRIVILEGES ( READ);
```

Apply it to the RPD using nqUDMLExec. I’ve split the statement over multiple lines to make it more readable.  
 `c:\OracleBI\server\Bin\nQUDMLExec.exe  
-U Administrator  
-P SADMIN  
-I c:\extend_query_text.udml  
-B c:\OrignalRPD.rpd  
-O c:\UpdatedRPD.rpd`

For more information on using UDML see [here](http://www.rittmanmead.com/2007/10/27/scripting-entries-in-the-oracle-bi-repository/) and [here](http://www.rittmanmead.com/files/andreas_nobbmann_udml_xml.pdf).

## Start nqsserver

Unix: `run-sa.sh start` *or*  `run-sa.sh start64`  
Windows: Services -> Start Oracle BI Server
