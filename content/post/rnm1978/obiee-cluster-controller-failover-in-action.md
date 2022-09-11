---
title: "OBIEE cluster controller failover in action"
date: "2009-09-15"
categories: 
  - "cluster"
  - "load-balancing"
  - "obiee"
  - "performance"
  - "sawserver"
  - "unix"
---

Production cluster is 2x BI Server and 2x Presentation Services, with a BIG-IP F5 load balancer on the front.

![1pub](/images/rnm1978/1pub1.png "1pub")

## Symptoms

Users started reporting slow login times to BI. Our monitoring tool (Openview) reported that "BIServer01 may be down. Failed to contact it using ping.". BIServer01 cannot be reached by ping or ssh from Windows network.

## Diagnostics

nqsserver and nqsclustercontroller on BIServer01 was logging these repeated errors:

> \[nQSError: 12002\] Socket communication error at call=send: (Number=9) Bad file number

Whether OBIEE was running on BIServer01 or not, users could still use OBIEE but with a delayed login.

Majority of the login time spent on the OBIEE "Logging in ... " screen, which is not normally seen because login is quick.

Network configuration issues found on BIServer01.

Initial suspicion was that EBS authentication was the cause of the delay, as this is only used at login time so would fit with the behaviour observed. They checked their system and could see no problems. They also reported that the authentication SQL only hit EBS just before OBIEE logged in.

## Diagnosis

Using nqcmd on one of the Presentation Services boxes it could be determined that failover of Cluster Controllers was occuring, but only after timing out on contacting the Primary Cluster Controller (BIServer01). ![2pub](/images/rnm1978/2pub2.png "2pub") \[sourcecode language="bash"\] \[biadm@PSServer01\]/app/oracle/product/obiee/setup $set +u \[biadm@PSServer01\]/app/oracle/product/obiee/setup $. ./sa-init64.sh \[biadm@PSServer01\]/app/oracle/product/obiee/setup $nqcmd

\------------------------------------------------------------------------------- Oracle BI Server Copyright (c) 1997-2006 Oracle Corporation, All rights reserved -------------------------------------------------------------------------------

Give data source name: Cluster64 Give user name: Administrator Give password: xxxxxxxxxxxxx \[60+ second wait here\] \[/sourcecode\] This conclusion was reached because after setting PrimaryCCS to BIServer02 there was no delay in connecting. I changed the odbc.ini entry for Cluster64 to switch the CCS server order around \[...\] PrimaryCCS=BIServer02 SecondaryCCS=BIServer01 \[...\]

\[sourcecode language="bash"\] \[biadm@PSServer01\]/app/oracle/product/obiee/setup $nqcmd

\------------------------------------------------------------------------------- Oracle BI Server Copyright (c) 1997-2006 Oracle Corporation, All rights reserved -------------------------------------------------------------------------------

Give data source name: Cluster64 Give user name: Administrator Give password: xxxxxxxxxxxxx \[logs straight in\] \[/sourcecode\] Any changes to odbc.ini have to be followed by a bounce of sawserver.

## Resolution

To fix the slow login for users whilst the network problems were investigated I switched the order of CCS in the odbc.ini configuration and bounced each sawserver: ![3pub](/images/rnm1978/3pub1.png "3pub") For the end-users the problem was resolved as they could now log straight in. However at this stage we're still running with half a cluster. If BIServer02 had failed at this point then the BI service would have become unavailable.

The root-cause was a network configuration error on the four servers combined with a possible hardware failure.

## Summary

Ignoring Scheduler, a two-machine OBIEE cluster has an Active:Active pair of BI Servers. Analytics traffic to these servers is routed via an Active:Passive pair of Cluster Controllers.

The client (eg sawserver) uses ODBC config syntax to define which Cluster Controller to try contacting first. This is the PrimaryCCS. If it connects then the PrimaryCCS will return the name of the BI Server to the client, which will then send all subsequent ODBC connections to the BI Server direct.

If the client cannot connect to the PrimaryCCS in the time defined it will try the SecondaryCCS instead. The SecondaryCCS behaves exactly the same as the PrimaryCCS - it returns the name of the BI Server to the client for direct ODBC connection.

The Cluster Controller maintains the state of the BI Servers and if one becomes unavailable will know not to route any Analytics traffic to it.

The failover of the Cluster Controller itself is stateless, it is local only to the client session context. This means that each new client session has to go through the failover from Primary to Secondary CCS with the associated timeout delay.

\[update 21st Sept\] I've tested out the same configuration over four VM OEL 4 servers, and cannot reproduce the delayed login time. When one CCS is taken down failover to the other appears almost instantaneous \[/update\]

## FinalTimeOutForContactingCCS

odbc.ini has the parameter FinalTimeOutForContactingCCS set to 60 seconds. Changing this to a lower value does NOT appear to reduce the failover time.
