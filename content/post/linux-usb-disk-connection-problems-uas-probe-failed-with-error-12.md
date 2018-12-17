+++
author = "Robin Moffatt"
categories = ["lsblk", "uas", "usb", "mount"]
date = 2017-06-21T06:14:45Z
description = ""
draft = false
slug = "linux-usb-disk-connection-problems-uas-probe-failed-with-error-12"
tag = ["lsblk", "uas", "usb", "mount"]
title = "Linux - USB disk connection problems - uas: probe failed with error -12"

+++

Usually connecting external disks in Linux is easy. Plug it in, run `fdisk -l` or `lsblk | grep disk` to identify the device ID, and then `mount` it. 

Unfortunately in this instance, plugging in my Seagate 2TB wasn't so simple. The server is running Proxmox: 

    # uname -a
    Linux proxmox01 4.4.6-1-pve #1 SMP Thu Apr 21 11:25:40 CEST 2016 x86_64 GNU/Linux

No device showed up on `lsblk` or `fdisk -l`. In `dmesg` I saw: 

    uas: probe of 4-2:1.0 failed with error -12

and `/var/log/syslog`: 

```
Jun 20 10:28:23 proxmox01 kernel: [8025519.475079] usb 3-1: new high-speed USB device number 10 using xhci_hcd
Jun 20 10:28:23 proxmox01 kernel: [8025519.604683] usb 3-1: Manufacturer: Seagate
Jun 20 10:28:23 proxmox01 kernel: [8025519.605666] CPU: 0 PID: 31152 Comm: kworker/0:0 Tainted: P           O    4.4.6-1-pve #1
Jun 20 10:28:23 proxmox01 kernel: [8025519.605681]  000000000208c020 0000000000000000 ffff880cacdd3560 ffffffff81192b5c
Jun 20 10:28:23 proxmox01 kernel: [8025519.605705]  [<ffffffff810c3914>] ? __wake_up+0x44/0x50
Jun 20 10:28:23 proxmox01 kernel: [8025519.605723]  [<ffffffff811b2264>] kmalloc_order_trace+0x24/0xb0
Jun 20 10:28:23 proxmox01 kernel: [8025519.605742]  [<ffffffff813bdfc4>] blk_init_tags+0x14/0x20
Jun 20 10:28:23 proxmox01 kernel: [8025519.605763]  [<ffffffff8154e522>] __device_attach_driver+0x72/0x80
Jun 20 10:28:23 proxmox01 kernel: [8025519.605779]  [<ffffffff8154d282>] bus_probe_device+0x92/0xa0
Jun 20 10:28:23 proxmox01 kernel: [8025519.605795]  [<ffffffff8154e164>] driver_probe_device+0x224/0x4b0
Jun 20 10:28:23 proxmox01 kernel: [8025519.605811]  [<ffffffff8154e6a3>] device_initial_probe+0x13/0x20
Jun 20 10:28:23 proxmox01 kernel: [8025519.605827]  [<ffffffff81617130>] hub_event+0x1020/0x1580
Jun 20 10:28:23 proxmox01 kernel: [8025519.605843]  [<ffffffff810a0baa>] kthread+0xea/0x100
Jun 20 10:28:23 proxmox01 kernel: [8025519.605860] active_anon:6721278 inactive_anon:2537813 isolated_anon:0
Jun 20 10:28:23 proxmox01 kernel: [8025519.605860]  active_file:1818599 inactive_file:16022602 isolated_file:0
Jun 20 10:28:23 proxmox01 kernel: [8025519.605860]  unevictable:9057 dirty:343 writeback:0 unstable:0
Jun 20 10:28:23 proxmox01 kernel: [8025519.605860]  slab_reclaimable:808602 slab_unreclaimable:40370
Jun 20 10:28:23 proxmox01 kernel: [8025519.605860]  mapped:105858 shmem:280137 pagetables:44195 bounce:0
Jun 20 10:28:23 proxmox01 kernel: [8025519.605860]  free:4793036 free_pcp:3685 free_cma:0
Jun 20 10:28:23 proxmox01 kernel: [8025519.605884] Node 0 Normal free:9716940kB min:22276kB low:27844kB high:33412kB active_anon:15658136kB inactive_anon:5117636kB active_file:2095992kB inactive_file:29493156kB unevictable:32376kB isolated(anon):0kB isolated(file):0kB present:65011712kB managed:63964020kB mlocked:32376kB dirty:728kB writeback:0kB mapped:221248kB shmem:485280kB slab_reclaimable:1345308kB slab_unreclaimable:74956kB kernel_stack:29856kB pagetables:72468kB unstable:0kB bounce:0kB free_pcp:5720kB local_pcp:200kB free_cma:0kB writeback_tmp:0kB pages_scanned:1100 all_unreclaimable? no
Jun 20 10:28:23 proxmox01 kernel: [8025519.605912] Node 0 DMA32: 2931*4kB (UME) 12003*8kB (UME) 6685*16kB (UME) 1735*32kB (UME) 338*64kB (UME) 47*128kB (UME) 0*256kB 0*512kB 0*1024kB 0*2048kB 0*4096kB = 297876kB
Jun 20 10:28:23 proxmox01 kernel: [8025519.605945] Node 1 hugepages_total=0 hugepages_free=0 hugepages_surp=0 hugepages_size=1048576kB
Jun 20 10:28:23 proxmox01 kernel: [8025519.605953] Free swap  = 928kB
Jun 20 10:28:23 proxmox01 kernel: [8025519.605958] 0 pages cma reserved
```

