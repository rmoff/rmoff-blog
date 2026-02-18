---
draft: false
title: 'Sourcecode markup tweaks in WordPress'
date: "2011-09-26T14:14:25+0100"
categories:
- wordpress
---

I noticed in [Ed Stevens’](http://edstevensdba.wordpress.com/2011/02/16/sqlnet_client_cfg/) blog posting here that some sourcecode he’d posted had certain lines highlighted.

<!--more-->
WordPress provides the sourcecode tag for marking up sourcecode in blog posts.  
For example:

> cd /some/random/folder  
> ls -l  
> # do not run this next line!

is much better presented as:

```

cd /some/random/folder
ls -l
# do not run this next line!
```

by wrapping it in 
```
tags

I’ve known about the language=’xx’ attribute that you can use with the tag, but Ed’s posting prompted me to check on the syntax and it turns out there a few tweaks one can use. Some of them are illustrated below. The list is taken from [WordPress’ Posting Source Code](http://en.support.wordpress.com/code/posting-source-code/) reference page.

## [sourcecode] ….
```

```

#REF: http://en.support.wordpress.com/code/posting-source-code/
#
# This is some dummy source code to illustrate sourcecode posting on wordpress
# Line 2
# Line 3
cd /some/random/folder
ls -l
# do not run this next line!
rm -rf /some
```

## 
```bash
….
```

```

#REF: http://en.support.wordpress.com/code/posting-source-code/
#
# This is some dummy source code to illustrate sourcecode posting on wordpress
# Line 2
# Line 3
cd /some/random/folder
ls -l
# do not run this next line!
rm -rf /some
```

## [sourcecode gutter=false] …. [/sourcecode]

```

#REF: http://en.support.wordpress.com/code/posting-source-code/
#
# This is some dummy source code to illustrate sourcecode posting on wordpress
# Line 2
# Line 3
cd /some/random/folder
ls -l
# do not run this next line!
rm -rf /some
```

## [sourcecode collapse=true] …. [/sourcecode]

```

#REF: http://en.support.wordpress.com/code/posting-source-code/
#
# This is some dummy source code to illustrate sourcecode posting on wordpress
# Line 2
# Line 3
cd /some/random/folder
ls -l
# do not run this next line!
rm -rf /some
```

## [sourcecode highlight=3,5,6,8] …. [/sourcecode]

```

#REF: http://en.support.wordpress.com/code/posting-source-code/
#
# This is some dummy source code to illustrate sourcecode posting on wordpress
# Line 2
# Line 3
cd /some/random/folder
ls -l
# do not run this next line!
rm -rf /some
```

## [sourcecode firstline=42] …. [/sourcecode]

```

#REF: http://en.support.wordpress.com/code/posting-source-code/
#
# This is some dummy source code to illustrate sourcecode posting on wordpress
# Line 2
# Line 3
cd /some/random/folder
ls -l
# do not run this next line!
rm -rf /some
```

## [sourcecode padlinenumbers=3] …. [/sourcecode]

```

#REF: http://en.support.wordpress.com/code/posting-source-code/
#
# This is some dummy source code to illustrate sourcecode posting on wordpress
# Line 2
# Line 3
cd /some/random/folder
ls -l
# do not run this next line!
rm -rf /some
```

## [sourcecode toolbar=false] …. [/sourcecode]

```

#REF: http://en.support.wordpress.com/code/posting-source-code/
#
# This is some dummy source code to illustrate sourcecode posting on wordpress
# Line 2
# Line 3
cd /some/random/folder
ls -l
# do not run this next line!
rm -rf /some
```

## [sourcecode light=true language=’bash’] …. [/sourcecode]

```

#REF: http://en.support.wordpress.com/code/posting-source-code/
#
# This is some dummy source code to illustrate sourcecode posting on wordpress
# Line 2
# Line 3
cd /some/random/folder
ls -l
# do not run this next line!
rm -rf /some
```
