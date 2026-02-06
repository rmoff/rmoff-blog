---
title: "OBIEE clustering - specifying multiple Presentation Services from Presentation Services Plug-in"
date: "2009-11-06"
categories: 
  - "load-balancing"
  - "oas"
  - "OBIEE"
  - "sawserver"
  - "unix"
---

# Introduction

Whilst the BI Cluster Controller takes care nicely of clustering and failover for BI Server (nqsserver), we have to do more to ensure further resilience of the stack.

A diagram I come back to again and again when working out configuration or connectivity problems is the one on P16 of the [Deployment Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b40058.pdf). With this you can work out most issues for yourself through simple reasoning. Print it out, pin it to your wall, and read it!

As a reminder, when a user calls up the address for Answers or Dashboards the flow goes :

1. web browser
2. web serve r (eg OAS - Apache)
3. app server (eg OAS - OC4J) -> BI Presentation Services Plug-in ("analytics")
4. BI Presentation Services
5. (BI Server)
6. (Database)

With clustering we are aiming to spread the load as much as possible. This gives us resilience if a component fails and capacity as the work is shared out.

This posting examines how to configure step 3 on the above list (BI Presentation Services Plug-in) to work with multiple BI Presentation Services.

From the Deployment Guide:

> _BI Presentation Services Plug-ins route session requests to BI Presentation Services instances using native protocol. The connections are load balanced using native load balancing capability._
> 
> _BI Presentation Services receives requests from BI Presentation Services Plug-in \[...\]. Although an initial user session request can go to any BI Presentation Services in the cluster, each user is then bound to a specific BI Presentation Services instance._

Be aware that "BI Presentation Services" is not the same as "BI Presentation Services Plug-in":

- **"BI Presentation Services"** is sawserver, a service in its own right.
- **"BI Presentation Services Plug-in"** is a java servlet called analytics deployed within a J2ee application server.
    - There is also a version for IIS using ISAPI. This article is only about the j2ee version. The configuration principles should remain the same for the ISAPI plugin though.

# Configuration

To configure the j2ee plug-in, do the following:

1. Locate web.xml found in $J2EE\_home/applications/analytics/analytics/WEB-INF
    - See note below regarding this path as it is contrary to that given in the [Deployment Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b40058.pdf) on p35
2. Create a backup of the web.xml file
3. By default the file will have two sets of init-params. Remove these: \[sourcecode language="xml"\] <init-param> <param-name>oracle.bi.presentation.sawserver.Host</param-name> <param-value>localhost</param-value> </init-param> <init-param> <param-name>oracle.bi.presentation.sawserver.Port</param-name> <param-value>9710</param-value> </init-param> \[/sourcecode\]
4. Add in a new init-param in place of the two you removed, specifying your Presentation Services hosts and ports (syntax is **host:port**) in a **semi-colon** delimited list \[sourcecode language="xml"\] <init-param> <param-name>oracle.bi.presentation.sawservers</param-name> <param-value>BISandbox01:9710;BISandbox02:9710</param-value> </init-param>\[/sourcecode\]
5. Save your modified web.xml file
6. Restart your application server
    - In OAS you can use _opmnctl restartproc_
7. Login to Answers and test that it works
8. Stop one of your Presentation Services (sawserver)
9. Refresh Answers. You'll probably get a 500 Internal Server Error.
    - If you check the application.log it shows that it can't connect to the Presentation Services (because you've just stopped it, duh!)
10. Refresh Answers again in a minute or two. You should get Presentation Services back, but from a different instance.

- Does anyone know where this period is defined, eg is it a timeout setting, multiple failed connection attempts?

13. Work through all your Presentation Services servers, stopping and starting the service on each to ensure each is being picked up

## How do you know which Presentation Services you're using?

This is where it can get a bit confusing!

The images that you see rendered on the page are local to the **BI Presentation Services Plug-in**. So if you muck around with the files in /res you can tag the login page with the server that _analytics plugin is running on_. If you're not using web server load balancing then this will always be the web server that you're connecting to.

The web catalog is specified by the **BI Presentation Services** instance. Once your clustering is setup then obviously you must share or replicate your web catalog. However whilst setting up the plugin->presentation services connectivity it might be an idea to have separate instances. Set up the default dashboard on login simply to show the Presentation Sevices server name as a text box (hardcode it). Do this for each server. You can go and check the actual Request in the web catalog on each server's file system to make sure you're on the right one.

## Logfiles

- BI Presentation Services Plug-in:
    - $J2EE\_home/application-deployments/analytics/home\_default\_group\_1/application.log
        
    - Also available through OAS's Enterprise Manager, click Logs link top right and navigate to the analytics Application
- BI Presentation Services:
    - $OracleBIData/web/log/sawlog0.log
        

## Common errors

### 500 Internal Server Error

Servlet error: An exception occurred. The current application deployment descriptors do not allow for including it in this response. Please consult the application log for details.

**BI Presentation Services Plug-in** has thrown an error, and you should check its logfile (see below).

### ﻿﻿﻿﻿analytics: Servlet error java.net.ConnectException: Connection refused

The **BI Presentation Services Plug-in** is trying to connect to a Presentation Services and can't. Either you've specified the wrong host or port details in the web.xml, or Presentation Services (sawserver) is not running.

### Internal Server Error

The server encountered an internal error or misconfiguration and was unable to complete your request.

This typically means that the **BI Presentation Services Plug-in** is not running. Check in OAS that the **analytics** application is started

## Bonus - shared config

In researching this I found an interesting point in the 10.1.3.4.1 release notes. You can specify the analytics configuration in a shared config file using the oracle.bi.presentation.sawbridge.configFilePath param-name.

On a clustered setup with shared filesystem you can therefore have one file listing the Presentation Services servers to use, and reference this from each analytics config.

Ref: [Configuring Oracle BI EE Using an EAR File](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/e10404/general.htm#CIHJFBAG)

## web.xml location

The [Deployment Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b40058.pdf) p35 states that the web.xml for java servlet is `$OracleBI_HOME/web/app/WEB-INF`. However, in my experience this should actually be `$J2EE_home/applications/analytics/analytics/WEB-INF`.

The table on p97 in the [Infrastructure Installation and Configuration Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31765.pdf) concurs with this, and shows different locations for web.xml. The difference is whether your installation using IIS or OAS/OC4J.

So for OAS/OC4J web.xml is $J2EE\_home/applications/analytics/analytics/WEB-INF, and for IIS's ISAPI plugin it is $OracleBI\_HOME/web/app/WEB-INF
