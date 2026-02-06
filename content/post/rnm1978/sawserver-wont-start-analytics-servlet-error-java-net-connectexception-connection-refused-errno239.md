---
title: "sawserver won't start (analytics: Servlet error java.net.ConnectException: Connection refused (errno:239))"
date: "2009-03-30"
categories: 
  - "OBIEE"
  - "sawserver"
  - "unix"
---

We're getting this error in the Presentation Services plug-in \[analytics\].  
Log file: /j2ee/home/application-deployments/analytics/home\_default\_group\_1/application.log  
  

> 09/03/30 13:16:38.75 analytics: Servlet error  
> java.net.ConnectException: Connection refused (errno:239)  
> at java.net.PlainSocketImpl.socketConnect(Native Method)  
> at java.net.PlainSocketImpl.doConnect(PlainSocketImpl.java:333)  
> at java.net.PlainSocketImpl.connectToAddress(PlainSocketImpl.java:195)  
> at java.net.PlainSocketImpl.connect(PlainSocketImpl.java:182)  
> at java.net.SocksSocketImpl.connect(SocksSocketImpl.java:366)  
> at java.net.Socket.connect(Socket.java:517)  
> at java.net.Socket.connect(Socket.java:467)  
> at java.net.Socket.(Socket.java:364)  
> at java.net.Socket.(Socket.java:178)  
> at com.siebel.analytics.web.sawconnect.ConnectionPoolSocketFactoryImpl.createSocket(ConnectionPoolSocketFactoryImpl.java:63)  
> at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)  
> at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:39)  
> at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:25)  
> at java.lang.reflect.Method.invoke(Method.java:585)  
> at com.siebel.analytics.web.sawconnect.ConnectionPoolSocketFactoryImpl.createSocket(ConnectionPoolSocketFactoryImpl.java:70)  
> at com.siebel.analytics.web.sawconnect.ConnectionPool.createNewConnection(ConnectionPool.java:314)  
> at com.siebel.analytics.web.sawconnect.ConnectionPool.getConnection(ConnectionPool.java:133)  
> at com.siebel.analytics.web.SAWBridge.processRequest(SAWBridge.java:299)  
> at com.siebel.analytics.web.SAWBridge.doGet(SAWBridge.java:325)  
> at javax.servlet.http.HttpServlet.service(HttpServlet.java:743)  
> at javax.servlet.http.HttpServlet.service(HttpServlet.java:856)  
> at com.evermind\[Oracle Containers for J2EE 10g (10.1.3.3.0) \].server.http.ServletRequestDispatcher.invoke(ServletRequestDispatcher.java:713)  
> at com.evermind\[Oracle Containers for J2EE 10g (10.1.3.3.0) \].server.http.ServletRequestDispatcher.forwardInternal(ServletRequestDispatcher.java:3  
> 70)  
> at com.evermind\[Oracle Containers for J2EE 10g (10.1.3.3.0) \].server.http.HttpRequestHandler.doProcessRequest(HttpRequestHandler.java:871)  
> at com.evermind\[Oracle Containers for J2EE 10g (10.1.3.3.0) \].server.http.HttpRequestHandler.processRequest(HttpRequestHandler.java:453)  
> at com.evermind\[Oracle Containers for J2EE 10g (10.1.3.3.0) \].server.http.AJPRequestHandler.run(AJPRequestHandler.java:302)  
> at com.evermind\[Oracle Containers for J2EE 10g (10.1.3.3.0) \].server.http.AJPRequestHandler.run(AJPRequestHandler.java:190)  
> at oracle.oc4j.network.ServerSocketReadHandler$SafeRunnable.run(ServerSocketReadHandler.java:260)  
> at oracle.oc4j.network.ServerSocketAcceptHandler.procClientSocket(ServerSocketAcceptHandler.java:239)  
> at oracle.oc4j.network.ServerSocketAcceptHandler.access$700(ServerSocketAcceptHandler.java:34)  
> at oracle.oc4j.network.ServerSocketAcceptHandler$AcceptHandlerHorse.run(ServerSocketAcceptHandler.java:880)  
> at com.evermind\[Oracle Containers for J2EE 10g (10.1.3.3.0) \].util.ReleasableResourcePooledExecutor$MyWorker.run(ReleasableResourcePooledExecutor.  
> java:303)  
> at java.lang.Thread.run(Thread.java:595)

  
The relevant bit of the stacktrace looks like "com.siebel.analytics.web.sawconnect.ConnectionPoolSocketFactoryImpl.createSocket", i.e. it's trying to connect to SAW.  
  
I checked if Presentation Services is running:  

> ps -ef|grep saw  

which it was. However, looking in the /web/log folder the sawserver.out.log file is zero bytes!  
  
I stopped all services including OAS and restarted them:  
\- OAS comes up fine  
\- Javahost starts fine  
\- Presentation services process starts but no log file generated  
When I try to connect to Analytics I get 500 Server Error and "analytics: Servlet error  
java.net.ConnectException: Connection refused (errno:239)" error logged in the analytics Presentation Services plug in log file  
  
Looking at this logically, sawserver is the problem. It's not starting up - there's no log and the port 9710 doesn't get opened up by it.  
The strangest thing at this point is that there is no log - there's normally be at least a "... starting up" type entry, even if nothing else.  
Even after increasing the log levels (/web/config/logconfig.xml) to minute levels (100 for each), there is still nothing logged.  
  
On a dev box on which nothing's changed recently (and which sawserver was running without complaint) I did  

> run-saw.sh stop  

(...wait for a while...)  

> run-saw.sh start64  

and sawserver didn't come up! This to me points the finger towards the server  
  
This has now gone to Oracle as an SR, as something is clearly up with sawserver :-(  
  
Update: running gpm (glance for x-windows) I found this:  
![](/images/rnm1978/image_lost.png)sawserver64 being reported as "Blocked On" "Other" for 100% of the time.  
Not sure what that translates to in real money yet though.  
  
Update: [solution here!](http://rnm1978.blogspot.com/2009/04/sawserver-wont-start-up-resolved.html)
