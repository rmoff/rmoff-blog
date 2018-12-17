+++
author = "Robin Moffatt"
categories = ["obiee", "bvt", "regression testing", "baseline validation tool", "obiee12c"]
date = 2016-05-18T15:35:46Z
description = ""
draft = false
image = "/images/2016/05/2016-05-18_15-26-14.jpg"
slug = "baseline-validation-tool-parameter-directory-is-not-a-directory"
tag = ["obiee", "bvt", "regression testing", "baseline validation tool", "obiee12c"]
title = "OBIEE Baseline Validation Tool - Parameter 'directory' is not a directory"

+++

Interesting quirk in running Baseline Validation Tool for OBIEE here. If you invoke `obibvt` from the `bin` folder, it errors with **Parameter 'directory' is not a directory**

```
PS C:\OracleBI-BVT> cd bin
PS C:\OracleBI-BVT\bin> .\obibvt -config C:\OracleBI-BVT\bin\bvt-config.xml -deployment current
 INFO: Result folder: Results\current
Throwable: Parameter 'directory' is not a directory
Thread[main,5,main]
SEVERE: Unhandled Exception
SEVERE: java.lang.IllegalArgumentException: Parameter 'directory' is not a directory
       at org.apache.commons.io.FileUtils.validateListFilesParameters(FileUtils.java:545)
       at org.apache.commons.io.FileUtils.listFiles(FileUtils.java:521)
       at org.apache.commons.io.FileUtils.listFiles(FileUtils.java:691)
       at com.oracle.biee.bvt.UpgradeTool.loadPlugins(UpgradeTool.java:537)
       at com.oracle.biee.bvt.UpgradeTool.runPluginTests(UpgradeTool.java:644)
       at com.oracle.biee.bvt.UpgradeTool.run(UpgradeTool.java:812)
       at com.oracle.biee.bvt.UpgradeTool.main(UpgradeTool.java:999)

PS C:\OracleBI-BVT\bin>
```

Solution? Run the exact same command, but from the folder above: 

```
PS C:\OracleBI-BVT> .\bin\obibvt -config C:\OracleBI-BVT\bin\bvt-config.xml -deployment current
```

---
(Photo credit: https://unsplash.com/@rooszan)
