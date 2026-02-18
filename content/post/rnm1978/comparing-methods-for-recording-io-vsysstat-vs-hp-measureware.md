---
draft: false
title: 'Comparing methods for recording I/O – V$SYSSTAT vs HP Measureware'
date: "2011-03-09T13:38:50+0000"
image: "/images/2011/03/io_compare_sampling_methods.webp"
categories:
- io
- oracle
- rrdtool
- unix
---

I wrote last year about [Graphing I/O data using gnuplot and Oracle V$SYSSTAT](/post/rnm1978/graphing-io-data-using-gnuplot-and-oracle-vsysstat//), using a script from Kevin Closson in his article [How To Produce Raw, Spreadsheet-Ready Physical I/O Data With PL/SQL. Good For Exadata, Good For Traditional Storage](http://kevinclosson.wordpress.com/2009/04/28/how-to-produce-raw-spreadsheet-ready-physical-io-data-with-plsql-good-for-exadata-good-for-traditional-storage/).  
Here I’ve got a simple comparison of the data recorded through this script (in essence, Oracle’s V$SYSSTAT), and directly on the OS through HP’s MeasureWare. It’s graphed out with my new favourite tool, rrdtool:

<!--more-->
[![](/images/2011/03/io_compare_sampling_methods.webp "io_compare_sampling_methods")](/images/2011/03/io_compare_sampling_methods.webp)

Happily for me, the data marries up almost exactly. One might say that so it ought. But it’s always good to have explicit proof of such a supposition.
