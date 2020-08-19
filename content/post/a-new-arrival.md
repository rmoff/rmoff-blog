+++
categories = ["proxmox", "home server", "lxc", "docker", "vmware esxi"]
date = 2016-06-07T20:43:20Z
description = ""
draft = false
image = "/images/2016/06/photo-1463412855783-af97e375664b-1.jpeg"
slug = "a-new-arrival"
tag = ["proxmox", "home server", "lxc", "docker", "vmware esxi"]
title = "A New Arrival"

+++

After a long and painful delivery, I'm delighted to announce the arrival of a new addition to my household ... : 

![](/images/2016/06/IMG_3813.jpg)

This [custom-build from Scan 3XS](https://www.scan.co.uk/3xs/shared/98f6ed5b-7fc4-492c-b66c-3c0e4117dd9c) is sat in my study quietly humming away. I'm going to use it for hosting VMs for R&D on OBIEE, Big Data Lite, Elastic, InfluxDB, Kafka, etc. 
I'll blog various installations that I've done on it as a reference for myself, and anyone else interested. Which I guess means, myself ;)

I'm running [Proxmox 4](https://www.proxmox.com/en/) on it, which is a bare-metal hypervisor. The other option I looked at was VMWare ESXi but I went for Proxmox because: 

- As well as 'fat' VMs, it supports Linux Containers (LXC), which means I get a lot more bang for my buck in terms of capacity, as well as componentisation of different tools that I run on it
- I've run Proxmox 3 on an old laptop for several years previously and found it to be a perfect fit
- VMWare didn't look like it supported containers, and looked like a potentially confusing/complex stack for a single node in a home environment, and heavy on the GUI tools
- Whilst VMWare ESXi offers easier import/export of VMs (eg to VMWare Fusion on a laptop, or of OVAs such as Oracle's SampleApp) it is relatively easy still to do on Proxmox

Earlier versions of Proxmox used OpenVZ containers and a custom kernel that I sometimes hit issues with not being compatible (e.g. with [sysdig](https://github.com/draios/sysdig/issues/415)). Proxmox 4 uses the mainstream Linux Containers (LXC), and also supports Docker which is something I've yet to get to grips with but I think could be useful. 

![](/images/2016/06/proxmox01.png)
