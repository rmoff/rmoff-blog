---
draft: false
title: 'Collecting OBIEE systems management data with jmx'
date: "2010-12-06T21:30:32+0100"
categories:
- jmx
- mbeans
- monitoring
- obiee
- systemsmanagement
---

## Introduction

<!--more-->
This is the first part of three detailed articles making up a mini-series about [OBIEE monitoring](/post/rnm1978/obiee-monitoring/). It demonstrates how to capture OBIEE performance information, and optionally graph it out and serve it through an auto-updating webpage.

For some background on OBIEE’s Systems Management component, along with JMX and MBeans, [see here](/post/rnm1978/oracle-bi-management-systems-management-mbeans//) and [here](/post/rnm1978/collecting-obiee-systems-management-data-with-jmx//). The following assumes you know your mbeans from coffee beans and jmx from a bmx.

The metric collection is built around the [jmxsh](http://code.google.com/p/jmxsh/) tool. This is similar to [jmxterm](http://wiki.cyclopsgroup.org/jmxterm) and both provide command-line access to jmx. Once it’s commandline, it’s scriptable 🙂

This was developed and works on both Windows (through [cygwin](http://www.cygwin.com/)) and HP-UX.

## The Script

jmxsh uses the a scripting language based on tcl, and with a bit of trial-and-error I developed the following script, **obieejmx.tcl**. It connects to a remote BI server, authenticates to the JMX agent, and then periodically polls the jmx counters and writes the values to a tab-separated file. It runs until you cancel it.

```

# obieejmx.tcl
# OBIEE JMX collector
# https://rmoff.net
#

# Set connection details
set host my-remote-server
set port 9980
set user jmx-user-name
set pw my-jmx-password

# Define the counters (userdefined ID / MBean / Attribute list, tab separated)
set mbeanattrs [list]
lappend mbeanattrs {1   Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Connection Pool      Current Open Connections}
lappend mbeanattrs {2   Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Query Cache  Current Running Queries}
lappend mbeanattrs {3   Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Query Cache  Current Cache Entries}
lappend mbeanattrs {4   Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Sessions     Active Sessions}
lappend mbeanattrs {5   Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Sessions     Current Sessions}
lappend mbeanattrs {6   Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Sessions     Sessions Logged On}
lappend mbeanattrs {7   Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI DB Connection Pool,name=Star_Oracle Data Warehouse_Oracle Data Warehouse Connection Pool     Current Busy Connection Count}
lappend mbeanattrs {8   Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI DB Connection Pool,name=Star_Oracle Data Warehouse_Oracle Data Warehouse Connection Pool     Current Connection Count}
lappend mbeanattrs {9   Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI Physical DB,name=Oracle Data Warehouse       KiloBytes/sec}
lappend mbeanattrs {10  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI Physical DB,name=Oracle Data Warehouse       Queries/sec}
lappend mbeanattrs {11  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI Physical DB,name=Oracle Data Warehouse       Rows/sec}
lappend mbeanattrs {12  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,name=Oracle BI General      Active Execute Requests}
lappend mbeanattrs {13  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,name=Oracle BI General      Active Fetch Requests}
lappend mbeanattrs {14  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,name=Oracle BI General      Avg. query elapsed time}
lappend mbeanattrs {15  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,name=Oracle BI General      Queries/sec}
lappend mbeanattrs {16  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,name=Oracle BI General      Total sessions}
lappend mbeanattrs {17  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,name=Oracle BI General      Succeeded Logins Ratio as %}

# Write the header
puts -nonewline "Timestamp"
foreach {mbeanattr} $mbeanattrs {
        # Get the mbean & attribute
        set parts [split $mbeanattr "\t"]
        set mbean [lindex $parts 1]
        set attr [lindex $parts 2]
        puts -nonewline "\t$mbean $attr"
}
puts ""

# Connect to the host
jmx_connect -h $host -p $port -U $user -P $pw

# Get the values
while {0 == 0} {
        puts -nonewline "[clock format [clock seconds] -format %Y-%m-%d-%H:%M:%S]"
        foreach {mbeanattr} $mbeanattrs {
                # Get the mbean & attribute
                set parts [split $mbeanattr "\t"]
                set mbean [lindex $parts 1]
                set attr [lindex $parts 2]

                #Uncomment for debug:
                #puts "---"
                #puts "$mbean $attr"

                # Get the metric and write to output
                puts -nonewline "\t[ jmx_get -m $mbean $attr]"

        }
        # Flush the output buffer line
        puts ""
        # Sleep for 60 seconds
        after 60000
}
```

You may want to tweak the polling frequency, depending on the metrics that you’re collecting and the purpose of them. For building up a general picture of system usage (active sessions, etc), then every minute – or greater – should be sufficient. For other metrics which record rates per second (eg “New Sessions / sec”) then you may well want to sample more frequently.

You invoke this via jmxsh ([download link](http://jmxsh.googlecode.com/files/jmxsh-R5.jar)) using the following syntax:

```

$java -jar jmxsh-R5.jar obieejmx.tcl
```

or if you’ve setup the (ambiguously-named) file **[jmxsh](http://jmxsh.googlecode.com/files/jmxsh)**, you can use this:

```

$./jmxsh obieejmx.tcl
```

It will write the counter values to stdout, so capture it to file using

```

./jmxsh obieejmx.tcl >> results.jmx 
```

To run it continually as a background process, use nohup (so it doesn’t die when you logoff) and & (to run it in the background):

```

# Run collector indefinitely
nohup ./jmxsh obieejmx.tcl >> results.jmx &
```

The output you’ll get will look like this:

```

2010-11-29-14:41:17     5       0       38      1       12      9       0       614     0       0       0       0       0       0       0       3       0
2010-11-29-14:42:17     5       0       33      1       12      9       0       614     0       0       0       0       0       0       0       3       0
2010-11-29-14:43:17     5       0       33      1       12      9       0       614     0       0       0       0       0       0       0       3       0
2010-11-29-14:44:17     5       0       33      1       12      9       0       614     0       0       0       0       0       0       0       3       0
```

To stop the collector running, you’ll need to find the process

```

$ps -ef|jmxsh 
userid 14695     1  2  Nov 29  ?         5:12 /opt/java6/bin/IA64N/java -jar ./jmxsh-R5.jar obieejmx.tcl
```

and then kill it

```

kill 14695
```

## Defining the counters

You’ll have noticed in my script that I define an array of counter names. You can get a list of all the counters in various ways including through [Presentation Services (saw.dll?perfmon)](http://obiee101.blogspot.com/2009/07/obiee-perfmon-performance-monitor.html), [OAS/OC4J](http://blogs.oracle.com/siebelessentials/2008/11/oracle_bi_ee_and_mbeans.html), or [JConsole](/post/rnm1978/jconsole-jmx//). My personal preference is using [Presentation Services (saw.dll?perfmon)](http://obiee101.blogspot.com/2009/07/obiee-perfmon-performance-monitor.html) as it gives the list nice and neatly and with an explanation of each counter.  
Once you’ve decided which you want to collect, you need to use jmxsh again to get the correct format. Counters are defined as Attributes (eg **Current Open Connections**) within MBeans (eg **Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Connection Pool**). Different jmx interfaces seem to label the MBean in a different format, for example:

```

jmxsh:  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Sessions
jmxterm:Oracle BI Management:AppName=Oracle BI Presentation Server,Oracle BI=Performance,name=Oracle BI PS Sessions
```

(spot the order in which “Oracle BI=” and “AppName=” are listed)  
So for using jmxsh in your script, use jmxsh to get the exact MBean names otherwise you’ll spend a long time tearing your hair out wondering why it’s not working!  
To get jmxsh to list the MBeans, you use it in the ‘browse’ mode. First off, run jmxsh and connect to your OBIEE server using the jmx\_connect command

```


$ java -jar jmxsh-R5.jar
jmxsh v1.0, Tue Jan 22 16:23:12 GMT 2008


Type 'help' for help.  Give the option '-?' to any command
for usage help.


Starting up in shell mode.
% jmx_connect -h myserver -p 9980 -U myjmxuser
Password: ********
Connected to service:jmx:rmi:///jndi/rmi://myserver:9980/jmxrmi.
```

Hit enter at this point and it’ll switch to browse mode, and list out the MBean Domains.

```


%
Entering browse mode.
====================================================


 Available Domains:


       1. java.util.logging
       2. JMImplementation
       3. Oracle BI Management
       4. java.lang


  SERVER: service:jmx:rmi:///jndi/rmi://myserver:9980/jmxrmi
```

Select **Oracle BI Management**

```

====================================================
Select a domain: 3
====================================================
```

This lists all the MBeans within Oracle BI Management – there’s a lot!

```


 Available MBeans:


       1. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Chart Engine
       2. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI DB Connection Pool,name=Star_Oracle Data Warehouse_Oracle Data Warehouse Writeback Connection Pool
       3. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,type=Oracle BI PS Thread Pools,name=TaskScheduler
       4. Oracle BI Management:Oracle BI=Configuration,type=Presentation Server Configuration,name=Query
       5. Oracle BI Management:Oracle BI=Configuration,type=Presentation Server Configuration,name=AsyncLogon[ThreadPoolDefaults]
       6. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Query Cache
[...]
     134. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Sessions
[...]
```

You can filter by defining a [glob](http://en.wikipedia.org/wiki/Glob_%28programming%29) filter by typing your search term at the “Select an mbean:” prompt. For example:

```

====================================================
Select an mbean: Performance
====================================================

 Available MBeans:

       1. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Chart Engine
       2. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI DB Connection Pool,name=Star_Oracle Data Warehouse_Oracle Data Ware
house Writeback Connection Pool
       3. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,type=Oracle BI PS Thread Pools,name=TaskScheduler
       4. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Query Cache
[...]
      53. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI Generic Cache,name=Star_DrillDownQuery_Cache

  SERVER: service:jmx:rmi:///jndi/rmi://myserver:9980/jmxrmi
  DOMAIN: Oracle BI Management
  GLOB:   *Performance* (space to clear)
```

This shows just MBeans with Performance in the name. Alternatively use a wildcard within the glob:

```

Select an mbean: Performance*Cache
====================================================

 Available MBeans:

       1. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Query Cache
       2. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Catalog XML Cache
       3. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI Generic Cache,name=Star_DrillDownInfo_Cache
       4. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Security Manager Account Cache
       5. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI Generic Cache,name=Star_LDAP_Cache
       6. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Catalog Attribute Cache
       7. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Security Manager Account Memberships Cache
       8. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI Generic Cache,name=Star_Plan_Cache
       9. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI Generic Cache,name=Star_ColumnAggrInfo_Cache
      10. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI Generic Cache,name=Star_RowWiseInit_Cache
      11. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS DXE Cache
      12. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Cube Cache
      13. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,name=Oracle BI Data Cache
      14. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS XML Document Caches
      15. Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Server,type=Oracle BI Generic Cache,name=Star_DrillDownQuery_Cache

  SERVER: service:jmx:rmi:///jndi/rmi://myserver:9980/jmxrmi
  DOMAIN: Oracle BI Management
  GLOB:   *Performance.*Cache* (space to clear)
```

If you use globs, remember to clear them by typing space and then enter, otherwise when you list Attributes you won’t see any which don’t also match your filter.

To view the Attributes for an MBean, enter the MBean’s number:

```

====================================================
Select an mbean: 134
====================================================

 Attribute List:

       1. -r- Integer     Current Sessions
       2. -r- Integer     Maximum Sessions
       3. -r- Integer     Sessions Logged On
       4. -r- Integer     Maximum Logged On
       5. -r- Integer     Current Embryonic Sessions
       6. -r- Integer     Maximum Embryonic Sessions
       7. -r- Integer     Active Sessions
       8. -r- Integer     Maximum Active Sessions
       9. -r- Integer     Total Lifetime Sessions
      10. -r- Integer     New Sessions / sec
      11. -r- Integer     Total Failed Logons
      12. -r- Integer     Failed Logons/sec
      13. -r- Integer     Total Logons
      14. -r- Integer     New Logons/Sec


  SERVER: service:jmx:rmi:///jndi/rmi://myserver:9980/jmxrmi
  DOMAIN: Oracle BI Management
  MBEAN:  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Sessions
```

Once you’ve chosen your MBeans and Attributes, you can incorporate them into the obieejmx.tcl script by adding additional lappend lines. The format is:

```

lappend mbeanattrs {<ID><tab><mbean><tab><attribute>}
```

ID is just a number used later on in the process, it can be whatever you like. Make sure the three values are tab-separated.  
An example line is:

```

lappend mbeanattrs {17  Oracle BI Management:Oracle BI=Performance,AppName=Oracle BI Presentation Server,name=Oracle BI PS Sessions      Current Embryonic Sessions}
```

If you get the error “Cannot convert result to a string” then check your MBean and Attribute names, normally this error means it can’t find what you’ve asked for. Also check that the array member definitions (lappend) are tab separated, not just space separated.

## Where next?

Now you’ve got the data, do something with it! See [charting OBIEE performance data with gnuplot](/post/rnm1978/charting-obiee-performance-data-with-gnuplot/).
