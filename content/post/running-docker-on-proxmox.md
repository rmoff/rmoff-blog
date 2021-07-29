+++
categories = ["docker", "proxmox", "bittorrent sync", "dropbox"]
date = 2016-06-07T21:43:26Z
description = ""
draft = false
image = "/images/2016/06/limes_lemons.jpeg"
slug = "running-docker-on-proxmox"
tag = ["docker", "proxmox", "bittorrent sync", "dropbox"]
title = "Running a Docker Container on Proxmox for BitTorrent Sync"

+++

([Previously](/2016/06/07/a-new-arrival/), [previously](/2016/06/07/commissioning-my-proxmox-server-os-and-filesystems/), [previously](/2016/06/07/importing-vmware-and-virtualbox-vms-to-proxmox/))

Since Proxmox 4 has a recent Linux kernel and mainline one at that, it means that Docker can be run on it. I've yet to really dig into Docker and work out when it makes sense in place of Linux Containers (LXC), so this is going to be a learning experience for me. 

To install Docker, add Backports repo to apt: 
```bash
root@proxmox01:~# cat /etc/apt/sources.list.d/backports.list
deb http://ftp.debian.org/debian jessie-backports main
```

And then install: 

```bash
apt-get update && apt-get install docker.io
```

Once installed, run a test to validate it's all working: 

```bash
root@proxmox01:~# docker run --rm hello-world

Hello from Docker.
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker Hub account:
 https://hub.docker.com

For more examples and ideas, visit:
 https://docs.docker.com/engine/userguide/
```

---

[Resilio Sync](https://getsync.com) (previously known as BitTorrent Sync) is a Peer-To-Peer (P2P) tool that is a great way for sharing and synchronising folders across machines, both local and remote. Think Dropbox, but without the central "Cloud" bit. I like using it for sharing VM images particularly, for two reasons: 

1. It trickles data down as and when and as fast or slow as the internet connection permits. If your wifi drops, it's no biggie. If someone's transferring data from you, you can reboot your machine without causing everything to fail. Sync just keeps plodding away at transferring the data. Whether transferring between two LAN machines, or LAN to another person's machine, or even up to Amazon S3 (via an EC2 machine running Sync), it's a great tool.
2. Because it's P2P, the more people who are sharing a file, the faster you can receive it. If two people have the file you want, and one goes offline, you can still continue to receive it from the other. If both are online an your bandwidth supports it, you can get it twice as fast. 

You can use it for one-off transfers of single huge files, or just folders of documents that you want to keep in sync.
 
BitTorrent|Resilio Sync is nothing to do with the somewhat-infamous BitTorrent, other than similar technology -- which is presumably why they replaced the 'BitTorrent' part of the name.

I've run BitTorrent Sync in the past in an OpenVZ container, but thought this would be a good chance to see if Docker was going to be useful for me. I found a [Docker image existing for Sync already](https://hub.docker.com/r/bittorrent/sync/), so ran it: 

```bash
rmoff@proxmox01:~$ DATA_FOLDER=/data04/sync
rmoff@proxmox01:~$ mkdir $DATA_FOLDER
rmoff@proxmox01:~$ WEBUI_PORT=8888
rmoff@proxmox01:~$ sudo docker run -d --name Sync   -p $WEBUI_PORT:8888 -p 55555   -v $DATA_FOLDER:/mnt/sync -v /data04:/mnt/mounted_folders/data04  --restart on-failure   bittorrent/sync
```

It was as simple that that. I pointed my web browser at port 8888 on my Proxmox server (the Docker host), and it worked perfectly.

![](/images/2016/06/Sync___c7415250d7a3.png)

To see what Docker containers are running use `ps`: 

```bash
root@proxmox01:~# docker ps
CONTAINER ID        IMAGE                    COMMAND                CREATED             STATUS              PORTS                                              NAMES
b9081e03570b        bittorrent/sync:latest   "/opt/run_sync --log   11 hours ago        Up 11 hours         0.0.0.0:8888->8888/tcp, 0.0.0.0:32770->55555/tcp   Sync
```

and to terminate one use `docker rm` (with `-f` if you want to just crash it and get rid)

So why's that better as a Docker container than a VM? Or a Linux Container (LXC)? Well the VM one is easy - way fewer resources needed on the host machine to run it. Better than a LXC? Not sure yet. On the plus side, it's even more minimalistic than LXC. On the downside... it's more minimalistic than LXC. This may be my inexperience with Docker, but I like the fact that an LXC I can still SSH into and it's (up to a certain point) still a "real" server. Another upside to LXC is that Proxmox's web GUI can be used to manage them. I've yet to dig into whether there are good Web GUIs for Docker.
