---
title: "TortoiseSVN doesn't prompt for authentication"
date: "2010-09-21"
categories: 
  - "svn"
---

Here's one in the series of stupid things I've done but which Google has thrown no answers, so I post it here to help out fellow idiots.

Today's episode involves our SCM tool, TortoiseSVN. I'd been happily using it for over a year, when suddenly I couldn't commit any more. I could browse and checkout to my heart's content, but when I tried to commit, _boom_:

**Commit failed (details follow): Authorization failed**

The odd thing was that I wasn't being prompted to login, i.e. I wasn't _authenticating_, so how could I give it my credentials with which to _authorise_??

I went through and cleared out all authentication data, even digging around in Documents and Settings app data to flush it all out. Nothing. No prompt when I went to the repo, and thus no authorisation to commit my changes.

We're using SVN on Windows via Apache, with Windows Domain authentication.

I rebooted. I reinstalled. I installed an older version of the client. No dice. I whipped out Google - TortoiseSVN doesn't ask for authentication. Nothing.

And most puzzling of all was that it was just me, no-one else using the SVN repo had the problem.

I fired up a second PC that I'd used a few months ago, and went to TortoiseSVN - and got prompted for my credentials. So then I looked a bit closer. And a bit closer still. Bingo.

See if you can spot the difference:

![](/images/rnm1978/svn01.png "svn01")

![](/images/rnm1978/svn02.png "svn02")

For some reason I'd been merrily connecting using the svn:// protocol, which worked for read-only (I think our SVN server's configured for anonymous read-only), but then barfed on write-attempts.

Using https:// protocol, correctly prompted me to authenticate on connection.
