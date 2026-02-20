---
title: "#Fail: My Oracle Support"
date: "2009-11-11"
url: "/2009/11/11/fail-my-oracle-support/"
categories: 
  - "oracle"
  - "rant"
  - "support"
aliases:
- /2009/11/11/#fail-my-oracle-support/
---

Metalink was retired this weekend and made way for the new My Oracle Support system. It didn't go as smoothly as it could have done.

This post is going to be a bit of a rambling rant.

Ultimately people, including me, don't like their [cheese being moved](http://en.wikipedia.org/wiki/Who_Moved_My_Cheese%3F) (not unless there's a really runny piece of [Camembert](http://en.wikipedia.org/wiki/Cheese_Shop_sketch#Table_of_Cheeses) at the end of it). That makes it a bit more difficult to discuss because some of people's complaints will just be geeks being stubborn (and boy, can geeks be stubborn). Arguments descend into minutiae of detail and flash vs DHTML - whilst the bigger picture gets lost.

People especially don't like their cheese being moved (okay okay enough of the cheese) change to systems that they depend on to do their job. If it were the migration of a blogging website or somesuch then it'd be a bummer, there'd be grumbling about it, but ultimately people would probably be quite sanguine about it. **When it comes to a support website though, it has to be available**.

If this were a system that we delivered to our users then we'd (hopefully) get laughed out the building and/or strung up. It stinks, and there's no denying it. Maybe once upon a time the concept was a good one, but somewhere along the line looks overtook functionality and someone in charge forgot that this wasn't a beauty contest but a support website relied on by many many people for doing their jobs. Some of the new functionality (and it is there) in MOS is quite neat -- but I only discover it by accident because most of the time I'm waiting for the s#dding thing to load or respond to a mouse click.

I can understand a marketing agency designing some krazy kool website to sell junk food to kidz using lots of flash and clever code, and the benefit (whizzy effects impressing target audience) outweighs the disadvantage (lower spec'd PCs can't display it properly or at reasonable speed). But a support website? C'mon! It's a **support** website! It should work in [Lynx](http://en.wikipedia.org/wiki/Lynx_%28web_browser%29) (maybe not quite). It was [apparently tested on](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=747242.5#browser) a 2 gig / 3Ghz PC - I'd suggest that's hardly standard fare yet.

I want to go to the Oracle support website and get support. **I shouldn't have to attend training or webinars to use a website**. If I do, then the website's badly designed. Seriously. And enough with the rambling waffly emails already. I get enough emails everyday that any communication about Metalink/MOS needs to be clear and concise. It doesn't need BS in it about a "Leveraging the personalized, proactive, and collaborative support capabilities \[...\] reduce the time you spend maintaining Oracle solutions" (literal quotation).

As an OBIEE user I've already been using My Oracle Support after Metalink3 was discontinued a few months ago. After that migration I raised several non-technical SRs reporting various problems, and almost always got a response with the implication that I was doing something wrong or needed helping, rather than the impression that I'd reported a bug which needed fixing. Somehow, and I'd have hoped this would come from within the organisation, bugs reported by customers need to go straight to Dev, rather than the customer fobbed off. And I was fobbed off without a doubt. Next time I shall not bother reporting problems because it's not worth the time I spend on it.

Sr. Customer Support Manager Chris Warticki at Oracle has blogged about the cutover:

- [Classic MetaLink:Na,na,na,Nah,na,na. Hey hey Goodbye](http://blogs.oracle.com/Support/2009/11/classic_metalinknanananahnana.html)
- [My Oracle Support - Migration Update](http://blogs.oracle.com/Support/2009/11/my_oracle_support_-_migration.html)

There's another blog from Support [here](http://blogs.oracle.com/supportportal/2009/09/welcome_to_my_oracle_support_-.html).

## OUG survey

OUG are running a survey until 19th Nov:

> Last weekend, Oracle closed the current Metalink service and migrated the users to My Oracle Support. UKOUG has had reports from its membership and from across EMEA of a number of problems in this migration. In order to enter into dialogue with Oracle on this, we would appreciate it if you could complete the following very short survey.

You can [find the survey here](http://www.oug.org/metalink)

## Footnote - non-flash My Oracle Support

There is a non-flash version of My Oracle Support at [http://supporthtml.oracle.com](http://supporthtml.oracle.com). However from where I am I can't login directly (see errors below)

You might be able to get in indirectly on [this link](https://supporthtml.oracle.com/ep/faces/secure/ml3/patches/ARUPatchDownload.jspx).

Clicking the Home link when going in on [this link](https://supporthtml.oracle.com/ep/faces/secure/ml3/patches/ARUPatchDownload.jspx) or trying to login from [http://supporthtml.oracle.com](http://supporthtml.oracle.com) gives **500 Internal Server** error on IE and "Recursive error in error-page calling for /secure/error.jspx, see the application log for details. " in FireFox.

Looking at http://supporthtml.oracle.com and having used the flash version for a while now the non-flash version looks pretty similar. More effort's gone into its appearance than I'd expect for a site that's been knocked out in HTML as a purely-functional alternative to the main flash site. It's evidently not fully functional yet but I wonder if someone's taken the wise idea to do the rewrite in non-flash and will ditch the flash version at some point in the future?

## Follow up

It looks like things are stabilising a bit, although I still get inconsistent results when using supporthtml.oracle.com.

Some more blogs about the problems:

- [http://oracledoug.com/serendipity/index.php?%2Farchives%2F1541-My-Oracle-Support.html](http://oracledoug.com/serendipity/index.php?%2Farchives%2F1541-My-Oracle-Support.html)
- [http://jkstill.blogspot.com/2009/11/metalink-we-barely-knew-ye.html](http://jkstill.blogspot.com/2009/11/metalink-we-barely-knew-ye.html)
- [http://optimaldba.blogspot.com/2009/11/its-messbut-its-no-surprise.html](http://optimaldba.blogspot.com/2009/11/its-messbut-its-no-surprise.html)
- [http://dbasrus.blogspot.com/2009/11/quite-frankly-warticki-you-should.html](http://dbasrus.blogspot.com/2009/11/quite-frankly-warticki-you-should.html)
