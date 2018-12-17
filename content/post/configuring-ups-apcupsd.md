+++
author = "Robin Moffatt"
categories = ["apcupsd", "ups"]
date = 2016-07-18T07:59:51Z
description = ""
draft = false
image = "/images/2016/07/1__rmoff_proxmox01___var_log__ssh_-3.png"
slug = "configuring-ups-apcupsd"
tag = ["apcupsd", "ups"]
title = "Configuring UPS/apcupsd"

+++

With my new server I bought a UPS, partly just as a Good Thing, but also because I suspect a powercut fried the motherboard on a previous machine that I had, and this baby is too precious to lose ;)

The idea is that the UPS will smooth out the power supply to my server, protecting it from surges or temporarily blips in power loss. If there's a proper power cut, the UPS is connected to my server and can initiate a graceful shutdown instead of system crash. It seems unintuitive in this day and age of laptops and iPads that you just close or switch off to "suspend" them that killing the power to a server can damage it, but when you think about it just a moment more, it's hardly surprising.

The software for enabling the server (running Debian 8/Proxmox 4, kernel 4.4.6-1-pve), is a textbook example of why many people took against Linux in the early days - esoteric, out of date documentation. In this short article I'll record how I actually got the thing to work, and a couple of errors I hit along the way.

The UPS I'm running is a [APC Back-UPS 650](https://www.scan.co.uk/products/650va-apc-bk650ei-tower-ups-with-internet-dsl-fax-modem-protection-retail-box), which includes a cable to connect its data port to the USB of a server/workstation

---

### Detour - nuts

