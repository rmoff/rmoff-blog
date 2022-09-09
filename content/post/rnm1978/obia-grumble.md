---
title: "OBIA grumble"
date: "2009-08-04"
categories: 
  - "obia"
  - "oracle"
  - "rant"
---

I'm starting on an upgrade from OBIA 7.9.5 to 7.9.6 and wading through the two main docs:

- [7.9.6 Upgrade guide](http://download.oracle.com/docs/cd/E14223_01/bia.796/e14218.pdf)
- [7.9.6 Installation guide](http://download.oracle.com/docs/cd/E14223_01/bia.796/e14217.pdf)

It would be nice if Oracle could come up with some less confusing terminology. It seems that not only is the whole product of OBIA referred to as OBIA ([see @lex's posting for a good explanation](http://siebel-essentials.blogspot.com/2009/06/can-you-describe-oracle-bi-applications.html)), but that the sub-components which are not-OBIEE-or-DAC-or-Informatica is also OBIA, c.f. page 6-1 of the Upgrade guide "\[...\]upgrade your Oracle BI Applications environment to the current version." To me that implies that once I've done this, my OBIA will be upgraded - but no, actually, some of the supporting bits will be upgraded, but I still have to do a heck of a lot more grunt work before what I consider OBIA (and the manual is called OBIA too!) is upgraded.

And whilst I'm at it ... it tells you to "\[...\]uninstall \[...\] previous release of Oracle BI Applications \[...\]" - but doesn't tell you how. I checked the docs but found no reference, and in the end manually moved the objects listed in the Installation guide page 4-13 as being installed by the Oracle BI Applications installation (which of course installs _Oracle BI Applications_, but not _Oracle BI Applications_ - spot the difference? sorry, I'm just being fatuous now) out of c:\\OracleBI and C:\\OracleBIData. After running the 7.9.6 OBIA installer I noticed a c:\\OracleBI\\UninstallApps folder, so maybe that was there for 7.9.5 before too and I just missed it. Still - how difficult would it have been to include in the documentation "You must install previous versions first, **run c:\\OracleBI\\UninstallApps\\setup.exe to do this**"?
