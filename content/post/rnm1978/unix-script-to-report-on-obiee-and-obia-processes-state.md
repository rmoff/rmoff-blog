---
title: "Unix script to report on OBIEE and OBIA processes state"
date: "2009-08-14"
url: "/2009/08/14/unix-script-to-report-on-obiee-and-obia-processes-state/"
categories: 
  - "apache"
  - "cluster"
  - "dac"
  - "obia"
  - "OBIEE"
  - "sawserver"
  - "unix"
---

Here's a set of scripts that I use on our servers as a quick way to check if the various BI components are up and running.

![areservicesrunning](/images/rnm1978/areservicesrunning2.png "areservicesrunning")

Because we split the stack across servers, there are different scripts called in combination. On our dev boxes we have everything and so the script calls all three sub-scripts, whereas on Production each server will run one of:

1. BI Server
2. Presentation Server & OAS
3. Informatica & DAC

The scripts source another script called process\_check.sh which I based on the common.sh script that comes with OBIEE.

The BI Server script includes logic to only check for the cluster controller if it's running on a known clustered machine. This is because in our development environment we don't cluster the BI Server.

Each script details where the log files and config files can be found, obviously for your installation these will vary. I should have used variables for these, but hey, what's a hacky script if not imperfect :-)

The script was written and tested on HP-UX.

## Installation

Copy each of these onto your server in the same folder.

You might need to add that folder to your PATH.

Edit are\_processes\_running.sh so that it calls the appropriate scripts for the components you have installed.

You shouldn't need to edit any of the other scripts except to update log and config paths.

## The scripts

### are\_processes\_running.sh


```bash
# are_processes_running.sh
# RNM 2009-04-21
# https://rnm1978.wordpress.com

clear
echo "=-=-=-=-=-=-=-=-=-=-=- "
echo " "

# Comment out the scripts that are not required
# For example if there is no ETL on this server then only
# run the first two scripts
_are_BI_processes_running.sh
_are_PS_processes_running.sh
_are_INF_processes_running.sh

echo " "
echo "=-=-=-=-=-=-=-=-=-=-=- "
```


### \_are\_BI\_processes\_running.sh


```bash
# _are_BI_processes_running.sh
# RNM 2009-04-21
# https://rnm1978.wordpress.com

. process_check.sh

########## BI Server #################
echo "====="
if [ "$(is_process_running nqsserver)" = yes ]; then
  tput bold
  echo "nqsserver (BI Server) is running"
  tput rmso
else
  tput rev
  echo "nqsserver (BI Server) is not running"
  tput rmso
  echo "  To start it enter:"
  echo "    run-sa.sh start64"
fi
echo "  Log files:"
echo "    tail -n 50 -f /app/oracle/product/obiee/server/Log/NQServer.log"
echo "    tail -n 50 -f /app/oracle/product/obiee/server/Log/nqsserver.out.log"
echo "    tail -n 50 -f /app/oracle/product/obiee/server/Log/NQQuery.log"
echo "  Config file:"
echo "    view /app/oracle/product/obiee/server/Config/NQSConfig.INI"

echo "====="
if [ "$(is_process_running nqscheduler)" = yes ]; then
  tput bold
  echo "nqscheduler (BI Scheduler) is running"
  tput rmso
else
  tput rev
  echo "nqscheduler (BI Scheduler) is not running"
  tput rmso
  echo "  To start it enter:"
  echo "    run-sch.sh start64"
fi
echo "  Log files:"
echo "    tail -n 50 -f /app/oracle/product/obiee/server/Log/NQScheduler.log"
echo "    tail -n 50 -f /app/oracle/product/obiee/server/Log/nqscheduler.out.log"
echo "    ls -l /app/oracle/product/obiee/server/Log/iBots/"
echo "  Config file:"
echo "    view /data/bi/scheduler/config/instanceconfig.xml"

echo "====="
echo "$hostname"
if [ "$(hostname)" = "BICluster1" -o "$(hostname)" = "BICluster2" ]; then
  if [ "$(is_process_running nqsclustercontroller)" = yes ]; then
    tput bold
    echo "BI Cluster Controller is running"
    tput rmso
  else
    tput rev
    echo "BI Cluster Controller is not running"
    tput rmso
    echo "  To start it enter:"
    echo "    run-ccs.sh start64"
  fi
    echo "  Log files:"
  echo "    tail -n 50 -f /app/oracle/product/obiee/server/Log/NQCluster.log"
  echo "    tail -n 50 -f /app/oracle/product/obiee/server/Log/nqsclustercontroller.out.log"
  echo "  Config file:"
  echo "    view /app/oracle/product/obiee/server/Config/NQClusterConfig.INI"
else
  echo "(Not checked for Cluster Controller because not running on BICluster1 or BICluster2)"
fi
```


### \_are\_PS\_processes\_running.sh