My first port of call was the top of the Google hits, [`nut` (Network UPS Tools)](http://networkupstools.org/), using the `usbhid-ups` driver. This failed to even start up:

    usbhid-ups[11055]: segfault at 0 ip 00007f4e9fe3ca87 sp 00007fffcbd48228 error 4 in libc-2.19.so[7f4e9fd1d000+1a2000]

---

### Success - apcupsd

Next I found [`apcupsd`](http://www.apcupsd.org/) (APC UPS Daemon).

```bash
apt-get install apcupsd
```

#### Finding the device

[The docs](http://www.apcupsd.org/manual/manual.html) suggested I'd find my UPS device listed at `/proc/bus/usb/drivers`, and if not the drivers at least at `/proc/bus/usb/drivers` - neither of these worked for me:

```bash
root@proxmox01:/proc/bus# cat /proc/bus/usb/devices
cat: /proc/bus/usb/devices: No such file or directory
root@proxmox01:/proc/bus# cat /proc/bus/usb/drivers
cat: /proc/bus/usb/drivers: No such file or directory
```

But a fortunate [Google hit](https://forums.linuxmint.com/viewtopic.php?t=91483) reminded me about `lsusb`:

```bash
root@proxmox01:/proc/bus# lsusb
[...]
Bus 003 Device 007: ID 051d:0002 American Power Conversion Uninterruptible Power Supply
[...]
```

And there it is. Phew. It's also found using `udev` (per the apcupsd documentation - maybe I shouldn't be quite so rude about it):

```bash
root@proxmox01:/proc/bus# udevadm info --attribute-walk --name=/dev/usb/hiddev0
[...]
  looking at parent device '/devices/pci0000:00/0000:00:14.0/usb3/3-2':
    KERNELS=="3-2"
    SUBSYSTEMS=="usb"
    DRIVERS=="usb"
    ATTRS{bDeviceSubClass}=="00"
    ATTRS{bDeviceProtocol}=="00"
    ATTRS{devpath}=="2"
    ATTRS{idVendor}=="051d"
    ATTRS{speed}=="1.5"
    ATTRS{bNumInterfaces}==" 1"
    ATTRS{bConfigurationValue}=="1"
    ATTRS{bMaxPacketSize0}=="8"
    ATTRS{busnum}=="3"
    ATTRS{devnum}=="7"
    ATTRS{configuration}==""
    ATTRS{bMaxPower}=="0mA"
    ATTRS{authorized}=="1"
    ATTRS{bmAttributes}=="e0"
    ATTRS{bNumConfigurations}=="1"
    ATTRS{maxchild}=="0"
    ATTRS{bcdDevice}=="0006"
    ATTRS{avoid_reset_quirk}=="0"
    ATTRS{quirks}=="0x0"
    ATTRS{serial}=="4B1517P07342  "
    ATTRS{version}==" 1.10"
    ATTRS{urbnum}=="86"
    ATTRS{ltm_capable}=="no"
    ATTRS{manufacturer}=="American Power Conversion"
    ATTRS{removable}=="removable"
    ATTRS{idProduct}=="0002"
    ATTRS{bDeviceClass}=="00"
    ATTRS{product}=="Back-UPS CS 650 FW:817.v9.I USB FW:v9"
```

And finally, it's also there under `usb-devices`:

```bash
root@proxmox01:/proc/bus# usb-devices
[...]
T:  Bus=03 Lev=01 Prnt=01 Port=01 Cnt=02 Dev#=  7 Spd=1.5 MxCh= 0
D:  Ver= 1.10 Cls=00(>ifc ) Sub=00 Prot=00 MxPS= 8 #Cfgs=  1
P:  Vendor=051d ProdID=0002 Rev=00.06
S:  Manufacturer=American Power Conversion
S:  Product=Back-UPS CS 650 FW:817.v9.I USB FW:v9
S:  SerialNumber=4B1517P07342
C:  #Ifs= 1 Cfg#= 1 Atr=e0 MxPwr=0mA
I:  If#= 0 Alt= 0 #EPs= 1 Cls=03(HID  ) Sub=00 Prot=00 Driver=usbhid
[...]
```



#### Found the device, now configure apcupsd

In `/etc/apcupsd/apcupsd.conf` I set:

    UPSCABLE usb
    UPSTYPE usb
    #DEVICE

I started the daemon, which didn't actually run based on the `status` command:

```bash
root@proxmox01:/proc/bus# service apcupsd start
root@proxmox01:/proc/bus# service apcupsd status
● apcupsd.service - LSB: Starts apcupsd daemon
   Loaded: loaded (/etc/init.d/apcupsd)
   Active: active (exited) since Fri 2016-06-17 13:56:25 BST; 28min ago

Jun 17 13:56:25 proxmox01 apcupsd[15897]: Please check your configuration ISCONFIGURED in /etc/default/apcupsd
```

After editing `/etc/default/apcupsd` to set

    ISCONFIGURED=yes

The service came up and stayed up:

```bash
root@proxmox01:/proc/bus# service apcupsd restart
root@proxmox01:/proc/bus# service apcupsd status
● apcupsd.service - LSB: Starts apcupsd daemon
   Loaded: loaded (/etc/init.d/apcupsd)
   Active: active (running) since Fri 2016-06-17 14:30:01 BST; 1s ago
  Process: 1242 ExecStop=/etc/init.d/apcupsd stop (code=exited, status=0/SUCCESS)
  Process: 1249 ExecStart=/etc/init.d/apcupsd start (code=exited, status=0/SUCCESS)
   CGroup: /system.slice/apcupsd.service
           └─1254 /sbin/apcupsd

Jun 17 14:30:01 proxmox01 apcupsd[1249]: Starting UPS power management: apcupsd.
Jun 17 14:30:01 proxmox01 apcupsd[1254]: apcupsd 3.14.12 (29 March 2014) debian startup succeeded
Jun 17 14:30:01 proxmox01 apcupsd[1254]: NIS server startup succeeded
```

The successful service start can also be seen in `/var/log/apcupsd.events` and `/var/log/daemon.log`

### Testing it

Now we're up and running, let's [test it](http://www.apcupsd.org/manual/manual.html#communications-test).

#### Disconnect UPS data cable from Server ###

The unscary one first - disconnect the data comms between UPS and server. It took a few more than the 6 seconds than the doc says, but within a minute or so I got a system beep on the server and :

```bash
Broadcast message from root@proxmox01 (somewhere) (Fri Jun 17 14:39:48 2016):

Warning communications lost with UPS proxmox01
```

as well as an entry in the `/var/log/daemon.log`:

```
2016-06-17 14:39:48 +0100  Communications with UPS lost.
```

I plugged the USB back in to my server, and got:

```
Jun 17 14:41:14 proxmox01 apcupsd[1254]: Communications with UPS restored.
```

#### Disconnect UPS from Mains Power ###

The document entertainingly says:

> The first time that you do this, psychologically it won't be easy, but after you have pulled the plug a few times, you may even come to enjoy it.

The first step is to replace the actual script that would shut the server down if necessary on power failure and battery exhaustion with a dummy one:

```bash
mv /etc/apcupsd/apccontrol /etc/apcupsd/apccontrol.bak
cp /usr/share/doc/apcupsd/examples/safe.apccontrol /etc/apcupsd/apccontrol
```

And then ... pull the plug on the USB from the mains ...

```
Broadcast message from root@proxmox01 (somewhere) (Fri Jun 17 14:49:41 2016):

apccontrol: Warning power loss detected.



Broadcast message from root@proxmox01 (somewhere) (Fri Jun 17 14:49:47 2016):

apccontrol: Power failure. Running on UPS batteries.
```

Entries in the `/var/log/daemon.log`, and my UPS starts beeping too.

Plugging the UPS back in (phew), and:

```
Broadcast message from root@proxmox01 (somewhere) (Fri Jun 17 14:51:04 2016):

apccontrol: Off battery. Mains returned.



Broadcast message from root@proxmox01 (somewhere) (Fri Jun 17 14:51:04 2016):

apccontrol: Power has returned...
```

In real life when we had a powercut the UPS worked perfectly too: 

```
Jul 18 02:19:00 proxmox01 apcupsd[1254]: Power failure.
Jul 18 02:19:06 proxmox01 apcupsd[1254]: Running on UPS batteries.
Jul 18 02:25:40 proxmox01 apcupsd[1254]: Mains returned. No longer on UPS batteries.
Jul 18 02:25:40 proxmox01 apcupsd[1254]: Power is back. UPS running on mains.
```
#### Full Power Outage ###

TODO!

*And yes this is bad. Just like backups being only as good as the last successful restore, a UPS graceful shutdown routine really does need to be tested. Watch this space!*

### Bonus - data extract

Because we left `NETSERVER` enabled in the config, we can probe the stats of the UPS:

```bash
root@proxmox01:/proc/bus# apcaccess status
APC      : 001,045,1060
DATE     : 2016-06-17 14:30:35 +0100
HOSTNAME : proxmox01
VERSION  : 3.14.12 (29 March 2014) debian
UPSNAME  : proxmox01
CABLE    : USB Cable
DRIVER   : USB UPS Driver
UPSMODE  : Stand Alone
STARTTIME: 2016-06-17 14:30:01 +0100
MODEL    : Back-UPS CS 650
STATUS   : ONLINE
LINEV    : 244.0 Volts
LOADPCT  : 40.0 Percent
BCHARGE  : 100.0 Percent
TIMELEFT : 14.9 Minutes
[...]
```

I might brew a bash-based extract of this data into InfluxDB to track in Grafana (of course!), or maybe look at [this](https://bitbucket.org/snippets/wnasich/7Kg89/telegraf-input-for-apc-ups-status-using) custom [Telegraf](https://influxdata.com/time-series-platform/telegraf/) plugin.
