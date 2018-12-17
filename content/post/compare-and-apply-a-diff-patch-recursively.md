+++
author = "Robin Moffatt"
categories = ["diff", "patch"]
date = 2018-06-07T14:35:36Z
description = ""
draft = false
image = "/images/2018/06/IMG_8940.jpg"
slug = "compare-and-apply-a-diff-patch-recursively"
tag = ["diff", "patch"]
title = "Compare and apply a diff / patch recursively"

+++

Hacky way to keep config files in sync when there's a new version of some software. 

**Caveat : probably completely wrong, may not pick up config entries added in the new version, etc. But, _works for me right here right now_ ;-)**

So let's say we have two folders: 

    confluent-4.1.0
    confluent-4.1.1

Same structures, different versions. 4.1.0 was set up with our local config in `./etc`, that we want to preserve. We can use `diff` to easily see what's changed: 

    diff -r confluent-4.1.0/etc confluent-4.1.0/etc

But this only tells us what changed. Nicer is to automagically apply it. 

Let's run this from the folder in which we're going to apply the changes: 

    cd confluent-4.1.1/etc

Run the `diff`, and write the results to a file: 

    diff -ur . ../../confluent-4.1.0/etc > 4.1.1.patch 

Now apply it: 

    patch -p0 < 4.1.1.patch
    
Of course, you took a backup first before you did that, just in case something broke… right? 
