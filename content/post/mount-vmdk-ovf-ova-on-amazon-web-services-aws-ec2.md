+++
author = "Robin Moffatt"
categories = ["vmdk", "vgscan", "lvm", "mount", "raw", "img", "aws", "losetup"]
date = 2017-03-11T14:21:00Z
description = ""
draft = false
slug = "mount-vmdk-ovf-ova-on-amazon-web-services-aws-ec2"
tag = ["vmdk", "vgscan", "lvm", "mount", "raw", "img", "aws", "losetup"]
title = "Mount VMDK/OVF/OVA on Amazon Web Services (AWS) EC2"

+++

So you've got a Linux VM that you want to access the contents of in EC2 - how do you do it? Let's see how. First up, convert the VMDK to raw image file. If you've got a `ova`/`ovf` then just untar it first (`tar -xvf my_vm.ova`), from which you should get the VMDK. With that, convert it using `qemu-img`:

```
$ time qemu-img convert -f vmdk -O raw SampleAppv607p-appliance-disk1.vmdk SampleAppv607p-appliance-disk1.raw

real    16m36.740s
user    6m44.136s
sys     0m11.000s
```

Inspect the image file: 
```
$ file /u01/stage/vm/extract/SampleAppv607p-appliance-disk1.raw
/u01/stage/vm/extract/SampleAppv607p-appliance-disk1.raw: DOS/MBR boot sector; GRand Unified Bootloader, stage1 version 0x3, boot drive 0x80, 1st sector stage2 0x8480e, GRUB version 0.94

$ sudo fdisk -l /u01/stage/vm/extract/SampleAppv607p-appliance-disk1.raw

Disk /u01/stage/vm/extract/SampleAppv607p-appliance-disk1.raw: 214.7 GB, 214748364800 bytes, 419430400 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk label type: dos
Disk identifier: 0x000274a9

                                                   Device Boot      Start         End      Blocks   Id  System
/u01/stage/vm/extract/SampleAppv607p-appliance-disk1.raw1   *        2048     1026047      512000   83  Linux
/u01/stage/vm/extract/SampleAppv607p-appliance-disk1.raw2         1026048   419430399   209202176   8e  Linux LVM
```

Mounting it straight out won't work: 
```
$ sudo mount /u01/stage/vm/extract/SampleAppv607p-appliance-disk1.raw /mnt/sampleapp/
mount: wrong fs type, bad option, bad superblock on /dev/loop1,
       missing codepage or helper program, or other error

       In some cases useful info is found in syslog - try
       dmesg | tail or so.
```

Using the offset (**2048**) from `fdisk` output above, mount the first partition: 

```
$ sudo mkdir /mnt/sampleapp
$ sudo mount -o offset=$((2048 * 512)) /u01/stage/vm/extract/SampleAppv607p-appliance-disk1.raw /mnt/sampleapp/
```

Success!
```
$ ls -l sampleapp/
total 134841
-rw-r--r--. 1 root root   106308 Oct 14  2014 config-2.6.32-504.el6.x86_64
-rw-r--r--. 1 root root   107139 Mar 22  2016 config-2.6.32-573.22.1.el6.x86_64
-rw-r--r--. 1 root root   131020 Mar 23  2016 config-3.8.13-118.4.2.el6uek.x86_64
[...]
```

Now to mount the rest of the disk. Not so simple, as it uses Logical Volume Management (LVM): 

```
$ sudo mount -o offset=$((1026048 * 512)) /u01/stage/vm/extract/SampleAppv607p-appliance-disk1.raw /mnt/sampleapp/
mount: unknown filesystem type 'LVM2_member'
```

Courtesy of [this article](http://www.hutsky.cz/blog/2014/06/mount-a-disk-image-containing-lvm/), we use `losetup` to make the volumes available via the loop device, run as root. We can skip the use of `kpartx` by using the `-P` flag on `losetup`: 

```
# losetup -P /dev/loop0 /u01/stage/vm/extract/SampleAppv607p-appliance-disk1.raw
```

And then activate the volume groups: 

```
# vgscan
  Reading all physical volumes.  This may take a while...
  Found volume group "vg_demo" using metadata type lvm2

# vgchange -ay vg_demo
  3 logical volume(s) in volume group "vg_demo" now active
```

Finally, mount each volume group: 

```
# ls -l /dev/mapper/
total 0
crw------- 1 root root 10, 236 Feb 14 10:21 control
lrwxrwxrwx 1 root root       7 Feb 14 14:21 loop0p1 -> ../dm-0
lrwxrwxrwx 1 root root       7 Feb 14 14:21 loop0p2 -> ../dm-1
lrwxrwxrwx 1 root root       7 Feb 14 14:21 vg_demo-lv_home -> ../dm-4
lrwxrwxrwx 1 root root       7 Feb 14 14:21 vg_demo-lv_root -> ../dm-2
lrwxrwxrwx 1 root root       7 Feb 14 14:21 vg_demo-lv_swap -> ../dm-3

# mkdir sampleapp/home sampleapp/root
# mount /dev/mapper/vg_demo-lv_root /mnt/sampleapp/root/
# mount /dev/mapper/vg_demo-lv_home /mnt/sampleapp/home/
```

---

To unmount the image: 

```
# umount /mnt/sampleapp/home/
# umount /mnt/sampleapp/root/
# umount /mnt/sampleapp/
# losetup -d /dev/loop0
```

---

Convert back to VMDK: 

```
[ec2-user@ip-10-0-1-238 extract]$ time qemu-img convert -f raw -O vmdk SampleAppv607p-appliance-disk1.raw SampleAppv607p-appliance-disk1-mod.vmdk

real    19m34.931s
user    0m4.780s
sys     3m25.332s
```
