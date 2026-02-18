---
draft: false
title: 'Mark Rittman’s OBIEE repository for DAC'
date: "2009-07-23T10:07:00+0000"
categories:
- dac
- etl
- obiee
---

[Mark Rittman has an excellent article](http://www.rittmanmead.com/2009/01/30/analyzing-bi-apps-etl-runs-using-obiee-and-the-dac-repository/) about querying the DAC repository database tables, including a [downloadable RPD file](http://www.rittmanmead.com/files/DAC%20Analysis.rpd). Being new to working with RPDs I thought it would be good practise to explore this as well as hopefully get some useful information about our current ETL deployment.

<!--more-->
I downloaded the RPD to c:\OracleBI\server\Repository and opened it up in the Admin tool (Administrator/Administrator).  
First off I changed the connection pool to point to my DAC repository database, having setup a TNS entry for it first.

Then I had to rename the physical schema from DAC to DAC\_REPO, and moved S\_ETL\_DAY from S\_NQ\_ACCT to DAC\_REPO — both of these are just how our DBs laid out, [YMMV](http://en.wikipedia.org/wiki/Your_mileage_may_vary)

To test the connectivity I did Update Row Count over one of the tables, and got

> There was an error while updating row count for “ORCL”..”DAC\_REPO”.”S\_ETL\_DAY”:  
> [nQSError: 17001] Oracle Error code:942, message: ORA-00942: table or view does not exist …

I’d already checked where the tables did reside through SQL Developer:  
*(Image no longer available)*Since my connection was defined with a user other than the schema owner (DAC\_REPO), I figured it was maybe not qualifying the table name, so found this in the connection pool settings:  
*(Image no longer available)*I could then update the row counts, with the following exceptions which are columns defined in the RPD but not present in my DAC repository schema (v7.9.5.1):  
W\_ETL\_FOLDER.PRIORITY, W\_ETL\_RUN\_STEP.GROUP\_NAME and W\_ETL\_RUN\_STEP.RUN\_MODE

I deleted these from the Physical layer, hoping that it would warn me if they’re used in the BMM or Presentation layer. It didn’t – but running a Global Consistency Check warned me that Run Mode is used in the Task Runs logical table, so I deleted it from there too.

I saved the RPD and change my NQServer.config to point to it:  
*(Image no longer available)*Starting up BI Server I got an error:

> 2009-07-23 11:47:45  [nQSError: 26011] File C:\OracleBI\server\Config\NQSConfig.INI Near Line 30, near : Syntax error [nQSError: 26012] .

So I guess it’s not happy with the spaces in the filename. I changed it to

> Star = “DAC Analysis.rpd”, DEFAULT;

and it starts up fine. I then got an error trying to log into Answers:

> Error connecting to the Oracle BI Server: The specified ODBC DSN is referencing a subject area that no longer exists within the Oracle BI Repository.
>
> State: 08004. Code: 10018. [NQODBC] [SQL\_STATE: 08004] [nQSError: 10018] Access for the requested connection is refused. [nQSError: 43037] Invalid catalog, Sample Sales, specified. (08004)

(I like the fact that Presentation Services parses the ODBC error into something more intelligable. I’d have eventually figured it out from the ODBC error, but being told up front what the problem is doesn’t happen enough with computer errors:) )

This happened because in my system DSN (pointed to in the Presentation Services instanceconfig.xml) I had checked the “Change default catalog to” box, and it was trying to find SampleSales in the repository when it didn’t exist.  
*(Image no longer available)*Unticking this box finally let me log in  
*(Image no longer available)*  
On a specific point, the “# Succesful” and “# Failed” measures in Task Runs refer to the number of rows, not number of tasks as it could be interpreted.

The RPD is described by Mark Rittman as:

> […] no means finished or error tested, but if you want to see how I put the example together, feel free to download it and see how it’s put together.[…]

and this is a fair description of it. It’s a great starting point which has done a lot of the hard work, and it is very useful as a head-start for understanding the DAC repository tables.  
However, it would be wrong to think of it as an out-the-box solution for super-fancy reporting against the DAC. Realistically you still need to understand the tables and data that you’re analysing otherwise you’ll come up with misleading or plain wrong reports.  
But that said, if you have a DAC deployment that you maybe want to do some serious performance work with and want a way to visualise what’s going on in your batch, this is a great starting place.
