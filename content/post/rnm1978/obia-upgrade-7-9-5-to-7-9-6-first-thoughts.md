---
title: "OBIA upgrade 7.9.5 to 7.9.6 - first thoughts"
date: "2009-08-13"
url: "/2009/08/13/obia-upgrade-7-9-5-to-7-9-6-first-thoughts/"
categories: 
  - "bug"
  - "dac"
  - "obia"
  - "oracle"
aliases:
- /2009/08/13/obia-upgrade-7.9.5-to-7.9.6-first-thoughts/
---

We're upgrading from OBIA 7.9.5 (Financials - GL) to OBIA 7.9.6. Our reasons are for support (7.9.5 does not support Oracle 11g) and minor functionality additions.

Our architecture is: HP-UX 64 bit Itanium (11.31), Oracle 11g (11.1.0.7), separate ETL server, 4x OBIEE servers (2x BI, 2xPS). We have no customisations in the ETL except something for budgets, which is superseded in 7.9.6.

This post is a semi-formed articulation of my frustrations encountered during an initial run through of the upgrade in a sandbox. As we progress with the upgrade I will post further, hopefully more useful, information on what we encounter.

## Grumble

Oracle's upgrade documentation is, in my opinion, not very good. Whilst I find the rest of their OBIA and OBIEE documentation in general clear and comprehensive, the OBIA upgrade document is ambiguous and completely lacking detail in areas.

There is probably also an element of failing to please all the punters all the time... OBIA is for so many different subject areas, so many potential technologies, that upgrade instructions maybe have to be generic. If we had some highly-customised deployment on some obscure technology set then I would expect to have to work a lot out for myself, so my sense of frustration comes from using the most vanilla of vanilla - Oracle-everything, no customisations - yet still having to figure out so much for myself.

