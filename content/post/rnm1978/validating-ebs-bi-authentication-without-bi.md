---
title: "Validating EBS-BI authentication, without BI"
date: "2010-05-17"
url: "/2010/05/17/validating-ebs-bi-authentication-without-bi/"
categories: 
  - "obia"
  - "OBIEE"
  - "security"
---

Troubleshooting EBS-BI integrated authentication can be a tiresome activity, so here's a shortcut that might help. If you suspect the problem lies with EBS then you can leave OBIEE out of the equation.

1. Login to EBS  
    ![](/images/rnm1978/2010-05-17_1155081.png "2010-05-17_115508")
2. Use [FireBug](https://addons.mozilla.org/en-US/firefox/addon/1843/) or [Fiddler2](http://www.fiddler2.com/fiddler2/) to inspect web traffic as follows:

1. Click the BI link from EBS
2. Should be first a request to EBS server, which returns 302 and redirects to `http://<bi server>:<port>/analytics/saw.dll?Dashboard&acf=101507310`
3. Record the value of acf (eg `101507310`)  
    ![](/images/rnm1978/2010-05-17_1201361.png "2010-05-17_120136")
4. Record the value of the cookie that's passed to BI. It should normally match the EBS TNS name (but doesn't have to). In this example it's EBSBIS1A, and the value is `_ACpwGUoeCKUX7GilVh7ZZKR:S`  
    ![](/images/rnm1978/2010-05-17_1307451.png "2010-05-17_130745")

4. Use sqlplus to open a connection to the EBS database using the ID that BI connects as (eg EBS\_BI)
```
$sqlplus EBS_BI/password@EBSDATABASE

SQL*Plus: Release 11.1.0.6.0 - Production on Mon May 17 13:10:11 2010

Copyright (c) 1982, 2007, Oracle.  All rights reserved.


Connected to:
Oracle Database 11g Enterprise Edition Release 11.1.0.7.0 - 64bit Production
With the Partitioning, OLAP, Data Mining and Real Application Testing options

SQL>
```

5. Enter this statement, substituting values as appropriate  
    call /\* acf \*/ APP\_SESSION.validate\_icx\_session('cookie value'); eg: 
```
SQL> call /* 101507310 */ APP_SESSION.validate_icx_session('_ACpwGUoeCKUX7GilVh7ZZKR:S');
```

6. Expect to get:
```
Call completed.

SQL>
```

7. If the cookie ID is invalid you'll get 
```
ERROR at line 1:
ORA-06510: PL/SQL: unhandled user-defined exception
ORA-06512: at "APPS.APP_SESSION", line 315
```

    
    After writing this I discovered My Oracle Support article [758392.1](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=758392.1&h=Y) which has the same info plus a bit more.
