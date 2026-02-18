---
draft: false
title: 'Multiple RPDs on one server – Part 2 – Presentation Services'
date: "2009-08-25T16:13:07+0000"
image: "/images/2009/08/oracle-enterprise-manager-oc4jadmin-cluster-topology_1251187606945.webp"
categories:
- hack
- obiee
- sawserver
---

## Introduction

<!--more-->
In this article I plan to get sample and paint repositories hosted on a single server, using one BI Server instance and two Presentation Services instances. This is on both Unix (OEL 4) and Windows, and both OC4J (OBIEE’s “basic installation” option) and OAS (“Advanced Installation”).

Make sure you’ve read and followed [part 1 – BI Server](/post/rnm1978/multiple-rpds-on-one-server-part-1-the-bi-server/) first.

Remember that multiple Presentation Services instances on a machine is **UNSUPPORTED BY ORACLE!**

## OBIEE Components

*See the [deployment guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b40058.pdf) p.11 for a thorough explanation of the components.*

It’s important to understand the components of the OBIEE stack as what we’re doing is unsupported and undocumented in parts, so you need to be able to diagnose and reason through issues you may get:

- BI Server (nqserver) – the Analytics server. Uses the RPD to build queries to send to the database.
- Presentation Services (sawserver) – This takes the submission of queries from Answers/Dashboards and sends them by ODBC to the BI Server. It handles the rendering of the returned data.
- Presentation Services Plug-in (analytics) – This is a J2EE application deployed in on an application server such as Oracle Application Server or OC4J. It handles server-side calls from the Answers or Dashboards webpage.

What we do is deploy a second instance of the Presentation Services Plug-in (analytics) and configure it to talk to a second invocation of Presentation Services (sawserver) which is run with a new configuration.

NB contrary to other posts on this subject that I’ve seen, you don’t need to *install* a second instance of presentation services – you just fire up your existing one with a different configuration file.

## Deploy a second instance of Presentation Services Plug-in (analytics)

