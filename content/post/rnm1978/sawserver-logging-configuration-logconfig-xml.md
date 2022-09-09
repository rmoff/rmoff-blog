---
title: "sawserver logging configuration - logconfig.xml"
date: "2009-07-23"
categories: 
  - "config"
  - "hack"
  - "log"
  - "sawserver"
---

The configuration of how Presentation Services (sawserver) does its logging is in the file web/config/logconfig.xml (same directory as instanceconfig.xml).  
  
It's all nice and XML'd:  

![](/images/rnm1978/filter.png)Logging Detail  
Change the numerical values in the FilterRecord entries to alter the detail level of the logging. Lower means less detail, higher means more.  
  
Be aware that your log files can grow very rapidly if you set the logging too high, and unless you're troubleshooting then leave them at the defaults.  
  
Logging Configuration  
You can change various things like how many log files are written, to what size, and also the format of the log entries:  
![](/images/rnm1978/shortlog.png)This configuration is in the Writer definition, in the case of format set fmtName="short"  
Being able to write a single-line entry is very useful in the case of monitoring software (eg. OpenView) which can't parse multiple line log entries.  
  
sawserver.out.log and saw\[x\].log  
sawserver.out.log is the stdout logging from presentation services. In Unix this is captured to sawserver.out.log, whereas in Windows I don't think it's captured.  
saw\[x\].log is the file logging from presentation services  
  
The level of information for both files is defined in logconfig.xml:  

> <filterrecord writerclassgroup="Cout" path = "saw" information="31" warning="41" error="41" security="41">  
> <filterrecord writerclassgroup="File" path = "saw" information="31" warning="100" error="100" security="41">

  
So by default you'll more detail in your saw\[x\].log (writerClassGroup="File") than sawserver.out.log (the redirected stdout, writerClassGroup="Cout"). In sawserver.out.log you'll get the same Information and Security type messages as saw\[x\].log, but fewer (only those of greater severity) Warning and Error type messages.  
  
More detail  
See [Presentation Services Administration Guide](http://download.oracle.com/docs/cd/E10415_01/doc/bi.1013/b31766.pdf) "Using the Oracle BI Presentation Services Logging Facility" for more very detailed information.
