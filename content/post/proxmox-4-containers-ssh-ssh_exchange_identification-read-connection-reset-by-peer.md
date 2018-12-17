+++
author = "Robin Moffatt"
categories = ["proxmox", "cidr", "networking", "lxc"]
date = 2016-07-05T15:20:37Z
description = ""
draft = false
image = "/images/2016/07/proxmox01_-_Proxmox_Virtual_Environment-1.png"
slug = "proxmox-4-containers-ssh-ssh_exchange_identification-read-connection-reset-by-peer"
tags = ["proxmox", "cidr", "networking", "lxc"]
title = "Proxmox 4 Containers - ssh - ssh_exchange_identification: read: Connection reset by peer"

+++

**TL;DR** When defining networking on Proxmox 4 LXC containers, use an appropriate CIDR suffix (e.g. 24) - don't use 32!

---
On my [Proxmox 4 server](http://rmoff.net/2016/06/07/commissioning-my-proxmox-server/) I'm running a whole load of lovely LXC containers. Unfortunately, I had trouble connecting to them. From a client machine, I got the error

    ssh_exchange_identification: read: Connection reset by peer

On the server I was connecting to (which I could get a console for through the Proxmox GUI, or a session on using `pct enter` from the Proxmox host) I ran a SSHD process with debug to see what was happening: 

    $(which sshd) -D -ddd -P 2000

Which showed a bunch of various errors including one or more of the following:

    fatal: Write failed: Connection reset by peer [preauth]
    getpeername failed: Transport endpoint is not connected
    get_remote_port failed

It wasn't just SSH that was affected - any inbound network requests to the server failed, with connection reset type messages. 

---
After a bunch of fruitless Googling and dead-ends, I hit upon the problem. One thing that I had found was that if I changed the network configuration for the container from a static IP to DHCP, it worked fine and I could ssh to it. Looking closer at the network configuration, I saw the problem: 

![](/content/images/2016/07/proxmox01_-_Proxmox_Virtual_Environment.png)

By setting the [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) suffix to **32** it was only routing traffic from that particular IP. Changing it to **24** (or indeed, DHCP) fixed the problem and traffic began flowing freely. 

_Note - [IANANE](https://en.wikipedia.org/wiki/IANAL) (I Am Not A Network Engineer) so the above may be an inaccurate description of the cause/resolution -- but it did well enough for me on my home rig to work!_
