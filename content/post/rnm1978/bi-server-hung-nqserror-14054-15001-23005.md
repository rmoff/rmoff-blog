---
title: "BI Server hung - nQSError 14054 / 15001 / 23005"
date: "2009-10-16"
categories: 
  - "OBIEE"
---

Watch out if you are using init blocks in your RPD. We hit a bug (#9019374) recently that caused BI Server (10.1.3.4) to hang.

The init block in question should have returned a date to update a repository variable, but because of badly-written SQL and abnormal data in the source table actually returned a **null value**. BI Server evidently didn't like this null being inserted somewhere where it shouldn't have and understandably logged :

> \[14054\] Unable to load subject area: Core.\[nQSError: 15001\] Could not load navigation space for subject area Core. \[nQSError: 23005\] The repository variable, LAST\_REFRESH\_DT, has no value definition.

Instead of invalidating the subject area Core and continuing as normal (which is what it **should** do), it hung and had to be killed forcefully (kill -9 nqsserver). We fixed the init block SQL to exclude the NULL value, and restarted BI Server successfully.

The hang was worse than a crash because diagnostics are harder since it's less clear what the problem is immediately as nothing's "broken", things just aren't working right. The symptoms we got were

- Users already logged in found dashboards or answers weren't working (no errors, just no response when items clicked on)
- Admin Tool hanging after a short period of time when connected to the server.
- Users who weren't logged in getting stuck at the OBIEE “Logging in” screen.

It's always interesting with these kind of problems looking back on the initial diagnosis. With hindsight, it's obvious why this caused a problem, but at the time we were scratching our heads. How could our server suddenly have stopped working, when we'd not changed anything for weeks? But of course something had changed: the data! Our init block refreshed hourly, and the data it read from had changed since it refreshed the previous hour.

So lessons to take away are:

- Don't write SQL that can return NULL values - never mind if "the data should never be null" - if it CAN then it MIGHT, so code for it!
- If something's "suddenly" stopped working, remember to think about less obvious factors like init blocks

Update 12th Feb 2010: Another bug's been raised on the back of this: BUG 9358471 - REPOSITORY VARIABLES INIT BLOCK SQL SHOULD HANDLE NULL CONDITIONS
