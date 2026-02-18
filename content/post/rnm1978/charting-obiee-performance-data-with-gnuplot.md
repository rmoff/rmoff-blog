---
title: "Charting OBIEE performance data with gnuplot"
date: "2010-12-06"
categories: 
  - "gnuplot"
  - "jmx"
  - "monitoring"
  - "OBIEE"
  - "unix"
  - "visualisation"
---

## Introduction

This is the second part of three detailed articles making up a mini-series about [OBIEE monitoring](/2010/12/06/obiee-monitoring/). It demonstrates how to capture OBIEE performance information, and optionally graph it out and serve it through an auto-updating webpage.

This article takes data that [part one](/2010/12/06/collecting-obiee-systems-management-data-with-jmx/) showed you how to collect into a tab-separated file that looks something like this:


```
2010-11-29-14:48:18 1 0 11 0 3 2 1 676 340 0 53 1 0 41 0 3 0 2010-11-29-14:49:18 1 0 11 0 3 2 1 676 0 0 0 1 0 0 0 3 0 2010-11-29-14:50:18 2 0 16 1 4 3 1 679 0 0 0 1 0 0 0 4 0 2010-11-29-14:51:18 2 2 19 1 4 3 1 679 32 0 53 1 0 58 0 4 0 2010-11-29-14:52:18 2 1 19 1 4 3 4 682 0 0 0 1 0 0 0 4 0 2010-11-29-14:53:18 2 1 19 1 4 3 4 682 0 0 0 1 0 0 0 4 0 2010-11-29-14:54:18 2 0 19 1 4 3 1 682 0 0 0 1 0 0 0 4 0
```


and plot it into something like looks like this: ![](/images/rnm1978/summary-6hr.png "summary.6hr")

## gnuplot

Depending on what you're wanting to use the data for, and your level of comfort with command-line tools, you may just want to take your datafile and plot it with something like Excel for ad-hoc analysis. However, for fully automated data capture and rendering, I'd recommend giving gnuplot a go. It's not the simplest of tools and the documentation is so vast as to be overwhelming - but if you've the time to tweak it then you will find it very flexible.

