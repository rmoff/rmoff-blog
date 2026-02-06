---
title: "OBIEE and HP Performance Center (a.k.a. LoadRunner) - Notes"
date: "2009-10-01"
categories: 
  - "loadrunner"
  - "OBIEE"
  - "performance"
---

This is a supplemental post to [this one describing how to set up a VUser in LoadRunner to test OBIEE](/2009/10/01/performance-testing-obiee-using-hp-performance-center-a.k.a.-loadrunner/). It's various notes that I made during the development but which aren't directly part of the step-by-step tutorial. They're not necessarily vital for recording scripts, but observations and explanations that should be helpful when working with LoadRunner and OBIEE.

## Validation using sawserver logs

It's no use running a load test if the load you think you're applying isn't actually being applied. To validate the test you compare what happens on the server when the scenario is manually performed with what happens with it's from a VUser and hopefully the same behaviour is observed.

To validate the replay, enable detailed sawserver logging in logconfig.xml:

\[sourcecode language="xml"\] <Writers> \[...\] <Writer implementation="FileLogWriter" \[...\] fmtName="short" \[...\] /> \[...\] </Writers> \[...\] <Filters> \[...\] <FilterRecord writerClassGroup="File" path = "saw" information="31" warning="100" error="100" security="41"/> <FilterRecord writerClassGroup="File" path = "saw.charts.pop" information="100" warning="100" error="100" security="41"/> <FilterRecord writerClassGroup="File" path = "saw.odbc.statement.execute.sql" information="100" warning="100" error="100" security="41"/> <FilterRecord writerClassGroup="File" path = "saw.httpserver" information="100" warning="100" error="100" security="41"/> \[...\] </Filters> \[/sourcecode\]

Restart sawserver, manually perform the scenario. Stop sawserver, save sawlog0.log. Restart sawserver (wait until it's fully down - grep for netstat a-|grep 9710 until TIME\_WAIT not showing), run vuser to completion. Stop sawserver, save sawlog0.log. WinMerge to compare sawlog0.log files. Should be same number of ODBC calls, HTTP requests and responses, and calls to PopChart (?). [![LR16](http://rnm1978.files.wordpress.com/2009/09/lr16.png?w=300 "LR16")](http://rnm1978.files.wordpress.com/2009/09/lr16.png)

## Charts

Charts in OBIEE are Shockwave flash. They're requested from the sawserver with a uniqueID (called StateID) that is generated when the parent page is created dynamically:

\[sourcecode language="html"\] web\_url("saw.dll\_11", "URL=http://10.3.105.181:7777/analytics/saw.dll?DocPart&\_scid=9mEXbnHnTew&StateID=14036570", "Resource=1", "RecContentType=application/x-shockwave-flash", "Referer=http://10.3.105.181:7777/analytics/saw.dll?Dashboard", "Snapshot=t140.inf", LAST); \[/sourcecode\]

This causes two issues:

1. If you leave the request in then you will get an "Invalid state identifier" error, because the request will be for a chart object associated with a previously generated report (rather than the current one)
2. You therefore cannot simulate the load that requesting each chart will impose on the sawserver and network between sawserver and client. HOWEVER, by monitoring /data/tmp/sawcharts it's possible to correlate the generation of charts with VUser requests, so we CAN reproduce the chart-generation load on the server (just not the request and transport of the charts to the client)

## Correlation

Most web applications will use some kind of session state variable. LoadRunner can spot these and handle them. If they're not done properly then the web application will get confused because you'll be specifying a session that's long-gone. That's what the Invalid State Identifier seen above is about.

If you record your script in one go then you'll find LoadRunner does some automatic correlation for you based on the Siebel setting you enabled when you set the recording options- you'll see lines like this:

\[sourcecode language="xml"\] /\* Registering parameter(s) from source task id 71 // {Siebel\_Analytic\_ViewState14} = "boo89b1camkd4ctutdb9qe33p6" // \*/

web\_reg\_save\_param("Siebel\_Analytic\_ViewState14", "LB/IC=ViewState\\" value=\\"", "RB/IC=\\"", "Ord=1", "Search=Body", "RelFrameId=1", LAST); \[/sourcecode\]

This populates a parameter which is used in a subsequent step:

\[sourcecode language="xml"\]

web\_submit\_data("saw.dll\_7", \[...\] "Name=ViewState", "Value={Siebel\_Analytic\_ViewState14}", ENDITEM, \[...\] \[/sourcecode\]

Without knowing properly how sawserver works, it still appears that the ViewState parameter is optional, because commenting it out of ITEMDATA lists gives the same behaviour as if it is there:

\[sourcecode language="xml"\] web\_submit\_data("saw.dll\_7", "Action=http://10.3.105.181:7777/analytics/saw.dll?Dashboard", "Method=POST", "RecContentType=text/html", "Referer=http://10.3.105.181:7777/analytics/saw.dll?Dashboard", "Snapshot=t68.inf", "Mode=HTTP", ITEMDATA, "Name=\_scid", "Value=X0OQ7O8dJ0k", ENDITEM, "Name=PortalPath", "Value=/shared/Sample Sales/\_portal/02 History & Benching", ENDITEM, "Name=Page", "Value=22 Indexing", ENDITEM, /\* "Name=ViewState", "Value={Siebel\_Analytic\_ViewState14}", ENDITEM, \*/ "Name=StateAction", "Value=NewPage", ENDITEM, LAST); \[/sourcecode\]

Removing it makes the script easier to work with - but as I say, may be breaking something in the long-run so do test and don't take my word for it.

After replaying your recording you should scan for further correlations by pressing Ctrl-F8. It should pick up the scid which I think is the session ID as it is constant across sessions. It'll also pick up the character set. [![LR48](http://rnm1978.files.wordpress.com/2009/09/lr48.png?w=300 "LR48")](http://rnm1978.files.wordpress.com/2009/09/lr48.png)Click on Correlate and go to vuser\_init where you should see a new web\_reg\_save\_param statement. This populates the paramater based on the search condition defined, so in this case parses the body of the page for a value between \_scid= and "

\[sourcecode language="xml"\] // \[WCSPARAM WCSParam\_Diff1 11 X0OQ7O8dJ0k\] Parameter {WCSParam\_Diff1} created by Correlation Studio web\_reg\_save\_param("WCSParam\_Diff1", "LB=\_scid=", "RB=\\"", "Ord=2", "RelFrameId=1", "Search=Body", "IgnoreRedirections=Yes", LAST); \[/sourcecode\]

Once you've figured out common correlations for an application you can program them into a rule, see above for an OBIEE file I've created.

## Testing NQServer directly

**This idea nicked wholesale from the document provided by Oracle Support :-)** LoadRunner works with the ODBC protocol and can therefore be used for load testing the Analytics (NQServer) directly, i.e. excluding the Presentation Services web front-end. This would be done by recording activity through nQCmd: ![](/images/rnm1978/lr60.png "LR59")![LR60](http://rnm1978.files.wordpress.com/2009/10/lr60.png?w=300 "LR60")

![](/images/rnm1978/lr62.png "LR61")![LR62](/images/rnm1978/lr62.png "LR62")
