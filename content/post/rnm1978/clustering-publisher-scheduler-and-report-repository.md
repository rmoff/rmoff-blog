---
draft: false
title: 'Clustering Publisher – Scheduler and Report Repository'
date: "2009-03-24T11:28:00+0000"
categories:
- BI publisher
- cluster
- obiee
- quartz
---

The [Oracle BI Publisher Enterprise Cluster Deployment](http://www.oracle.com/technology/products/xml-publisher/docs/BIP_HA.pdf) doc which I just found through Metalink highlighted a couple of points:  
– Report repository should be shared  
– The scheduler should be configured for a cluster

<!--more-->
Report Repository  
Through Admin>System Maintenance>Report Repository I changed the path from the default, /xmlp/XMLP to a NFS mount data/shared/xmlp and restarted the xmlpserver application in OAS. On coming back up Publisher complained because all its config files (in xmlp/Admin), had disappeared. I’d not moved any of the contents of /xmlp/XMLP since Report Repository suggested to me that it was just for reports, ergo with no reports yet created there was nothing to move.  
So pedantaries aside, I moved the contents of /xmlp/XMLP to my new share, data/shared/xmlp. Publisher was happy after this.

A side effect of config being held in the “Report Repository” path is that when I configured the second BI Publisher server to use this new shared path all of the config I’d done on the first server was applied to the second. I wonder if this is how it’s supposed to work, or there’s going to be server-specific config written to a shared location which will cause problems?

With hindsight, and if the config can be shared like this, then setting up the shared file system first would have been best, and then I’d have only had to configure the one server and the second would have picked it up (for Scheduler changes etc).

Scheduler  
I installed the Scheduler schema successfully, and ticked the Enable Clustering under Scheduler Properties. Doing some poking around (google for “Enable Clustering” “Scheduler Properties”) I found [this page](http://www.opensymphony.com/quartz/wikidocs/ConfigJDBCJobStoreClustering.html) which documents Quartz (used for scheduling in BI Publisher, some more info [here](http://blogs.oracle.com/xmlpublisher/2008/05/scheduler_threads.html)). It states

> Enable clustering by setting the “org.quartz.jobStore.isClustered” property to “true”. Each instance in the cluster should use the same copy of the quartz.properties file.

The last sentence of this is reassuring as it describes what I’ve now got with the shared Report Repository folder. Checking data/shared/xmlp/Admin/Scheduler/quartz-config.properties shows that it now includes:

> org.quartz.jobStore.isClustered=true
