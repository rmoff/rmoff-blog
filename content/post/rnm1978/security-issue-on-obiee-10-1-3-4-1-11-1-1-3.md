---
title: "Security issue on OBIEE 10.1.3.4.1, 11.1.1.3"
date: "2011-08-04"
categories: 
  - "bug"
  - "obiee"
  - "security"
---

July's [Critical Patch Update](http://www.oracle.com/technetwork/topics/security/cpujuly2011-313328.html) from Oracle includes [CVE-2011-2241](http://web.nvd.nist.gov/view/vuln/detail?vulnId=CVE-2011-2241), which affects OBIEE versions 10.1.3.4.1 and 11.1.1.3. No details of the exploit other than it "allows remote attackers to affect availability via unknown vectors related to Analytics Server."

It is categorised with a [CVSS score of 5](http://nvd.nist.gov/cvss.cfm?version=2&name=CVE-2011-2241&vector=(AV%3AN/AC%3AL/Au%3AN/C%3AN/I%3AN/A%3AP)) (on a scale of 10), with no impact on Authentication, Confidentiality, or Integrity, and "Partial+" impact on Availability. So to a security-unqualified layman (me), it sounds like someone could remotely crash your NQSServer process, but not do any more damage than that.

Patches [11833743](https://updates.oracle.com/ARULink/PatchDetails/process_form?patch_num=11833743) and [11833750](https://updates.oracle.com/ARULink/PatchDetails/process_form?patch_num=11833750) for 10.1.3.4.1 and 11.1.1.3 respectively.