The upgrade document is a compendium of "see xxxx document for more details". Anyone taking the upgrade half-seriously will invariably end up compiling their own version of instructions, copying-and-pasting the essence of the referenced documents into one place to produce their own upgrade instructions. This is good for understanding the process but leaves me feeling that I'm writing Oracle's documentation for them. As a side-note to this, the HTML version of the [upgrade guide](http://download.oracle.com/docs/cd/E14223_01/bia.796/e14218/toc.htm) **doesn't use hyperlinking** to its many references to the [installation guide](http://download.oracle.com/docs/cd/E14223_01/bia.796/e14217/toc.htm)!

### "Upgrading Oracle BI Applications"

Ref: [Page 6-1 of "Oracle® Business Intelligence Applications Upgrade Guide for Informatica PowerCenter Users"](http://download.oracle.com/docs/cd/E14223_01/bia.796/e14218/upgr_oracle.htm#CHDCBJDD) This is so patently ridiculous. As I see it, OBIA is basically a combination of OBIEE, Informatica, DAC, etc etc - all individual components which are upgraded separately. Yet this section of the upgrade doc innocently states "Run the Oracle BI Applications installer to upgrade your Oracle BI Applications environment to the current version". Simple as that! So once I've run the installer, my Oracle BI Applications environment will be at the "current version", right? wrong, obviously. What this actually installs is the bits and pieces that are the "money-shot" of OBIA -- pre-built OBIEE RPD, pre-built DAC repository, pre-built Informatica repository. OBIA is a confusing enough product, without stupid documentation like this. Maybe the marketeers or salesmen had a hand it, but OBIA is **either** the sum of the consituant parts (apps plus pre-built repositories), **or** it's just the pre-built repositories, but it can't be both. It really should be called "Upgrade OBIA pre-built repositories" or something like that. Or provide an installer which does actually install all of OBIA....

## Documentation errors

### Out of date screenshots

Ref: [p. 4-31 of Oracle® Business Intelligence Applications Installation Guide for Informatica PowerCenter Users](http://download.oracle.com/docs/cd/E14223_01/bia.796/e14217/windows_ic.htm#BABBHCCF) Screenshot is out of date, they've not updated the documentation for 7.9.6. Two category check boxes are missing, "User Data" and "Overwriten log file" ![](/images/rnm1978/t_seed.gif) ![dacimpt01](/images/rnm1978/dacimpt01.png "dacimpt01")

Ref: [To register Informatica Services in DAC / p. 4-33](http://download.oracle.com/docs/cd/E14223_01/bia.796/e14217/windows_ic.htm#BABDHDEA). The screenshot is out of date, it doesn't list the new Domain field: ![](/images/rnm1978/t_inst8.gif) ![dacconf01](/images/rnm1978/dacconf01.png "dacconf01")

### Configuring Informatica Integration service in DAC

The [documentation](http://download.oracle.com/docs/cd/E14223_01/bia.796/e14217/windows_ic.htm#BABDHDEA) is wrong on this, as it does not take into account the DAC change of a new Domain field, and Server Hostname being replaced by Service. It also says to modify the record with Name = Oracle\_BI\_DW\_Server, but by default the record has a name of INFORMATICA\_DW\_SERVER Therefore when configuring this you need to set:

- **Service**: The name of your Informatica Integration Service, eg. Oracle\_BI\_DW\_Base\_Integration\_Service
- **Domain**: The name of your Informatica Domain, eg. Domain\_serverA

The rest of the fields as per the document.

## Known bugs

Watch out for: [8723317 - unique constraint (DAC\_REPO.W\_ETL\_SYSPROP\_U1) violated when imported Metadata into the DAC repository](https://metalink3.oracle.com/od/faces/secure/km/BugDisplay.jspx?id=8723317&bugProductSource=Oracle)

## DAC and Informatica repositories

Your existing Informatica and DAC repositories are **not** upgraded.

The document says to "Rename and copy" your existing repositories. This comes under "Best practices for preparing to upgrade". What it should say is you **must** either use new database schemas when you upgrade, or move your existing ones. We used Oracle's export/import to create copies of the existing repository schemas into new schemas (eg DAC\_REPO to DAC\_REPO\_795), and then dropped and recreated the existing repository schema (eg DAC\_REPO) so that they were empty to install to. The upgrade doc simply doesn't say to do this, or it misleadingly tells you to rename your Informatica repository, which in the context of an Informatica Repository is not possible. If you don't do this then you hit problems after the installation of DAC because you already have an existing repository which you get prompted to upgrade when you launch the client.

\[edit\] Actually - maybe your repositories **are** upgraded. It depends. You could upgrade your DAC repo in place and then Refresh Base from the new DAC repository metadata, or you can do it the other way around. You'd do the former if you had lots of customisations and the latter if you didn't. \[edit2\] If you do the latter then you import a 7.9.5 version of the DAC repo, which throws lots of errors because tables changed in 7.9.6 with quite a lot of non-nullable columns added. Maybe you upgrade your 7.9.5 repository (you're prompted to do so when you log in with the new DAC client), then export it, then import the new one and then refresh base on that? Or maybe if you've few customisations you just install a fresh 7.9.6 DAC repository and apply your few customisations to it manually? It's probably all patently obvious to a DAC/OBIA expert but about as clear as mud to someone just trying to figure it out just from the manuals.\[/edit2\]

It would be really helpful if this kind of thing didn't have to be inferred and best-guessed from the documentation. Even if the doc just laid out the two approaches and left it to the user to chose the best. As it is the documentation states one method, or none at all. \[/edit\]

## In summary ...

If you're doing an upgrade of OBIA then plan PLENTY of time for figuring out how it'll work in your environment. Set up a sandbox you can play in and rollback, don't assume you can follow the documentation sequentially and it all work nicely.

Oracle should be aiming to produce an Upgrade Guide as comprehensive as their Installation Guide. A product, especially an Enterprise one of this scale, is made up of more than its binaries. It is the binaries, the documentation, the support. An upgrade can be traumatic at the best of times - the documentation should give the user confidence to unleash it on their Production environment, not the feeling that one is half-guessing at the solution.

DAC repo your
