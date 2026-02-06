---
title: "psservice - Windows command line goodness!"
date: "2009-07-23"
categories: 
  - "hack"
  - "OBIEE"
  - "sawserver"
  - "services"
  - "windows"
---

Our main servers are Unix and I'm as happy as a pig in muck at the command line, so when I'm working on Windows (where I've got a test OBIEE install) I like to stick with the CLI where possible.  
  
[PSService](http://technet.microsoft.com/en-us/sysinternals/bb897542.aspx) is one of those tools that I instinctively reach for without realising it. Combined with [Launchy](http://www.launchy.net/), it's even better.  
  
Simply put, you can control windows services from the command line.  
  
So to restart Presentation Services, instead of  

> Start -> Settings -> Control Panel -> Administrative Tools -> Services, scroll down, find service, right click, select restart,  

I do  

> alt-space -> cmd \[tab\] psservice restart sawsvc

![](/images/rnm1978/image_lost.png)](http://1.bp.blogspot.com/_RCx_EVJpczQ/SmiW7L0eSRI/AAAAAAAAGcw/DMT4ttHX0GE/s1600/psservice1.png)[![](/images/rnm1978/psservice2.png)You can query service statuses, and for multiple services at a time:  

> C:\\Windows\\System32>psservice query "Oracle BI"  

> PsService v2.21 - Service information and configuration utility  
> Copyright (C) 2001-2006 Mark Russinovich  
> Sysinternals - www.sysinternals.com  
>   
> SERVICE\_NAME: Oracle BI Cluster Controller  
> DISPLAY\_NAME: Oracle BI Cluster Controller  
> (null)  
> TYPE              : 10 WIN32\_OWN\_PROCESS  
> STATE             : 1  STOPPED  
>                     (NOT\_STOPPABLE,NOT\_PAUSABLE,IGNORES\_SHUTDOWN)  
> WIN32\_EXIT\_CODE   : 1077 (0x435)  
> SERVICE\_EXIT\_CODE : 0  (0x0)  
> CHECKPOINT        : 0x0  
> WAIT\_HINT         : 0x0  
>   
> SERVICE\_NAME: Oracle BI Scheduler  
> DISPLAY\_NAME: Oracle BI Scheduler  
> (null)  
> TYPE              : 10 WIN32\_OWN\_PROCESS  
> STATE             : 1  STOPPED  
>                     (NOT\_STOPPABLE,NOT\_PAUSABLE,IGNORES\_SHUTDOWN)  
> WIN32\_EXIT\_CODE   : 1077 (0x435)  
> SERVICE\_EXIT\_CODE : 0  (0x0)  
> CHECKPOINT        : 0x0  
> WAIT\_HINT         : 0x0  
>   
> SERVICE\_NAME: Oracle BI Server  
> DISPLAY\_NAME: Oracle BI Server  
> (null)  
> TYPE              : 10 WIN32\_OWN\_PROCESS  
> STATE             : 4  RUNNING  
>                     (STOPPABLE,NOT\_PAUSABLE,ACCEPTS\_SHUTDOWN)  
> WIN32\_EXIT\_CODE   : 0  (0x0)  
> SERVICE\_EXIT\_CODE : 0  (0x0)  
> CHECKPOINT        : 0x0  
> WAIT\_HINT         : 0x0  
>   
> SERVICE\_NAME: sawjavahostsvc  
> DISPLAY\_NAME: Oracle BI Java Host  
> (null)  
> TYPE              : 10 WIN32\_OWN\_PROCESS  
> STATE             : 4  RUNNING  
>                     (STOPPABLE,NOT\_PAUSABLE,ACCEPTS\_SHUTDOWN)  
> WIN32\_EXIT\_CODE   : 0  (0x0)  
> SERVICE\_EXIT\_CODE : 0  (0x0)  
> CHECKPOINT        : 0x0  
> WAIT\_HINT         : 0x0  
>   
> SERVICE\_NAME: sawsvc  
> DISPLAY\_NAME: Oracle BI Presentation Server  
> (null)  
> TYPE              : 10 WIN32\_OWN\_PROCESS  
> STATE             : 4  RUNNING  
>                     (STOPPABLE,NOT\_PAUSABLE,ACCEPTS\_SHUTDOWN)  
> WIN32\_EXIT\_CODE   : 0  (0x0)  
> SERVICE\_EXIT\_CODE : 0  (0x0)  
> CHECKPOINT        : 0x0  
> WAIT\_HINT         : 0x0

PSService can be run remotely too, so you could use it for remote administration of your servers.  
  
You can get full syntax from psservice -help  
  
Services can be referenced by either their name (sawsvc) or display name (Oracle BI Presentation Server)  
  
BTW if you like this kind of thing and work with Windows rather than Unix, check out [Microsoft's PowerShell](http://www.microsoft.com/windowsserver2003/technologies/management/powershell/default.mspx) - it's one of the few things I've missed since moving back to working primarily with Unix! :-D (I don't mean that in a Microsoft-bashing way, just that it's really satisfying to work with)  
  
\[Edit\]  
You can also use the builtin [net command for controlling services](http://technet.microsoft.com/en-us/library/cc736564%28WS.10%29.aspx#BKMK_cmd), but it's not as functional as psservice  
\[/edit\]
