---
title: "Hardening OAS"
date: "2010-01-21"
categories: 
  - "apache"
  - "oas"
  - "security"
---

[Oracle Application Server](http://rnm1978.wordpress.com/category/oas/) (OAS) is the Web and Application server typically deployed with OBIEE. There are several settings which by default may be viewed as security weaknesses. Whether realistically a target or not, it's good practice to always be considering security and lock down your servers as much as reasonably possible. I adopt the default stance of having to find a reason to leave something less secure, rather than justify why it needs doing.

There are various tools and companies out there that will help you scan your deployments for weaknesses. In reading about this I found [Nikto](http://cirt.net/nikto2) which runs on all platforms. In essence it takes a hostname and port and scans for known vulnerabilities in web servers (not just OAS).

Listed below are some of the simple things you can do to secure your default deployment of OAS.

Almost all of this is derived from the very excellent [Securing Oracle Application Server by Caleb Sima](http://rmccurdy.com/scripts/docs/spidynamics/Securing%20Oracle%20Application%20Server.pdf)

In the text below I refer to $OAS\_HOME which may not be an actual environment variable, but is the home directory of your OAS installation.

Don't forget to backup config files before you change them, and take backups of deleted files and directories.

After making the changes bounce OAS (_opmnctl stopall; opmnctl startall_).

As well as the specifics below you should always keep an eye on [Oracle's Critical Patch Updates](http://www.oracle.com/technology/deploy/security/alerts.htm).

## Web server version and details

By default OAS will report its version in both HTTP headers and on error pages (such as those returned on a 404 Not Found which is easy to obtain by entering a non-existent URL):

![](/images/rnm1978/1.png) ![](/images/rnm1978/2010-01-08_141948.png)

Apply these two changes to $OAS\_HOME/Apache/Apache/conf/httpd.conf:

1. Search for **ServerSignature** and change it from On to **Off**  
    This removes the server information from error pages  
    Ref: [http://httpd.apache.org/docs/2.2/mod/core.html#serversignature](http://httpd.apache.org/docs/2.2/mod/core.html#serversignature)
2. Add this on the next line:  
    **ServerTokens ProductOnly**  
    This removes some server version info from the HTTP header, and is the least possible data to reveal in Apache.  
    Ref: [http://httpd.apache.org/docs/2.2/mod/core.html#servertokens](http://httpd.apache.org/docs/2.2/mod/core.html#servertokens)

After the changes have been made:

![](/images/rnm1978/2010-01-08_142751.png) ![](/images/rnm1978/2010-01-08_142713.png)

## TRACE method

Read [Apache Tips: Disable the HTTP TRACE method/](http://www.ducea.com/2007/10/22/apache-tips-disable-the-http-trace-method/) for information on how to see if HTTP TRACE is enabled. It is by default in OAS, and most security scanners will pick it up as a problem.

To disable it, add to $OAS\_HOME/Apache/Apache/conf/httpd.conf:  
**TraceEnable Off**

## Default content

Most web and application servers come with default content such as example pages or "Welcome" pages, and OAS is no exception. The reason for getting rid of this content is to give potential attackers one less thing to work with. Static content might give them information about software versions or paths. Dynamic content (JSPs etc) may be exploitable. Either way - what is to be gained from leaving it in place?

### Apache default content

![](/images/rnm1978/2010-01-08_150007.png)

In $OAS\_HOME/Apache/Apache: \[sourcecode\] mv htdocs/ htdocs.old mkdir htdocs vi htdocs/index.html # enter: <HTML><HEAD><TITLE>Nothing to see here</TITLE></HEAD><BODY>Nothing to see here, move along.</BODY></HTML> \[/sourcecode\]

![](/images/rnm1978/2010-01-08_150158.png)

* * *

![](/images/rnm1978/2010-01-18_134955.png)

\[sourcecode\] rm $OAS\_Home/Apache/Apache/icons/README rm $OAS\_Home/Apache/Apache/fcgi-bin/\* \[/sourcecode\]

![](/images/rnm1978/2010-01-18_135124.png)

### j2ee

![](/images/rnm1978/2010-01-18_124603.png)  

![](/images/rnm1978/2010-01-18_124652.png)  

![](/images/rnm1978/2010-01-18_142342.png)  

\[sourcecode\] cd $OAS\_HOME/j2ee/home/default-web-app rm -r WEB-INF/classes rm -r examples/ echo "Nothing to see here" > index.html \[/sourcecode\]

![](/images/rnm1978/2010-01-18_133909.png)  

![](/images/rnm1978/2010-01-18_133926.png)

## Pre-populated username in OAS login form

This could help an attacker as they are given a username to start trying to login as. ![](/images/rnm1978/2010-01-08_155415.png) However, I can't work out how to disable it. I opened a thread on OTN here: [http://forums.oracle.com/forums/thread.jspa?threadID=1010227&tstart=0](http://forums.oracle.com/forums/thread.jspa?threadID=1010227&tstart=0)

If you know, please leave a comment!

## Weak ciphers / SSL version 2 supported

Disable the weak SSL ciphers & disable version 2 of the protocol

Add to httpd.conf after the TraceEnable statement from above:

\[sourcecode\] SSLProtocol ALL -SSLv2 SSLCipherSuite HIGH:!SSLv2:!ADH:!aNULL:!eNULL:!NULL \[/sourcecode\] Ref: [http://httpd.apache.org/docs/2.0/mod/mod\_ssl.html#sslciphersuite](http://httpd.apache.org/docs/2.0/mod/mod_ssl.html#sslciphersuite)

Ref: [http://adamyoung.net/Disable-SSLv2-System-Wide](http://adamyoung.net/Disable-SSLv2-System-Wide)

## Restarting OAS

When I started implementing this I used **opmnctl restartproc**, but found that HTTP\_Server came back as status "Stop" or "Bounce". I also got errors like: "time out while waiting for a managed process to restart".

What I think happened was that the httpd (Apache) processes didn't come down properly, and so couldn't restart.

Therefore I resorted to **opmnctl shutdown**, then search for any remaining httpd processes (**ps -ef|grep httpd**) and kill any (**kill -9 xxxx**), and then restart OAS (**opmnctl startall**)
