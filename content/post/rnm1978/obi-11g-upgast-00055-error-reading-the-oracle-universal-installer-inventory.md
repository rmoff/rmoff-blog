---
title: "OBI 11g : UPGAST-00055: error reading the Oracle Universal Installer inventory"
date: "2011-10-05"
categories: 
  - "inventory"
  - "obiee-11g"
  - "oui"
---

It's not my fault really.

When running an installation, presented with the option of

- (a) do a bunch of stuff and wait to continue the install later or
- (b) tick a box and continue now

it's a better man that I who would opt for option (a).

When I recently installed OBIEE 11g, I was prompted to get a script run as root to set up the inventory, or tick "Continue Installation with local inventory" to continue with the install.

Not having root privileges on the machine, not really understanding the purpose of OUI inventory on a single installation machine, and mostly just being a bit lazy, I obviously went for the path of least resistance.

![](/images/rnm1978/2011-09-30_1555_-0001.png "2011-09-30_1555_ 0001")

The installation proceeded with no further issues, and I spent a couple of happy hours tinkering with the freshly installed OBI 11g and EM.

But... you cross the gods of OUI's inventory at your peril...

When I tried to run the Upgrade Assistant, got an error: 
```
/app/oracle/product/fmw_home/Oracle_BI1/bin $./ua
Oracle Fusion Middleware Upgrade Assistant 11.1.1.5.0
Log file is located at: /app/oracle/product/fmw_home/Oracle_BI1/upgrade/logs/ua2011-10-05-08-53-26AM.log
UPGAST-00055: error reading the Oracle Universal Installer inventory
The inventory pointer location /etc/oraInst.loc is either not readable or does not exist
```


Sure enough, the file doesn't exist: 
```
$ls -l /etc/oraInst.loc
ls: /etc/oraInst.loc: No such file or directory
```


Fortunately it appears you can make amends with OUI easily, by running as root the script which you were originally asked to run: 
```
[root@server]/ $/app/oracle/product/oraInventory/createCentralInventory.sh
Setting the inventory to /app/oracle/product/oraInventory
Setting the group name to biadmin
Creating the Oracle inventory pointer file (/etc/oraInst.loc)
Changing permissions of /app/oracle/product/oraInventory to 770.
Changing groupname of /app/oracle/product/oraInventory to biadmin.
The execution of the script is complete
```


This creates /etc/oraInst.loc, which simply points to the original local inventory which was created: 
```
$cat /etc/oraInst.loc
inventory_loc=/app/oracle/product/oraInventory
inst_group=biadmin
```


After this the Upgrade Assistant fired up just fine.
