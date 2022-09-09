---
title: "JConsole / JMX - followup"
date: "2009-07-21"
categories: 
  - "jmx"
  - "obiee"
  - "performance"
  - "sawserver"
---

A few points to add to my [previous posting on JConsole](/2009/07/16/jconsole-jmx/):  

- As well as performance data, you have access to configuration data. Be aware that it is read-write! So whilst it might be a nice alternative to digging around for your instanceconfig.xml etc, you should be careful
- If you have your BI Server and Presentation Services deployed on separate servers then you will only get MBeans for the relevant service:

[![](/images/rnm1978/mbeans.png)](http://1.bp.blogspot.com/_RCx_EVJpczQ/SmXTSqXPZ0I/AAAAAAAAGa0/zcySsYjtY8c/s1600/mbeans.png)

- If you want to view the values of the BI Server MBeans and your Presentation Services server is not on the same box then you have to use JConsole/JMX, as Performance Monitor will not have access to the values:

[![](/images/rnm1978/bigeneral.png)](http://2.bp.blogspot.com/_RCx_EVJpczQ/SmXVeWb9r3I/AAAAAAAAGa8/1MKb6-oyCO4/s1600/bigeneral.png)[![](/images/rnm1978/bigeneralweb.png)](http://1.bp.blogspot.com/_RCx_EVJpczQ/SmXVmyJGBvI/AAAAAAAAGbE/CbLyr8veM8o/s1600/bigeneralweb.png)  
\[Edit\]  
An alternative to jconsole is to access the Oracle BI Management MBeans through oc4j. [@lex has details here](http://blogs.oracle.com/siebelessentials/2008/11/oracle_bi_ee_and_mbeans.html)  
\[/edit\]
