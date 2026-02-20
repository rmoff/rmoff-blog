---
title: "ORA-12537 / ORA-12518 [Informatica DAC error CMN_1022]"
date: "2009-03-25"
url: "/2009/03/25/ora-12537-ora-12518-informatica-dac-error-cmn_1022/"
categories: 
  - "dac"
  - "informatica"
  - "obia"
  - "oracle"
---

We're getting problems with an instance of Informatica / out-of-the-box OBIA on a new set of servers. When we run the execution plan we get this error soon after starting:  

> MAPPING> DBG\_21075 Connecting to database \[TNSENTRY\], user \[MYUSER\]  
> MAPPING> CMN\_1761 Timestamp Event: \[Tue Mar 24 18:56:33 2009\]  
> MAPPING> CMN\_1022 Database driver error...  
> CMN\_1022 \[  
> Database driver error...  
> Function Name : Logon  
> ORA-12537: TNS:connection closed  
>   
> Database driver error...  
> Function Name : Connect  
> Database Error: Failed to connect to database using user \[MYUSER\] and connection string \[TNSENTRY\].\]  
>   
> MAPPING> CMN\_1761 Timestamp Event: \[Tue Mar 24 18:56:33 2009\]  
> MAPPING> CMN\_1076 ERROR creating database connection.

One or two tasks using the DataWarehouse connection succeed, and then the rest fail with the above error.  
  
That one or two tasks succeed proves that the connection string is specified correctly, plus I'd expect to see an auth error if our username/pw was incorrect. We've verified the Physical Data Source in DAC, but stupidly in Informatica (Workflow Manager - Connections - Relational) there's no "test connection".  
  
Both of the errors, Informatica's CMN\_1022 and Oracle's ORA-12537, are generic "somat's bust" ones, neither providing a clue to what the problem is.  
  
Metalink 3 has several entries for CMN\_1022 but they just point to configuration/installation errors with the database connectivity.  
  
There's a [matching article](http://forums.oracle.com/forums/thread.jspa?messageID=3171675) on OTN Forums but without a definitive solution  
  
In DAC Physical Data Sources the Max Num Connections is 10. The OTN forum posting refers to performace so guessing maybe Oracle wasn't happy with the # of concurrent connections I changed it to 1, but the problem remained.  
  
This is on Informatica 8.1.1, Oracle client 10.2.0 and Oracle DB 11.1.0.7. 
  
Our DBA had a look and validated all the connectivity, and also granted the user DBA just to make sure it wasn't a priviledges issue.  
  
I turned on tracing in the sqlclient (add trace\_level\_client=16 to the sqlnet.ora in $TNS\_ADMIN) and got this rather helpful output:  
  

> \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*  
> Fatal NI connect error 12537, connecting to:  
> (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=mydb.company.com)(PORT=1521))(CONNECT\_DATA=(SID=TNSENTRY)(SERVER=DEDICATED)(CID=(PROGRAM=pmdtm)(HOST=  
> apphost)(USER=unixuser))))  
>   
> VERSION INFORMATION:  
> TNS for HPUX: Version 10.2.0.1.0 - Production  
> TCP/IP NT Protocol Adapter for HPUX: Version 10.2.0.1.0 - Production  
> Time: 25-MAR-2009 11:09:46  
> Tracing to file: /app/oracle/product/informatica/server/bin/cli\_2844.trc  
> Tns error struct:  
> ns main err code: 12537  
> TNS-12537: TNS:connection closed  
> ns secondary err code: 12560  
> nt main err code: 507  
> TNS-00507: Connection closed  
> nt secondary err code: 0  
> nt OS err code: 0  

and delving into the guts of the .trc file found:  

