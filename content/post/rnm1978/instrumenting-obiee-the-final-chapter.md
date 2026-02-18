---
title: "Instrumenting OBIEE - the final chapter"
date: "2011-10-10"
categories: 
  - "dbms_application_info"
  - "dbms_session"
  - "monitoring"
  - "OBIEE"
  - "performance"
  - "systemsmanagement"
---

 

* * *

 

### _**This article has been superseded by a newer version: [Instrumenting OBIEE Database Connections For Improved Performance Diagnostics](http://www.rittmanmead.com/2015/03/instrumenting-obiee-database-connections-for-improved-performance-diagnostics/)**_

* * *

 

(_Previously on this blog: [1](/2010/01/26/identify-your-obiee-users-by-setting-client-id-in-oracle-connection/), [2](/2011/02/02/instrumenting-obiee-for-tracing-oracle-db-calls/), [3](/2011/08/08/have-you-defined-client_id-in-obiee-yet/)..._)

## Summary

Instrument your code. Stop guessing. Make your DBA happy. Make your life as a BI Admin easier.

## The Problem

OBIEE will typically connect to the database using a generic application account. (Hopefully, you'll have isolated it to an account used only for this purpose - if you haven't, you should.)

The problem is that you lose a lot of visibility of work both up and down the stack.

- An OBIEE query is causing a problem on the database - **how do you identify the originator**?
- You want to investigate the performance of an OBIEE query, but **how do you identify which DB session it is**?

![](/images/rnm1978/2011-10-10_1032_-0000.png "2011-10-10_1032_ 0000") We know SID 491 is causing a problem, but how do we identify the originating OBIEE user?

You **could** start piecing together Usage Tracking and NQQuery.log files, but it's hardly convenient or instantaneous is it?

## The solution

By taking advantage of native Oracle procedures, we can instrument our OBIEE code to pass through lots of valuable information:

![](/images/rnm1978/2011-10-10_1033_-0001.png "2011-10-10_1033_ 0001") Now we can see which OBIEE user fired the query resulting in SID 491, and not only the user, but the dashboard and request name they are running.

This works in both OBIEE 10g and 11g.

See [my previous post here for further background](/2011/02/02/instrumenting-obiee-for-tracing-oracle-db-calls/), and discussion of the procedures used.

## Implementing it - overview

In essence, we harness internal OBIEE session variables which hold the user ID, name, dashboard and report name. We put a set of database calls on the connection pool(s) associated with query requests.

We have to do a bit of trickery to work around two issues.

Firstly, the variables may not be set (you may not have saved your new request yet, or may be running it outside of a dashboard). To get around this, we create two dummy session variables with the same names, and populate them with dummy init blocks.

Secondly, there is a limitation to the number of characters that can be passed through, and so we manipulate the string if necessary to use the right-most characters.

## Implementing it - Init Block and Dummy Variables

### Summary:

Create two init block/session variable pairs:

![](/images/rnm1978/2011-10-10_1145_-0000.png "2011-10-10_1145_ 0000") Session Variables

![](/images/rnm1978/2011-10-10_1145_-0001.png "2011-10-10_1145_ 0001") Initialisation Blocks

Be sure to use a connection pool which isn't used for queries.

### Step-by-step

Load up your RPD. If you haven't already, create a new connection pool that is just for these init blocks. It can be to any database - in the examples below it's an Oracle one, but any that supports selecting from a dummy table like DUAL in Oracle.

Go to Manage -> Variables, click on Session -> Initialisation Blocks. Right click in the section to the right, and select New Initialization Block. ![](/images/rnm1978/2011-10-10_1051_-0000.png "2011-10-10_1051_ 0000")

Call the init block Dummy\_SawSrcPath\_InitBlock, and then click on "Edit Data Source"![](/images/rnm1978/2011-10-10_1053_-0000.png "2011-10-10_1053_ 0000")

Set the Data Source Type to Database, and the init string to


```sql
select '[unsaved request]' from dual
```


Click on Browse to set the Connection Pool used. The connection pool should be one exclusively for init blocks (not the same you use for queries). If you try to use the same connection pool as for queries, you'll most likely get an error when you logon.

Once you've set the connection pool, click on Test - you should get a result as shown: ![](/images/rnm1978/2011-10-10_1125_-0000.png "2011-10-10_1125_ 0000")

If the Test doesn't succeed then you need to fix the problem before you continue.

Assuming it's worked, click OK to return to the Init Block creation window. We now want to define the dummy variable, so to do so click on "Edit Data Target": ![](/images/rnm1978/2011-10-10_1129_-0000.png "2011-10-10_1129_ 0000") Click on New to create a new variable, and give it the name SAW\_SRC\_PATH. Make sure you get the name exactly correct, no typos. Give it a default initializer, and then click OK. ![](/images/rnm1978/2011-10-10_1132_-0000.png "2011-10-10_1132_ 0000") Make sure your init block setup now looks like this: ![](/images/rnm1978/2011-10-10_1137_-0000.png "2011-10-10_1137_ 0000") Click on Test, and expect to get this returned: ![](/images/rnm1978/2011-10-10_1140_-0000.png "2011-10-10_1140_ 0000") Assuming it works, then click OK to save the new Init Block and Variable.

