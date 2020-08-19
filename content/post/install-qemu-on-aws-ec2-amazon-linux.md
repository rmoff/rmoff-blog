+++
categories = ["qemu", "aws", "ec2", "centos", "rhel"]
date = 2017-03-11T15:04:00Z
description = ""
draft = false
slug = "install-qemu-on-aws-ec2-amazon-linux"
tag = ["qemu", "aws", "ec2", "centos", "rhel"]
title = "Install qemu on AWS EC2 Amazon Linux"

+++

Mucking about with virtual disks, I wanted to install `qemu` on a AWS EC2 instance in order to use `qemu-img`.

Not finding it in a `yum` repo, I built it from scratch: 

    $ uname -a

    Linux ip-10-0-1-238 4.4.41-36.55.amzn1.x86_64 #1 SMP Wed Jan 18 01:03:26 UTC 2017 x86_64 x86_64 x86_64 GNU/Linux

Steps: 

    sudo yum install -y ghc-glib-devel ghc-glib autoconf autogen intltool libtool

    wget http://download.qemu-project.org/qemu-2.8.0.tar.xz
    tar xvJf qemu-2.8.0.tar.xz
    cd qemu-2.8.0
    ./configure
    make
    sudo make install

---

I hit a few errors, recorded here for passing Googlers: 

First error: 

    $ ./configure

    ERROR: glib-2.22 gthread-2.0 is required to compile QEMU

To fix it, first enable EPEL repository - in `/etc/yum.repos.d/epel.repo` set `enabled=1` for `[epel]`

Then install the Haskell glib library:

    sudo yum install -y ghc-glib-devel ghc-glib

Three more missing dependencies during the build, errors were: 

* `/bin/sh: autoreconf: command not found`
* `Can't exec "aclocal": No such file or directory at /usr/share/autoconf/Autom4te/FileUtils.pm line 326.`
* `configure.ac:75: error: possibly undefined macro: AC_PROG_LIBTOOL`

Fixed with : 

    $ sudo yum install -y autoconf autogen intltool libtool

---
