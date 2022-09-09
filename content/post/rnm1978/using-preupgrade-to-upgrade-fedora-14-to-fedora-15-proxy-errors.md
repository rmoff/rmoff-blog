---
title: "Using preupgrade to upgrade Fedora 14 to Fedora 15 - proxy errors"
date: "2011-09-12"
categories: 
  - "fedora"
  - "linux"
---

When using preupgrade to upgrade an existing Fedora 14 installation to Fedora 15, the following two errors were encountered:

- Failed to fetch release info
- No groups available in any repository

The box sits on a network behind a proxy out to the web.

The resolution was to make sure that environment variables **http\_proxy** and **https\_proxy** are set: \[sourcecode language="bash"\] export http\_proxy=http://user:password@proxyserver:port export https\_proxy=http://user:password@proxyserver:port \[/sourcecode\] Make sure you do this from the user from which you run preupgrade.

## Update

The upgrade is kapput. On reboot I get: **The root for the previously installed system was not found**

Lots of hits on the bug database but none resolving. So still stuck on F14 until I get chance to resolve this, probably just a clean install.

## Update 2

I've successfully upgraded two other F14 installations to F15 using preupgrade, so the problems above must be unique to the installation in question.
