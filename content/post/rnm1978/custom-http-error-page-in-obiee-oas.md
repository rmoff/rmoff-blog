---
title: "Custom HTTP error page in OBIEE / OAS"
date: "2009-05-18"
categories: 
  - "apache"
  - "oas"
  - "OBIEE"
---

It's possible to change the error pages served up by OAS/Apache by using the ErrorDocument directive. This is [widely documented](http://httpd.apache.org/docs/1.3/mod/core.html#errordocument).  
  
However, to get this to take effect in an oc4j application (such as analytics) you need to change mod\_oc4j.conf too.  
(I found this out from this post [here](http://jhelvoort.wordpress.com/2009/01/13/errordocument-fails-to-intercept-internal-500-error/))  
  
Take backups of httpd.conf and mod\_oc4j.conf, and then edit them as follows:  
  
In httpd.conf add:  
ErrorDocument 500 /500.html  
where /500.html is a relative path to your custom document  
  
In mod\_oc4j.conf add to the end of the file:  
Oc4jUseOHSErrors on  
  
This will make any HTTP 500 (Internal Server error) errors show the page 500.html, instead of the default Apache one.  
  
Don't forget to bounce OHS after making this change:  
opmnctl restartproc ias-component=HTTP\_Server
