+++
author = "Robin Moffatt"
categories = ["obiee", "obiee12c", "exportserviceinstance", "wlst"]
date = 2016-05-27T09:13:00Z
description = ""
draft = false
image = "/images/2016/05/1__oracle_demo___demo_us_oracle_com_127_0_0_1_20160527T094829__ssh_.png"
slug = "dynamic-naming-of-obiee-12c-service-instance-exports"
tags = ["obiee", "obiee12c", "exportserviceinstance", "wlst"]
title = "Dynamic Naming of OBIEE 12c Service Instance Exports"

+++

[`exportServiceInstance`](http://docs.oracle.com/middleware/1221/biee/BIESG/configrepos.htm#BIESG9314) will export the RPD, Presentation Catalog, and Security model (application roles & policies etc -- but *not* WLS LDAP) into a single `.bar` file, from which they can be imported to another environment, or restored to the same one at a later date (e.g. for backup/restore).

To run `exportServiceInstance` you need to launch WLST first. The following demonstrates how to call it, and embeds the current timestamp & machine details in the backup (useful info, and also makes the backup name unique each time). 

To include the timestamp and hostname in the bar file: 

```python
import time, socket
ts=time.strftime('%Y%m%dT%H%M%S',time.localtime())
hostname = socket.gethostname()
ip = socket.gethostbyname(hostname)
exportServiceInstance('C:/app/oracle/fmw/user_projects/domains/bi/','ssi','c:/',('C:/%s_%s_%s' % (hostname,ip,ts) ))
```
	
All in one line: 

```python
import time, socket;ts=time.strftime('%Y%m%dT%H%M%S',time.localtime());hostname = socket.gethostname();ip = socket.gethostbyname(hostname);exportServiceInstance('C:/app/oracle/fmw/user_projects/domains/bi/','ssi','c:/',('C:/%s_%s_%s' % (hostname,ip,ts) ))
```

On bash, including WLST invocation

```bash
/app/oracle/biee/oracle_common/common/bin/wlst.sh <<EOF
import time, socket;ts=time.strftime('%Y%m%dT%H%M%S',time.localtime());hostname = socket.gethostname();ip = socket.gethostbyname(hostname);exportServiceInstance('/app/oracle/biee/user_projects/domains/bi/','ssi','/home/oracle',('/home/oracle/%s_%s_%s' % (hostname,ip,ts) ))
EOF
```