> (11) \[25-MAR-2009 11:09:46:011\] nsprecv: reading from transport...  
> (11) \[25-MAR-2009 11:09:46:011\] nttrd: entry  
> (11) \[25-MAR-2009 11:09:46:100\] nttrd: exit  
> (11) \[25-MAR-2009 11:09:46:100\] ntt2err: entry  
> (11) \[25-MAR-2009 11:09:46:100\] ntt2err: Read unexpected EOF ERROR on 38  
> (11) \[25-MAR-2009 11:09:46:100\] ntt2err: exit  
> (11) \[25-MAR-2009 11:09:46:100\] nsprecv: error exit  
> (11) \[25-MAR-2009 11:09:46:100\] nserror: entry  
> (11) \[25-MAR-2009 11:09:46:101\] nserror: nsres: id=0, op=68, ns=12537, ns2=12560; nt\[0\]=507, nt\[1\]=0, nt\[2\]=0; ora\[0\]=0, ora\[1\]=0, ora\[2\]=0

So maybe it's the DB server that's not playing ball? I'm guessing the "Read unexpected EOF ERROR on 38" might be relevant.  
  
Taking the opportunity to learn a bit more about Oracle connectivity, I had a look at [Oracle® Database Net Services Administrator's Guide 10g Release 2 (10.2) - Troubleshooting Oracle Net Services](http://download.oracle.com/docs/cd/B19306_01/network.102/b14212/troublestng.htm#sthref1553). This details setting up logs and traces, and points to Trace Assistant, trcasst. Running it on one of the trace files from a failed connection reported this:  

> ///////////////////////////////////////////////////////////////  
> Error found. Error Stack follows for thread #: 11  
>               id:0  
>   Operation code:68  
>       NS Error 1:12537  
>       NS Error 2:12560  
> NT Generic Error:507  
>   Protocol Error:0  
>         OS Error:0  
>  NS & NT Errors Translation  
> 12537, 00000 "TNS:connection closed"  
>  // \*Cause: "End of file" condition has been reached; partner has disconnected.  
>  // \*Action: None needed; this is an information message.  
> /  
> 12560, 00000 "TNS:protocol adapter error"  
>  // \*Cause: A generic protocol adapter error occurred.  
>  // \*Action: Check addresses used for proper protocol specification. Before  
>  // reporting this error, look at the error stack and check for lower level  
>  // transport errors.For further details, turn on tracing and reexecute the  
>  // operation. Turn off tracing when the operation is complete.  
> /  
> 00507, 00000 "Connection closed"  
>  // \*Cause: Normal "end of file" condition has been reached; partner has  
>  // disconnected.  
>  // \*Action: None needed; this is an information message.  
> /  
> ///////////////////////////////////////////////////////////////

which is the same error as I found in the trace file but with each code explained.  
  
We tested different permutations of servers:  

> Inf server A / 10g client -> DB Server A (11g) -> Fails  
> Inf server A / 10g client -> DB Server Y (11g) -> Success  
> Inf server B / 10g client -> DB Server B (11g) -> Success  
> Inf server A / 10g client -> DB Server Z (10g) -> Success  
> Inf server C / 11g client -> DB Server C (11g) -> Success  
> Inf Server C / 11g client -> DB Server A (11g) -> Success  

So now we have three identical setups (same informatica/oracle client/oracle DB), two of which work, one fails - when run against Server A.  
  
Our DBA ran a trace on the listener on Server A and picked up this error:  

> TNS-12518: TNS:listener could not hand off client connection  
> TNS-12547: TNS:lost contact  
> TNS-12560: TNS:protocol adapter error  
> TNS-00517: Lost contact  
> HPUX Error: 32: Broken pipe

which points to a possible OS issue.  
  
Ref: [Oracle® Database Installation Guide 11g Release 1 (11.1) for HP-UX - 2.7 Configure Kernel Parameters](http://download.oracle.com/docs/cd/B28359_01/install.111/b32072/pre_install.htm#BABJHCJI)  
Ref: Metalink article 550859.1 - TROUBLESHOOTING GUIDE TNS-12518 TNS listener could not hand off client connection  
  
The UNIX team checked the kernel settings between DB Server A and DB Server Y, but found no differences (in particular they checked maxuprc and nproc).  
  
This problem eventually got resolved after two actions:  

> 1) Database server was restarted  
> 2) Oracle PROCESSES was increased from 200 to 500  

  
We suspect the restart fixed the problem as one of the UNIX guys spotted some "performance funnies" (technical term ;-) ) on the box prior to the restart.