A bit of Googling led me to [here](https://unix.stackexchange.com/questions/270945/why-cant-i-mount-the-disk-now-with-limited-memory), which suggested memory was causing a problem with `uas` that is responsible for making the drive device available. The existing memory usage looked like this: 

```bash
root@proxmox01:~# free -m
             total       used       free     shared    buffers     cached
Mem:        128811     110118      18692       1094       3198      67616
-/+ buffers/cache:      39303      89508
Swap:         8191       8191          0
```
Taking a bit of a gamble on running random commands from the internet I ran : 
```bash
root@proxmox01:~# echo 3 | sudo tee /proc/sys/vm/drop_caches
3

root@proxmox01:~# free -m
             total       used       free     shared    buffers     cached
Mem:        128811      38275      90536       1094         23       1435
-/+ buffers/cache:      36815      91996
Swap:         8191       8191          0
```

After which I reconnected the drive and ... it was picked up and registered just fine. 

```
usb 4-2: USB disconnect, device number 3
usb 4-5: new SuperSpeed USB device number 4 using xhci_hcd
usb 4-5: New USB device found, idVendor=0bc2, idProduct=3321
usb 4-5: New USB device strings: Mfr=2, Product=3, SerialNumber=1
usb 4-5: Product: Expansion Desk
usb 4-5: Manufacturer: Seagate
usb 4-5: SerialNumber: NA4N4ZC9
scsi host16: uas
scsi 16:0:0:0: Direct-Access     Seagate  Expansion Desk   0604 PQ: 0 ANSI: 6
sd 16:0:0:0: Attached scsi generic sg10 type 0
sd 16:0:0:0: [sdj] Spinning up disk...
..........ready
sd 16:0:0:0: [sdj] 488378645 4096-byte logical blocks: (2.00 TB/1.82 TiB)
sd 16:0:0:0: [sdj] 16384-byte physical blocks
sd 16:0:0:0: [sdj] Write Protect is off
sd 16:0:0:0: [sdj] Mode Sense: 4f 00 00 00
sd 16:0:0:0: [sdj] Write cache: enabled, read cache: enabled, doesn't support DPO or FUA
sd 16:0:0:0: [sdj] 488378645 4096-byte logical blocks: (2.00 TB/1.82 TiB)
 sdj: sdj1
sd 16:0:0:0: [sdj] 488378645 4096-byte logical blocks: (2.00 TB/1.82 TiB)
sd 16:0:0:0: [sdj] Attached SCSI disk
```