```bash
# _are_PS_processes_running.sh
# RNM 2009-04-21
# https://rnm1978.wordpress.com

. process_check.sh

########## OAS  #################
echo "====="
if [ "$(is_process_running httpd)" = yes ]; then
  tput bold
  echo "Apache (HTTP server) is running"
  tput rmso
else
  tput rev
  echo "Apache (HTTP server) is not running"
  tput rmso
  echo "  It should have been started as part of OAS. Check that opmn (Oracle Process Manager and Notification) is running"
  echo "  If opmn is running then run this command to check the status of the components:"
  echo "    opmnctl status -l"
  echo "  If opmn is not running then start it with this command:"
  echo "    opmnctl startall"
fi
echo "  Log files:"
echo "    ls -lrt /app/oracle/product/OAS_1013/Apache/Apache/logs"
echo "  Config file:"
echo "    view /app/oracle/product/OAS_1013/Apache/Apache/conf/httpd.conf"

echo "====="
if [ "$(is_process_running opmn)" = yes ]; then
  tput bold
  echo "opmn (OAS - Oracle Process Manager and Notification) is running"
  tput rmso
else
  tput rev
  echo "opmn (OAS - Oracle Process Manager and Notification) is not running"
  tput rmso
  echo "  To start it use this command:"
  echo "    opmnctl startall"
fi
echo "  Log files:"
echo "    ls -lrt /app/oracle/product/OAS_1013/opmn/logs"
echo "    ls -lrt /app/oracle/product/OAS_1013/j2ee/home/log"
echo "  Config file:"
echo "    view /app/oracle/product/OAS_1013/opmn/conf/opmn.xml"
echo "    view /app/oracle/product/OAS_1013/j2ee/home/config/server.xml"

########## Presentation Services #################
echo "====="
if [ "$(is_process_running javahost)" = yes ]; then
  tput bold
  echo "javahost is running"
  tput rmso
else
  tput rev
  echo "javahost is not running"
  tput rmso
  echo "  It is started as part of the sawserver startup script"
  echo "  To start it run this command:"
  echo "    run-saw.sh start64"
    echo "  To start it independently run this command:"
  echo "    /app/oracle/product/obiee/web/javahost/bin/run.sh"
  fi
echo "  Log files:"
echo "    ls -lrt /data/web/web/log/javahost/"
echo "  Config file:"
echo "    view /app/oracle/product/obiee/web/javahost/config/config.xml"

echo "====="
if [ "$(is_process_running sawserver)" = yes ]; then
  tput bold
  echo "sawserver (Presentation Services) is running"
  tput rmso
else
  tput rev
  echo "sawserver (Presentation Services) is not running"
  tput rmso
  echo "  To start it enter:"
  echo "    run-saw.sh start64"
fi
echo "  Log files:"
echo "    tail -n 50 -f /data/web/web/log/sawserver.out.log"
echo "    tail -n 50 -f /data/web/web/log/sawlog0.log"

echo "  Config file:"
echo "    view /data/web/web/config/instanceconfig.xml"
echo "    ls -l /data/web/web/config/"
```


### \_are\_INF\_processes\_running.sh


```bash
# _are_INF_processes_running.sh
# RNM 2009-04-22
# https://rnm1978.wordpress.com

. process_check.sh

########## Informatica #################
echo "====="
inf_running=1
if [ "$(is_process_running server/bin/pmrepagent)" = yes ]; then
  tput bold
  echo "pmrepagent (Informatica Repository Server) is running"
  tput rmso
else
  tput rev
  echo "pmrepagent (Informatica Repository Server) is not running"
  tput rmso
  inf_running=0
fi
if [ "$(is_process_running server/bin/pmserver)" = yes ]; then
  tput bold
  echo "pmserver (Informatica Server) is running"
  tput rmso
else
  tput rev
  echo "pmserver (Informatica Server) is not running"
  tput rmso
  inf_running=0
fi
if [ "$inf_running" -eq 0 ]; then
  echo " "
  echo "  To start PowerCenter:"
  echo "    cd /app/oracle/product/informatica/server/tomcat/bin"
  echo "    infaservice.sh startup"
fi
echo " "
echo "  Log files (PowerCenter):"
echo "    ls -lrt /app/oracle/product/informatica/server/tomcat/logs"
echo " "
echo "  Log files (ETL jobs):"
echo "    ls -lrt /app/oracle/product/informatica/server/infa_shared/SessLogs"
echo "    ls -lrt /app/oracle/product/informatica/server/infa_shared/WorkflowLogs"

########## DAC #################

echo "====="
if [ "$(is_process_running com.siebel.etl.net.QServer)" = yes ]; then
  tput bold
  echo "DAC is running"
  tput rmso
else
  tput rev
  echo "DAC is not running"
  tput rmso
  echo " "
  echo "  To start the DAC server:"
  echo "    cd /app/oracle/product/informatica/DAC_Server/"
  echo "    nohup startserver.sh &"
  echo " "
fi
echo "  Log files:"
echo "    ls -lrt /app/oracle/product/informatica/DAC_Server/log"
```


### process\_check.sh


```bash
# process_check.sh
# get_pid plagiarised from OBIEE common.sh
# RNM 2009-04-03
# RNM 2009-04-30 Exclude root processes (getting false positive from OpenView polling with process name)

get_pid ()
{
 echo `ps -ef| grep $1 | grep -v grep | grep -v "    root " | awk '{print $1}'` # the second grep excludes the grep process from matching itself, the third one is a hacky way to avoid root processes
}

is_process_running ()
{
process=$1
#echo $process
procid=`get_pid $process`
#echo $procid
if test "$procid" ; then
 echo "yes"
else
 echo "no"
fi
}
```

