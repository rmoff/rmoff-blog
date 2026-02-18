---
draft: false
title: 'OBIEE admin tools & hacks'
date: "2009-07-21T09:28:00+0000"
image: "/images/2009/07/jmanage13_134a37.webp"
categories:
- hack
- mbeans
- nqcmd
- obiee
- performance
- sawping
- sawserver
- unix
---

As a kid I loved the idea of lego where you can disassemble and reassemble something from the ground up. As soon as I got my hands on a computer it was the same. You can have your Acorn Archimedes with its games, where do I find the sprites and sound files behind it? Likewise Microsoft Word, let me at the VBA underneath to hack it around and see what else it can do.

<!--more-->
With that in mind I’ve enjoyed discovering bits of the “underbelly” of OBIEE from manuals, blogs and a few SRs I’ve raised.

Here’s my list so far, please feel free to add to it in the comments and correct any errors or missing credits 🙂  
  
Oracle BI Management data  
This server-based performance and diagnostic data can be access through several methods:

### perfmon

### 

Credit: <http://obiee101.blogspot.com/2009/07/obiee-perfmon-performance-monitor.html>  
*(Image no longer available)*  
Go to <http://%5Bserver%5D:%5Bport%5D/analytics/saw.dll?perfmon> and you’ll get the Performance Monitor. This is the same data that’s used by the BI Management Pack and is accessible through the [jmx agent](/post/rnm1978/jconsole-jmx/)

### oc4j

An alternative to jconsole is to access the Oracle BI Management MBeans through oc4j. [@lex has details here](http://blogs.oracle.com/siebelessentials/2008/11/oracle_bi_ee_and_mbeans.html)  
*(Image no longer available)*

### Windows perfmon

### 

*(Image no longer available)*

More details in [separate post here](/post/rnm1978/obiee-windows-perfmon-counters/)

### jconsole

The same data as through perfmon above, full details here: [jmx agent](/post/rnm1978/jconsole-jmx/)  
*(Image no longer available)*

### jManage

jManage is an open-source tool that can also be used to access the MBeans:  
![jmanage13](/images/2009/07/jmanage13_134a37.webp "jmanage13")  
See [this post](/post/rnm1978/oracle-bi-management-jmanage//) for information  
sawping  
Credit: <http://tipsonobiee.blogspot.com/2009/07/sawping.html>

> C:\OracleBI\web\bin>sawping.exe -help  
> sawping [-p port] [-s host] [-v (verbose mode)] [-q (quiet mode)] [-h]C:\OracleBI\web\bin>sawping.exe -s myPSserver.company.net -v  
> Server alive and well

NB not got this working yet on unix:

> obiee/web/bin64 $./sawping64  
> /usr/lib/hpux64/dld.so: Unable to find library ‘libsawcomm643r.so’.

Found in [OracleBI Home]/web/bin (or Bin64)

nqcmd  
Great little command line tool. We’re using it for some crude load testing (get a bunch of logical-SQL statements and use unix scripting to fire them in parallel at the BI Server) as well as monitoring of the BI Server (“pinging” it regularly with some small logical-SQL to make sure it responds correctly)  
Found in [OracleBI Home]/server/Bin (or Bin64)

UnixChk  
(UNIX only, duh)  
What it says on the tin – validates your Unix environment is suitable for OBIEE

> Usage: UnixChk.sh [-b] [-s | ]

diagcap  
Support asked me to run this, you’ll find it in [OBIEE home]/server/Bin

> Usage: ./diagcap.sh -d [-p] [-h]  
> -d : directory that info will be stored  
> The directory must be empty  
> -p : absolute path to Oracle BI root directory  
> May be omitted if the SAROOTDIR  
> environment variable is set  
> -h : show this help message

It collects all the config files and log files from your environment into a TAR archive, which you can then send to support.

tusc  
Not OBIEE as such, but interesting for the truly nosy. This is a unix (HP) tool which you use to invoke a program and then get low-level diagnostics on what it’s up to. Most of the output may be gobbledegook to all but the hardcore programmer, but it does sometimes pick out if a library file is missing etc.  
For example to invoke nqqserver in run-sa.sh:

> tusc -vfe ${ANA\_BIN\_DIR}/nqsserver 2>&1 &

Administration Tool  
Maybe not so unknown, but has front-end for monitoring clusters which I liked

The AdminTool can also be fed a script via the command line, [see details here](/post/rnm1978/admintool-exe-command//)

Other stuff  
This is a list of binaries that might or might not be of interest and that I plan to have a play with at some point

NB obiee/setup/sa-init64.sh and common.sh scripts might need running first to set the environment variables correctly.

obiee/web/bin

- cryptotools – used for generating keys for authentication between obiee/delivers/xmlp
- sawmigrate – for migrating from older versions of OBIEE?

obiee/server/Bin

- equalizerpds – For equalising RPDs prior to merging as part of an upgrade process [Reference](http://download.oracle.com/docs/cd/E12102_01/books/AnyAppUpgr/AnyAppUpgrApps19.html)
- ErrorMsgCheck (directory) – not sure
- nqerrormsgcompiler – not sure

> $nqerrormsgcompiler  
> ErrorMessageCompiler [] []  
> Exiting

- nqlogviewer – For parsing BI server logs. Can be useful for clustered instances?
- nqschangepassword – For changing of RPD user passwords
- nqscripthostexec – not sure

> $nqscripthostexec  
> Usage: nqscripthostexec Memory fault(coredump)

- nqsshutdown – To shut down a BI Server via DSN reference ([see here](http://gerardnico.com/wiki/dat/obiee/executable_files/nqsshutdown))
- nqsudmlcli – something to do with UDML?
- nqudmlexec – executing UDML against the RPD
- nqudmlgen – generating UDML from an RPD
- nqxudmlexec – executing XML formatted UDML against the RPD
- nqxudmlgen – generating XML formatted UDML from an RPD
- openssl – OpenSSL command line
- sametaexport – Oracle Database Metadata Generator. See [Oracle Business Intelligence Server Administration Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31770.pdf) and [Venkat’s blog](http://oraclebizint.wordpress.com/2007/11/05/oracle-bi-ee-101332-sametaexport-for-improving-query-performance-precursor-for-materialized-views/)
- saschinvoke – invoke Delivers jobs & iBots (see [here](http://oraclebizint.wordpress.com/2008/03/06/oracle-bi-ee-101332-integrating-schedulerdelivers-into-other-applications/))
- schconfig – Scheduler [Delivers] configuration program
- schshutdown – Shutdown Scheduler remotely?

In Googling these various binaries I found an excellent PDF from Andreas Nobbmann’s presentation in Brighton earlier this year: [Scripting OBIEE – Is UDML and XML all you need?](http://www.trivadis.com/uploads/tx_cabagdownloadarea/andreas_nobbmann_udml_xml.pdf)

Another useful page is here: <http://gerardnico.com/wiki/dat/obiee/executable_files/start>
