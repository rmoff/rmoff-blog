---
draft: false
title: 'Scripts to extract information from OBIEE NQQuery.log'
date: "2010-06-11T09:02:49+0100"
categories:
- hack
- nqcmd
- obiee
- unix
---

Here are a couple of little unix scripts that I wrote whilst developing my [performance testing OBIEE method](/post/rnm1978/performance-testing-and-obiee//).

<!--more-->
They’re nothing particularly special, but may save you the couple of minutes it’d take to write them 🙂

Note that some of this data is available from Usage Tracking and where it is I’d recommend getting it from there, databases generally being easier to reliably and repeatably query than a transient log file.

## Extracting Logical SQL from NQQuery.log

First is how to extract logical SQL statements from NQQuery.log. This is useful if you want to build up a set of files to replay as a test load against OBIEE:

1. Use grep to extract just the logical SQL statements

   ```
   
   grep SAW_SRC NQQuery.log > NQQuery.lsql_statements.txt
   ```
2. If desired, eliminate duplicates from the file

   ```
   	sort -u NQQuery.lsql_statements.txt > NQQuery.lsql_statements.deduped.txt
   ```
3. Use split to the lsql statements into separate files:

   ```
   split -l 1 NQQuery.lsql_statements.txt replay.
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

```

# get_nq_stats.sh
# https://rmoff.net
#
# Outputs query details of the most recently executed query on BI Server
# Make sure OBIEE_HOME environment variable is set, or update this script to hardcode its location
#
# Usage 
#     get_nq_stats.sh <testref>
#
# Examples:
#   Append to file: 
#     get_nq_stats.sh testrep01 >> nq_stats.csv
#   Output to screen:
#     get_nq_stats.sh testrep01
#
tail -n12 $OBIEE_HOME/server/Log/NQQuery.log|awk -v ref=$1 'BEGIN {physical=""
rows=""
elapsed=""
} {
if ($8=="physical") {gsub(/,/,"",$10) ;physical= $10}
if ($2=="Rows" ) {rows= $6}
if ($2=="Logical") {gsub(/,/,"",$8) ; elapsed= $8}
}
END {
# print "DB Queries,Rows,Elapsed sec"
print ref "," physical "," rows "," elapsed
}
'
```

The usage for this is on an isolated sequential test environment where you run one BI query, then run this against NQQuery.log, then another query, then this against NQQuery.log etc. Each time you call this script you use a reference (that of the BI Query you’ve just run), and this will be output along with the data from NQQuery.log.  
If you call this script and pipe the output to append to a CSV file you can build up a file that looks like this:

```

Report reference,DB Queries,Rows,Elapsed sec
test_report_001,1,2171,165
test_report_002,1,12,143
test_report_003,2,10,6
test_report_004,1,1890,5
test_report_005,1,615,7
test_report_006,4,893,70
test_report_007,4,1407,77
test_report_008,1,148,126
test_report_009,1,4,48
test_report_011,1,3,152
test_report_012,1,15,430
test_report_013,8,452,141
test_report_014,1,21015,390
```

## OBIEE Replay

These snippets form part of a set of Unix and Oracle scripts that I’ve developed under the title OBIEE Replay. The idea of it is to build a harness through which Logical SQL statements can be run against the BI Server and various metrics collected, all in a repeatable manner.  
As and when I get time, I plan to post these scripts up here, so watch this space… 🙂
