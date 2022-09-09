---
title: "ORA-00922: missing or invalid option"
date: "2009-07-27"
categories: 
  - "ora-00922"
  - "oracle"
---

We routinely change Oracle passwords as part of security best-practice, I keep hitting this and keep forgetting why! :-)

> \[sourcecode language='sql'\] ALTER USER DAC\_REPO IDENTIFIED BY 1KoBe3RH REPLACE YlR94tqp \[/sourcecode\]
> 
> Error report: SQL Error: ORA-00922: missing or invalid option 00922\. 00000 - "missing or invalid option" \*Cause: \*Action:

Someone better qualified than me can explain why but I suspect it's the leading number in the new password. Quoting the passwords then works fine:

\[sourcecode language='sql'\] ALTER USER DAC\_REPO IDENTIFIED BY "1KoBe3RH" REPLACE "YlR94tqp" \[/sourcecode\]

ALTER USER DAC\_REPO succeeded.
