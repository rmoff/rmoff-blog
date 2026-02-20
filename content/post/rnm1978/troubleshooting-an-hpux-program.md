---
title: "Troubleshooting an HPUX program"
date: "2009-04-01"
categories: 
  - "unix"
---

In investigating the [problems with sawserver](/2009/03/30/sawserver-wont-start-analytics-servlet-error-java-net-connectexception-connection-refused-errno239/) I was pointed towards a tool called [tusc](http://hpux.connect.org.uk/hppd/hpux/Sysadmin/tusc-7.9/) (which appears to be an HP version of truss).  
  
You can use it to invoke a program, and get out a bunch of debug information including system calls.  
  
You run it like this:  

> $tusc -fep /app/oracle/product/obiee/web/bin64/sawserver64

As a beginner when it comes to hardcore \*nix I can only look at this and take pot shots at what's going on, but with Google by my side I'm interested in the last lines of the output:  

> open("/app/oracle/product/10.2.0/lib/libstd\_v2.so.1", O\_RDONLY|0x800, 0) ......... ERR#2 ENOENT  
> open("/app/oracle/product/obiee/server/Bin64/libstd\_v2.so.1", O\_RDONLY|0x800, 0) . ERR#2 ENOENT  
> open("/app/oracle/product/obiee/web/bin64/libstd\_v2.so.1", O\_RDONLY|0x800, 0) .... ERR#2 ENOENT  
> open("/app/oracle/product/obiee/odbc/lib64/libstd\_v2.so.1", O\_RDONLY|0x800, 0) ... ERR#2 ENOENT  
> open("/usr/lib/libstd\_v2.so.1", O\_RDONLY|0x800, 0) ............................... ERR#2 ENOENT  
> open("/lib/libstd\_v2.so.1", O\_RDONLY|0x800, 0) ................................... ERR#2 ENOENT  
> open("/app/oracle/product/10.2.0/lib/libstd\_v2.so.1", O\_RDONLY|0x800, 0) ......... ERR#2 ENOENT  
> open("/opt/aCC/lib/hpux64/libstd\_v2.so.1", O\_RDONLY|0x800, 0) .................... ERR#2 ENOENT  

This is the last output before the process hangs, and ENOENT is a file or directory not found error. It looks like it's scanning different folders for the file  
  
This makes me think there's something up with the path/load library environment variables (but why on all our servers and only now??).
