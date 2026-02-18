---
draft: false
title: 'Metalink 3 RIP'
date: "2009-09-02T08:55:56+0000"
image: "/images/2009/09/404-not-found_1251880997896.webp"
categories:
- obiee
---

This weekend just gone Metalink3 went to the digital dustbin. In principle this is a Good Thing, as multiple support websites for a single company is confusing and frustrating.

<!--more-->
Metalink is now “My Oracle Support” and is a flash-based whizz-bang affair. Everyone has different tastes, but there’s a lot to be said for plain HTML for ease and speed of access. But then people probably grumbled to the Wright Brothers that there was nothing wrong with land-transport at the time…

Navigating to my bookmarked Metalink 3 SR home (<https://metalink3.oracle.com/od/faces/secure/ml3/sr/SRHome.jspx?mc=true>) came up with a nice clear redirect page comfortingly reassuring me :

![404 Not Found_1251880997896](/images/2009/09/404-not-found_1251880997896.webp "404 Not Found_1251880997896")  
</sarcasm>

So fair enough hard-coding even in bookmarks isn’t always a good idea, but I’m certain OAS allows for custom error pages… 😉

Going to <https://metalink3.oracle.com/> redirected (without an explanation) to My Oracle Support, and from here I logged in. My SRs had ported over, and all seemed fine.

It appears that My Oracle Support != My Oracle Support in places though. If I login to my existing Metalink (not Metalink3) account at <https://metalink.oracle.com/CSP/ui/flash.html#> and search for a Metalink 3 SR I get an error “**SR Number must be a number**.”. This is presumably because of the hyphen in Metalink3 SRs.  
If I log in on a redirect from Metalink 3 then I can search for the SR fine.  
The flash interface for the two looks the same, but somewhere under the layers something’s been hacked in one place and not the other I’m guessing.

To finish on a positive note, My Oracle Support shows more than the last 100 entries on an SR. And when you’ve got an SR that’s been dragging on for seven months and feel like you’re going around in circles but can’t prove it, that’s a useful thing.
