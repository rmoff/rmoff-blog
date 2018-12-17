+++
author = "Robin Moffatt"
categories = ["obiee", "obiee12c", "hang", "boot.properties", "start.cmd"]
date = 2016-05-20T14:22:21Z
description = ""
draft = false
image = "/images/2016/05/limes_lemons.jpeg"
slug = "obiee-12c-hangs-at-startup"
tags = ["obiee", "obiee12c", "hang", "boot.properties", "start.cmd"]
title = "OBIEE 12c hangs at startup - Starting AdminServer ..."

+++

Running the OBIEE 12c startup on Windows: 

    C:\app\oracle\fmw\user_projects\domains\bi\bitools\bin\start.cmd

Just hangs at: 

    Starting AdminServer ...

No CPU being consumed, very odd. But then ... looking at `DOMAIN_HOME\servers\AdminServer\logs\AdminServer.out` shows the last log entry was: 

    Enter username to boot WebLogic server:

And that's bad news, cos that's an interactive prompt, but not echo'd to the console output of the startup command, and there's no way to interact with it.

The `start.cmd` was being called by adding it to the Startup folder (`C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp`), and I guess it was something about this that stopped the prompt coming back to the console, because when I ran it manually from the command prompt, I got this: 

```
C:\Users\Administrator>C:\app\oracle\fmw\user_projects\domains\bi\bitools\bin\start.cmd
BI_PRODUCT_HOME set as C:\app\oracle\fmw\bi\
[...]
Requesting credentials ...
Enter Weblogic login details at prompt
Weblogic Username: 
```

If I entered the credentials, the AdminServer still failed to start, appearing to already be running. 

So why was it even prompting for the credentials in the first place? This was a server that had booted just fine previously. 

The `start.cmd` is a wrapper for a Jython WLST script which uses Node Manager to start up all the necessary components. Taking the `startWebLogic.cmd` and running it independently works fine, and the AdminServer comes up with no boot credentials required. But, from `start.cmd` the whole process stalls at the interactive prompt for credentials. Weird. 

Digging around a bit shows that `start.cmd` passes an argument to the AdminServer that we can guess is relevant to the problem: 

    -Dweblogic.system.BootIdentityFile=
    C:\app\oracle\fmw\user_projects\domains\bi\servers\AdminServer\data\nodemanager\boot.properties
Loading this file showed an AES-encrypted username/password as you'd expected: 

```
#Fri May 20 15:53:35 UTC 2016
password={AES}7zL9O1AP+5yVmpG1t71wu22m1VCBPyixC9tg8H78m+A\=
username={AES}IIqpK/FkTSV0CKPdigpMuaI0ECplaqv5Oplv9AoDRWM\=
```

Note the `{AES}` prefix. If you remove that you can replace it with plain text values. On a guess that maybe the credentials are invalid or corrupted, I reset them: 

```
#Fri May 20 15:53:35 UTC 2016
password=Password01
username=weblogic
```

After doing this, the stack came up just fine. 

**Note** this is just hacking around on a test server -- I wouldn't recommend changing files that aren't meant to be changed unless you're sure it's the answer, otherwise you can just end up compounding problems...
