+++
author = "Robin Moffatt"
categories = ["goldengate", "oracle", "kafka", "confluent platform", "swingbench"]
date = 2017-11-21T17:31:00Z
description = ""
draft = false
image = "/images/2017/11/oggkaf01_sm.jpg"
slug = "installing-oracle-goldengate-for-big-data-12-3-1-with-kafka-connect-and-confluent-platform"
tags = ["goldengate", "oracle", "kafka", "confluent platform", "swingbench"]
title = "Installing Oracle GoldenGate for Big Data 12.3.1 with Kafka Connect and Confluent Platform"

+++

_Some notes that I made on installing and configuring Oracle GoldenGate with Confluent Platform. Excuse the brevity, but hopefully useful to share!_

---

I used the [Oracle Developer Days VM](http://www.oracle.com/technetwork/database/enterprise-edition/databaseappdev-vm-161299.html) for this - it's preinstalled with Oracle 12cR2. [Big Data Lite](http://www.oracle.com/technetwork/database/bigdata-appliance/oracle-bigdatalite-2104726.html) is nice but currently has an older version of GoldenGate.

Login to the VM (oracle/oracle) and then install some useful things:

    sudo rpm -Uvh https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
    sudo yum install -y screen htop collectl rlwrap p7zip unzip sysstat perf iotop
    sudo su -
    cd /etc/yum.repos.d/
    wget http://download.opensuse.org/repositories/shells:fish:release:2/CentOS_7/shells:fish:release:2.repo
    yum install fish


Check Oracle version etc:

<script src="https://gist.github.com/rmoff/dedaa1a2ef4b3225a6299a36629dcb67.js"></script>

# Install OGG #

[Download both](http://www.oracle.com/technetwork/middleware/goldengate/downloads/index.html) **Oracle GoldenGate** 12.3.0.1 and **Oracle GoldenGate for Big Data** 12.3.1.1.0. For reference, here is the [Install guide](http://docs.oracle.com/goldengate/c1221/gg-winux/GIORA/GUID-B5B88238-C74D-487B-AD7D-7809ED5125EE.htm#GIORA162).

Make sure installers are present on VM

    [oracle@localhost ~]$ ls -l ~/Downloads/
    total 610368
    -rw-r--r--. 1 oracle oinstall 543200432 Sep  5 08:45 123010_fbo_ggs_Linux_x64_shiphome.zip
    -rw-r--r--. 1 oracle oinstall  81812011 Sep  5 08:38 123110_ggs_Adapters_Linux_x64.zip

Unzip the OGG installer

    [oracle@localhost Downloads]$ unzip 123010_fbo_ggs_Linux_x64_shiphome.zip

Build a response file (e.g. `/tmp/oggcore.rsp`)

    oracle.install.responseFileVersion=/oracle/install/rspfmt_ogginstall_response_schema_v12_1_2
    INSTALL_OPTION=ORA12c
    SOFTWARE_LOCATION=/u01/app/ogg
    START_MANAGER=true
    MANAGER_PORT=7809
    DATABASE_LOCATION=/u01/app/oracle/product/12.2/db_1/
    INVENTORY_LOCATION=/u01/app/oraInventory/
    UNIX_GROUP_NAME=oracle

Install OGG:

    [oracle@localhost Disk1]$ ~/Downloads/fbo_ggs_Linux_x64_shiphome/Disk1/runInstaller -silent -nowait -responseFile /tmp/oggcore.rsp
    Starting Oracle Universal Installer...

    Checking Temp space: must be greater than 120 MB.   Actual 13557 MB    Passed
    Checking swap space: must be greater than 150 MB.   Actual 4088 MB    Passed
    Preparing to launch Oracle Universal Installer from /tmp/OraInstall2017-09-05_09-34-29AM. Please wait ...[oracle@localhost Disk1]$ [WARNING] [INS-75014] Database version cannot be determined from the location specified.
    CAUSE: The components inventory may be missing or corrupted in the location specified.
    ACTION: Specify an alternate database location.
    You can find the log of this install session at:
    /u01/installervb/logs/installActions2017-09-05_09-34-29AM.log

    …
    …

    The installation of Oracle GoldenGate Core was successful.
    Please check '/u01/installervb/logs/silentInstall2017-09-05_09-34-29AM.log' for more details.
    Successfully Setup Software.

Check that OGG Manager is running

    [oracle@localhost ogg]$ . oraenv
    ORACLE_SID = [oracle] ? orcl12c
    ORACLE_BASE environment variable is not being set since this
    information is not available for the current user ID oracle.
    You can set ORACLE_BASE manually if it is required.
    Resetting ORACLE_BASE to its previous value or ORACLE_HOME
    The Oracle base has been set to /u01/app/oracle/product/12.2/db_1
    [oracle@localhost ogg]$ cd /u01/app/ogg/
    [oracle@localhost ogg]$ rlwrap ./ggsci

    Oracle GoldenGate Command Interpreter for Oracle
    Version 12.3.0.1.0 OGGCORE_12.3.0.1.0_PLATFORMS_170721.0154_FBO
    Linux, x64, 64bit (optimized), Oracle 12c on Jul 21 2017 23:31:13
    Operating system character set identified as UTF-8.

    Copyright (C) 1995, 2017, Oracle and/or its affiliates. All rights reserved.



    GGSCI (localhost.localdomain) 1> info mgr

    Manager is running (IP port localhost.localdomain.7809, Process ID 23231).


    GGSCI (localhost.localdomain) 2>

## Configure DB for OGG ##

Since the DB is multitenant, [need to use](http://docs.oracle.com/goldengate/c1221/gg-winux/GIORA/GUID-1A6D7483-BF6D-4354-904D-E9BBD0E7DD59.htm#GIORA558) [integrated capture mode](http://docs.oracle.com/goldengate/c1221/gg-winux/GIORA/GUID-6C0E8B93-FA67-4700-AC33-6E57F4DBF9B2.htm#GIORA212).

Add TNS entry (per [doc](http://docs.oracle.com/goldengate/c1221/gg-winux/GIORA/GUID-A72C7E33-6AA6-4F88-9F01-E9FC0FDE0C46.htm#GIORA982)) to `/u01/app/oracle/product/12.2/db_1/network/admin/tnsnames.ora`:

```
OGG_ORCL12C =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = 0.0.0.0)(PORT = 1521))
    (CONNECT_DATA =
      (SERVER = DEDICATED)
      (SERVICE_NAME = orcl12c)
    )
  )
```

Next, set up [Minimum Database-level Supplemental Logging](http://docs.oracle.com/goldengate/c1221/gg-winux/GIORA/GUID-55E7046C-0550-40C2-A855-904A2049F31B.htm#GIORA367)

Launch SQL*Plus: `rlwrap sqlplus SYS/oracle@orcl12c as sysdba`

Run the following:

    ALTER DATABASE ADD SUPPLEMENTAL LOG DATA;
    ALTER DATABASE FORCE LOGGING;
    SHUTDOWN IMMEDIATE
    STARTUP MOUNT
    ALTER DATABASE ARCHIVELOG;
    ALTER DATABASE OPEN;
    ALTER SYSTEM SWITCH LOGFILE;
    ALTER SYSTEM SET ENABLE_GOLDENGATE_REPLICATION=TRUE SCOPE=BOTH;
    EXIT

### Configure OGG Extract ###

Launch OGG command line:

```
[oracle@localhost ~]$ . oraenv
ORACLE_SID = [oracle] ? orcl12c
ORACLE_BASE environment variable is not being set since this
information is not available for the current user ID oracle.
You can set ORACLE_BASE manually if it is required.
Resetting ORACLE_BASE to its previous value or ORACLE_HOME
The Oracle base has been set to /u01/app/oracle/product/12.2/db_1
[oracle@localhost ~]$
[oracle@localhost ~]$ cd /u01/app/ogg/
[oracle@localhost ogg]$ rlwrap ./ggs
ggsci       ggserr.log
[oracle@localhost ogg]$ rlwrap ./ggsci

Oracle GoldenGate Command Interpreter for Oracle
Version 12.3.0.1.0 OGGCORE_12.3.0.1.0_PLATFORMS_170721.0154_FBO
Linux, x64, 64bit (optimized), Oracle 12c on Jul 21 2017 23:31:13
Operating system character set identified as UTF-8.

Copyright (C) 1995, 2017, Oracle and/or its affiliates. All rights reserved.



GGSCI (localhost.localdomain) 1>
```

Register the integrated Extract process, for the Container Database (`orcl`) - this'll take a minute or two to complete:

    DBLOGIN USERID SYSTEM@localhost:1521/orcl12c PASSWORD oracle
    REGISTER EXTRACT EXT1 DATABASE CONTAINER (ORCL)

Enter commands to enable schema logging with all columns captured, on schema `HR` in the pluggable DB (`ORCL`):

    ADD SCHEMATRANDATA ORCL.HR ALLCOLS

We can now define the extract itself:

    ADD EXTRACT EXT1, INTEGRATED TRANLOG, BEGIN NOW

Write a trail file for the extract

    ADD EXTTRAIL ./dirdat/lt EXTRACT EXT1

Specify parameters for the extract:

    EDIT PARAM EXT1

In the edit session paste:

    EXTRACT EXT1
    USERID SYSTEM@OGG_ORCL12C, PASSWORD oracle
    EXTTRAIL ./dirdat/lt
    SOURCECATALOG ORCL
    TABLE HR.*;

Save and close the file. Now we're ready to start the extract.

From the `GGSCI` prompt issue:

    START EXT1

and check that it's running:

    INFO EXT1

Expected status:

```
EXTRACT    EXT1      Last Started 2017-09-05 11:21   Status RUNNING
Checkpoint Lag       00:00:00 (updated 00:00:05 ago)
Process ID           27550
Log Read Checkpoint  Oracle Integrated Redo Logs
                     2017-09-05 11:21:18
                     SCN 0.1957461 (1957461)
```

If it doesn't start successfully then check `/u01/app/ogg/ggserr.log`.

### Smoketest ###

Log into SQL*Plus

    rlwrap sqlplus SYS/oracle@orcl as sysdba

Insert a row and commit:

    SQL> INSERT INTO HR.REGIONS VALUES (42,'FOO');

    1 row created.

    SQL> commit;

    Commit complete.

Fire up OGG's `logdump` ([ref](https://www.rittmanmead.com/blog/2016/09/using-logdump-to-debug-oracle-goldengate-and-kafka/)):

    [oracle@localhost ogg]$ rlwrap ./logdump

    Oracle GoldenGate Log File Dump Utility for Oracle
    Version 12.3.0.1.0 OGGCORE_12.3.0.1.0_PLATFORMS_170721.0154

    Copyright (C) 1995, 2017, Oracle and/or its affiliates. All rights reserved.



    Logdump 11 >GHDR ON
    Logdump 12 >DETAIL ON
    Logdump 13 >DETAIL DATA
    Logdump 14 >OPEN /u01/app/ogg/dirdat/lt000000000
    Current LogTrail is /u01/app/ogg/dirdat/lt000000000
    Logdump 15 >

Check the extract trail file and see the record added (preceeded by the table metadata):

<script src="https://gist.github.com/rmoff/db86d4b12a295aea51b55f3c5abf5236.js"></script>

## Install OGG-BD ##

Doc: [Installing Oracle GoldenGate for Big Data](http://docs.oracle.com/goldengate/bd123110/gg-bd/GBDIG/toc.htm)

Unpack OGG-BD into target folder:

    mkdir /u01/app/ogg-bd
    cp ~/Downloads/123110_ggs_Adapters_Linux_x64.zip /u01/app/ogg-bd/
    cd /u01/app/ogg-bd/
    unzip 123110_ggs_Adapters_Linux_x64.zip
    tar -xf ggs_Adapters_Linux_x64.tar

Set `LD_LIBRARY_PATH` environment variable (this needs to be set each time you prior to launching the MGR process through `ggsci`, otherwise the replicat will abort with the error `OGG-15050  Oracle GoldenGate Delivery, rkconn.prm:  Error loading Java VM runtime library: (2 No such file or directory).`). [Ref](http://docs.oracle.com/goldengate/bd123110/gg-bd/GADBD/introduction1.htm#GADBD113)

    [oracle@localhost ogg-bd]$ export LD_LIBRARY_PATH=$JAVA_HOME/jre/lib/amd64/server/
    [oracle@localhost ~]$ echo $JAVA_HOME
    /home/oracle/java/jdk1.8.0_131
    [oracle@localhost ~]$ echo $LD_LIBRARY_PATH
    /home/oracle/java/jdk1.8.0_131/jre/lib/amd64/server/
    [oracle@localhost ~]$

Create initial folders and create manager config

    oracle@localhost /u/a/ogg-bd> rlwrap ./ggsci
    Oracle GoldenGate for Big Data
    Version 12.3.1.1.0

    Oracle GoldenGate Command Interpreter
    Version 12.3.0.1.0 OGGCORE_OGGADP.12.3.0.1.0GA_PLATFORMS_170810.0015
    Linux, x64, 64bit (optimized), Generic on Aug 10 2017 01:26:22
    Operating system character set identified as UTF-8.

    Copyright (C) 1995, 2017, Oracle and/or its affiliates. All rights reserved.



    GGSCI (localhost.localdomain) 1> CREATE SUBDIRS

    Creating subdirectories under current directory /u01/app/ogg-bd

    Parameter file                 /u01/app/ogg-bd/dirprm: created.
    Report file                    /u01/app/ogg-bd/dirrpt: created.
    Checkpoint file                /u01/app/ogg-bd/dirchk: created.
    Process status files           /u01/app/ogg-bd/dirpcs: created.
    SQL script files               /u01/app/ogg-bd/dirsql: created.
    Database definitions files     /u01/app/ogg-bd/dirdef: created.
    Extract data files             /u01/app/ogg-bd/dirdat: created.
    Temporary files                /u01/app/ogg-bd/dirtmp: created.
    Credential store files         /u01/app/ogg-bd/dircrd: created.
    Masterkey wallet files         /u01/app/ogg-bd/dirwlt: created.
    Dump files                     /u01/app/ogg-bd/dirdmp: created.


    GGSCI (localhost.localdomain) 2> EDIT PARAM MGR

In the config file put:

    PORT 7801

And then from the `ggsci` prompt start the manager and confirm that it's running

    GGSCI (localhost.localdomain) 3> start mgr
    Manager started.


    GGSCI (localhost.localdomain) 4> info mgr

    Manager is running (IP port localhost.localdomain.7801, Process ID 28707).

# Install Confluent Platform 3.3 #

    sudo rpm --import http://packages.confluent.io/rpm/3.3/archive.key

Add to `/etc/yum.repos.d/confluent.repo`

```
[Confluent.dist]
name=Confluent repository (dist)
baseurl=http://packages.confluent.io/rpm/3.3/7
gpgcheck=1
gpgkey=http://packages.confluent.io/rpm/3.3/archive.key
enabled=1

[Confluent]
name=Confluent repository
baseurl=http://packages.confluent.io/rpm/3.3
gpgcheck=1
gpgkey=http://packages.confluent.io/rpm/3.3/archive.key
enabled=1
```

Install Confluent Enterprise

    sudo yum clean all
    sudo yum install confluent-platform-2.11

Modify Oracle to shut down HTTP listener on port 8081 since we don't need it and it clashes with Schema Registry. As SYSDBA run on **each** CDB/PDB run:

    exec dbms_xdb.sethttpport(0);

Then stop/start the listener.

To start Confluent Platform run

    confluent start

# Configure & Smoke Test OGG-Kafka Connect → Kafka #

## Configure for OGG-BD Kafka Connect handler  ##

([Doc](http://docs.oracle.com/goldengate/bd123110/gg-bd/GADBD/using-kafka-connect-handler.htm#GADBD-GUID-81730248-AC12-438E-AF82-48C7002178EC))

Put these files in `/u01/app/ogg-bd/dirprm`:

<script src="https://gist.github.com/rmoff/0b658cccc625eed827ade52d7abab048.js"></script>

**Be very careful with the above configuration files for any trailing whitespace** - it can cause problem, [detailed here](https://rmoff.net/2017/09/12/oracle-goldengate-kafka-connect-handler-troubleshooting/). 

Launch `ggsci`:

    cd /u01/app/ogg-bd && rlwrap ./ggsci

[Re-]Add replicat:

    stop rkconn
    pause 1
    delete replicat rkconn
    pause 1
    add replicat rkconn, exttrail /u01/app/ogg/dirdat/lt
    pause 1
    start rkconn

Check status

    info all
    info rkconn

Expect:

```
GGSCI (localhost.localdomain) 37> info all

Program     Status      Group       Lag at Chkpt  Time Since Chkpt

MANAGER     RUNNING
REPLICAT    RUNNING     RKCONN      00:00:00      00:00:05


GGSCI (localhost.localdomain) 38> info rkconn

REPLICAT   RKCONN    Last Started 2017-09-27 13:50   Status RUNNING
Checkpoint Lag       00:00:00 (updated 00:00:09 ago)
Process ID           15843
Log Read Checkpoint  File /u01/app/ogg/dirdat/lt000000002
2017-09-27 13:43:27.000000  RBA 2393

```

Check logfile `/u01/app/ogg-bd/ggserr.log` and `/u01/app/ogg-bd/dirrpt/*` for any errors.

## Smoke test OGG -- Kafka Connect --> Kafka ##

Insert a row in Oracle (as done already above)

* Log into SQL*Plus

        rlwrap sql SYS/oracle@orcl as sysdba

* Insert a row and commit:

        SQL> INSERT INTO HR.REGIONS VALUES (42,'FOO');

        1 row created.

        SQL> commit;

        Commit complete.

Check that the Kafka topic has been created

    kafka-topics --zookeeper localhost:2181 --list
    ...
    ora-ogg-HR-COUNTRIES-avro
    ora-ogg-HR-REGIONS-avro
    ...

View the record

    kafka-avro-console-consumer \
    --bootstrap-server localhost:9092 \
    --property schema.registry.url=http://localhost:8081 \
    --property print.key=true \
    --from-beginning \
    --topic ora-ogg-HR-COUNTRIES-avro

Optionally install `jq` (`sudo yum install jq`) to pretty-print the JSON displayed (remember the message is still in Avro in Kafka internally though)

```
$ kafka-avro-console-consumer \
  --bootstrap-server localhost:9092 \
  --property schema.registry.url=http://localhost:8081 \
  --from-beginning \
  --topic ora-ogg-HR-COUNTRIES-avro|jq '.'
{
  "table": {
    "string": "ORCL.HR.COUNTRIES"
  },
  "op_type": {
    "string": "I"
  },
  "op_ts": {
    "string": "2017-09-12 22:26:11.000000"
  },
  "current_ts": {
    "string": "2017-09-27 13:50:59.279000"
  },
  "pos": {
    "string": "00000000010000002739"
  },
  "COUNTRY_ID": {
    "string": "XX"
  },
  "COUNTRY_NAME": {
    "string": "FOO"
  },
  "REGION_ID": {
    "double": 42
  }
}
```

# Bonus: Install Swingbench and build/seed schema #

[Download Swingbench 2.6](http://dominicgiles.com/downloads.html)

    unzip swingbench261046.zip
    sudo mv swingbench /opt

Create the tablespace and user manually so that we can capture everything with GoldenGate (there's probably a better way to do this?)

<script src="https://gist.github.com/rmoff/959a7b090c67725abcb009017545406c.js"></script>

Define the Extract properties

    cat >> /u01/app/ogg/dirprm/EXT_SOE.prm<<EOF
    EXTRACT EXT_SOE
    USERID SYSTEM@OGG_ORCL12C, PASSWORD oracle
    EXTTRAIL ./dirdat/oe
    SOURCECATALOG ORCL
    TABLE SOE.*;
    EOF

Then launch OGG

    cd /u01/app/ogg/
    rlwrap ./ggsci

and set up capture of the schema

    DBLOGIN USERID SYSTEM@localhost:1521/orcl12c PASSWORD oracle
    REGISTER EXTRACT EXT_SOE DATABASE CONTAINER (ORCL)
    ADD SCHEMATRANDATA ORCL.SOE ALLCOLS
    ADD EXTRACT EXT_SOE, INTEGRATED TRANLOG, BEGIN NOW
    ADD EXTTRAIL ./dirdat/oe EXTRACT EXT_SOE
    START EXT_SOE

Now run Swingbench `oewizard`, and the creation of the tables and data load will be captured in OGG:

    /opt/swingbench/bin/oewizard -cs localhost:1521/orcl -cl -scale 0.1 -dbap oracle -u soe -p soe -v -create

Swingbench output:

    SwingBench Wizard
    Author  :        Dominic Giles
    Version :        2.6.0.1046

    Running in Lights Out Mode using config file : ../wizardconfigs/oewizard.xml

    [...]

    ============================================
    |           Datagenerator Run Stats        |
    ============================================
    Connection Time                        0:00:00.003
    Data Generation Time                   0:01:03.240
    DDL Creation Time                      0:00:43.730
    Total Run Time                         0:01:46.979
    Rows Inserted per sec                       19,200
    Data Generated (MB) per sec                    1.9
    Actual Rows Generated                    2,116,908

    Connecting to : jdbc:oracle:thin:@localhost:1521/orcl
    Connected

    Post Creation Validation Report
    ===============================
    The schema appears to have been created successfully.

    Valid Objects
    =============
    Valid Tables : 'ORDERS','ORDER_ITEMS','CUSTOMERS','WAREHOUSES','ORDERENTRY_METADATA','INVENTORIES','PRODUCT_INFORMATION','PRODUCT_DESCRIPTIONS','ADDRESSES','CARD_DETAILS'
    Valid Indexes : 'PRD_DESC_PK','PROD_NAME_IX','PRODUCT_INFORMATION_PK','PROD_SUPPLIER_IX','PROD_CATEGORY_IX','INVENTORY_PK','INV_PRODUCT_IX','INV_WAREHOUSE_IX','ORDER_PK','ORD_SALES_REP_IX','ORD_CUSTOMER_IX','ORD_ORDER_DATE_IX','ORD_WAREHOUSE_IX','ORDER_ITEMS_PK','ITEM_ORDER_IX','ITEM_PRODUCT_IX','WAREHOUSES_PK','WHS_LOCATION_IX','CUSTOMERS_PK','CUST_EMAIL_IX','CUST_ACCOUNT_MANAGER_IX','CUST_FUNC_LOWER_NAME_IX','ADDRESS_PK','ADDRESS_CUST_IX','CARD_DETAILS_PK','CARDDETAILS_CUST_IX'
    Valid Views : 'PRODUCTS','PRODUCT_PRICES'
    Valid Sequences : 'CUSTOMER_SEQ','ORDERS_SEQ','ADDRESS_SEQ','LOGON_SEQ','CARD_DETAILS_SEQ'
    Valid Code : 'ORDERENTRY'
    Schema Created
    oracle@localhost /o/swingbench>

For more details on how to do cool stuff with Swingbench data, including in KSQL for live joining of events with reference data, keep an eye on the [Confluent blog](https://www.confluent.io/blog/)…