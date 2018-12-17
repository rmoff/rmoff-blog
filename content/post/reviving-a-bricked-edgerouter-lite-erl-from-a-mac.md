+++
author = "Robin Moffatt"
categories = ["edgemax", "erl", "edgerouter lite", "tftp", "rj45", "screen", "squashfs", "router", "networking"]
date = 2016-06-08T15:58:30Z
description = ""
draft = false
image = "/images/2016/06/1__screen-1.png"
slug = "reviving-a-bricked-edgerouter-lite-erl-from-a-mac"
tag = ["edgemax", "erl", "edgerouter lite", "tftp", "rj45", "screen", "squashfs", "router", "networking"]
title = "Reviving a bricked EdgeRouter Lite (ERL) from a Mac"

+++

I've got an [EdgeRouter LITE](https://www.ubnt.com/edgemax/edgerouter-lite/) (ERL) which I used as my home router until a powercut fried it a while ago ([looks like I'm not the only one to have this issue](https://community.ubnt.com/t5/EdgeMAX/2nd-Failed-ERLite/m-p/601815)). The symptoms were it powering on but not giving any DHCP addresses, or after a factory reset responding on the default IP of 192.168.1.1. It was a real shame, because it had been a great bit of kit up until then. I am a complete hack when it comes to networking, and it struck the balance right between letting me do what I needed to do, without overwhelming me with complexity. 
I'd replaced it with a SonicWall TZ105 but having utterly failed to get the latter to permit OpenVPN traffic (so I can access my home server when on the road), which I had done with no problem on the ERL I thought I'd try and resurrect the ERL using [the instructions here](https://help.ubnt.com/hc/en-us/articles/204959514-EdgeMAX-Last-resort-recovery-of-failed-EdgeOS-device).

I bought a [RJ45-USB](https://www.amazon.co.uk/dp/B01A6OS6FK) cable from Amazon, and connected it to **Console** on the ERL and the USB to my Macbook Pro.

On my Mac, I determined USB device:

```bash
rmoff@asgard:~> ls -l /dev/tty.usbserial*
crw-rw-rw-  1 root  wheel   18,   4  8 Jun 17:01 /dev/tty.usbserial-AI038A4A
```

Using the eternally brilliant GNU `screen` as serial terminal client from standard Terminal/iTerm on the Mac:
(the 115200 is the [baud rate](https://help.ubnt.com/hc/en-us/articles/205202630-EdgeMAX-Connect-to-serial-console-port-default-settings))

```bash
screen /dev/tty.usbserial-AI038A4A 115200
```

Powering up the router showed:

```
[...]
SQUASHFS error: zlib_inflate error, data probably corrupt
SQUASHFS error: squashfs_read_data failed to read block 0x29767f3
SQUASHFS error: Unable to read fragment cache entry [29767f3]
SQUASHFS error: Unable to read page, block 29767f3, size b168
SQUASHFS error: Unable to read fragment cache entry [29767f3]
SQUASHFS error: Unable to read page, block 29767f3, size b168
SQUASHFS error: Unable to read fragment cache entry [29767f3]
SQUASHFS error: Unable to read page, block 29767f3, size b168
SQUASHFS error: Unable to read fragment cache entry [29767f3]
SQUASHFS error: Unable to read page, block 29767f3, size b168
SQUASHFS error: Unable to read fragment cache entry [29767f3]
SQUASHFS error: Unable to read page, block 29767f3, size b168
start-stop-daemon: unable to start /usr/sbin/atd (Input/output error)
Starting routing daemon: rib.
Starting EdgeOS router: migrate rl-system configure.

Welcome to EdgeOS ubnt ttyS0

By logging in, accessing, or using the Ubiquiti product, you
acknowledge that you have read and understood the Ubiquiti
License Agreement (available in the Web UI at, by default,
http://192.168.1.1) and agree to be bound by its terms.

ubnt login:

[...]
```

And on a second occasion showed: 

```
 0:0:0:0: [sda] No Caching mode page found
sd 0:0:0:0: [sda] Assuming drive cache: write through
sd 0:0:0:0: [sda] Attached SCSI removable disk
VFS: Cannot open root device "sda2" or unknown-block(8,2): error -17
Please append a correct "root=" boot option; here are the available partitions:
1f00             512 mtdblock0  (driver?)
1f01             512 mtdblock1  (driver?)
1f02              64 mtdblock2  (driver?)
0800         3789504 sda  driver: sd
  0801          145408 sda1 35e60000-01
  0802         1709056 sda2 35e60000-02
Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(8,2)

*** NMI Watchdog interrupt on Core 0x00 ***
        $0      0x0000000000000000      at      0x0000000010000ce0
        v0      0xffffffffc0620000      v1      0x0000000000000000
        a0      0xffffffffc07b0478      a1      0x0000000000000001
        a2      0x0000000000000000      a3      0xffffffffc05f8028
        a4      0x0000000000000000      a5      0x0000000000000002
        a6      0x0000000000000002      a7      0x0000000000000000
        t0      0xffffffffc07c0000      t1      0xffffffffc05f8028
        t2      0xffffffffc07b0000      t3      0x0000000000000006
        s0      0xffffffffc0590000      s1      0xffffffffc058bdd0
        s2      0xffffffffc0590000      s3      0x0000000000000014
        s4      0xffffffffc05df940      s5      0xffffffffc0688a60
        s6      0x0000000000000004      s7      0x0000000000000001
        t8      0x0000000000000000      t9      0x000000000000032b
        k0      0xdab0f2c75931f243      k1      0xd0f77c4765a7af0b
        gp      0xffffffffc05dc000      sp      0xffffffffc05df6f0
        s8      0x0000000862f59974      ra      0xffffffffc04ea078
        err_epc 0xffffffffc00a1070      epc     0xffffffffc007a140
        status  0x0000000010480ce4      cause   0x0000000040808800
        sum0    0x000000f000000000      en0     0x0100000400000000
*** Chip soft reset soon ***
```

([this also looks worth trying](https://community.ubnt.com/t5/EdgeMAX/SQUASHFS-error-and-repair/td-p/892730), but means opening up the ERL)

Started TFTP server on my Mac ([h/t](http://www.barryodonovan.com/2014/11/08/os-x-built-in-tftp-server)):

```bash
sudo launchctl load -F /System/Library/LaunchDaemons/tftp.plist
sudo launchctl start com.apple.tftpd
```

Downloaded `emrk-0.9c.bin` from [http://packages.vyos.net/tools/emrk/](http://packages.vyos.net/tools/emrk/) and copied it to the TFTP folder, to be used as a boot image for the ERL to run from across the network.

```bash
wget http://packages.vyos.net/tools/emrk/0.9c/emrk-0.9c.bin
sudo cp emrk-0.9c.bin /private/tftpboot/
```

Power up the ERL (or restart it if it's already on) and keep pressing a key in the Console window, which will interupt the boot sequence and land you at the bootloader console:

```bash
Looking for valid bootloader image....
Jumping to start of image at address 0xbfc80000


U-Boot 1.1.1 (UBNT Build ID: 4493936-g009d77b) (Build time: Sep 20 2012 - 15:48:51)

BIST check passed.
UBNT_E100 r1:2, r2:14, serial #: DC9FDB282DDB
Core clock: 500 MHz, DDR clock: 266 MHz (532 Mhz data rate)
DRAM:  512 MB
Clearing DRAM....... done
Flash:  4 MB
Net:   octeth0, octeth1, octeth2

USB:   (port 0) scanning bus for devices... 1 USB Devices found
       scanning bus for storage devices...
  Device 0: Vendor:          Prod.: USB DISK 2.0     Rev: PMAP
            Type: Removable Hard Disk
            Capacity: 3700.6 MB = 3.6 GB (7579008 x 512)                                                                                                                           0
Octeon ubnt_e100#
```

Connect the ERL to your network (I used port 0), and then configure its network details:

```bash
Octeon ubnt_e100# set ipaddr 192.168.10.2
Octeon ubnt_e100# set netmask 255.255.255.0
Octeon ubnt_e100# set serverip 192.168.10.79
Octeon ubnt_e100# set gatewayip 192.168.10.1
```

where:

* `ipaddr` - the IP address to assign to the ERL
* `netmask` - `255.255.255.0` (I don't profess to be a networking expert; maybe this would vary in some cases?)
* `serverip` - the IP address of the TFTP server (my Mac, in this case)
* `gatewayip` - the IP address of the router currently in use (not the ERL, but the one acting as your current gateway). [According to the doc](https://help.ubnt.com/hc/en-us/articles/204959514-EdgeMAX-Last-resort-recovery-of-failed-EdgeOS-device) this is optional.

Then define the boot image to use, and transfer it to the ERL:

```bash
Octeon ubnt_e100# set bootfile emrk-0.9c.bin
Octeon ubnt_e100# tftpboot
Using octeth0 device
TFTP from server 192.168.10.79; our IP address is 192.168.10.2
Filename 'emrk-0.9c.bin'.
Load address: 0x9f00000
Loading: #################################################################
         #############################################
done
Bytes transferred = 15665511 (ef0967 hex), 9502 Kbytes/sec
Octeon ubnt_e100#
```

Finally, initiate the boot sequence from the newly-transferred image:

```bash
Octeon ubnt_e100# bootoctlinux $loadaddr
ELF file is 64 bit
Allocating memory for ELF segment: addr: 0xffffffff81100000 (adjusted to: 0x1100000), size 0xe83940
Allocated memory for ELF segment: addr: 0xffffffff81100000, size 0xe83940
Processing PHDR 0
  Loading e23d80 bytes at ffffffff81100000
  Clearing 5fbc0 bytes at ffffffff81f23d80
[...]
```

On boot I got some errors:

```bash
Checking system image MD5 sum
sd 0:0:0:0: [sda] Unhandled sense code
sd 0:0:0:0: [sda] Result: hostbyte=0x00 driverbyte=0x08
sd 0:0:0:0: [sda] Sense Key : 0x3 [current]
sd 0:0:0:0: [sda] ASC=0x11 ASCQ=0x0
sd 0:0:0:0: [sda] CDB: cdb[0]=0x28: 28 00 00 12 a4 18 00 00 f0 00
end_request: I/O error, dev sda, sector 1221656
sd 0:0:0:0: [sda] Unhandled sense code
sd 0:0:0:0: [sda] Result: hostbyte=0x00 driverbyte=0x08
sd 0:0:0:0: [sda] Sense Key : 0x3 [current]
sd 0:0:0:0: [sda] ASC=0x11 ASCQ=0x0
sd 0:0:0:0: [sda] CDB: cdb[0]=0x28: 28 00 00 13 d6 60 00 00 f0 00
end_request: I/O error, dev sda, sector 1300064
System image MD5 sum is not correct! Your image may be corrupted.
```

And then a prompt for accepting the licence and whether I wanted to use DHCP, to both of which I answered `yes`:

```
**********************************************
Welcome to EdgeMax Rescue Kit!

This tool is distributed under the terms of
GNU General Public License and other licenses

Brought to you by SO3 Group

[...]
```

At the `EMRK>` prompt, I opted for the complete reinstall:

```bash
EMRK>emrk-reinstall
WARNING: This script will reinstall EdgeOS from scratch
If you have any usable data on your router storage,
it will be irrecoverably destroyed!
Do you want to continue?
yes or no: yes
Unmounting boot partition
Unmounting root partition
Re-creating partition table
Creating boot partition
Formatting boot partition
mkfs.vfat 3.0.9 (31 Jan 2010)
Creating root partition
Formatting root partition
Mounting boot parition
Mounting root partition
kjournald starting.  Commit interval 5 seconds
EXT3 FS on sda2, internal journal
EXT3-fs: mounted filesystem with writeback data mode.
Enter EdgeOS image url:http://dl.ubnt.com/firmwares/edgemax/v1.8.0/ER-e100.v1.8.0.4853089.tar
```

You're then prompted for the EdgeOS image, which you can find on the [Ubiquiti website](https://www.ubnt.com/download/edgemax/). I went for the one matching my router, **ERLite** (`EdgeRouter ERLite-3/ERPoe-5 Firmware v1.8.0`)

```bash
Unpacking EdgeOS release image
Verifying EdgeOS kernel
Copying EdgeOS kernel to boot partition
Verifying EdgeOS system image
Copying EdgeOS system image to root partition
Copying version file to the root partition
Creating EdgeOS writable data directory
Cleaning up
Installation finished
Please reboot your router
```

Now enter `reboot` to restart your hopefully-healthy ERL!

```bash
EMRK>reboot
```

After the reboot things looked *much* healthier!

```
scsi 0:0:0:0: Direct-Access              USB DISK 2.0     PMAP PQ: 0 ANSI: 4
sd 0:0:0:0: [sda] 7579008 512-byte logical blocks: (3.88 GB/3.61 GiB)
sd 0:0:0:0: [sda] Write Protect is off
sd 0:0:0:0: [sda] No Caching mode page found
sd 0:0:0:0: [sda] Assuming drive cache: write through
sd 0:0:0:0: [sda] No Caching mode page found
sd 0:0:0:0: [sda] Assuming drive cache: write through
 sda: sda1 sda2
sd 0:0:0:0: [sda] No Caching mode page found
sd 0:0:0:0: [sda] Assuming drive cache: write through
sd 0:0:0:0: [sda] Attached SCSI removable disk
kjournald starting.  Commit interval 3 seconds
EXT3-fs (sda2): using internal journal
EXT3-fs (sda2): mounted filesystem with journal data mode
VFS: Mounted root (unionfs filesystem) on device 0:11.
Freeing unused kernel memory: 288K (ffffffffc0648000 - ffffffffc0690000)
Algorithmics/MIPS FPU Emulator v1.5
INIT: version 2.88 booting
INIT: Entering runlevel: 2
[ ok ] Starting routing daemon: rib nsm ribd.
[ ok ] Starting EdgeOS router: migrate rl-system configure.

Welcome to EdgeOS ubnt ttyS0

By logging in, accessing, or using the Ubiquiti product, you
acknowledge that you have read and understood the Ubiquiti
License Agreement (available in the Web UI at, by default,
http://192.168.1.1) and agree to be bound by its terms.

ubnt login:
```

_If you accidently close your `screen` you'll find you get a "Resource Busy" and "Sorry, could not find a PTY." error. Simply unplug the USB cable from your Mac and then plug it back in, and you'll be good to go again from where you left off_
