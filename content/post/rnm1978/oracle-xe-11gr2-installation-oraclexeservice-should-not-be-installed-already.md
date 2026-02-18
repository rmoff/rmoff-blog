---
draft: false
title: 'Oracle XE 11gR2 installation – “OracleXEService should not be installed already”'
date: "2011-04-04T09:09:23+0100"
image: "/images/2011/04/snag-2011-04-04-08-47-32-0000.webp"
categories:
- oracle
- windows
- XE
- XE 11gR2
---

Oracle XE 11gR2 beta has just been released, some [details here](http://technology.amis.nl/blog/11785/oracle-xe-11gr2-the-free-express-edition-for-oracle-database-11gr2) and [download here](http://www.oracle.com/technetwork/database/express-edition/11gxe-beta-download-302519.html). It’s not a great deal of use for sandboxing DWH-specific stuff, given this list of **excluded** functionality (and this is by no means everything that’s not included):

<!--more-->
> - Bitmapped index, bitmapped join index, and bitmap plan conversions
> - Oracle Partitioning
> - Parallel Data Pump Export/Import
> - Parallel query/DML
> - Parallel Statement Queuing
>
> ([source](http://download.oracle.com/docs/cd/E17781_01/license.112/e18068/toc.htm#BABJBGGA))

However, it’s always interesting to have to hand for trying out other things. And I like playing with new toys 🙂

On running the installer, I hit this problem:  

![](/images/2011/04/snag-2011-04-04-08-47-32-0000.webp "SNAG-2011-04-04-08.47.32-0000")

"OracleXEService should not be installed already"

> […]
>
> Checking for Oracle XE Service instance…:  
> Expected result : OracleXEService should not be installed already.  
> Actual result: OracleServiceXE found on system.  
> Check complete: The overall result of this check is failed.

The previous owner of the machine had installed Oracle XE 10, but I’d removed this:  

![](/images/2011/04/snag-2011-04-04-08-53-31-0000.webp "SNAG-2011-04-04-08.53.31-0000")

No Oracle XE 10g listed in add/remove programs

Or so I thought:  

![](/images/2011/04/snag-2011-04-04-08-57-25-0000.webp "SNAG-2011-04-04-08.57.25-0000")

OracleServiceXE still listed in Services

To remove the service entry, use the [sc command](http://technet.microsoft.com/en-us/library/cc742045(WS.10).aspx):

```

sc delete OracleServiceXE
```

For good measure I did the same for OracleJobSchedulerXE.  

![](/images/2011/04/snag-2011-04-04-09-00-47-0000.webp "SNAG-2011-04-04-09.00.47-0000")

Delete service entries using sc

After this, installation proceeded as normal.
