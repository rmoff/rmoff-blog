---
title: "Scripts to extract information from OBIEE NQQuery.log"
date: "2010-06-11"
categories: 
  - "hack"
  - "nqcmd"
  - "OBIEE"
  - "unix"
---

Here are a couple of little unix scripts that I wrote whilst developing my [performance testing OBIEE method](/post/rnm1978/performance-testing-and-obiee/).

They're nothing particularly special, but may save you the couple of minutes it'd take to write them :)

Note that some of this data is available from Usage Tracking and where it is I'd recommend getting it from there, databases generally being easier to reliably and repeatably query than a transient log file.

## Extracting Logical SQL from NQQuery.log

First is how to extract logical SQL statements from NQQuery.log. This is useful if you want to build up a set of files to replay as a test load against OBIEE:

1. Use grep to extract just the logical SQL statements
```bash
grep SAW\_SRC NQQuery.log > NQQuery.lsql\_statements.txt
```

2. If desired, eliminate duplicates from the file
```bash
sort -u NQQuery.lsql\_statements.txt > NQQuery.lsql\_statements.deduped.txt
```

3. Use split to the lsql statements into separate files: 
```bash
split -l 1 NQQuery.lsql\_statements.txt replay.
```
 This creates a set of files with a replay. prefix and xx suffix, eg.
    - replay.aa
    - replay.ab
    - etc

## Extracting query metrics from NQQuery.log

The next snippet will parse the end of the NQQuery.log and output query execution details:

- Number of database queries
- How many rows were returned
- How long it took


```bash
# get\_nq\_stats.sh # https://rmoff.net # # Outputs query details of the most recently executed query on BI Server # Make sure OBIEE\_HOME environment variable is set, or update this script to hardcode its location # # Usage # get\_nq\_stats.sh <testref> # # Examples: # Append to file: # get\_nq\_stats.sh testrep01 >> nq\_stats.csv # Output to screen: # get\_nq\_stats.sh testrep01 # tail -n12 $OBIEE\_HOME/server/Log/NQQuery.log|awk -v ref=$1 'BEGIN {physical="" rows="" elapsed="" } { if ($8=="physical") {gsub(/,/,"",$10) ;physical= $10} if ($2=="Rows" ) {rows= $6} if ($2=="Logical") {gsub(/,/,"",$8) ; elapsed= $8} } END { # print "DB Queries,Rows,Elapsed sec" print ref "," physical "," rows "," elapsed } '
```
 The usage for this is on an isolated sequential test environment where you run one BI query, then run this against NQQuery.log, then another query, then this against NQQuery.log etc. Each time you call this script you use a reference (that of the BI Query you've just run), and this will be output along with the data from NQQuery.log. If you call this script and pipe the output to append to a CSV file you can build up a file that looks like this: 
```
Report reference,DB Queries,Rows,Elapsed sec test\_report\_001,1,2171,165 test\_report\_002,1,12,143 test\_report\_003,2,10,6 test\_report\_004,1,1890,5 test\_report\_005,1,615,7 test\_report\_006,4,893,70 test\_report\_007,4,1407,77 test\_report\_008,1,148,126 test\_report\_009,1,4,48 test\_report\_011,1,3,152 test\_report\_012,1,15,430 test\_report\_013,8,452,141 test\_report\_014,1,21015,390
```


## OBIEE Replay

These snippets form part of a set of Unix and Oracle scripts that I've developed under the title OBIEE Replay. The idea of it is to build a harness through which Logical SQL statements can be run against the BI Server and various metrics collected, all in a repeatable manner. As and when I get time, I plan to post these scripts up here, so watch this space... :-)
