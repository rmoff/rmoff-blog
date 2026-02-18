---
title: "OBIEE and F5 BIG-IP"
date: "2009-04-15"
categories: 
  - "apache"
  - "load-balancing"
  - "oas"
  - "OBIEE"
---

We've got a setup of two OAS/Presentation Services boxes and two BI Server boxes, with load balancing/failover throughout.  
The Load Balancing of the web requests is being done through a separate bit of kit, an F5 BIG-IP load balancer. This directs the requests at the two OAS servers.  
  
The problem we have is that by default OAS serves HTTP on port 7777, but the F5 is using port 80. A request for our load balanced URL: http://bi.mycompany.com/analytics/ barfs out with

> Internet Explorer cannot display the webpage  
>   
> Most likely causes:  
> \-You are not connected to the Internet.  
> \-The website is encountering problems.  
> \-There might be a typing error in the address.

or in FireFox:  

> Failed to Connect The connection was refused when attempting to contact bi.mycompany.com:7777. Though the site seems valid, the browser was unable to establish a connection.

Using the excellent [HttpFox add-in](https://addons.mozilla.org/en-US/firefox/addon/6647) for Firefox I could see the HTTP requests/responses:  

1. http://bi.mycompany.com/analytics/ goes via the loadbalancer on the default HTTP port 80 to OAS
2. OAS responds with HTTP/1.1 302 Moved Temporarily to http://bi.mycompany.com:7777/analytics/saw.dll?Dashboard
3. The web client requests this URL (http://bi.mycompany.com:7777/analytics/saw.dll?Dashboard) from the load balancer but because it's port 7777 F5 rejects the request (NS\_ERROR\_CONNECTION\_REFUSED)  
    

We could also just use the direct URL http://bi.mycompany.com/analytics/saw.dll?Dashboard but this is hardly user friendly (and also means that if they typo when entering it they'll get an unhelpful error as above)  
  
Looking at the httpd.conf for Apache to find the port config made me think of the UseCanonicalName setting which I also [encountered recently](/2009/04/02/oas-makes-you-log-in-twice/). This setting is to do with how Apache deals with the server name in the URL being requested and the hostname of the server configured in Apache.  
When I got the behaviour described above UseCanonicalName was set to Off, which I think means Apache does not rewrite the URL at all, so the redirect was to http://bi.mycompany.com:7777/analytics/saw.dll?Dashboard which is the F5 Load Balancer address.  
If I changed UseCanonicalName to On then the F5 load balancing starts to work, as this happens instead:  

1. http://bi.mycompany.com/analytics/ goes via the loadbalancer on the default HTTP port 80 to OAS
2. OAS responds with HTTP/1.1 302 Moved Temporarily to http://oasserver\_1.mycompany.com:7777/analytics/saw.dll?Dashboard

i.e. the request goes directly to one of the load balanced servers, and correctly on port 7777. 
The disadvantage of this is that the URL used by the web client then becomes http://oasserver\_1.mycompany.com which means the user is no longer hitting the load balancer so any failover wouldn't get picked up. It also means that users might start bookmarking OAS servers directly instead of the load balancer, again meaning that they don't hit the load balancer so a server failover wouldn't get picked up.  
  
  
Eventually I got this resolved, with a bit of help from a very helpful chap at Oracle. By changing the httpd.conf to set Port 80, when Apache rewrites URLs it now uses Port 80. 
Listen remains as 7777. 
Traffic from web client now hits the LB on port 80, which forwards to 7777 on one of the OAS servers, which if necessary rewrite the URL and use port 80 in the rewrite.  
Because Listen remains as 7777 there is no need to run Apache as root.  
You can also set ServerName to the load balancer address (bi.mycompany.com) and UseCanonicalName to On. If you do this then I don't think it's possible to access web pages on a specific OAS server (eg oasserver\_1) because entering http://oasserver\_1.mycompany.com:7777/analytics just redirects to bi.mycompany.com/analytics.  
  
Ref: [Deploying F5 with Oracle Application Server 10g](http://www.f5.com/pdf/deployment-guides/f5-oracle10g-dg.pdf)  
Ref: [Oracle HTTP Server - Port setting](http://www.blogger.com/Default%20page%20%28bi.morrisonsplc.co.uk/%29%20is%20OAS%20homepage.%20%20Should%20we%20amend%20this%20to%20be%20a%20redirect%20to%20/analytics?%20Will%20the%20only%20access%20be%20via%20ebiz%20%28and%20thus%20direct%20URL%29?%20/app/oracle/product/OAS_1013/Apache/Apache/htdocs/index.html.en)  
Ref: Metalink 301755.1 - What Is the Difference Between Port & Listen In Httpd.Conf
