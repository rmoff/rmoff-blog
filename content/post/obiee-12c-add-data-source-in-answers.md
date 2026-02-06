+++
categories = ["OBIEE", "obiee12c", "xsa", "dataset", "datasetsvc"]
date = 2016-05-27T08:44:24Z
description = ""
draft = false
slug = "obiee-12c-add-data-source-in-answers"
tag = ["OBIEE", "obiee12c", "xsa", "dataset", "datasetsvc"]
title = "OBIEE 12c - \"Add Data Source\" in Answers"

+++

So this had me scratching my head for a good hour today. Comparing SampleApp v511 against a vanilla OBIEE 12c install I'd done, one had "Add Data Source" as an option in Answers, the other didn't. The strange thing was that the option *wasn't* there in SampleApp -- and usually that has all the bells and whistles enabled. 

After checking and re-checking the **Manage Privileges** option, and even the Application Policy grants, and the manual, I hit MoS - and turned up [Doc ID 2093886.1](https://support.oracle.com/epmos/faces/DocContentDisplay?id=2093886.1). 

Apparently, it is a _bug_ (go figure) that this option shows up when you use the SampleAppLite BAR file, and that the only proper way to upload datasets is through Visual Analyzer. 

![Add Data Source](/images/2016/05/Pasted_Image_27_05_2016__10_30.png)

This is on version 12.2.1.0.0; perhaps the option will be formally added (or properly removed) in the future.

For the reasoning behind it being unavailable in Answers, see bug [22347229](https://support.oracle.com/epmos/faces/BugDisplay?id=22347229).
