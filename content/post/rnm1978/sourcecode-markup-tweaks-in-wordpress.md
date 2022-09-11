---
title: "Sourcecode markup tweaks in Wordpress"
date: "2011-09-26"
categories: 
  - "wordpress"
---

I noticed in [Ed Stevens'](http://edstevensdba.wordpress.com/2011/02/16/sqlnet_client_cfg/) blog posting here that some sourcecode he'd posted had certain lines highlighted.

Wordpress provides the sourcecode tag for marking up sourcecode in blog posts. For example:

> cd /some/random/folder ls -l # do not run this next line!

is much better presented as: \[sourcecode language="bash"\] cd /some/random/folder ls -l # do not run this next line! \[/sourcecode\] by wrapping it in \[sourcecode\] tags

I've known about the language='xx' attribute that you can use with the tag, but Ed's posting prompted me to check on the syntax and it turns out there a few tweaks one can use. Some of them are illustrated below. The list is taken from [Wordpress' Posting Source Code](http://en.support.wordpress.com/code/posting-source-code/) reference page.

## \[sourcecode\] .... \[/sourcecode\]

\[sourcecode\] #REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some \[/sourcecode\]

## \[sourcecode language=bash\] .... \[/sourcecode\]

\[sourcecode language="bash"\] #REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some \[/sourcecode\]

## \[sourcecode gutter=false\] .... \[/sourcecode\]

\[sourcecode gutter="false"\] #REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some \[/sourcecode\]

## \[sourcecode collapse=true\] .... \[/sourcecode\]

\[sourcecode collapse="true"\] #REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some \[/sourcecode\]

## \[sourcecode highlight=3,5,6,8\] .... \[/sourcecode\]

\[sourcecode highlight="3,5,6,8"\] #REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some \[/sourcecode\]

## \[sourcecode firstline=42\] .... \[/sourcecode\]

\[sourcecode firstline="42"\] #REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some \[/sourcecode\]

## \[sourcecode padlinenumbers=3\] .... \[/sourcecode\]

\[sourcecode padlinenumbers="3"\] #REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some \[/sourcecode\]

## \[sourcecode toolbar=false\] .... \[/sourcecode\]

\[sourcecode toolbar="false"\] #REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some \[/sourcecode\]

## \[sourcecode light=true language='bash'\] .... \[/sourcecode\]

\[sourcecode light="true" language="bash"\] #REF: http://en.support.wordpress.com/code/posting-source-code/ # # This is some dummy source code to illustrate sourcecode posting on wordpress # Line 2 # Line 3 cd /some/random/folder ls -l # do not run this next line! rm -rf /some \[/sourcecode\]
