+++
author = "Robin Moffatt"
categories = ["obiee", "obiee12c", "bar"]
date = 2016-05-19T10:06:03Z
description = ""
draft = false
image = "/images/2016/05/2016-05-19_12-05-07.jpg"
slug = "oracle-bi-bar-exceptions-unsupportedbarexception-the-bar-file-provided-as-input-is-not-supported-in-this-bi-platfrom-release"
tags = ["obiee", "obiee12c", "bar"]
title = "oracle.bi.bar.exceptions.UnSupportedBarException: The Bar file provided as input is not supported in this BI Platfrom release."

+++

Another quick note on OBIEE 12c, this time on the [importServiceInstance](https://docs.oracle.com/middleware/1221/biee/BIESG/configrepos.htm#BIESG9316) command. If you run it with a BAR file that doesn't exist, it'll fail (obviously), but the error at the end of the stack trace is slightly confusing: 

    oracle.bi.bar.exceptions.UnSupportedBarException: 
    The Bar file provided as input is not supported in this BI Platfrom release.

Scrolling back up the stack trace does show the error message: 

    SEVERE: Failed in reading bar file. [...]
    java.io.FileNotFoundException: [...] 
    (The system cannot find the file specified)

So ... RTEM (Read the Fantastic Error Message) in full, don't just skim to the end...

---

```
PS C:\OracleBI-BVT> C:\app\oracle\fmw\oracle_common\common\bin\wlst.cmd

Initializing WebLogic Scripting Tool (WLST) ...

Welcome to WebLogic Server Administration Scripting Shell

Type help() for help on available commands

wls:/offline> importServiceInstance('C:/app/oracle/fmw/user_projects/domains/bi/','ssi','C:/app/oracle/fmw/bi/bifoundation/samples/sampleapplite/SampleAppLite.bar')
Starting Import Service Instance
May 19, 2016 10:54:05 AM oracle.bi.bar.util.DomainIntrospectUtils obtainSingletonDataDirectory
INFO: Obtained Singleton Data Directory as C:\app\oracle\fmw\user_projects\domains\bi\bidata
May 19, 2016 10:54:05 AM oracle.bi.bar.framework.ConfigFileUtility getConfigProperty
INFO: property value found in config file: ALL
May 19, 2016 10:54:05 AM oracle.bi.bar.framework.ConfigFileUtility getConfigProperty
INFO: property value found in config file: 100000
May 19, 2016 10:54:05 AM oracle.bi.bar.framework.ConfigFileUtility getConfigProperty
INFO: property value found in config file: 500000
May 19, 2016 10:54:05 AM oracle.bi.bar.framework.ConfigFileUtility getConfigProperty
INFO: property value found in config file: V1
May 19, 2016 10:54:06 AM oracle.bi.bar.si.ServiceInstanceLifeCycleFactory getServiceInstanceLifeCycleImpl
INFO: Service Instance lifecyle impl version used:V1
May 19, 2016 10:54:06 AM oracle.bi.bar.log.LogUtils doesLogHandlerExist
INFO: Path from ODL Handler = C:\app\oracle\fmw\user_projects\domains\bi\bilogs\service_instances\ssi\metadata\si20160519_105405.log
May 19, 2016 10:54:06 AM oracle.bi.bar.log.LogUtils doesLogHandlerExist
INFO: Found odl handler logging to log file C:\app\oracle\fmw\user_projects\domains\bi\bilogs\service_instances\ssi\metadata\si20160519_105405.log
May 19, 2016 10:54:06 AM oracle.bi.bar.util.ValidateFileTypeUtil checkBarFile
SEVERE: Failed in reading bar file. C:\app\oracle\fmw\bi\bifoundation\samples\sampleapplite\SampleAppLite.bar
java.io.FileNotFoundException: C:\app\oracle\fmw\bi\bifoundation\samples\sampleapplite\SampleAppLite.bar (The system cannot find the file specified)
        at java.io.FileInputStream.open0(Native Method)
        at java.io.FileInputStream.open(FileInputStream.java:195)
        at java.io.FileInputStream.<init>(FileInputStream.java:138)
        at oracle.bi.bar.util.ValidateFileTypeUtil.checkBarFile(ValidateFileTypeUtil.java:50)
        at oracle.bi.bar.si.ServiceInstanceLifeCycleImpl.importServiceInstance(ServiceInstanceLifeCycleImpl.java:240)
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
        at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
        at java.lang.reflect.Method.invoke(Method.java:497)
        at org.python.core.PyReflectedFunction.__call__(Unknown Source)
        at org.python.core.PyMethod.__call__(Unknown Source)
        at org.python.core.PyObject.__call__(Unknown Source)
        at org.python.core.PyInstance.invoke(Unknown Source)
        at org.python.pycode._pyx133.importServiceInstance$3(/C:/app/oracle/fmw/bi/lib/bi-bar.jar!/wlstScriptDir/ServiceInstanceLifeCycle.py:63)
        at org.python.pycode._pyx133.call_function(/C:/app/oracle/fmw/bi/lib/bi-bar.jar!/wlstScriptDir/ServiceInstanceLifeCycle.py)
        at org.python.core.PyTableCode.call(Unknown Source)
        at org.python.core.PyTableCode.call(Unknown Source)
        at org.python.core.PyTableCode.call(Unknown Source)
        at org.python.core.PyFunction.__call__(Unknown Source)
        at org.python.pycode._pyx140.f$0(<console>:1)
        at org.python.pycode._pyx140.call_function(<console>)
        at org.python.core.PyTableCode.call(Unknown Source)
        at org.python.core.PyCode.call(Unknown Source)
        at org.python.core.Py.runCode(Unknown Source)
        at org.python.core.Py.exec(Unknown Source)
        at org.python.util.PythonInterpreter.exec(Unknown Source)
        at org.python.util.InteractiveInterpreter.runcode(Unknown Source)
        at org.python.util.InteractiveInterpreter.runsource(Unknown Source)
        at org.python.util.InteractiveInterpreter.runsource(Unknown Source)
        at weblogic.management.scripting.utils.WLSTInterpreter.runsource(WLSTInterpreter.java:1093)
        at weblogic.management.scripting.WLST.main(WLST.java:227)
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
        at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
        at java.lang.reflect.Method.invoke(Method.java:497)
        at weblogic.WLST.main(WLST.java:47)

May 19, 2016 10:54:06 AM oracle.bi.bar.log.LogUtils removeServiceInstanceODLHandler
INFO: Path from ODL Handler = C:\app\oracle\fmw\user_projects\domains\bi\bilogs\service_instances\ssi\metadata\si20160519_105405.log
May 19, 2016 10:54:06 AM oracle.bi.bar.log.LogUtils removeServiceInstanceODLHandler
INFO: Removing odl handler after completion of the run for log file C:\app\oracle\fmw\user_projects\domains\bi\bilogs\service_instances\ssi\metadata\si20160519_105405.log
Traceback (innermost last):
  File "<console>", line 1, in ?
  File "/C:/app/oracle/fmw/bi/lib/bi-bar.jar!/wlstScriptDir/ServiceInstanceLifeCycle.py", line 63, in importServiceInstance
        at oracle.bi.bar.si.ServiceInstanceLifeCycleImpl.importServiceInstance(ServiceInstanceLifeCycleImpl.java:244)
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
        at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
        at java.lang.reflect.Method.invoke(Method.java:497)

oracle.bi.bar.exceptions.UnSupportedBarException: oracle.bi.bar.exceptions.UnSupportedBarException: The Bar fileC:\app\oracle\fmw\bi\bifoundation\samples\sampleapplite\SampleAppLite.bar provided as input is not supported in this BI Platfrom release.
wls:/offline>
```

---
(Photo credit: https://unsplash.com/@joerobot)