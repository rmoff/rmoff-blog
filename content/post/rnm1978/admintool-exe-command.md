---
draft: false
title: 'AdminTool.exe /command'
date: "2009-09-08T12:46:47+0000"
categories:
- admintool
- hack
- obiee
- windows
---

There’s an undocumented feature in AdminTool.exe that you can use the /command switch with a text file containing scripted commands to make changes to an RPD file (or create a new one).

<!--more-->
It’s undocumented and **UNSUPPORTED** so be careful using it.

Some good details in these blog posts, especially Erik’s which has a good list of syntax.

- [Venkat](http://oraclebizint.wordpress.com/2008/05/02/oracle-bi-ee-101332-automating-password-updates-of-connection-pools-and-users-command-line-options/)
- [Erik Eckhardt](http://translate.google.co.uk/translate?hl=en&sl=cs&u=http://bidwcz.blogspot.com/2008_05_01_archive.html&ei=KkqmSsbuNcfajQen74W6Dg&sa=X&oi=translate&resnum=6&ct=result&prev=/search%3Fq%3D%2522admintool.exe%2B/command%2522%26hl%3Den%26client%3Dfirefox-a%26rls%3Dorg.mozilla:en-GB:official%26hs%3DEKf%26num%3D30) (translated from Czech, [original here](http://bidwcz.blogspot.com/2008/05/bi-administration-tool-v-pkazovm-mdu.html))- [@lex](http://siebel-essentials.blogspot.com/2008/11/automating-rpd-metadata-export-with.html)
  - [Kumar Kambam](http://obieeblog.wordpress.com/2009/08/04/simplifying-migration-process-%E2%80%93-changing-environment-specific-variables-in-rpd/)

I’m intrigued to know how the original posters figured out the commands available, if it’s undocumented… 🙂

[update]  
Just discovered that CAF uses this functionality in order to Consistency Check the altered RPD that it can create:  
CAF uses commandline script:  
C:\OracleBI\server\bin\AdminTool /command C:\CAF\_Training\Target\Consistency.config

```

Open C:\CAF_Training\Target\paint.rpd Administrator Administrator
Hide
ConsistencyCheck C:\CAF_Training\Target\ConsistencyCheck.log
Exit
```

[/update]
