---
title: "Troubleshooting Presentation Services / analytics connectivity"
date: "2009-12-09"
categories: 
  - "OBIEE"
  - "sawping"
  - "sawserver"
---

Short but sweet this one - a way of troubleshooting connectivity problems between _analytics_ (the Presentation Services Plug-in, either j2ee servlet or ISAPI, a.k.a. SAWBridge) and _sawserver_ (Presentation Services).

For a recap on the services & flow please see the first few paragraphs of [this post](/2009/11/06/obiee-clustering-specifying-multiple-presentation-services-from-presentation-services-plug-in/).

Problems in connectivity between analytics and sawserver normally manifest themselves through this error message:

> 500 Internal Server Error Servlet error: An exception occurred. The current application deployment descriptors do not allow for including it in this response. Please consult the application log for details.

Which IE and Firefox render something like this: [![](http://rnm1978.files.wordpress.com/2009/12/500-int-2009-12-09_093628.png?w=300 "500 int 2009-12-09_093628")](http://rnm1978.files.wordpress.com/2009/12/500-int-2009-12-09_093628.png) [![](http://rnm1978.files.wordpress.com/2009/12/500-2009-12-09_093740.png?w=1024 "500 2009-12-09_093740")](http://rnm1978.files.wordpress.com/2009/12/500-2009-12-09_093740.png)

At this stage all this means is the analytics plugin, i.e. the J2EE or ISAPI servlet, has thrown an error. That is all. Now, 95% of the time this will be because Presentation Services isn't running, either by design (i.e. you forgot to start it) or because it's barfed (in which case you need to check its log files etc and fix the problem).

## Analytics logfile

Best practice demands a logical approach, so rather than rushing off to Presentation Services, take moment to examine the analytics logfile. For OAS or OC4J you'll normally find this in $J2EE\_HOME/home/application-deployments/analytics/home\_default\_group\_1/application.log (where $J2EE\_HOME will be the j2ee directory underneath your OAS or OC4J installation folder). Open up the logfile and navigate to the bottom of it, and work up it backwards until you get a date and timestamp and a message like this:

\[sourcecode\] 09/12/09 09:38:30.885 analytics: Servlet error \[/sourcecode\]

The next line(s) will tell you what the problem is, followed by a bunch of generic java gibberish and stack. Ignore the latter and pick out the action error, which will often be: \[sourcecode\] java.net.ConnectException: Connection refused \[/sourcecode\] or sometimes: \[sourcecode\] java.net.ConnectException: Connection timed out \[/sourcecode\]

(Does anyone have additional errors to add in here?)

## Troubleshooting

The errors are often self-explanatory (so long as you understand the architecture); "Connection refused" means that analytics tried to connect to sawserver and couldn't. Once the problem is established then it's a case of working through in a logical manner to determine the cause. Connection refused is 95% of the time simply that Presentation Services (sawserver) isn't running. Or maybe it is running, but on a different host or port than analytics is looking for.

To check where analytics is going to be looking for sawserver, examine the analytics configuration file **$J2EE\_home/applications/analytics/analytics/WEB-INF/web.xml** (different for ISAPI, see last paragraph [here](/2009/11/06/obiee-clustering-specifying-multiple-presentation-services-from-presentation-services-plug-in/)). There'll be configuration lines matching one of these two examples. The default is this: \[sourcecode language="xml"\] <init-param> <param-name>oracle.bi.presentation.sawserver.Host</param-name> <param-value>localhost</param-value> </init-param> <init-param> <param-name>oracle.bi.presentation.sawserver.Port</param-name> <param-value>9710</param-value> </init-param> \[/sourcecode\] A customised (e.g. for <a href="[clustered resilience](/2009/11/06/obiee-clustering-specifying-multiple-presentation-services-from-presentation-services-plug-in/)) entry may look like this: \[sourcecode language="xml"\] <init-param> <param-name>oracle.bi.presentation.sawservers</param-name> <param-value>BISandbox01:9710;BISandbox02:9710</param-value> </init-param>\[/sourcecode\]

### sawserver

Let's check the connectivity from both sides. First off, is Presentation Services (sawserver) running on the server we're expecting it to be and listening on the correct port? In unix we can check this quite simply using the ps command and filtering it with the grep command. On the host that we're expecting sawserver to be, run this: \[sourcecode\] $ ps -ef|grep sawserver oracle 14827 1 0 09:58 pts/0 00:00:00 /bin/sh /app/oracle/product/obiee/setup/sawserver.sh oracle 14842 14827 35 09:58 pts/0 00:00:01 /app/oracle/product/obiee/web/bin/sawserver \[/sourcecode\] If there's no output from this (or only the grep itself) then sawserver's not running, and you need to fix that before proceeding. On Windows check the Services window (services.msc) and task manager for sawserver.exe.

Assuming sawserver is running, now check that it is listening on the port specific in the analytics configuration file (see above). In this example, I'm checking for the default port, 9710: \[sourcecode\] $ netstat -a|grep 9710 tcp 0 0 \*:9710 \*:\* LISTEN \[/sourcecode\] If there's no output from the command then it means that port 9710 is not in use, i.e. sawserver is not listening on it. N.B. at this point it is theoretically possible that another application is using port 9710 - all we're proving is that **something** is using it. But unless you've changed sawserver's port (in instanceconfig.xml) then the fact it's started up means that it is it using 9710 because it won't start if another application is using its port. In Windows you can use netstat -a but there's no grep by default so you need to scroll down the output to look for the port.

So - sawserver is running on the expected host, and listening on the correct port.

### analytics

Now let's examine connectivity from the point of view of the analytics plugin (which is flow of the traffic too, i.e. connecting _TO_ sawserver). On the server hosting your application server (OAS/OC4J/IIS, etc) -which may or may not be the same as your Presentation Services - we want to test if Presentation Services can be connected to at the network layer. To do this we're going to prod the port and host that it's configured on (according to web.xml, see above).

The following is on OEL 4, which is a based on RedHat so I'd expect that to behave the same. First get a "control" output for connecting to a port that most definitely is not open to traffic. Find a port on your sawserver host (which may or may not be local) that's unused: \[sourcecode\] $ netstat -a|grep 9999 $ \[/sourcecode\] If you get output from the netstat then pick another port until you don't Now let's try connecting to it to see what happens when we connect to a closed port: \[sourcecode\] $ telnet localhost 9999 Trying 127.0.0.1... telnet: connect to address 127.0.0.1: Connection refused \[/sourcecode\] So - our control output for a closed port is this _telnet: connect to address 127.0.0.1: Connection refused_.

Recall what host and port we determined analytics was trying to connect to (from web.xml, see above), and run the test for it. In this example I'll check for the default - localhost and 9710. If we get something like this: \[sourcecode\] $ telnet localhost 9710 Trying 127.0.0.1... Connected to localhost. Escape character is '^\]'. \[/sourcecode\] then it shows the port and host is accepting connections. You can't do much more from here that I'm aware of, but it proves the port is open.

However if we get this: \[sourcecode\] $ telnet localhost 9710 Trying 127.0.0.1... telnet: connect to address 127.0.0.1: Connection refused \[/sourcecode\] then it would tell us that the port we're expecting to be open isn't - and you have a problem! See below for further suggestions.

On Windows you'll get similar behaviour for a failed connection: \[sourcecode\] C:\\>telnet localhost 9999 Connecting To localhost...Could not open connection to the host, on port 9999: Connect failed \[/sourcecode\] For a successful connection you will normally find the command window clears and you get a flashing cursor. Enter a few random characters or hit Ctrl-C to return to the command prompt.

## Further troubleshooting

If you get a connection error when you telnet to the host and port that you think sawserver should be on then you have identified the problem, and now need to diagnose the cause. Starting points for this are:

- If you're not using an IP then check if the hostname resolves correctly. Try pinging it. If it doesn't ping then you have general connectivity problems outside of OBIEE and need to speak with your network team to resolve them.
- If the host pings but the port still is not accessible is it being blocked by a firewall?

There's an interesting case study around this problem [here](http://forums.oracle.com/forums/thread.jspa?messageID=3956900#3956900), and an unsolved one [here](http://forums.oracle.com/forums/thread.jspa?messageID=3915369&#3915369).

## Summary

This is a fairly low-level way of methodically picking your way through problems between two of the OBIEE components. As I've said, 95% of the time it's a simple thing, that Presentation Services isn't running. However hopefully this article gives you more of a basis on which to diagnose and solve the remaining 5% of issues. **If you can't telnet to sawserver's host and port from the machine that your application service is running on then your problem lies in connectivity and you need to fix that before trying to fix anything else.**

## Footnote - sawping

Just after writing this article I remembered a utility called sawping that I first saw mentioned by Srinivas Malyala [here](http://tipsonobiee.blogspot.com/2009/07/sawping.html). In essence it does the same as what I documented using telnet above - it tests for sawserver on a given hostname and port. I'd be interested to know if it does any more than check for the open port (i.e. does it interrogate the application on the end of the port to check it is sawserver). Watching saw.rpc entries to the sawserver.log it doesn't look like it, or if it does it's not logged.

To use it in unix you need to dot-source $OBIEE\_HOME/setup/sa-init.sh (or sa-init64.sh) first to set your environment variables and paths: \[sourcecode\] $ . ./sa-init.sh $ \[/sourcecode\] Test the default hostname and port (I don't think this parses analytics' web.xml): \[sourcecode language="bash"\] $sawping Server alive and well \[/sourcecode\] Add the -v flag for more verbose output if you get an error: \[sourcecode\] $ sawping Unable to connect to server. The server may be down or may be too busy to accept additional connections.

$ sawping -v Unable to connect to server. The server may be down or may be too busy to accept additional connections. An error occurred during execution of "connect". Connection refused \[Socket:3\] Error Codes: ETI2U8FA

\[/sourcecode\]

Test for sawserver on a different host: \[sourcecode\] $ sawping -s bisandbox02 Server alive and well \[/sourcecode\]

Note the message tells you what the problem is if there is an error (in this example, "Unable to resolve address") \[sourcecode\] $ sawping -s bisandboxxxxx02 -v An error occured during process. Run in verbose mode to see error details. Unable to resolve the address for bisandboxxxxx02. Error Codes: AXSBMN8D:

TRY\_AGAIN \[/sourcecode\]

Test for sawserver on a different host and port:

\[sourcecode\] $ sawping -s bisandbox02 -p 9711 -v Server alive and well \[/sourcecode\]

To use the utility in Windows either add $OBIEE\_Home/web/bin to your PATH environment variable, or reference it directly. The argument syntax remains the same: \[sourcecode\] C:\\>c:\\OracleBI\\web\\bin\\sawping.exe Server alive and well

C:\\>c:\\OracleBI\\web\\bin\\sawping.exe -s bisandbox02 Server alive and well

C:\\>c:\\OracleBI\\web\\bin\\sawping.exe -p 9711 -v Unable to connect to server. The server may be down or may be too busy to accept additional connections. An error occurred during execution of "connect". No connection could be made because the target machine actively refused it. \[Socket:1808\] Error Codes: ETI2U8FA \[/sourcecode\]
