---
title: "How to resolve \"[nQSError: 12002] Socket communication error at call=: (Number=-1) Unknown\""
date: "2010-01-22"
categories: 
  - "config"
  - "OBIEE"
  - "security"
  - "unix"
  - "windows"
---

This error caught me out today. I was building a Linux VM to do some work on, and for the life of me couldn't get the OBIEE Admin Tool to connect to the BI Server on the VM.

The error I got when trying to define a DSN on the Windows box was:

> \[nQSError: 12008\] Unable to connect to port 9703 on machine 10.3.105.132 \[nQSError: 12010\] Communication error connecting to remote end point: address = 10.3.105.132; port = 9703. \[nQSError: 12002\] Socket communication error at call=: (Number=-1) Unknown

This error means that the ODBC Driver for BI Server can't communicate with the BI Server on port 9703. 99% of the time this question comes up on the forums it's because the BI Server isn't running, or the host is incorrect.

I validated the BI Server **was** running and listening on port 9703: 
```
\[oracle@RNMVM03 setup\]$ netstat -a|grep 9703 tcp 0 0 \*:9703 \*:\* LISTEN
```


And I fired up Presentation Services and OC4J and successfully logged into Answers. So why couldn't my Windows box connect?

I tried telnetting from my Windows box to the VM on port 9704 - the OC4J port. This worked, as did pinging it. So the network connectivity between the two was there. If I telnetted to port 9703 (BI Server) there was an eventual timeout.

**The answer** to the problem was that my Linux VM (OEL5.4) was running a firewall which I'd cleverly allowed 9704 on but not 9703. Disabling the firewall fixed the problem.
