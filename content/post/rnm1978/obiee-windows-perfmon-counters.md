---
title: "OBIEE Windows PerfMon counters"
date: "2009-07-24"
categories: 
  - "hack"
  - "obiee"
  - "performance"
  - "windows"
---

Yet another way to access the BI Management data discussed [here](http://rnm1978.blogspot.com/2009/07/21/obiee-admin-tools-amp-hacks/) - through Windows' PerfMon tool.  
  
This will only work for installations where your OBIEE server is running on Windows. You should be able to run PerfMon locally or remotely. Standard practise would be not to run it locally on a Production machine :-)  
  
To run PerfMon go to Start->Run and enter perfmon, or navigate Start -> Settings -> Control Panel -> Administrative Tools -> Performance  
  
By default a handful of metrics about your local machine are displayed:  
![](/images/rnm1978/image_lost.png)  
Right click and Add Counters:  
![](/images/rnm1978/image_lost.png) then enter the network name eg \\\\MYREMOTESERVER in 'Select counters from Computer:', otherwise set this to 'Use local computer counters'.  
  
Then click on Performance object dropdown, and you should see a long list of Oracle BI performance objects:  
![](/images/rnm1978/image_lost.png)Pick one of these and a list of counters within the object will be listed. You can add all, some or just one of these.  
![](/images/rnm1978/image_lost.png)  
  
By default the Performance Counters are installed I think, but both NQSServer.exe and sawserver.exe have commandline options for reinstalling them (or uninstalling, if you want to):  

> NQSServer.exe /installperf  
> NQSServer.exe /uninstallperf  
>   
> sawserver.exe /installperf  
> sawserver.exe /uninstallperf  

PerfMon is documented well elsewhere on the web so I won't say much more other than that you can use it interactively or logging to file. The latter would be very useful for trending of performance data, you could even go full circle and analyse it with Answers :-)  
  
Final thought is that exposing the data this way is very helpful for Systems Management, as you now have the option of using [MOM/SCOM](http://www.microsoft.com/systemcenter/operationsmanager/en/us/default.aspx), etc to monitor and alert on your BI servers.  
  
I would imagine some or all of the above functionality is also available through the BI Management Pack for Enterprise Manager, but this is another way to [skin the cat](http://www.usingenglish.com/reference/idioms/there+are+many+ways+to+skin+a+cat.html).