Repeat as above to create an init block/variable pair for SAW\_DASHBOARD, looking like this: ![](/images/rnm1978/2011-10-10_1142_-0000.png "2011-10-10_1142_ 0000")

When you've finished, you should have two init block/variables pairs set up like this:

![](/images/rnm1978/2011-10-10_1145_-0000.png "2011-10-10_1145_ 0000") Session Variables

![](/images/rnm1978/2011-10-10_1145_-0001.png "2011-10-10_1145_ 0001") Initialisation Blocks

## Implementing it - connection pool

Add these three SQL statements to the "Execute before query" of "Connection Scripts" of each Connection Pool which is used for queries. Do not add them to ones which are used for init blocks / authentication etc.


```sql
call dbms_application_info.set_client_info(client_info=>'VALUEOF(NQ_SESSION.DISPLAYNAME)') call dbms_session.set_identifier('VALUEOF(NQ_SESSION.USER)') call dbms_application_info.set_module(module_name=>'OBIEE: ' || case when length('VALUEOF(NQ_SESSION.SAW_DASHBOARD)')<40 then 'VALUEOF(NQ_SESSION.SAW_DASHBOARD)' else '...' || substr('VALUEOF(NQ_SESSION.SAW_DASHBOARD)',-37) end,action_name=>case when length('VALUEOF(NQ_SESSION.SAW_SRC_PATH)')<31 then 'VALUEOF(NQ_SESSION.SAW_SRC_PATH)' else '...' || substr('VALUEOF(NQ_SESSION.SAW_SRC_PATH)',-28) end);
```


![](/images/rnm1978/2011-10-10_1156_-0000.png "2011-10-10_1156_ 0000")

This sets values as follows:

- **Client Identifier** is the OBIEE login **user id**
- **Client Info** is the user's **display name.**
- **Module** and **Action** are populated with the **dashboard** name (prefixed by "OBIEE") and **report** names respectively, truncated to the left if necessary to fit into the field size.

NB CLIENT\_IDENTIFIER and CLIENT\_INFO have a larger capacity so could be used if you want to view more of the report/dashboard detail:


```
V$SESSION column Max value length MODULE 47 ACTION 31 CLIENT_INFO 63 CLIENT_IDENTIFIER 63
```


Reference: [DBMS\_APPLICATION\_INFO](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_appinf.htm#i999290) [DBMS\_SESSION](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_sessio.htm#ARPLS054)

## Testing the changes

If you're currently logged into Answers, logout and log back in. This is necessary for the dummy session variables to populate.

Run this sql\*plus SQL script below to look at any existing OBIEE queries running on the database.


```sql
set linesize 170 col program for a30 col client_info for a20 col client_identifier for a18 col module for a47 col action for a31

SELECT SID,PROGRAM, CLIENT_IDENTIFIER, CLIENT_INFO, MODULE, ACTION FROM V$SESSION WHERE LOWER(PROGRAM) LIKE 'nqsserver%';
```


Now login to Answers, and run an existing report, or create a new one. When you re-run the SQL script you should see your session now listed: ![](/images/rnm1978/2011-10-10_1206_-0000.png "2011-10-10_1206_ 0000")

## Not a fan of sql\*plus?

[If for some strange reason you don't love sql\*plus](http://www.thatjeffsmith.com/archive/2011/05/i-only-use-sqlplus-a-desperate-cry-for-help/), you can obviously use the above SQL in any other SQL client. Or, you can fire up Enterprise Manager and see the same set of information: ![](/images/rnm1978/2011-10-10_1308_-0000.png "2011-10-10_1308_ 0000") (run at a different time from the SQL above, so different report and dashboard names)

## Warning

It's occurred to me that by parsing in user-provided values to a string that's executed on the database, there could be the potential for a breach through SQL Injection via a maliciously named report or dashboard.

I've not been able to find a report name which does cause trouble, but I have never tried exploiting SQL injection before.

It is another good reason to make sure that you're using a DB account solely created for reporting queries from OBIEE, because then its privileges can be greatly restricted. This isn't an excuse not to test for SQL Injection, but a reminder of why good practices such as granting of least privileges exist.

## Troubleshooting

- Make sure you **don't**suffix the database calls with semi-colons (statement terminators). If you do you'll probably get an error like this:
    
    
```
[nQSError: 17001] Oracle Error code: 911, message: ORA-00911: invalid character at OCI call OCIStmtExecute
```

    
- If you're having problems implementing this, or doing further playing around with it, you can see the exact SQL that's executed on connection by bumping up LOGLEVEL and checking NQQuery.log.
- Don't use the same connection pool for the init blocks as you do for queries. If you try this, then the init blocks will fire and try to submit a command on the database which requires the variables that the very init blocks are trying to populate. Confused? OBIEE certainly will be too.
- If someone creates a report or dashboard with single quote in the name, it causes problems. The error will be ambiguous too:![](/images/rnm1978/2011-10-10_1453_-0000.png "2011-10-10_1453_ 0000") State: HY000. Code: 10058. \[NQODBC
