---
title: "sawserver won't start up - resolved"
date: "2009-04-01"
url: "/2009/04/01/sawserver-wont-start-up-resolved/"
categories: 
  - "OBIEE"
  - "sawserver"
  - "unix"
---

(See [here](/2009/03/30/sawserver-wont-start-analytics-servlet-error-java-net-connectexception-connection-refused-errno239/) and [here](/2009/04/01/troubleshooting-an-hpux-program/) for history)  
  
I edited the shell script which is eventually called by run-saw.sh to start the sawserver, (OracleBI)/setup/sawserver.sh, to use trus:  
Comment out the final line:  

> $SASAWSERVER

and insert as a new line:  

> tusc -fepan -o /tmp/sawserver\_tusc.out $SASAWSERVER  

The output of trus ended with this:  

> open("/app/oracle/product/10.2.0/lib/libstd\_v2.so.1", O\_RDONLY|0x800, 0) ......... ERR#2 ENOENT  
> open("/app/oracle/product/obiee/server/Bin64/libstd\_v2.so.1", O\_RDONLY|0x800, 0) . ERR#2 ENOENT  
> open("/app/oracle/product/obiee/web/bin64/libstd\_v2.so.1", O\_RDONLY|0x800, 0) .... ERR#2 ENOENT  
> open("/app/oracle/product/obiee/odbc/lib64/libstd\_v2.so.1", O\_RDONLY|0x800, 0) ... ERR#2 ENOENT  
> open("/usr/lib/libstd\_v2.so.1", O\_RDONLY|0x800, 0) ............................... ERR#2 ENOENT  
> open("/lib/libstd\_v2.so.1", O\_RDONLY|0x800, 0) ................................... ERR#2 ENOENT  
> open("/app/oracle/product/10.2.0/lib/libstd\_v2.so.1", O\_RDONLY|0x800, 0) ......... ERR#2 ENOENT  
> open("/opt/aCC/lib/hpux64/libstd\_v2.so.1", O\_RDONLY|0x800, 0) .................... ERR#2 ENOENT

which showed sawserver failing to find libstd\_v2.so.1. 
The helpful chap on my SR at Oracle said this should be in /usr/lib/hpux64 (which it is) and so to add this to the SHLIB\_PATH variable:  

> export SHLIB\_PATH=/usr/lib/hpux64  

If SHLIB\_PATH already has a value then use the syntax ${SHLIB\_PATH}:/usr/lib/hpux64 or use this anyway and set +u to stop the shell barfing on the unknown variable  
  
Having updated SHLIB\_PATH sawserver now starts up fine on this server now! w00t!  
  
But -- why did this just start happening now?? The same servers with the same obiee installation and same obiee configuration worked without the SHLIB\_PATH being set last week, so why do they need it now?
