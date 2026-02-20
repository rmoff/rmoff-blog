---
title: "How to find out what web application server is in use"
date: "2009-07-28"
url: "/2009/07/28/how-to-find-out-what-web-application-server-is-in-use/"
categories: 
  - "oas"
  - "OBIEE"
  - "sawserver"
---

If, for some reason, you need to check what web application server is in use for Presentation Services (as [this chap](http://forums.oracle.com/forums/thread.jspa?messageID=3651833#3651833) needed to), you can use an add-in for FireFox called [HttpFox](https://addons.mozilla.org/en-US/firefox/addon/6647) to inspect the HTTP headers.  
  
1\. Install [HttpFox](https://addons.mozilla.org/en-US/firefox/addon/6647) (and obviously Firefox if you don't have it already!)  
2\. Open the HttpFox window (Tools -> HttpFox -> Toggle HttpFox)  
3\. Click the Start button in the HttpFox window  
4\. Navigate to your OBIEE home page  
5\. Click the Stop button in the HttpFox window  
6\. Click on the first entry in the list, URL should be http://yourserver:7777/analytics/saw.dll?Dashboard  
7\. In the right-hand pane of the Headers tab you should see Server listed. In this instance, it's Oracle-Application-Server-10g/10.1.3.1.0 Oracle-HTTP-Server  
  
![](/images/rnm1978/image_lost.png)
