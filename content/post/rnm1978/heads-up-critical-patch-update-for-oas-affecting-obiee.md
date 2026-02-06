---
title: "Heads up - Critical Patch Update affecting OBIEE"
date: "2009-10-16"
categories: 
  - "bug"
  - "oas"
  - "OBIEE"
  - "security"
---

The [Critical Patch Update Pre-Release Announcement](http://www.oracle.com/technology/deploy/security/critical-patch-updates/cpuoct2009.html) for October has been published. The pre-release is advance notice of the affected software prior to release of the quarterly Critical Patch Update. It is published on the Thursday prior to the patch releases (which was postponed by a week because of OOW).

It looks like if you're running OBIEE 10.1.3.4.0 or 10.1.3.4.1 through OAS 10.1.2.3.0/10.1.3.4.0/10.1.3.5.0 then you should check back next Tuesday 20th for details.

Paraphrasing the announcement:

> Security vulnerabilities addressed by this Critical Patch Update affect the following products: \[...\] • Oracle Application Server 10g Release 3 (10.1.3), versions 10.1.3.4.0, 10.1.3.5.0 • Oracle Application Server 10g Release 2 (10.1.2), version 10.1.2.3.0 \[...\] • Oracle Business Intelligence Enterprise Edition, versions 10.1.3.4.0, 10.1.3.4.1 \[...\] Oracle Application Server Executive Summary
> 
> This Critical Patch Update contains 3 new security fixes for the Oracle Application Server. 2 of these vulnerabilities may be remotely exploitable without authentication, i.e., may be exploited over a network without the need for a username and password. None of these fixes are applicable to client-only installations, i.e., installations that do not have an Oracle Application Server installed. \[...\] The highest CVSS base score of vulnerabilities affecting Oracle Application Server products is 4.3.
> 
> The Oracle Application Server components affected by vulnerabilities that are fixed in this Critical Patch Update are:
> 
> \* Oracle Business Intelligence Enterprise Edition \[...\]

More details from the Oracle [Critical Patch Updates and Security Alerts](http://www.oracle.com/technology/deploy/security/alerts.htm) page.

\[update 21st October\] [Details here, patch is for BI Server so presumably the application server is irrelevant](/2009/10/21/critical-patch-update-obiee-vuln-cve-2009-1990/)
