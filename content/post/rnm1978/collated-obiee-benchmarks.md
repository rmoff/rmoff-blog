---
title: "Collated OBIEE benchmarks"
date: "2009-09-18"
categories: 
  - "obiee"
  - "performance"
---

(Updated 12th Oct 09)

Here's a list of the OBIEE benchmark documents published by Oracle:

<table class="inline" border="0"><tbody><tr class="row0"><td class="col0"><strong>Benchmark</strong></td><td class="col1"><strong>Date</strong></td><td class="col2"><strong>Source document</strong></td></tr><tr class="row0"><td class="col0">1 - IBM System x3755</td><td class="col1">Sep-07</td><td class="col2"><a class="urlextern" title="http://www.oracle.com/appserver/business-intelligence/docs/bi-suite-ee-4000-benchmark-x3755.pdf" rel="nofollow" href="http://www.oracle.com/appserver/business-intelligence/docs/bi-suite-ee-4000-benchmark-x3755.pdf" target="_ext">PDF</a></td></tr><tr class="row1"><td class="col0">2 - HP DL380 G4</td><td class="col1">Sep-07</td><td class="col2"><a class="urlextern" title="http://www.oracle.com/appserver/business-intelligence/docs/oracle-biee-5k-user-benchmark-hpdl3802.pdf" rel="nofollow" href="http://www.oracle.com/appserver/business-intelligence/docs/oracle-biee-5k-user-benchmark-hpdl3802.pdf" target="_ext">PDF</a></td></tr><tr class="row2"><td class="col0">3 - Sun T2000</td><td class="col1">Sep-07</td><td class="col2"><a class="urlextern" title="http://www.oracle.com/appserver/business-intelligence/docs/oracle-bi-ee-10k-benchmark-sunt2000.pdf" rel="nofollow" href="http://www.oracle.com/appserver/business-intelligence/docs/oracle-bi-ee-10k-benchmark-sunt2000.pdf" target="_ext">PDF</a></td></tr><tr class="row3"><td class="col0">4 - Sun SPARC Enterprise T5440</td><td class="col1">Aug-09</td><td class="col2"><a class="urlextern" title="http://www.oracle.com/appserver/business-intelligence/docs/oraclebiee_28000user_benchmark_on_solaris_t5440.pdf" rel="nofollow" href="http://www.oracle.com/appserver/business-intelligence/docs/oraclebiee_28000user_benchmark_on_solaris_t5440.pdf" target="_ext">PDF</a></td></tr><tr class="row3"><td class="col0">5 - Sun SPARC Enterprise T5440</td><td class="col1">Oct-09</td><td class="col2"><a class="urlextern" title="http://www.oracle.com/appserver/business-intelligence/docs/oraclebiee_50000user_benchmark_on_solaris_t5440.pdf" rel="nofollow" href="http://www.oracle.com/appserver/business-intelligence/docs/oraclebiee_50000user_benchmark_on_solaris_t5440.pdf" target="_ext">PDF</a></td></tr></tbody></table>

Collecting the numbers into one table gives this: [![benchmarks](/images/rnm1978/benchmarks2.png "benchmarks")](http://rnm1978.files.wordpress.com/2009/09/benchmarks2.png)

Based on the details in the documents I think these were all against OBIA's Service Analytics schema & dashboards/reports.

Interesting to note the side-by-side comparison in benchmark 3 (Sun T2000) of two servers, in one case both running BI and Presentation Services and in the other having the two components separate. It appears to highlight the benefit that clustering provides in making the best use of resources.

For full details of the benchmarks see the source documents linked to above.
