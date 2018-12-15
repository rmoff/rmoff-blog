+++
author = "Robin Moffatt"
categories = ["proxmox", "ext4", "e2label", "lsblk", "hdiutil", "bootable usb", "memtest"]
date = 2016-06-07T21:03:22Z
description = ""
draft = false
image = "/images/2016/06/IMG_7889-1.jpg"
slug = "commissioning-my-proxmox-server"
tags = ["proxmox", "ext4", "e2label", "lsblk", "hdiutil", "bootable usb", "memtest"]
title = "Commissioning my Proxmox Server - OS and filesystems"

+++

([Previously](http://rmoff.net/2016/06/07/a-new-arrival/))

With my server in place, I ran a memtest on it ... which with 128G took a while ;)

![memtest](/content/images/2016/06/IMG_7889.jpg)

And then installed [Proxmox 4](https://www.proxmox.com/en/), using a bootable USB that I'd created on my Mac from the ISO downloaded from Proxmox's website. To create the bootable USB, create the `img` file:

```bash
hdiutil convert -format UDRW -o target.img source.iso
```

and then burn it to USB: 

```bash
sudo dd if=target.img of=/dev/rdiskN bs=1m
```

Replace **`N`** with the correct device based on `diskutil list` output. Don't get it wrong, else you'll properly knacker your machine :D

After booting the machine from the USB the Proxmox installation is a simple click-click-next-next job, after which it reboots and you're good to go. Proxmox is a Debian-based Linux distribution, so you SSH to it as you would any other box, and it also has a GUI at `https://<IP>:8006` (note HTTPS not HTTP). 

---

Once the OS was in place, I then set up the filesystems. There's a SDD I'm using for the main OS and binaries, along with four 3TB spinning disks. _I've opted to keep them un-raided, since one of the things I'm interested in is performance of things like HDFS and Kafka where from my limited understanding the raw spindles are as important as the logical devices that'd be presented on top of RAID. Maybe I'll be wrong and have to rebuild the machine in a few months' time ;)_

I formatted each 3TB disk as ext4: 

```bash
mkfs.ext4 /dev/sdb
mkfs.ext4 /dev/sdc
mkfs.ext4 /dev/sdd
mkfs.ext4 /dev/sde
```

_I did wonder about looking at other filesystems such as XFS, but figured that the standard mainstream option was probably absolutely fine for my needs. Quite possibly others are "better", but as long as there's nothing "wrong" with this one, it'll do just fine. I've a long list of topics to investigate once the server's up and running already, without adding FS comparisons to it._

Added a label to each one (to make mounting easier, and identifying them if I physically swap them in/out):

```bash
e2label /dev/sdb data01
e2label /dev/sdc data02
e2label /dev/sdd data03
e2label /dev/sde data04
```

Strangely, only one of the labels showed up:

```bash
root@proxmox01:/# ls -l /dev/disk/by-label/
total 0
lrwxrwxrwx 1 root root  9 Jun  1 09:34 data03 -> ../../sdd
```

Looking at the block devices, it seemed `sdd` was different from the other three:

```bash
root@proxmox01:/# lsblk
NAME               MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
sda                  8:0    0 447.1G  0 disk
├─sda1               8:1    0  1007K  0 part
├─sda2               8:2    0   127M  0 part
└─sda3               8:3    0   447G  0 part
  ├─pve-root       251:0    0    96G  0 lvm  /
  ├─pve-swap       251:1    0     8G  0 lvm  [SWAP]
  ├─pve-data_tmeta 251:2    0    84M  0 lvm
  │ └─pve-data     251:4    0   327G  0 lvm
  └─pve-data_tdata 251:3    0   327G  0 lvm
    └─pve-data     251:4    0   327G  0 lvm
sdb                  8:16   0   2.7T  0 disk
└─sdb1               8:17   0   128M  0 part
sdc                  8:32   0   2.7T  0 disk
└─sdc1               8:33   0   128M  0 part
sdd                  8:48   0   2.7T  0 disk
sde                  8:64   0   2.7T  0 disk
└─sde1               8:65   0   128M  0 part
```

So a reboot (maybe there's a better way?) fixed this:

```bash
root@proxmox01:~# lsblk
NAME               MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
sda                  8:0    0 111.8G  0 disk
├─sda1               8:1    0   200M  0 part
└─sda2               8:2    0 111.5G  0 part
sdb                  8:16   0 447.1G  0 disk
├─sdb1               8:17   0  1007K  0 part
├─sdb2               8:18   0   127M  0 part
└─sdb3               8:19   0   447G  0 part
  ├─pve-root       251:0    0    96G  0 lvm  /
  ├─pve-swap       251:1    0     8G  0 lvm  [SWAP]
  ├─pve-data_tmeta 251:2    0    84M  0 lvm
  │ └─pve-data     251:4    0   327G  0 lvm
  └─pve-data_tdata 251:3    0   327G  0 lvm
    └─pve-data     251:4    0   327G  0 lvm
sdc                  8:32   0   2.7T  0 disk /data01
sdd                  8:48   0   2.7T  0 disk /data02
sde                  8:64   0   2.7T  0 disk /data03
sdf                  8:80   0   2.7T  0 disk /data04

root@proxmox01:~# ls -l /dev/disk/by-label/
total 0
lrwxrwxrwx 1 root root  9 Jun  1 09:49 data01 -> ../../sdc
lrwxrwxrwx 1 root root  9 Jun  1 09:49 data02 -> ../../sdd
lrwxrwxrwx 1 root root  9 Jun  1 09:49 data03 -> ../../sde
lrwxrwxrwx 1 root root  9 Jun  1 09:49 data04 -> ../../sdf
```

Created host folders

```bash
mkdir /data01 /data02 /data03 /data04
```
Added entry to `/etc/fstab`

```
LABEL=data01 /data01 ext4 defaults 0 2
LABEL=data02 /data02 ext4 defaults 0 2
LABEL=data03 /data03 ext4 defaults 0 2
LABEL=data04 /data04 ext4 defaults 0 2
```

Another reboot to test the auto-mounting, and it's all good:

```bash
root@proxmox01:~# df -h
Filesystem      Size  Used Avail Use% Mounted on
udev             10M     0   10M   0% /dev
tmpfs            26G  9.6M   26G   1% /run
/dev/dm-0        95G  1.7G   88G   2% /
tmpfs            63G   28M   63G   1% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs            63G     0   63G   0% /sys/fs/cgroup
/dev/sdd        2.7T   73M  2.6T   1% /data02
/dev/sde        2.7T   73M  2.6T   1% /data03
/dev/sdc        2.7T   73M  2.6T   1% /data01
/dev/sdf        2.7T   73M  2.6T   1% /data04
tmpfs           100K     0  100K   0% /run/lxcfs/controllers
cgmfs           100K     0  100K   0% /run/cgmanager/fs
/dev/fuse        30M   16K   30M   1% /etc/pve
```

---

With the disks set up, I installed some important packages:

```
apt-get update
apt-get install screen collectl atop pve-headers-4.4.6-1-pve
```

Set up my `.screenrc`:

```
cat > ~/.screenrc <<EOF
hardstatus alwayslastline "%{= RY}%H %{kG}%{G} Screen(s): %{c}%w %=%{kG}%c  %D, %M %d %Y  LD:%l"
startup_message off
msgwait 1
defscrollback 100000
nethack on
EOF
```

Installed sysdig

```
curl -s https://s3.amazonaws.com/download.draios.com/stable/install-sysdig | sudo bash
# Make sure you've installed the pve-headers first, and then run this to build the necessary sysdig bit:
sysdig-probe-loader
```