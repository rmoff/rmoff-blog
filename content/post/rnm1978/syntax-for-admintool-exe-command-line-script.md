---
title: "Syntax for AdminTool.exe command line script"
date: "2009-09-09"
categories: 
  - "admintool"
  - "hack"
---

Bringing together in one place all of the script syntax that I've found so far for using with OBIEE's **AdminTool.exe /command**

Details and examples on usage in the following blogs (where I compiled the commands from):

- [Venkat](http://oraclebizint.wordpress.com/2008/05/02/oracle-bi-ee-101332-automating-password-updates-of-connection-pools-and-users-command-line-options/)
- [Erik Eckhardt](http://translate.google.co.uk/translate?hl=en&sl=cs&u=http://bidwcz.blogspot.com/2008_05_01_archive.html&ei=KkqmSsbuNcfajQen74W6Dg&sa=X&oi=translate&resnum=6&ct=result&prev=/search%3Fq%3D%2522admintool.exe%2B/command%2522%26hl%3Den%26client%3Dfirefox-a%26rls%3Dorg.mozilla:en-GB:official%26hs%3DEKf%26num%3D30) (translated from Czech, [original here](http://bidwcz.blogspot.com/2008/05/bi-administration-tool-v-pkazovm-mdu.html))
- [@lex](http://siebel-essentials.blogspot.com/2008/11/automating-rpd-metadata-export-with.html)
- [Kumar Kambam](http://obieeblog.wordpress.com/2009/08/04/simplifying-migration-process-%E2%80%93-changing-environment-specific-variables-in-rpd/)

* * *

**DON'T TRY THIS AT HOME!**

**I would only recommend this for read-only purposes such as generating the metadata dictionary or consistency check.**

* * *

\* OpenOnline DSN \[user \[password\]\] - Opens the online repository. NB can't edit properties without checking out objects first, and no way to do that from script.

\* Open FileName \[user \[password\]\] - opens the repository offline

\* New FileName - creates new repository offline

\* Save - saves opened repository

\* SaveAs FileName - saves opened repository under new name

\* Close - closes opened repository

\* Exit - closes AdminTool

\* SetProperty "Variable" "" Initializer "" \* SetProperty "Connection Pool" ""."" "User" "" \* SetProperty "Connection Pool" ""."" "Password" "" \* SetProperty "Connection Pool" ""."" "DSN" ""

\* MessageBox \[message\] - displays messagebox with the text, default message is "Siebel Analytics Administration Tool"

\* ImportRepository {Online|Offline} {FileName|DSNname} \[user \[password\]\] - initiates import from the other repository

\* ImportRepositoryObject {Project|"Presentation Catalog"|User|"Security Group"|Variable} {Name|\*} \[True|False \[True|False\]\] - imports object(s) from the other repository

\* ImportRepositoryExecute - executes the repository import defined by previous calls to ImportRepository and ImportRepositoryExecute

\* Compare FileName \[user \[password \[outputFile\]\]\] - compares current repository with another repository

\* Merge FileName1 FileName2 \[DecisionFile\] \[user1 \[password1 \[user2 \[password2\]\]\]\] - merges repositories

\* ConsistencyCheck \[outputFileName\] - global consistency check

\* BusinessModelConsistencyCheck businessModelName \[outputFileName\] - consistency check for one business model

\* CreateSubset NewRepositoryName MasterRepositoryName numberOfProjects project1 \[project2 \[project3 \[...\]\]\] \[user \[password\]\] - creates and opens multi-user subset repository

\* CheckinSubset ModifiedSubsetRepositoryName LockUserFullName \[user \[password\]\] - checks in ModifiedSubsetRepository into master repository

\* DescribeRepository Filename UTF-8 - triggers an export of the rpd metadata to the Filename file in UTF-8 codepage. This is similar to using the Administration Tool utility manually.

\* GenerateMetadataDictionary Destination\_Folder - run the Metadata Dictionary export

\* Hide - hides AdminTool

\* comment line starts with single quote ' character
