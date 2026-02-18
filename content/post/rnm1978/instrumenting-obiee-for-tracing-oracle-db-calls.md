---
draft: false
title: 'Instrumenting OBIEE for tracing Oracle DB calls'
date: "2011-02-02T15:04:00+0000"
image: "/images/2011/02/snag-2011-01-28-16-00-18-0000.webp"
categories:
- log
- monitoring
- obiee
- oracle
- performance
- usagetracking
---

Cary Millsap recently published a paper “[Mastering Performance with Extended SQL Trace](http://carymillsap.blogspot.com/2011/01/new-paper-mastering-performance-with.html)” describing how to use Oracle trace to assist with troubleshooting the performance of database queries.  
As with all of Cary Millsap’s papers it is superbly written, presenting very detailed information in a clear and understandable way. (and yes I do have a [DBA crush](http://dbakevlar.com/?p=46) ;-))  
It discusses how you can automate the tracing of specific sessions on the database, and requiring the application to be appropriately instrumented. This reminded me of a post that I made almost exactly 12 months ago [here](/post/rnm1978/identify-your-users-by-setting-client-id-in-oracle//), where I explained how to pass through the username of the OBIEE user to the database. Initially I thought it would be useful simply for being able to pin a rogue query to an end-user, but reading Cary’s paper made me realise there is more potential to it.

<!--more-->
## Why would you use it in OBIEE?

Essentially, it enables you to precisely identify DB connections coming in from OBIEE. Since you can identify the connections, you can then trace them or collect additional statistics on them.

In Production, this would be useful for helping with troubleshooting. If a query is behaving badly, the responsible user can be easily identified, and through the login ID matched back to Usage Tracking data (you do collect Usage Tracking data, right?). Conversely, if a user is complaining (unlikely, I know 😉 ) of performance issues you can easily spot their queries running on the database and get a head start on identifying the problem.

As well as tracing, you can use these attributes to collect statistics (eg I/O wait time, db time, etc) for specific users or application areas. You use the [DBMS\_MONITOR](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_monitor.htm#i1003679) CLIENT\_ID\_STAT\_ENABLE procedure and then view the stats in V$CLIENT\_STAT. Similar proc & V$ table exist for module-targeted statistics collecting.

## Implementation

In essence, all you do is use the OBIEE **Connection Scripts** setting in the appropriate Connection Pool to call one or more of the PL/SQL packages. The values that you can set on the connection are as follows:

| V$SESSION column | Corresponding connection command to set | Max value length |
| --- | --- | --- |
| MODULE | dbms\_application\_info.set\_module(module\_name=>'[…]’,action\_name =>NULL) | 47 |
| ACTION | dbms\_application\_info.set\_module(module\_name=>'[…]’,action\_name=>'[…]’) or dbms\_application\_info.set\_action(action\_name=>'[…]’) | 31 |
| CLIENT\_INFO | dbms\_application\_info.set\_client\_info | 63 |
| CLIENT\_IDENTIFIER | dbms\_session.set\_identifier | 63 |

(Ref: [DBMS\_APPLICATION\_INFO](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_appinf.htm#i999290), [DBMS\_SESSION](http://download.oracle.com/docs/cd/B28359_01/appdev.111/b28419/d_sessio.htm#ARPLS054))

For example, to pass through the OBIEE username and display name (NQ\_SESSION.USER and NQ\_SESSION.DISPLAYNAME respectively) you would use the following code:

[![](/images/2011/02/snag-2011-01-28-16-00-18-0000.webp "SNAG-2011-01-28-16.00.18-0000")](/images/2011/02/snag-2011-01-28-16-00-18-0000.webp)

Connection Pool settings

When you look at V$SESSION for the connection from OBIEE, it would show up something like this:

![](/images/2011/02/snag-2011-01-28-16-07-12-0000.webp "snag-2011-01-28-16-07-12-0000.png")

V$SESSION showing values from OBIEE connection

## Instrument individual reports

What would be really cool would be if we could pass through the details of the report being executed.  
A rather clunky way of doing this is by setting a custom session variable in the Logical SQL that gets sent to BI Server:

![](/images/2011/02/snag-2011-02-02-09-58-33-0000.webp "SNAG-2011-02-02-09.58.33-0000")

Then add a script to the connection pool to pass this value through in the database connection:  
[![](/images/2011/02/snag-2011-02-02-10-22-35-0000.webp "SNAG-2011-02-02-10.22.35-0000")](/images/2011/02/snag-2011-02-02-10-22-35-0000.webp)  
When run this then shows up on V$SESSION as:

```

col client_identifier for a20
col client_info for a20
SELECT PROGRAM, CLIENT_IDENTIFIER, CLIENT_INFO, MODULE, ACTION FROM V$SESSION WHERE LOWER(PROGRAM) LIKE 'nqsserver%';
```

![](/images/2011/02/snag-2011-02-02-14-48-24-0000.webp "snag-2011-02-02-14-48-24-0000.png")

You get an error if you’ve not set a value for the variable that is referenced in the connection script (in the above example, “REPORT”). So what you could do is create a dummy session variable called REPORT with a default value (eg “<unspecified report>”), which will then be used if a report doesn’t override it:  

![](/images/2011/02/snag-2011-02-02-11-23-24-0000.webp "SNAG-2011-02-02-11.23.24-0000")

Dummy session variable

  

![](/images/2011/02/snag-2011-02-02-11-23-53-0000.webp "SNAG-2011-02-02-11.23.53-0000")

Dummy init block

## Variables

It may be my misunderstanding of the subtleties of the flavours of OBIEE variables, but the behaviours seem inconsistent to me. For example, even though I am issuing a SET VARIABLE in my logical SQL, the value of the variable REPORT doesn’t change from its default (in this example ‘NONE’) when listed in the Session Manager or queried via Narrative view. It isn’t even shown if I don’t create it as a session variable in the RPD.

![](/images/2011/02/snag-2011-02-02-11-34-45-0000.webp "SNAG-2011-02-02-11.34.45-0000")

Unchanging session variable value

[![](/images/2011/02/snag-2011-02-02-11-51-07-0000.webp "SNAG-2011-02-02-11.51.07-0000")](/images/2011/02/snag-2011-02-02-11-51-07-0000.webp)

Session variables displayed in Answers

Despite this, the modified value of the variable is what gets passed through correctly in the DB connection.

## SAW\_SRC\_PATH

This is a variable (along with QUERY\_SRC\_CD) that is passed automagically by Presentation Services to BI Server in the Logical SQL it executes:  

![](/images/2011/02/snag-2011-02-02-13-06-08-0000.webp "SNAG-2011-02-02-13.06.08-0000")

Logical SQL, as seen in NQQuery.log

If this could be harnessed and manipulated (eg right-most 63 chars) then the report details of any report could be automatically included with the DB connection string. But – try as I have I can’t access the variable through VALUEOF. Anyone know how?

## References

- [Mastering Performance with Extended SQL Trace](http://carymillsap.blogspot.com/2011/01/new-paper-mastering-performance-with.html) – Cary Millsap
- @lex's variables reference diagram *(link no longer available)*
- [Gerard Nico’s excellent wiki](http://gerardnico.com/wiki/dat/obiee/server_variable) has lots of information about OBIEE variables, amongst other things
