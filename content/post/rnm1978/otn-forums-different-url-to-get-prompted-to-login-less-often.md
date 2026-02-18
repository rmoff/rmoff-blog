---
draft: false
title: 'OTN forums – different URL to get prompted to login less often'
date: "2009-08-18T14:32:02+0000"
categories:
- OTN
---

I have a couple of OTN forums bookmarked, and found that generally every few hours I get signed out and end up viewing them as Guest. I then have to click on sign in, enter password, etc.

<!--more-->
(Signing out this frequently is ridiculous, IMHO).

I found that instead of using the direct URL of a forum, eg:  
**<http://forums.oracle.com/forums/forum.jspa?forumID=378>**  
if I use this form:  
**<http://forums.oracle.com/forums/>adfAuthentication?success\_url=/forum.jspa?forumID=378**  
then I end up signed in more often, and if I’ve been signed out then it goes straight to the login page and then through to the forum.

Of course YMMV and you may prefer to go straight to the forum and only login when you need to.
