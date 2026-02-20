---
title: "JConsole / JMX"
date: "2009-07-16"
url: "/2009/07/16/jconsole-jmx/"
categories: 
  - "jmx"
  - "monitoring"
  - "OBIEE"
  - "performance"
  - "unix"
---

\[edit\] See [this post](/2009/07/21/jconsole-jmx-followup/) too \[/edit\] On an OBIEE server run 
```bash
nohup obiee/systemsmanagement/runagent.sh &amp;
```
 and then run **jconsole** (make sure you've set the DISPLAY first if you're running it from UNIX). NB: if you don't have jconsole in your path you can search for it: 
```bash
$whereis jconsole
jconsole: /opt/java1.5/bin/jconsole /opt/java6/bin/jconsole&lt;/span&gt;
```
 You should find it under your java/bin directory

You should get this kind of connection dialog: [![](/images/2009/07/jconsole_connect.webp)](/images/2009/07/jconsole_connect.webp) Click connect, and the console will launch. From here click on the MBeans tab, where you've got access to performance and configuration data [![](/images/2009/07/jconsole.webp)](/images/2009/07/jconsole.webp)

You can connect to the agent remotely too, but to do this you need to amend runagent.sh script: On the **java\_cmd** line replace  
`-Dcom.sun.management.jmxremote`  
with  
`-Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.port=9980 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false`  

See [here](http://java.sun.com/j2se/1.5.0/docs/guide/management/agent.html#remote) for more information on configuring jmx

The BI Management Pack uses the agent for collecting its data. The data is also accessible at http://\[server\]:\[port\]/analytics/saw.dll?perfmon (hat-tip: [John Minkjan](http://obiee101.blogspot.com/2009/07/obiee-perfmon-performance-monitor.html))
