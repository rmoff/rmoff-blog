+++
categories = ["proxmox", "vmware", "virtualbox", "qcow2"]
date = 2016-06-07T21:14:26Z
description = ""
draft = false
image = "/images/2016/06/prox01-1.png"
slug = "importing-vmware-and-virtualbox-vms-to-proxmox"
tag = ["proxmox", "vmware", "virtualbox", "qcow2"]
title = "Importing VMWare and VirtualBox VMs to Proxmox"

+++

([Previously](/2016/06/07/a-new-arrival/), [previously](/2016/06/07/commissioning-my-proxmox-server-os-and-filesystems/))

I've got a bunch of existing VirtualBox and VMWare VMs that I want to run on Proxmox. Eventually I'll migrate them to containers, but for the time being run them as "fat" VMs using Proxmox's KVM virtualisation. After copying the OVA files that I had to the server, I uncompressed them:

```bash
root@proxmox01:/data04/vms/bdl44-biwa# cd ../bdl44
root@proxmox01:/data04/vms/bdl44# ll
total 27249328
-rw------- 1 root root 27903306752 Jun  1 10:14 BigDataLite440.ova
root@proxmox01:/data04/vms/bdl44# tar -xf BigDataLite440.ova
root@proxmox01:/data04/vms/bdl44# ll
total 54498668
-rw------- 1 root root  7300486656 Feb 18 21:25 BigDataLite440-disk1.vmdk
-rw------- 1 root root  1261044224 Feb 18 21:26 BigDataLite440-disk2.vmdk
-rw------- 1 root root 19295202816 Feb 18 21:48 BigDataLite440-disk3.vmdk
-rw------- 1 root root    46550528 Feb 18 21:48 BigDataLite440-disk4.vmdk
-rw------- 1 root root 27903306752 Jun  1 10:14 BigDataLite440.ova
-rw------- 1 root root       19619 Feb 18 21:15 BigDataLite440.ovf
```

and then converted each disk image to qcow2 format: 
(_You can read more about how and why [here](https://www.jamescoyle.net/how-to/1218-upload-ova-to-proxmox-kvm) and [here](https://pve.proxmox.com/wiki/Migration_of_servers_to_Proxmox_VE#VMware_to_Proxmox_VE_.28KVM.29)_).

```bash
root@proxmox01:/data04/vms/bdl44# time qemu-img convert -f vmdk BigDataLite440-disk1.vmdk -O qcow2 BigDataLite440-disk1.qcow2

real    2m14.986s
user    1m39.976s
sys     0m23.548s
root@proxmox01:/data04/vms/bdl44# time qemu-img convert -f vmdk BigDataLite440-disk2.vmdk -O qcow2 BigDataLite440-disk2.qcow2

real    0m47.865s
user    0m35.556s
sys     0m3.684s
root@proxmox01:/data04/vms/bdl44# time qemu-img convert -f vmdk BigDataLite440-disk3.vmdk -O qcow2 BigDataLite440-disk3.qcow2

real    5m21.469s
user    3m49.736s
sys     1m0.348s
root@proxmox01:/data04/vms/bdl44# time qemu-img convert -f vmdk BigDataLite440-disk4.vmdk -O qcow2 BigDataLite440-disk4.qcow2

real    0m13.419s
user    0m5.716s
sys     0m0.296s
```

For re-usability, this will convert all found vmdk files in one fell swoop: 

```bash
for file in *.vmdk; do   i=${file##*/};qemu-img convert -f vmdk $i -O qcow2 $(echo $i |sed 's/vmdk/qcow2/g'); done
```


I then created a new VM using the Proxmox web interface, specifying the disk to match the size of the first disk listed in the `OVF` of the unpacked `OVA`

```xml
  <DiskSection>
    <Info>List of the virtual disks used in the package</Info>
    <Disk ovf:capacity="41943040000" ovf:diskId="vmdisk2" ovf:fileRef="file1" ovf:format="http://www.vmware.com/interfaces/specifications/vmdk.html#streamOptimized" vbox:uuid="150dbbe8-0c88-48d0-9fcf-e80d7d7d4c2f"/>
    <Disk ovf:capacity="104857600000" ovf:diskId="vmdisk3" ovf:fileRef="file2" ovf:format="http://www.vmware.com/interfaces/specifications/vmdk.html#streamOptimized" vbox:uuid="64101bef-46af-4e89-8c02-0e6315d6be41"/>
    <Disk ovf:capacity="62914560000" ovf:diskId="vmdisk4" ovf:fileRef="file3" ovf:format="http://www.vmware.com/interfaces/specifications/vmdk.html#streamOptimized" vbox:uuid="d7fae10b-aac3-4675-b295-6a5ab9db3e7f"/>
    <Disk ovf:capacity="20971520000" ovf:diskId="vmdisk5" ovf:fileRef="file4" ovf:format="http://www.vmware.com/interfaces/specifications/vmdk.html#streamOptimized" vbox:uuid="e29ccf7f-69f1-4338-ac2d-909344d74f75"/>
  </DiskSection>
```

and once created added the three remaining disks to the VM configuration. I removed the CD device so as to be able to sequence the four IDE disks as per the original OVF configuration.

![](/images/2016/06/prox01.png)

The config for the server looks like this:

```bash
root@proxmox01:/data04/vms/bdl44# cat /etc/pve/nodes/proxmox01/qemu-server/100.conf
bootdisk: ide0
cores: 4
ide0: data01:100/vm-100-disk-1.qcow2,size=40G
ide1: data01:100/vm-100-disk-2.qcow2,size=100G
ide2: data01:100/vm-100-disk-4.qcow2,size=60G
ide3: data01:100/vm-100-disk-5.qcow2,size=20G
memory: 16000
name: bdl44
net0: bridge=vmbr0,e1000=66:65:31:38:36:64
numa: 1
ostype: l26
smbios1: uuid=58e05db8-1bae-4ccf-90fe-9ea036a58056
sockets: 2
```

I copied the qcow2 files (converted from VMDK) **over** the existing qcow2 files:

```bash
time mv -f /data04/vms/bdl44/BigDataLite440-disk1.qcow2 /data01/images/100/vm-100-disk-1.qcow2
time mv -f /data04/vms/bdl44/BigDataLite440-disk2.qcow2 /data01/images/100/vm-100-disk-2.qcow2
time mv -f /data04/vms/bdl44/BigDataLite440-disk3.qcow2 /data01/images/100/vm-100-disk-3.qcow2
time mv -f /data04/vms/bdl44/BigDataLite440-disk4.qcow2 /data01/images/100/vm-100-disk-4.qcow2
```

From the Proxmox GUI I started the migrated VM, but it failed with the error `Unable to resolve 'LABEL=oracle_sw'`

![](/images/2016/06/prox02.png)

The reason being I'd got the disks wrong - look at the above configuration (1,2,4,5) and list of disk images (1-4). After fixing this the VM (a version of Big Data Lite 4.4) started up just fine. As did SampleApp v506:

![](/images/2016/06/prox03.png)

If you want you can tidy up by uninstalling the VirtualBox support modules:

```bash
sudo /opt/VBoxGuestAdditions-4.3.22/uninstall.sh
```

For reference: 

1.  I'm not sure if it makes too much difference on the exact sizing of the disk images in the qemu configuration file, since they grow as needed - hence sticking a size of 200G is going to do no harm (unless you actually don't have that disk space) and makes importing the image easier. 
2. You can update the configuration file to make the disk image names match those that you have, instead of renaming them to match the pattern that qemu generates. Swings & roundabouts.
