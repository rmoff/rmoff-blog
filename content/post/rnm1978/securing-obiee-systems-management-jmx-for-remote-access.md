---
title: "Securing OBIEE Systems Management JMX for remote access"
date: "2010-03-05"
categories: 
  - "jmx"
  - "obiee"
  - "security"
  - "systemsmanagement"
---

## JMX

OBIEE's Systems Management functionality exposes performance counters and the application's configuration options through Java MBeans and optionally a protocol called JMX.

It's extremely useful, and is documented pretty widely :

- [JConsole / JMX](/2009/07/16/jconsole-/-jmx/)
- [JConsole / JMX – followup](/2009/07/21/jconsole-jmx-followup/)
- [Oracle BI Management / Systems Management MBeans](/2009/07/22/oracle-bi-management-systems-management-mbeans/)
- [PerfMon](http://obiee101.blogspot.com/2009/07/obiee-perfmon-performance-monitor.html)
- [OBIEE MBeans and OC4J](http://blogs.oracle.com/siebelessentials/2008/11/oracle_bi_ee_and_mbeans.html)
- [OBIEE performance monitoring and alerting with jManage](/2009/07/29/obiee-performance-monitoring-and-alerting-with-jmanage/)

In this article I'm going to discuss the use of JMX to access these counters remotely, and a possible security issue that's present in the [BI Management Pack](http://docs.google.com/viewer?a=v&q=cache:cBH-0QJHbTEJ:download.oracle.com/docs/cd/B16240_01/doc/apirefs.102/e12639.pdf+com.sun.management.jmxremote.authenticate%3Dfalse&hl=en&gl=uk&pid=bl&srcid=ADGEESiWEE9yb6LNERALgxwRhxGkUPC_8VzSZcYiyFUbV2MMMcP0RniO8EcSgT8Y2VsihL8JwLtTQHBuEDAQhS0FOOGfRKt9AxGdnbZEBalywMSEQoyzrktNU1ppcvLgB-F2Hjcr6gLI&sig=AHIEtbTc_xYSdrrFG4k-rsCaJrd4ZJjodQ) manual. The BI Management Pack is an add-on to Oracle's Enterprise Manager / Grid Control for managing OBIEE, see [Mark Rittman's excellent guide on Oracle's website](http://www.oracle.com/technology/pub/articles/rittman-oem-bipack.html).

## Security Issue

To access Systems Management data remotely you need to start the JMX agent, having configured it for remote access first. However, if you are lazy, and/or follow the configuration in the BI Management Pack manual, and set **com.sun.management.jmxremote.authenticate=false** **anyone can update your OBIEE configuration** if they have network access to your server and a client for JMX (such as jconsole, part of standard java distribution) and time to guess the port number. This is not cool. Ever played with AUTHENTICATION=BYPASS\_NQS?

The [latest Java documentation](http://java.sun.com/javase/6/docs/technotes/guides/management/agent.html) (now with an Oracle logo!) does address this:

> Caution - This configuration is insecure. Any remote user who knows (or guesses) your JMX port number and host name will be able to monitor and control your Java application and platform. While it may be acceptable for development, it is not recommended for production systems.

To be clear - _if you're not running the JMX Agent, this is all irrelevant_. It's only if you're running it and haven't thought through the consequences of the configuration.

## Making the JMX Agent more secure

One way to secure the JMX agent is to use password authentication. The other is to set up SSL. The following demonstrates how to enable password authentication.

Please note - the following covers how to password-protect the JMX agent. It isn't making it bullet-proof, and there's no reason why a dictionary attack against it wouldn't work as there's no lockout. This also means it's a good reason not to use a default username from the config files. Note also the following warning in the Java documentation: (if anyone can translate it into english I'd be grateful ;-) )

> "WARNING: A potential security issue has been identified with password authentication for JMX remote connectors when the client obtains the remote connector from an insecure RMI registry (the default). If an attacker starts a bogus RMI registry on the target server before the legitmate one is started, then the attacker can steal clients' passwords."

To enable password authentication you need to edit three files. The first file to edit is the agent script, runagent.sh. You'll find this in $ORACLEBI\_HOME/systemsmanagement. By default, the file looks like this:

\[sourcecode language="bash"\] #!/bin/sh # this is a template of runagent.sh to be used on Unix. # The installer will fill in JAVA\_HOME, SAROOTDIR, and SATEMPDIR

export JAVA\_HOME=/usr/java/jdk1.6.0\_17 export SAROOTDIR=/app/oracle/product/obiee export SADATADIR=/data export SATEMPDIR=/data/tmp export UNIXPERFDIR=${SATEMPDIR}

java\_cmd="${JAVA\_HOME}/bin/java -Djava.library.path=${SAROOTDIR}/server/Bin -Dcom.sun.management.jmxremote -classpath analytics-jmx.jar:lib/xmlparserv2.jar oracle.bi.analytics.management.StandardConsoleAgent"

${java\_cmd} \[/sourcecode\]

To enable remote access to the JMX agent you change the java\_cmd to the following:

\[sourcecode language="bash"\] java\_cmd="${JAVA\_HOME}/bin/java -Djava.library.path=${SAROOTDIR}/server/Bin -Dcom.sun.management.jmxremote -Dcom.sun.man agement.jmxremote.port=9980 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false - classpath analytics-jmx.jar:lib/xmlparserv2.jar oracle.bi.analytics.management.StandardConsoleAgent" \[/sourcecode\]

Note that jmxremote.authenticate is set to false. To secure the JMX agent you change it to true:

\[sourcecode language="bash"\] java\_cmd="${JAVA\_HOME}/bin/java -Djava.library.path=${SAROOTDIR}/server/Bin -Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.port=9980 -Dcom.sun.management.jmxremote.authenticate=true -classpath analytics-jmx.jar:lib/xmlparserv2.jar oracle.bi.analytics.management.StandardConsoleAgent" \[/sourcecode\]

Now note what JAVA\_HOME is set to in the runagent.sh file (in the above example it's /usr/java/jdk1.6.0\_17). Navigate to this directory, and then to **jre/lib/management**. You should see these four files:

\[sourcecode\] jmxremote.access jmxremote.password.template management.properties snmp.acl.template \[/sourcecode\]

Create a copy of jmxremote.password.template to a file called **jmxremote.password**. Open the file and you'll see two default users (or "roles") as the documentation calls them.

\[sourcecode language="bash"\] $cp jmxremote.password.template jmxremote.password $vi jmxremote.password \[/sourcecode\]

\[sourcecode language="bash"\] # # Following are two commented-out entries. The "measureRole" role has # password "QED". The "controlRole" role has password "R&D". # # monitorRole QED # controlRole R&D \[/sourcecode\]

We'll come back to this file in a moment. Now open **jmxremote.access** and you'll see the access rights for the users ("roles") in the password file are defined here:

\[sourcecode\] # "readonly" grants access to read attributes of MBeans. # For monitoring, this means that a remote client in this # role can read measurements but cannot perform any action # that changes the environment of the running program. # "readwrite" grants access to read and write attributes of MBeans, # to invoke operations on them, and to create or remove them. # This access should be granted to only trusted clients, # since they can potentially interfere with the smooth # operation of a running program \[/sourcecode\]

So, now decide how you want to regulate access. **I would strongly recommend that the only access available through remote JMX is readonly**. Read/Write access to configuration needs to be through one auditable route, and I'd suggest this isn't the best one. If that's how we're going to configure it, we set the files up like this: (delete or comment out everything in the files first, having taken a backup first) **jmxremote.password:**

\[sourcecode language="bash"\] jmxobiee S3cur3Passw0rd \[/sourcecode\]

**jmxremote.access**

\[sourcecode language="bash"\] jmxobiee readonly \[/sourcecode\]

Finally, secure access to the password file so that it's only readable by the application owner ID:

\[sourcecode language="bash"\] chmod 600 jmxremote.password \[/sourcecode\]

Now, go back to $ORACLEBI\_HOME/systemsmanagement, and start the JMX agent:

\[sourcecode language="bash"\] nohup ./runagent & \[/sourcecode\]

(the nohup and & make it run in the background so it doesn't quit when you exit your session)

Having started your agent, you can go to JConsole and login to it remotely.

See the document [here](http://java.sun.com/j2se/1.5.0/docs/guide/management/agent.html#remote) for the full details of securing JMX, including use of SSL and alternative password file locations.

## Using JConsole

JConsole should be in your PATH, so enter JConsole from Start -> Run (Windows), or alternatively find it in the bin directory of your JAVA home directory (Windows/Linux/Unix). ![](/images/rnm1978/2010-03-05_141030.png "2010-03-05_141030")

To see the OBIEE counters click on MBeans tab : ![](/images/rnm1978/2010-03-05_141340.png "2010-03-05_141340")

and then expand the "Oracle BI Management" folder: ![](/images/rnm1978/2010-03-05_141521.png "2010-03-05_141521")

You'll notice if you're connected as a readonly user and try to change any values you get an error: ![](/images/rnm1978/2010-03-05_141644.png "2010-03-05_141644")

When OBIEE is running you get some very detailed performance counters: ![](/images/rnm1978/2010-03-05_142104.png "2010-03-05_142104")

(If you only see Configuration folders within BI then it's because OBIEE isn't running :) )

One nice thing you can do is see a graph of the metrics, by clicking on Attributes in the left tree, and then double-clicking on the number you want to graph in the right pane:

![](/images/rnm1978/2010-03-05_1428191.png "2010-03-05_142819")

## Footnote

I find the possibilities of the JMX interface to BI counters very interesting, and am surprised there is so little discussed about it. Maybe everyone else is merrily using it and feels no need to brag ;-)

The counters in particular that BI Server exposes gives a peek under the covers of an application that has no detailing logging other than NQQuery.log. Using these counters through JMX we can look at things such as the current state of a connection pool, or the BI Server Cache.

Does anyone know of a freeware tool for collecting data from JMX? I know I could use the BI Management Pack but we don't have it. JConsole or [JManage](/2009/07/29/obiee-performance-monitoring-and-alerting-with-jmanage/) give visualisation of the data realtime, but the latter is very rough around the edges.
