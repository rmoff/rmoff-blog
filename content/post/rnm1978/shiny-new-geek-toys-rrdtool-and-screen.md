---
title: "Shiny new geek toys -- rrdtool and screen"
date: "2011-03-01"
categories: 
  - "jmx"
  - "unix"
  - "visualisation"
---

I've added two new toys to my geek arsenal today. First is one with which I've dabbled before, but struggled to master. The second is a revelation to me and which I discovered courtesy of twitter.

## rrdtool

[rrdtool](http://oss.oetiker.ch/rrdtool) is a data collection and graphing tool which I've been aware of for a while. I wanted to use it when I wrote about [Collecting OBIEE systems management data](/2010/12/06/collecting-obiee-systems-management-data-with-jmx/) with JMX, but couldn't get it to work. I'll not lie to you - it is a bitch to work with at first. Or put a more polite way, it has a steep learning curve. But when you reach the top of the curve and realise its potential...wow. You'll soon understand why it is so widely used. I plan to write this up soon, but it let me draw nice graphs like this: ![](/images/rnm1978/graph.png "OBIEE - OBIA")

## screen

The second discovery is a tool called [screen](http://www.gnu.org/software/screen/). Innocuously named (and a bugger to search for on google), I'd never heard of it until today when [Frits Hoogland](http://twitter.com/#!/fritshoogland) mentioned it and the subsequent stream of approving tweets from various geeks whose opinions I respect made me go and read up about it. ![](/images/rnm1978/snag-2011-03-01-17-42-10-0000.png "SNAG-2011-03-01-17.42.10-0000") It is "a full-screen window manager that multiplexes a physical terminal between several processes, typically interactive shells". Why's it good? Two things:

1. In one ssh session, you can have multiple 'windows'. So you can be running one long process whilst working on another. Or developing some code and compiling it in the other. Or anything else clever you can think of.
2. As important, you can reattach to sessions you've lost connectivity to. Running a long sqlplus job that you've had to wrap in a nohup'd shell wrapper? Disconnecting your laptop to take home and log on via VPN? Dialled in on a dodgy line that drops connection? All of these are no problem - you can reattach to your live session any time you want.

There's a good introduction to screen in this article [here](http://www.linuxjournal.com/article/6340?page=0,0).
