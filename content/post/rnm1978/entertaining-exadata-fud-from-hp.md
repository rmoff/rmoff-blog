---
draft: false
title: 'Entertaining Exadata FUD from HP'
date: "2011-04-11T09:06:16+0100"
categories:
- DWH
- Exadata
- HP
- oracle
---

Chris Mellor at The Register posted an interesting article a couple of days ago, entitled [HP and Violin build Oracle Exadata killer](http://www.theregister.co.uk/2011/04/07/hp_violin_exadata_killer/). The slidedeck has been removed from HP’s FTP site, but a bit of Google magic throws up [a couple of mirror copies](http://www.google.co.uk/search?q=feb2511_Iwicki.pdf+filetype:pdf&num=30&hl=en&safe=off&prmd=ivns&filter=0).

<!--more-->
It’s an entertaining read (*“Do a Proof of Concept! 94% win rate!! We can and do win against Exadata!!”*), and a nice illustration of the [FUD](http://en.wikipedia.org/wiki/Fear,_uncertainty_and_doubt) techniques that companies use in marketing their products against others. Greg Rahn has [taken Netezza to task in the past](http://structureddata.org/tag/fud/) for this, and to be fair at least Netezza had a serious white paper to back up their arguments. HP’s deck (including choice sections such as “How to sell against Exadata”) is IMHO nothing more than a biased set of arguments for salespeople to use to attempt to bullshit customers.

The deck is entirely aimed at OLTP workloads, and lays all its weight on the IOPS you’ll get from lots of Flash memory (the Violin bit). As any ful kno, building a Data Warehouse on a system based on IOPS with no reference to throughput (GB/s), it doomed to painful failure. My understanding of Exadata is that it’s in part all about a properly balanced configuration. Unbalance this configuration at your peril, as you’ll start pushing unidentified bottlenecks around your system.

[Kevin Closson](http://kevinclosson.wordpress.com/) (ex-Oracle performance architect on Exadata, [now at EMC](http://kevinclosson.wordpress.com/2011/03/29/kevin-closson-joins-emc-data-computing-division-to-focus-on-greenplum-performance-engineering/)), commented on The Register article:

> *By my assessment the HPDBS (DL980 + Violin solution) is likely not positioned as an Exadata killer for bandwidth-sensitive DW/BI workloads. It simply doesn’t have enough high-bandwidth storage plumbing.*

Ironically for HP, they actually quote Kevin in their slide deck with a selective quotation from his blog article about a TPC-H benchmark result [here](http://kevinclosson.wordpress.com/2009/09/07/world-record-tpc-h-result-proves-oracle-exadata-storage-server-is-10x-faster-than-conventional-storage-on-a-per-disk-basis/). The quote is used to imply that Exadata isn’t anything other than just disks thrown together. If you’re going to selectively quote, how about this one in the next paragraph of the same article – “*I’m just comparing one Oracle Database 11g result to another Oracle Database 11g resul[…]The benchmark result was outstanding and it was Oracle technology in both the Database and Storage grid[…]*” …

Kevin goes on to comment on HPDBS:

> *On the other hand, a single-rack Exadata only supports a scalable read:write ratio of 40:1 (their data sheet 1,000,000 RIOP : 50,000 WIOPS). Actually, that 50,000 WIOPS is a gross number accounting neither for redundant writes (ASM redundancy) nor the larger sequential writes that a transaction processing system also must concurrently sustain. In other words, mileage varies (downward trend)*

Maybe HPDBS is a good solution, maybe it’s not. The deck certainly wasn’t published for public consumption so maybe it’s unfair to judge it on that. But it’s an interesting peek into the murky workings of technical sales. I’d be naïve to think that there isn’t a whole bunch of Oracle decks with similar “how to sell against xxxx” sections.

At the end of the day, solutions need to be judged on hard facts and whole pictures alone. For that reason, I’d take the technical blogs of respected writers any day above a sales pitch. Kevin Closson is a good example of this – working for a competitor he could easily have taken the opportunity to stick the knife in to Exadata, but as a respected technical writer he lets the facts speak for themselves.
