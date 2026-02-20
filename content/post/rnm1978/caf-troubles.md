---
title: "CAF troubles"
date: "2009-09-03"
url: "/2009/09/03/caf-troubles/"
categories: 
  - "caf"
  - "catalogmanager"
  - "OBIEE"
  - "windows"
---

Following the [Oracle CAF tutorial](http://www.oracle.com/technology/obe/obe_bi/bi_ee_1013/caf/caf.html) here, I got to Cloning Answers Requests section and then got stuck. I'd set up my environment exactly the same as in the tutorial, down to the same paths etc. After firing up the CAF to clone requests from the SampleSales catalog: ![caf1](/images/rnm1978/caf1.png "caf1") I clicked on Next and got the error **"Exception occurred when while initializing repository!!!"**

![error](/images/rnm1978/error.png "error")

By playing around with the passwords and path names I determined that both RPD files existed and that CAF could load them enough to validate the passwords. If the password is incorrect you get the error "The repository C:\\CAF\_Training\\Source\\samplesales.rpd cannot be opened".

Watching what happens in from ProcMon it looks like it checks the target RPD (paint) is present, then connects to Presentation Services web service. In the sawserver log (with enhanced logging) all that's really shown is the login request comes in and a valid session ID is returned.

In ContentAccelerator.properties I've set `LOG_FOLDER=C\:\\OracleBI\\web\\catalogmanager\\log` but just get a zero-byte CAF\_Exception.log file in that directory. The double slashes are deliberate c.f. the [CAF usage instructions](http://www.oracle.com/technology/products/bi/pdf/oraclebiee-cafv1-usage-instructions.pdf). The doc also indicates that the logging will be for operations carried out (clone etc), not for the tool as such.

Can anyone suggest how to resolve the "Exception occurred when while initializing repository!!!" error?

## Footnote - RTFM, a.k.a set your paths right!

Digging around with the brilliant [Process Monitor](http://technet.microsoft.com/en-us/sysinternals/bb896645.aspx) and [ProcessExplorer](http://technet.microsoft.com/en-us/sysinternals/bb896653.aspx) I noticed that Catalog Manager was running with JDK 1.5: ![procxp](/images/rnm1978/procxp1.png "procxp")

I'd seen the 1.6 requirement but have it installed so didn't think too much about it. Clearly 1.5 was taking precedence, as could be seen from my PATH variable: ![jdk](/images/rnm1978/jdk.png "jdk") Even after updating the PATH variable through settings > Control Panel > System Properties > Advanced > Environment Variables, Catalog Manager was still using JDK 1.5. [ProcessExplorer](http://technet.microsoft.com/en-us/sysinternals/bb896653.aspx) can be used to examine the environment variables that a process is using by right-clicking on a process and selecting Properties and then the Environment tab: ![catman](/images/rnm1978/catman.png "catman")

A reboot fixed this (at least, CatalogManager now fired up using the correct JDK 1.6 - which I'd have had in the first place if I'd [RTFM](http://www.oracle.com/technology/products/bi/pdf/oraclebiee-cafv1-usage-instructions.pdf)'d ... ), but I then got a new error in the same place as before (i.e. after clicking on Next in the Content Accelerator Wizard): ![javaerror](/images/rnm1978/javaerror.png "javaerror") D'oh - after the reboot I'd forgotten to restart my OBIEE services.

But -- I still have the Exception occurred when while initializing repository!!!" problem :-(

## Fixed

Update 9-Sep-09: Turns out I was almost on the right lines with my comment above about PATHs and java. There are two [downloads for CAF](http://download.oracle.com/technology/products/bi/files/OracleBIEE_CAFV1_Setup.zip), one when it was released (v1.01) and the current one (v1.02). In the readme for v1.02 java 1.6.0**\_10** is specified, whereas in v1.01 it only states 1.6.

After I'd upgraded my java installation (from 1.6.0\_03 to 1.6.0\_16) CAF worked fine.
