---
title: "Critical Patch Update - OBIEE vuln CVE-2009-1990"
date: "2009-10-21"
categories: 
  - "bug"
  - "obiee"
  - "security"
---

October's [Oracle Critical Patch Update Advisory](http://www.oracle.com/technology/deploy/security/critical-patch-updates/cpuoct2009.html) has been released. There are two vulnerabilities (CVE-2009-1999, CVE-2009-1990) listed under **Oracle Application Server** for "Component" **Business Intelligence Enterprise Edition** and one (CVE-2009-3407) for "component" **Portal**.

- CVE-2009-1999 is OBIEE and "Fixed in all supported versions. No patch provided in this Critical Patch Update.".
- CVE-2009-3407 looks like only OAS (not OBIEE), up to versions 10.1.2.3 and 10.1.4.2.
- CVE-2009-1990 is OBIEE and is the main vuln of interest. It's unclear if it's just OBIEE 10.1.3.4.x, or all versions of OBIEE through to and including 10.1.3.4.1. It's also confusing putting it on the same table as OAS especially given it has similar versioning (10.1.3.x.x).

For information about patches, see [My Oracle Support Note 881382.1](http://metalink.oracle.com/metalink/plsql/ml2_documents.showDocument?p_database_id=NOT&p_id=881382.1#AS_on_request). This doc lists patches [8927890](http://updates.oracle.com/ARULink/PatchDetails/process_form?patch_num=8927890) and [8927886](http://updates.oracle.com/ARULink/PatchDetails/process_form?patch_num=8927886) for OBIEE 10.1.3.4.1 and 10.1.3.4.0 respectively. Since no other versions are mentioned that suggests it doesn't affect them but that'd be a heck of an assumption to make and if I were running < 10.1.3.4.0 I'd be raising an SR to seek clarification especially given the ambiguity of the table in the [Advisory doc](http://www.oracle.com/technology/deploy/security/critical-patch-updates/cpuoct2009.html#AppendixOAS).

The patch ([8927890](http://updates.oracle.com/ARULink/PatchDetails/process_form?patch_num=8927890) for 10.1.3.4.1 / [8927886](http://updates.oracle.com/ARULink/PatchDetails/process_form?patch_num=8927886) for 10.1.3.4.0) updates libnqsmetadata and libnqsexecutionlist libraries (dll / so), so installation should be simple (and thus backout too).

Watch out for the pre-reqs on 8927890, which list the same build (10.1.3.4.0.080726.1900) as 8927886, even though it's supposed to be for 10.1.3.4.1. You also need to shutdown BI Scheduler (nqscheduler), even though only BI Server is named in the readme.txt.

There's no details on the vuln itself that I can find. The READMEs for each patch simply say "This patch fixes the following bug(s)" and lists the patch number (8927886 or 8927890). On MyOracleSupport there's no results for these bug numbers except a JDEdwards bug (!). On Metalink2 each bug turns up but is not publicly visible.
