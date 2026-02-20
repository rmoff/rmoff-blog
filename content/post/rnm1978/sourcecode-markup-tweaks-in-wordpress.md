---
title: "Sourcecode markup tweaks in Wordpress"
date: "2011-09-26"
categories: 
  - "wordpress"
---

I noticed in [Ed Stevens'](http://edstevensdba.wordpress.com/2011/02/16/sqlnet_client_cfg/) blog posting here that some sourcecode he'd posted had certain lines highlighted.

Wordpress provides the sourcecode tag for marking up sourcecode in blog posts. For example:

> cd /some/random/folder ls -l # do not run this next line!

is much better presented as: 
```bash
cd /some/random/folder ls -l # do not run this next line!
```
 by wrapping it in 
```
tags

I've known about the language='xx' attribute that you can use with the tag, but Ed's posting prompted me to check on the syntax and it turns out there a few tweaks one can use. Some of them are illustrated below. The list is taken from [Wordpress' Posting Source Code](http://en.support.wordpress.com/code/posting-source-code/) reference page.

## [sourcecode] ....
```



```
#REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some
```


## 
```bash
....
```



```bash
#REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some
```


## 
```
....
```



```
#REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some
```


## 
```
....
```



```
#REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some
```


## 
```
....
```



```
#REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some
```


## 
```
....
```



```
#REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some
```


## 
```
....
```



```
#REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some
```


## 
```
....
```



```
#REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some
```


## 
```
....
```



```
#REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some
```