gnuplot can be run interactively (which is useful for trialling settings) or as part of batch script, and can output to screen or file (eg. png). It assumes that your data is tab separated (which it should be if you've used my script).

The key bit to understand is the "plot xxx using yyy" statement. In this, xxx is your data file, whilst yyy is the columns to plot for x and y data respectively. So assuming that your x-axis is time and the first column in your datafile, and you want to plot the number of Active Sessions (which in my script is the fourth metric, so the fifth column - time being the first), you would have "using 1:5". 
```
plot "datafile.jmx" using 1:5 with lines
```


To plot to a PNG file, use a script like this:


```bash
gnuplot <<EOF set xdata time set timefmt "%Y-%m-%d-%H:%M:%S" set format x "%d %b\\n%H:%M" set yrange\[0:30\] set grid set key box outside below set terminal png font "arial, 7" size 410,200 enhanced truecolor set output "graph01.png" set title "Oracle BI PS Sessions\\nActive Sessions" plot "datafile.jmx" using 1:5 with lines
```


This line invokes gnuplot, and <<EOF tells it to pass the subsequent lines to gnuplot until end of file (or you put EOF literal in the file).


```
gnuplot <<EOF
```


This sets the x-axis as a time axis, gnuplot then scales it appropriately. The timefmt defines the format of the time data in the input file.


```
set xdata time set timefmt "%Y-%m-%d-%H:%M:%S"
```


The format of the axis labels on the x-axis is defined thus:


```
set format x "%d %b\\n%H:%M"
```


This hard-codes the y-axis range. Use "set autoscale" to revert to the default of gnuplot setting the range.


```
set yrange\[0:30\]
```


This puts a grid on the chart, and defines the title


```
set grid set title "Oracle BI PS Sessions\\nActive Sessions"
```


This tells gnuplot to write to a png file, using arial 7pt font, 410x200 pixels, and higher resolution. The "set output" command defines the actual filename.


```
set terminal png font "arial, 7" size 410,200 enhanced truecolor set output "graph01.png"
```


If you omit the "set terminal png \[...\]" line you'll get an interactive graph from gnuplot, which can be useful for testing different settings.

## Plotting multiple datasets

You can visualise multiple datasets alongside each other easily in gnuplot. You might want to do this for related metrics (eg Active Sessions vs Current Sessions), or a clustered OBIEE deployment:

![](/images/rnm1978/obia_6hr.png "obia_6hr")

![](/images/rnm1978/summary-6hr.png "summary.6hr")

To do this you append multiple statements to the "plot" command, separated by a comma: 
```
plot "datafile\_server01.jmx" using 1:4 with lines title "Server 01"\\ , "datafile\_server02.jmx" using 1:4 with lines title "Server 02"
```
 (the \\ is a line-continuation character)

The title for each dataset is defined as part of the statement as is seen above. This can be shown in a key which is enabled by default and can be moved to the bottom of the graph by using: 
```
set key box outside below
```


## Generating gnuplot scripts automagically

You may have realised by now that this is all quite fiddly to set up. Here are two scripts that will help generate gnuplot scripts. It's based on the tcl script from [part one](/2010/12/06/collecting-obiee-systems-management-data-with-jmx/) and uses the first item in the array, ID, to determine the column number that a metric will appear in in the datafile.

This first one writes a series of gnuplot statements to plot each metric out on an individual graph, and assumes you have a two-server cluster so plots the datafiles from two servers on the same graph. 
```bash
cat gnuplot\_header grep lappend obieejmx\_server01.tcl|\\ sed s/{//g|\\ sed s/}//g|\\ sed s/"lappend mbeanattrs "//g|\\ sed s/"Oracle BI Management:Oracle BI=Performance,AppName="//g|\\ sed s/"Oracle BI Server,"/"BI"/g|\\ sed s/"name=Oracle BI General"/""/g|\\ sed s/"type=Oracle BI Physical DB,name=Oracle Data Warehouse"/"DB"/g|\\ sed s/"type=Oracle BI DB Connection Pool,name=Star\_Oracle Data Warehouse\_Oracle Data Warehouse Connection Pool"/"Conn Pool"/g|\\ sed s/"Oracle BI Presentation Server,name=Oracle BI PS "/"BIPS"/g|\\ sed s/"Connection"/"Conn"/g|\\ sed s/"Current"/"Curr"/g|\\ sed s/"Sessions"/"Sess"/g|\\ awk 'FS="\\t" { $1+=1 print "set output \\""$1".png\\"" print "set title \\"" $2 "\\\\n" $3 "\\"" print "plot \\"server01.jmx\\" using 1:" $1 " with lines title \\"server01\\",\\"server02.jmx\\" using 1:" $1 " with lines title \\"server02\\"" }'
```


gnuplot\_header is a file you need to create in the same directory, and can just be a copy of the example gnuplot statement above.

This script plots multiple metrics for a single server onto the same graph. You may want to break the statements up into separate graph plots to group together related metrics or ones with similar ranges - this script will at least give you the correct column and titles to get you started. 
```bash
cat gnuplot\_header grep lappend obieejmx\_server01.tcl|\\ sed s/{//g|\\ sed s/}//g|\\ sed s/"lappend mbeanattrs "//g|\\ sed s/"Oracle BI Management:Oracle BI=Performance,AppName="//g|\\ sed s/"Oracle BI Server,"/"BI"/g|\\ sed s/"name=Oracle BI General"/""/g|\\ sed s/"type=Oracle BI Physical DB,name=Oracle Data Warehouse"/"DB"/g|\\ sed s/"type=Oracle BI DB Connection Pool,name=Star\_Oracle Data Warehouse\_Oracle Data Warehouse Connection Pool"/"Conn Pool"/g|\\ sed s/"Oracle BI Presentation Server,name=Oracle BI PS "/"BIPS"/g|\\ sed s/"Connection"/"Conn"/g|\\ sed s/"Current"/"Curr"/g|\\ sed s/"Sessions"/"Sess"/g|\\ awk 'BEGIN { FS="\\t" print "set output \\"server01.png\\"" print "set title \\"server01\\"" printf "plot " } { $1+=1 if (NR>1) {printf "\\\\\\n,"} printf " \\"server01.jmx\\" using 1:" $1 " with lines title \\"" $2 ":" $3 "\\"" } END {print ""}'
```


Both scripts use a series of sed statements to try and trim down the MBean names into something shorter for plotting on the graph key.

An example output would look something like this: 
```bash
# One metric per graph, across two servers gnuplot --persist <<EOF set xdata time set timefmt "%Y-%m-%d-%H:%M:%S" set format x "%d %b\\n%H:%M" set grid set key box outside below set terminal png font "arial, 7" size 410,200 enhanced truecolor set yrange \[0:30\] set output "2.obiee.png" set title "Oracle BI Presentation Server - Oracle BI PS Connection Pool\\nCurrent Open Connections" plot "server01.jmx" using 1:2 with lines title "server01","server02.jmx" using 1:2 with lines title "server02" set output "3.obiee.png" set title "Oracle BI Presentation Server - Oracle BI PS Query Cache\\nCurrent Running Queries" plot "server01.jmx" using 1:3 with lines title "server01","server02.jmx" using 1:3 with lines title "server02" set output "5.obiee.png" set title "Oracle BI Presentation Server - Oracle BI PS Sessions\\nActive Sessions" plot "server01.jmx" using 1:5 with lines title "server01","server02.jmx" using 1:5 with lines title "server02" set output "6.obiee.png" set title "Oracle BI Presentation Server - Oracle BI PS Sessions\\nCurrent Sessions" plot "server01.jmx" using 1:6 with lines title "server01","server02.jmx" using 1:6 with lines title "server02" set output "7.obiee.png" set title "Oracle BI Presentation Server - Oracle BI PS Sessions\\nSessions Logged On" plot "server01.jmx" using 1:7 with lines title "server01","server02.jmx" using 1:7 with lines title "server02" set output "8.obiee.png"
```



```bash
# Single server, multiple metrics on one graph gnuplot --persist <<EOF set xdata time set timefmt "%Y-%m-%d-%H:%M:%S" set format x "%d %b\\n%H:%M" set grid set key box outside right set terminal png font "arial,9" size 1224,500 enhanced truecolor

set output "server01.png" set title "server01" set yrange\[0:30\] plot "server01.jmx" using 1:2 with lines title "BIPSConn Pool:Curr Open Conns"\\ , "server01.jmx" using 1:3 with lines title "BIPSQuery Cache:Curr Running Queries"\\ , "server01.jmx" using 1:5 with lines title "BIPSSess:Active Sess"\\ , "server01.jmx" using 1:6 with lines title "BIPSSess:Curr Sess"\\ , "server01.jmx" using 1:7 with lines title "BIPSSess:Sess Logged On"\\ , "server01.jmx" using 1:8 with lines title "BIConn Pool:Curr Busy Conn Count"\\ , "server01.jmx" using 1:13 with lines title "BI:Active Execute Requests"\\ , "server01.jmx" using 1:14 with lines title "BI:Active Fetch Requests"\\ , "server01.jmx" using 1:17 with lines title "BI:Total sessions"
```


## Plotting subsets of data

You may well want to plot out subsets of the graph data, for example, the last 24 hours. This is simple to do, just run the jmx datafile through something like tail first: 
```bash
# Create 24 hour extract of data # Data is sampled every minute, so the last 24 hours will be 60\*24 = 1440 tail -n 1440 server01.jmx > server01.24hr.jmx
```


## Refreshing your graphs automagically

Assuming you've got your graph plotting script(s) in separate shell file(s), create a wrapper like this: 
```bash
# Uncomment this for debug, to echo each statement as it's executed # set -x # # This will loop for ever and ever # (or until one becomes less than two) while \[ 1 -lt 2 \] do # create any subset data files, using tail, as described above ./create\_6hr\_logs.sh ./create\_24hr\_logs.sh # plot your graph(s) ./plot\_by\_server.sh ./plot\_by\_server\_summary.sh ./plot\_by\_server\_6hr.sh ./plot\_by\_server\_6hr\_summary.sh ./plot\_6hr\_graphs.sh ./plot\_24hr\_graphs.sh # Copy all output png files to a tmp folder # from where they'll be served up as a web page # (I told you it was a hack) cp \*.png /tmp/obieejmx chmod g+r /tmp/obieejmx/\*.png # # Write the current time, for debug purposes date # Wait for a minute sleep 60 done
```


And then run your wrapper in the same way as the metric collection, using nohup and & 
```bash
nohup ./run\_graphs\_forever.sh &
```


## What next?

So you've got your data ... you've got your graphs ... now why not serve them up through a convenient webpage that refreshes automatically? [Click here for part three](/2010/12/06/adding-obiee-monitoring-graphs-into-oas/) that shows you how to bolt this onto an existing OAS installation.
