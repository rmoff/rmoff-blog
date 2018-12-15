+++
author = "Robin Moffatt"
categories = ["obiee", "installation", "jps-06514", "jdk", "environment variables", "wls", "keystore"]
date = 2016-03-18T18:04:07Z
description = ""
draft = false
slug = "obiee-11-1-1-9-installation-jps-06514-opening-of-file-based-keystore-failed"
tags = ["obiee", "installation", "jps-06514", "jdk", "environment variables", "wls", "keystore"]
title = "OBIEE 11.1.1.9 installation - JPS-06514: Opening of file based keystore failed"

+++

I got this lovely failure **during a fresh install** of OBIEE 11.1.1.9. I emphasise that it was during the install because there's other causes for this error **on an existing system** to do with corrupted credential stores etc -- not the case here. 

The install had copied in the binaries and was in the process of building the domain. During the early stages of this where it starts configuring and restarting the AdminServer it failed, with the AdminServer.log showing the following: (I've extracted the salient errors from the log)

```
<BEA-090892> <The loading of OPSS java security policy provider failed due to exception, see the exception stack trace or the server log file for root cause. If still see no obvious cause, enable the debug flag -Djava.security.debug=jpspolicy to get more information. Error message: JPS-06514: Opening of file based keystore failed.>

<BEA-000386> <Server subsystem failed. Reason: weblogic.security.SecurityInitializationException: The loading of OPSS java security policy provider failed due to exception, see the exception stack trace or the server log file for root cause. If still see no obvious cause, enable the debug flag -Djava.security.debug=jpspolicy to get more information. Error message: JPS-06514: Opening of file based keystore failed.
weblogic.security.SecurityInitializationException: The loading of OPSS java security policy provider failed due to exception, see the exception stack trace or the server log file for root cause. If still see no obvious cause, enable the debug flag -Djava.security.debug=jpspolicy to get more information. Error message: JPS-06514: Opening of file based keystore failed.

Caused By: oracle.security.jps.service.keystore.KeyStoreServiceException: JPS-06519: Failed to get/set credential with map fks and key null in bootstrap credstore. Reason oracle.security.jps.service.keystore.KeyStoreServiceException: JPS-06519: Failed to get/set credential with map fks and key current.key in bootstrap credstore. Reason null

Caused By: oracle.security.jps.service.keystore.KeyStoreServiceException: JPS-06519: Failed to get/set credential with map fks and key current.key in bootstrap credstore. Reason null

Caused By: oracle.security.jps.service.credstore.CredStoreException: JPS-01061: Access to bootstrap credential store denied to application code.
```

The cause? An old JDK and/or set of environment variables. The machine I was installing on already had an existing legacy 11.1.1.6 install, and I was doing a side-by-side out-of-place upgrade (patch migration). For various reasons I was using the same OS user as the existing install, and in the `.bash_profile` of this user there was a number of environment variables set pointing to the existing installation.

I wasn't sure if the install & domain build process spawns additional shells that mightn't inherit the environment variables of the launching session (and instead use those defined in the `.bash_profile`). So instead of simply unsetting the environment variables prior to launching `runInstaller.sh`, or running it with a `env -i` prefix (thanks, [etcSudoers](https://twitter.com/sudoed)!), I amended the `.bash_profile` (having backed it up first, of course) to remove all of the environment variables that it was setting. After relaunching my session, the installation ran through with no problem.
