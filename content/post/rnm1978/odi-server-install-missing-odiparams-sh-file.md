---
draft: false
title: 'ODI Server install – missing odiparams.sh file'
date: "2009-03-27T14:54:00+0000"
categories:
- odi
- oui
- unix
---

I’m installing ODI agent on our database server using OUI. I selected the “Server” option at install time to get the Agent only, but looking in oracledi/bin odiparams.sh is missing:

<!--more-->
> ```
> $ls -l *.sh  
> -rwxrwxrwx   1 odiadm     dba            685 Nov 21 15:58 agent.sh  
> -rwxrwxrwx   1 odiadm     dba            908 Nov 21 15:58 agentscheduler.sh  
> -rwxrwxrwx   1 odiadm     dba            707 Nov 21 15:58 agentstop.sh  
> -rwxrwxrwx   1 odiadm     dba            941 Nov 21 15:58 agentweb.sh  
> -rwxrwxrwx   1 odiadm     dba            724 Nov 21 15:58 jython.sh
> ```

My understanding was that odiparams.sh was necessary, and looking at the code for agent.sh it must be as it includes:

> . $ODI\_HOME/bin/odiparams.sh

Checking [the manual](http://www.oracle.com/technology/products/oracle-data-integrator/10.1.3/htdocs/documentation/oracledi_setup.pdf) it’s possible to install ODI simply by unzipping the installation folder, so I copied the rest of the bin directoy from the original installation.

I then edited the odiparams.sh as required, and the agent started fine.
