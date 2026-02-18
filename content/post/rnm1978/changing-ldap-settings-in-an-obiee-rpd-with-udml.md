---
title: "Changing LDAP settings in an OBIEE RPD with UDML"
date: "2011-02-23"
categories: 
  - "hack"
  - "ldap"
  - "OBIEE"
  - "udml"
---

A chap called Kevin posted a comment on a [previous posting of mine](/2009/09/09/syntax-for-admintool.exe-command-line-script/) asking

> _did you ever come across anything that could be used to change the LDAP server settings from a command line (admintool.exe, UDML, or otherwise)?_

I did a quick play around with some UDML and it appears that you can.

## Set up the initial LDAP server definition in the RPD

First I added a dummy LDAP server to samplesales.rpd: ![](/images/rnm1978/snag-2011-02-23-07-46-02-0000.png "SNAG-2011-02-23-07.46.02-0000")

Then save and close the RPD.

## Export the RPD to UDML format, and isolate the LDAP server UDML definition

Next open up a command prompt and run the following, which will export the UDML for the whole RPD: 
```
c:\\oraclebi\\server\\bin\\NQUDMLGen.exe -U Administrator -P Administrator -R c:\\oraclebi\\server\\repository\\samplesales.rpd -O c:\\scratch\\udml.txt
```
 ![](/images/rnm1978/snag-2011-02-23-07-53-23-0000.png "SNAG-2011-02-23-07.53.23-0000")

Open up the generated UDML in your favourite text editor. In the above example, it will have been written to c:\\scratch\\udml.txt.

Do a search for the name of your LDAP server, and you should hopefully find a line like this: 
```
DECLARE LDAP SERVER "My LDAP server" AS "My LDAP server" UPGRADE ID 80295
```


What you do now is remove all the rest of the RPD UDML, so cut from the beginning of the file up to the DECLARE LDAP SERVER, through to the next DECLARE statement. You should end up with something like this: ![](/images/rnm1978/snag-2011-02-23-07-56-52-0000.png "SNAG-2011-02-23-07.56.52-0000")

## Make the required LDAP server change in the UDML

On a copy of the UDML extracted above, make the required changes to the LDAP server definition. For this example, let's imagine we're moving the RPD to use a pre-production LDAP server. In a copy of the original udml.txt file, now called ldap\_preprod.udml, I've simply amended the HOST NAME field: 
```
HOST NAME 'ldap.preprod.server.com'
```
 Save the changed file (ldap\_preprod.udml in my example).

## Apply the LDAP server change to the RPD

Back at the command line, and this time NQUDMLExec 
```
c:\\OracleBI\\server\\Bin\\nQUDMLExec.exe -U Administrator -P Administrator -I c:\\scratch\\ldap_preprod.udml -B c:\\OracleBI\\server\\Repository\\samplesales.rpd -O c:\\OracleBI\\server\\Repository\\samplesales.preprod.rpd
```


This applies the UDML in the file specified by "-I" (c:\\scratch\\ldap\_preprod.udml) to be applied to "-B" base repository file (c:\\OracleBI\\server\\Repository\\samplesales.rpd) and write the output to "-O", a new repository file (c:\\OracleBI\\server\\Repository\\samplesales.preprod.rpd). ![](/images/rnm1978/snag-2011-02-23-16-26-25-0000.png "SNAG-2011-02-23-16.26.25-0000")

Open up the new RPD in Administration Tool and check the results of your handiwork: ![](/images/rnm1978/snag-2011-02-23-16-50-14-0000.png "SNAG-2011-02-23-16.50.14-0000")

## Further reading

UDML in OBIEE is nothing new, and there are some very good articles to read if you want to understand more about it:

- [Andreas Nobbmann: Scripting OBIEE – Is UDML and XML all you need ?](http://www.rittmanmead.com/files/andreas_nobbmann_udml_xml.pdf)
    - This is Andreas' presentation from the RittmanMead BI Forum 2009 - and Andreas is speaking again this year. More information here: [http://www.rittmanmead.com/biforum2011/](http://www.rittmanmead.com/biforum2011/)
- [Dylan Wan: UDML in Oracle BI Server](http://dylanwan.wordpress.com/2007/10/22/udml-in-oracle-bi-server/)
- [Mark Rittman: Scripting Entries in the Oracle BI Repository](http://www.rittmanmead.com/2007/10/scripting-entries-in-the-oracle-bi-repository/)
- [Venkat: UDML to automate repository Updates – Migration of Repositories from Development to Test/Production Environment](http://oraclebizint.wordpress.com/2008/04/04/oracle-bi-ee-101332-udml-to-automate-repository-updates-migration-of-repositories-from-development-to-testproduction-environment/)
- [Daan Bakboord: UDML – Scripting](http://obibb.wordpress.com/2011/02/21/udml-scripting/)
- [Andreas Nobbmann: Finding everything in your OBIEE repository - parsing your UDML](http://blog.trivadis.com/blogs/andreasnobbmann/archive/2008/12/04/parsing-your-udml.aspx)

## Footnote

All this can be done on Unix too, just make sure you have set your OBIEE environment first with sa-init.sh (or sa-init64.sh) before calling nqudmlgen / nqudmlexec

Whether Windows or Unix, make sure you work on a copy of your RPD, because you might corrupt it otherwise. I'm pretty sure some UDML hacking is unsupported, so use this at your own risk. And did I mention, work on a copy of your files and take backups.

From a note [that I wrote last year](/2010/03/18/obiee-11g-tidbit-xudml-support/) it looks like UDML is on its way out and an XML-based version on its way in for OBIEE 11g.

The code snippets assume that you have OBIEE installed to c:\\OracleBI - amend the path as necessary if you have it elsewhere. You'll always find NQUDMLGen & NQUDMLExec in <wherever you installed OracleBI>/server/Bin (or Bin64).