This is for OAS and OC4J, with another application server [YMMV](http://en.wikipedia.org/wiki/Your_mileage_may_vary).

- Login, at <http://:/em/> (common ports are 7777 or 9704) (see here for [info on resetting login details it if you don’t know the login](http://mike-lehmann.blogspot.com/2006/12/reset-oc4j-admin-password.html))
- [OAS only] Assuming you’re now on the “Cluster Topology” screen, click through to the OC4J home (under Members click the link where in the Type column it says OC4J)![Oracle Enterprise Manager (oc4jadmin) - Cluster Topology_1251187606945](/images/2009/08/oracle-enterprise-manager-oc4jadmin-cluster-topology_1251187606945.webp "Oracle Enterprise Manager (oc4jadmin) - Cluster Topology_1251187606945")
- Assuming you’re now on **OC4J: home** click the **Applications** link. (You should see one instance of analytics already deployed.)
- Click on the Deploy button ![oc4jhome](/images/2009/08/oc4jhome.webp "oc4jhome")
- For the next step, determine where on your server analytics.war is (by default it will be $OracleBI/web/analytics.war).
- On the **Deploy: Select Archive** page tick “*Archive is already present on the server where Application Server Control is running.*” and enter the full path to analytics.war. Under **Deployment Plan** leave “*Automatically create a new deployment plan*” ticked. Click Next.![Oracle Enterprise Manager (oc4jadmin) - Deploy- Select Archive_1251188864123](/images/2009/08/oracle-enterprise-manager-oc4jadmin-deploy-select-archive_1251188864123.webp "Oracle Enterprise Manager (oc4jadmin) - Deploy- Select Archive_1251188864123")
- On the **Deploy: Application Attributes** page change **Application Name** and **Context Root** to whatever you want to access the new instance by. For example, if you currently go to <http://localhost:7777/analytics> you could choose <http://localhost:7777/analyticsInstanceB>. In this example I’m going to use analyticsRNM. Click Next.![Oracle Enterprise Manager (oc4jadmin) - Deploy- Application Attributes_1251189838584](/images/2009/08/oracle-enterprise-manager-oc4jadmin-deploy-application-attributes_1251189838584.webp "Oracle Enterprise Manager (oc4jadmin) - Deploy- Application Attributes_1251189838584")
- On the **Deploy: Deployment Settings** page you shouldn’t need to change anything. Click Deploy.![Oracle Enterprise Manager (oc4jadmin) - Deploy- Deployment Settings_1251190127915](/images/2009/08/oracle-enterprise-manager-oc4jadmin-deploy-deployment-settings_1251190127915.webp "Oracle Enterprise Manager (oc4jadmin) - Deploy- Deployment Settings_1251190127915")
- Hopefully you’ll get a successful deployment:**![Oracle Enterprise Manager (oc4jadmin) - Confirmation_1251190541184](/images/2009/08/oracle-enterprise-manager-oc4jadmin-confirmation_12511905411841.webp "Oracle Enterprise Manager (oc4jadmin) - Confirmation_1251190541184")**Take note of the path listed as “Copy the archive to” in the output. This gives you the j2ee home, which you’ll need in a minute. In this example:

  ```
  [25-Aug-2009 09:51:33] Copy the archive to /app/oracle/product/10.1.3.1/OracleAS_1/j2ee/home/applications/analyticsRNM.ear
  ```

  the J2EE home dir is

  ```
  /app/oracle/product/10.1.3.1/OracleAS_1/j2ee/home
  ```
- Click Return, and on your OC4J: home you should now have a second analytics listed![Oracle Enterprise Manager (oc4jadmin) - OC4J- home_1251191169012](/images/2009/08/oracle-enterprise-manager-oc4jadmin-oc4j-home_1251191169012.webp "Oracle Enterprise Manager (oc4jadmin) - OC4J- home_1251191169012")

## Setting up a second Presentation Services

You need to create a second Presentation Services that will have its own web catalog and configuration to use the correct RPD.  
In this example I’ll create a new Presenttion Services which will be for **samplesales** whilst the original default installation will be for **paint**.

An important note is that we don’t need to install anything new, we simply use the existing installation with separate configurations (instanceconfig.xml) and web catalog. The next steps assume that you already have the web catalog for samplesales and just cover instanceconfig.xml

In $OracleBIData/web/config create a copy of instanceconfig.xml for your new instance, eg. instanceconfigRNM.xml. Edit it as follows:

- Set the **CatalogPath** to the web cat for samplesales
- Set the **DSN** to the ODBC connection you defined above for samplesales
- Under the <ServerInstance> tag add <**Listener** **port**=”9711” />. Set the listener port to port that is not currently in use. Remember what you set it to, as you’ll need to update the Presentation Services plugin with it (see below). In unix you can’t use below 1024 unless you’re root (which you shouldn’t be running OBIEE as!).

**Be aware that instanceconfig.xml is CaSe SENsiTIve**. Thanks to [Merlin128 for discovering this](http://forums.oracle.com/forums/thread.jspa?threadID=947711&tstart=0) 🙂 This can lead to problems as you won’t always get an error. If you use **catalogpath** (instead of **CatalogPath**) you’ll get an error, but if you use **Listener Port** (capital P, should be lowercase) you won’t get an error but sawserver will ignore it and default to port 9710.

Your modified file should look something like this:

```

<?xml version="1.0" encoding="utf-8"?>
<WebConfig>
   <ServerInstance>
   <Listener port="9711"/>
   <DSN>AnalyticsWebSampleSales</DSN>
   <CatalogPath>/data/web/catalog/samplesales</CatalogPath>
[...]
```

(**NB**: following the instructions in *“Changing the BI Presentation Services Listener Port” in the [deployment guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b40058.pdf) p.141*, I got an error when I tried to embed the Listener tag within RPC: “The configuration entry ‘RPC/Listener’ is deprecated. Please refer to the admin guide for more information.” followed by an Assertion failure. Putting it just within ServerIntance worked fine)

## Testing the second instance of Presentation Services (sawserver)

sawserver can be started with command line parameters, one of which is to specify the config file (which defaults to $OracleBIdata/web/config/instanceconfig.xml). Ultimately we’ll package this up neatly, but to avoid complications it’s best to run it natively from the commandline first to make sure it’s working and not hide any output which may be helpful.

#### Windows

From the commandline go to $OracleBI\web\bin (eg. C:\OracleBI\web\bin) and enter:  
**sawserver.exe -c c:\OracleBIData\web\config\instanceconfigRNM.xml**  
(amend c:\OracleBIData\web\config\instanceconfigRNM.xml as appropriate to point to the new instanceconfig.xml file you created above).  
Make sure you get a successful startup:

> Type: Information  
> […]  
> Oracle BI Presentation Services 10.1.3.4.1 (Build 090414.1900) are starting up.  
> —————————————  
> Type: Warning  
> […]  
> WARNING: The Oracle BI Presentation Server is running on a workstation class machine (Windows 2000 Workstation, Windows XP Professional, etc  
> .). Number of concurrent users may be severely limited by the operating system.  
> —————————————  
> Type: Information  
> […]  
> Oracle BI Presentation Services have started successfully.

#### Unix

From the shell prompt go to $OracleBI/setup and run

```

. ./sa-init.sh
sawserver -c /data/web/config/instanceconfigRNM.xml
```

Points to note:

- common.sh and sa-init.sh are “dot sourced”, i.e. type exactly: **dot space dot slash**
- If you’re on 64 bit then run sa-init64.sh and sawserver64 instead of sa-init.sh and sawserver respectively
- amend /data/web/config/instanceconfigRNM.xml as appropriate to point to the new instanceconfig.xml file you created above

Make sure you get a successful startup:

> Type: Information  
> […]  
> Oracle BI Presentation Services 10.1.3.4.1 (Build 090414.1900) are starting up.  
> —————————————  
> Type: Information  
> […]  
> Oracle BI Presentation Services have started successfully.

## Configuring the new Presentation Services plugin

You need to configure the new Presentation Services plugin (eg analyticsRNM) so that it can communicate with the second instance of Presentation Services.

- Go to your J2EE home directory (if you didn’t note it down below, in OC4J go logs in the top right corner and then click on View for one of the logs, this should give you the path to j2ee/home). Under applications (not application-deployments) go to whatever you called your new instance (eg analyticsRNM), then analytics, then WEB-INF  
  eg.

  ```
  /app/oracle/product/10.1.3.1/OracleAS_1/j2ee/home/applications/analyticsRNM/analytics/WEB-INF
  ```

  or

  ```
  C:\OracleBI\oc4j_bi\j2ee\home\applications\analyticsRNM\analytics\WEB-INF\
  ```
- Make a backup copy of web.xml
- Open web.xml in your favourite text editor and search for **oracle.bi.presentation.sawserver.Port**. On the line below there will be the default port of 9710. Change this to the new value that you defined above in *Setting up a second Presentation Services* (in that example it was 9711). It’s very important to get this bit right!![webxm](/images/2009/08/webxm.webp "webxm")
- In OC4J Application list restart the new instance (eg analyticsRNM), or restart the whole of OC4J/OAS to make doubly-sure.

## Testing the configuration

For good measure, first bounce both BI Server and your web/application server (eg OC4J, OAS) if you haven’t already.

Then start **both** versions of Presentation Services (either manully or scripted, see below). Check that they’ve started up correctly by checking sawserver.out.log, and check they’re listening on the correct ports (eg 9710 and 9711):

```
![tcp](/images/2009/08/tcp.webp "tcp")
```

**Note about ports**: don’t confuse these Presentation Services ports with your web server ports. You will always connect from your web browser to your web server on the same port, eg. 9704 or 7777. You would never enter the ports 9710 etc in your web browser address bar.

Start BI server if it’s not running, and then navigate to <http://%5Bweb> server]:[web server port]/analytics (eg <http://localhost:7777/analytics>) and login and ensure that you get paint (or whatever you’ve left your default instanceconfig.xml pointing to).

Now try <http://%5Bserver%5D:%5Bport%5D/%5Bnew> analytics] eg. <http://localhost:7777/analyticsRNM> and login and hopefully you’ll get samplesales (or whatever your new instanceconfig.xml points to).

![samplesales.rpd in one window, paint.rpd on the other, both running from one server](/images/2009/08/result.webp "result")

samplesales.rpd in one window, paint.rpd on the other, both running from one server

## Problems you might encounter

When doing this amount of configuration work it never does any harm to throw in cheeky service restart to see if it resolves an error. It’s probably good practice to try and work through an error first, if only for gathering understanding.

#### 500 Internal Server Error

*Servlet error: An exception occurred. The current application deployment descriptors do not allow for including it in this response. Please consult the application log for details.*  
This is a generic message meaning that the Presentation Services plugin (“analytics”) has thrown an error. To find details either get the log file from disc ($J2EE home/application-deployments//home\_default\_group\_1/application.log) or from **OC4J: home**![Oracle Enterprise Manager (oc4jadmin) - Log Files_1251205732988](/images/2009/08/oracle-enterprise-manager-oc4jadmin-log-files_1251205732988.webp "Oracle Enterprise Manager (oc4jadmin) - Log Files_1251205732988")  
From the log file you can get the real error message of what’s going on

#### Port 9710 is in use on the local system

Check that you’re starting sawserver directly, and not using sawserver.sh.  
If you use sawserver.sh then your -c argument will be ignored because sawserver.sh calls the sawserver binary without any arguments.

Doublecheck your customised instanceconfig.xml file, because sawserver won’t necessarily flag an error if it’s invalid, it will just revert to default values including port (9710).

#### Your new analytics instance shows the same repository as the default one

You analytics is probably connecting to the incorrect Presentation Services, or the Presentation Services it is connecting to is not running with the correct instanceconfig.xml file

- What port is Presentation Services plugin (analytics) looking for Presentation Services (sawserver) on? see $J2EE home/applications/[your analytics]/analytics/WEB-INF/web.xml and check the param-value for oracle.bi.presentation.sawserver.Port
- Shut down all Presentation Server (sawserver) instances that **aren’t** configured to serve the port in question. Use netstat to verify that the port is state LISTEN
- Try logging in again – if you get the login screen then you’re connecting to Presentation Services correctly, so the problem must be with the configuration there
- Check the instanceconfig file that the Presentation Services is started with, have you updated DSN, CatalogPath and Listener Port as described above?

#### java.io.EOFException at com.siebel.analytics.web.sawconnect.sawprotocol.SAWProtocol.readInt

> 09/08/25 14:04:50.46 analytics: Servlet error  
> java.io.EOFException  
> at com.siebel.analytics.web.sawconnect.sawprotocol.SAWProtocol.readInt(SAWProtocol.java:167)  
> at com.siebel.analytics.web.sawconnect.sawprotocol.SAWProtocolInputStreamImpl.readChunkHeader(SAWProtocolInputStreamImpl.java:232)

This means that the Presentation Services plugin (analytics) cannot communicate with Presentation Services (sawserver).  
Check:

- What port is analytics configured to use? see $J2EE home/applications/[your analytics]/analytics/WEB-INF/web.xml and check the param-value for oracle.bi.presentation.sawserver.Port
- Is Presentation Services (sawserver) started?
- Is Presentation Services (sawserver) listening on the same port as is configured in analytics’ web.xml? Check the instanceconfig file that sawserver was started with, and use netstat -a to check if it’s state LISTEN or not
- If all of these look correct, try bouncing your application server (OC4J, OAS, etc)

#### [nQSError: 10058] A general error has occurred. [nQSError: 12008] Unable to connect to port 9703 on machine localhost.

Whoops, you forgot to start your BI server…

#### Charts aren’t working, I just get a yellow triangle symbol

Is the Javahost service running?

## Starting both Presentation Services neatly

#### Unix

run-saw.sh is the script used in Unix to control Presentation Services. You can examine it in $OracleBI/setup/run-saw.sh and create your own hack based on your requirements (eg if you always want both started, or to control them individually).

Be aware that run-saw.sh checks for an running instance of “sawserver” so you’ll need to cater for that.

One method would be to create a new startup script like this:

```

#!/bin/sh
#
# Hacky script to run two versions of Presentation Services
#
# https://rmoff.net
#
# ---------------------------------------------------
# start your default Presentation Services
echo 'Starting default Presentation Services...'
echo ' '
run-saw.sh start
# The above should be "start64" if you're in 64 bit mode

# Now start the additional Presentation Services
echo '----'
echo ' '
echo 'Starting additional Presentation Services...'
echo ' '
. ./common.sh
. ./sa-init.sh
logfile="${SADATADIR}/web/log/sawserverRNM.out.log"
sawserver -c /data/web/config/instanceconfigRNM.xml  >> ${logfile} 2>&1 &
# The above should be "sawserver64" if you're in 64 bit mode
echo 'See '${logfile}' for log'
```

Stopping Presentation Services is easier, as run-saw.sh is ruthless in its approach and kills all instances of sawserver. If you don’t want this and want to target a specific instance you’ll need to use ps -ef|grep sawserver and kill the required process.

#### Windows

To add your new Presentation Services as a service in its own right using Microsoft’s [sc](http://support.microsoft.com/kb/251192), follow these steps.  
**This involves editing the registry! Do so at your own risk!**

1. From the commandline enter:

   ```
   
   sc create sawsvc2 binpath= SEARCHFORMEPLEASE displayname= "Oracle BI Presentation Server 2"
   ```

   (note the spaces after the equals character)
2. Run regedt32 and search for SEARCHFORMEPLEASE
3. Hopefully you’ll find HKEY\_LOCAL\_MACHINE\SYSTEM\CurrentControlSet\Services\sawsvc2
4. Edit the ImagePath Value to **“C:\OracleBI\web\bin\sawserver.exe” /service /c c:\OracleBIData\web\config\instanceconfigRNM.xml** (replacing paths where appropriate)![reg](/images/2009/08/reg.webp "reg")
5. Go to Services and you should see Oracle BI Presentation Server 2 which when started should bring up your new Presentation Services.![services](/images/2009/08/services.webp "services")

(I couldn’t get sc to accept the full command hence the SEARCHFORME hack!)

If you don’t want to muck around with services something like this simple script should suffice. It uses PsExec (from the excellent [PsTools](http://technet.microsoft.com/en-us/sysinternals/bb896649.aspx) suite of utilities) to start multiple sawserver instances in the background.

```

REM runMultiplePS.bat
REM
REM
REM Hacky script to run two versions of Presentation Services
REM
REM https://rmoff.net
REM
REM Uses psExec, download it from http://technet.microsoft.com/en-us/sysinternals/bb896649.aspx
REM and put it somewhere in your PATH like c:\windows\system32
REM ---------------------------------------------------
REM Default instance. Comment this line out if you're running it from Services instead.
REM (you could include -c c:\OracleBIData\web\config\instanceconfig.xml  if you wanted, same difference)
psexec -d C:\OracleBI\web\bin\sawserver.exe
REM Additional instance:
psexec -d C:\OracleBI\web\bin\sawserver.exe -c c:\OracleBIData\web\config\instanceconfigRNM.xml
REM ---------------------------------------------------
REM paths will be something like C:\OracleBI\web\bin64\sawserver64.exe for 64-bit
```

## Conclusion

Hopefully this article demonstrates clearly and in enough detail how to set up multiple Presentation Services, without overwhelming the reader. It is actually easy to do, and is great practice for understanding the architecture behind the OBIEE stack. Things to consider after this are the other shared resources (like javahost and logconfig.xml) which may want isolating depending on the use.

Remember that multiple Presentation Services instances on a machine is **UNSUPPORTED BY ORACLE!**

As well as working on multiple RPDs & Web Cats, this method could be used for one RPD but multiple web cats, maybe at different development levels, or as a sandbox for certain users. In that case the instanceconfig for each Presentation Services would specify the same ODBC DSN.

## References / sources

- [Borkur Steingrimsson’s article on Rittman Mead](http://www.rittmanmead.com/2007/09/11/managing-multiple-presentation-services-on-the-same-unix-box/)
- [OTN forum topic “can OBIEE run two rpd files at the same time?”](http://forums.oracle.com/forums/thread.jspa?threadID=607551)
- [Changa Reddy’s blog posting](http://obi-experience.blogspot.com/2008/04/multiple-instances-of-obieecomponents.html)
- [OTN forum topic “Presentation Server port wont change”](http://forums.oracle.com/forums/thread.jspa?threadID=947711&tstart=0)
- [Giorgio’s post on OTN](http://forums.oracle.com/forums/thread.jspa?threadID=714730&tstart=0)
- [John Minkjan’s 10.1.3.4.1 config tags document](http://docs.google.com/fileview?id=0B8vnN_oQ0v04MTYwNzI1ODktYmZkNy00MzJlLTkwNGUtYmU3ZjgwMDc3OTQ4&hl=en)
- [B.Vellinger’s blog posting](http://bvellinger.blogspot.com/2008/01/obiee-10132-and-multiple-presentation.html)
- [BI Server Administration Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31770.pdf)
- [Presentation Services Administration Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31766.pdf)
- [Installation and Configuration guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31765.pdf)
