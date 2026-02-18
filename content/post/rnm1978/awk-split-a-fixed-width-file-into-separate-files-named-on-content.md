---
title: "awk - split a fixed width file into separate files named on content"
date: "2010-10-19"
categories: 
  - "OBIEE"
---

More of a unix thing than DW/BI this post, but I have a beard so am semi-qualified....

The requirement was to improve the performance of some ODI processing that as part of its work was taking one huge input file, and splitting it into chunks based on content in the file. To add some (minor) spice the file was fixed width with no deliminators, so the easy awk answers that I found on google weren't applicable.

Source file, to be split based on cols 14-16: 
```
0000000010069583000A 0000000010083583000A 0000000011600583000B 0000000011936584000D 0000000010101584000E 0000000010903584000G 0000000010517585000Q
```


Output files: prefix.583.dat 
```
0000000010069583000A 0000000010083583000A 0000000011600583000B
```


prefix.584.dat 
```
0000000011936584000D 0000000010101584000E 0000000010903584000G
```


prefix.585.dat 
```
0000000010517585000Q
```


So without further ado, my little command-line gem: 
```bash
awk '{fn=substr($0,14,3);print > ("prefix." fn ".dat")}' file.dat
```
 Where:

- the output filename is made up of characters from column 14 in the input record for 3 characters
- file.dat is the input filename

For extra brownie points, incorporate components of the input filename in the output filenames: 
```bash
awk 'BEGIN {dt=substr(FILENAME,6,8)} {fn=substr($0,14,3);print > ("prefix." fn "." dt ".dat")}' file.20101018.dat
```


As a sidenote, this is an example of choosing the right tools for the job - when there's simple commandline tools that can be scripted like this, using a heavyweight tool like ODI is overkill and can indeed land you with performance problems.

\[edit\] Ted Dziuba has written a great article here on how unix utilities can often be the right tool for the job: [Taco Bell Programming](http://teddziuba.com/2010/10/taco-bell-programming.html). \[/edit\]
