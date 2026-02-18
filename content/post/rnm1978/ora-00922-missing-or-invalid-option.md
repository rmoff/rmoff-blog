---
draft: false
title: 'ORA-00922: missing or invalid option'
date: "2009-07-27T16:26:00+0000"
categories:
- ORA-00922
- oracle
---

We routinely change Oracle passwords as part of security best-practice, I keep hitting this and keep forgetting why! 🙂

<!--more-->
> ```
> 
> ALTER USER DAC_REPO IDENTIFIED BY 1KoBe3RH REPLACE YlR94tqp
> ```
>
> Error report:  
> SQL Error: ORA-00922: missing or invalid option  
> 00922. 00000 – “missing or invalid option”  
> \*Cause:   
> \*Action:

Someone better qualified than me can explain why but I suspect it’s the leading number in the new password. Quoting the passwords then works fine:

```

ALTER USER DAC_REPO IDENTIFIED BY "1KoBe3RH" REPLACE "YlR94tqp"
```

ALTER USER DAC\_REPO succeeded.
