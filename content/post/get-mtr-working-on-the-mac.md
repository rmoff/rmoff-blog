+++
author = "Robin Moffatt"
categories = ["mtr", "mac", "brew"]
date = 2018-12-08T12:45:40Z
description = ""
draft = false
image = "/images/2018/12/DSCF2037.jpg"
slug = "get-mtr-working-on-the-mac"
tags = ["mtr", "mac", "brew"]
title = "Get mtr working on the Mac"

+++

## Install

Not sure why the `brew` doesn't work as it used to, but here's how to get it working: 

    brew install mtr
    sudo ln /usr/local/Cellar/mtr/0.92/sbin/mtr /usr/local/bin/mtr
    sudo ln /usr/local/Cellar/mtr/0.92/sbin/mtr-packet /usr/local/bin/mtr-packet

_(If you don't do the two symbolic links (`ln`) you'll get `mtr: command not found` or `mtr: Failure to start mtr-packet: Invalid argument`)_

## Run

    sudo mtr google.com