---
title: "Bug in Clustered Publisher Scheduler - ClusterManager: detected 1 failed or restarted instances"
date: "2009-03-30"
url: "/2009/03/30/bug-in-clustered-publisher-scheduler-clustermanager-detected-1-failed-or-restarted-instances/"
categories: 
  - "bi-publisher"
  - "cluster"
  - "quartz"
---

Follow on from [setting up Publisher in a clustered environment](/2009/03/24/clustering-publisher-scheduler-and-report-repository/), I've found a nasty little bug in the scheduling element of Publisher, Quartz.  
  
Looking at the oc4j log file /opmn/logs/default\_group~home~default\_group~1.log I can see OC4J starting up, and then a whole load of repeated messages:  
  

> 09/03/30 11:28:43 Oracle Containers for J2EE 10g (10.1.3.3.0) initialized  
> \- ClusterManager: detected 1 failed or restarted instances.  
> \- ClusterManager: Scanning for instance "myserver.fqdn.company.net1238408921404"'s failed in-progress jobs.  
> \- ClusterManager: detected 1 failed or restarted instances.  
> \- ClusterManager: Scanning for instance "myserver.fqdn.company.net1238408921404"'s failed in-progress jobs.  
> \- ClusterManager: detected 1 failed or restarted instances.  
> \- ClusterManager: Scanning for instance "myserver.fqdn.company.net1238408921404"'s failed in-progress jobs.  
> \- ClusterManager: detected 1 failed or restarted instances.  
> \- ClusterManager: Scanning for instance "myserver.fqdn.company.net1238408921404"'s failed in-progress jobs.  
> \- ClusterManager: detected 1 failed or restarted instances.  
> \- ClusterManager: Scanning for instance "myserver.fqdn.company.net1238408921404"'s failed in-progress jobs.  
> \- ClusterManager: detected 1 failed or restarted instances.  
> \- ClusterManager: Scanning for instance "myserver.fqdn.company.net1238408921404"'s failed in-progress jobs.  
> \- ClusterManager: detected 1 failed or restarted instances.  
> \- ClusterManager: Scanning for instance "myserver.fqdn.company.net1238408921404"'s failed in-progress jobs.  
> \- ClusterManager: detected 1 failed or restarted instances.  
> \- ClusterManager: Scanning for instance "myserver.fqdn.company.net1238408921404"'s failed in-progress jobs.  
> \[... repeated for 38MB worth \]

Metalink to the rescue .... a search for "Search: ClusterManager: Scanning for instance" throws up doc 739623.1 - Repeated Error Appears In Log File - ClusterManager: detected 1 failed or restarted instances which details the problem and references bug # 7264646. 
  
This is a bug in Quartz (the Publisher scheduling tool), which has been fixed in [1.5.2](http://wiki.opensymphony.com/display/QRTZ1/Quartz+1.5.2) (the version that's included with Publisher is 1.5.1).  
  
On my installation quartz was located in /j2ee/home/applications/xmlpserver/xmlpserver/WEB-INF/lib  
  
Implenting the fix described on Metalink doc 739623.1 solved the problem.
