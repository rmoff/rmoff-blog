---
draft: false
title: 'Repository Error ([REP_51821] Failed to connect from Integration Service (pmserver) to repository Oracle_BI_DW_Base running in exclusive mode.)'
date: "2009-08-10T16:00:41+0000"
categories:
- obia
---

I keep hitting this error when setting up OBIA. I suppose it’s what it says on the tin, but Googling it didn’t match so I’m posting this so next time I hit it I remember 🙂

<!--more-->
> ```
> Repository Error ([REP_51821] Failed to connect from Integration Service (pmserver) to repository Oracle_BI_DW_Base running in exclusive mode.)
> ```

The cause is the Repository Service having OperatingMode set to Exclusive. This is necessary for some of the setup operations like restoring the pre-built Repository, but if you forget to switch it back the Integration Service will suddenly stop working.
