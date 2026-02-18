---
draft: false
title: 'Clean install of OAS – Enterprise Manager not available'
date: "2009-08-06T08:29:31+0000"
categories:
- OAS
---

I successfully installed OAS 10.1.3.3 and patched to 10.1.3.4. <http://localhost:7777> gave the OAS welcome page, but going to <http://localhost:7777/em> gave 404 Not Found.

<!--more-->
In [OASHome]/j2ee/home/config/servers.xml search for ascontrol, you should get:

```
<application name="ascontrol" path="../../home/applications/ascontrol.ear" parent="system" start="false" />
```

change the start attribute to true

```
<application name="ascontrol" path="../../home/applications/ascontrol.ear" parent="system" start="true" />
```

Restart OAS ([OAShome]/opmn/bin/opmnctl restartproc) and Enterprise Manager should now be available
