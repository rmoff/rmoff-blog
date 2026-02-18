---
draft: false
title: 'Collated OBIEE benchmarks'
date: "2009-09-18T13:10:49+0000"
image: "/images/2009/09/benchmarks2.webp"
categories:
- obiee
- performance
---

(Updated 12th Oct 09)

<!--more-->
Here’s a list of the OBIEE benchmark documents published by Oracle:

|  |  |  |
| --- | --- | --- |
| **Benchmark** | **Date** | **Source document** |
| 1 – IBM System x3755 | Sep-07 | [PDF](http://www.oracle.com/appserver/business-intelligence/docs/bi-suite-ee-4000-benchmark-x3755.pdf "http://www.oracle.com/appserver/business-intelligence/docs/bi-suite-ee-4000-benchmark-x3755.pdf") |
| 2 – HP DL380 G4 | Sep-07 | [PDF](http://www.oracle.com/appserver/business-intelligence/docs/oracle-biee-5k-user-benchmark-hpdl3802.pdf "http://www.oracle.com/appserver/business-intelligence/docs/oracle-biee-5k-user-benchmark-hpdl3802.pdf") |
| 3 – Sun T2000 | Sep-07 | [PDF](http://www.oracle.com/appserver/business-intelligence/docs/oracle-bi-ee-10k-benchmark-sunt2000.pdf "http://www.oracle.com/appserver/business-intelligence/docs/oracle-bi-ee-10k-benchmark-sunt2000.pdf") |
| 4 – Sun SPARC Enterprise T5440 | Aug-09 | [PDF](http://www.oracle.com/appserver/business-intelligence/docs/oraclebiee_28000user_benchmark_on_solaris_t5440.pdf "http://www.oracle.com/appserver/business-intelligence/docs/oraclebiee_28000user_benchmark_on_solaris_t5440.pdf") |
| 5 – Sun SPARC Enterprise T5440 | Oct-09 | [PDF](http://www.oracle.com/appserver/business-intelligence/docs/oraclebiee_50000user_benchmark_on_solaris_t5440.pdf "http://www.oracle.com/appserver/business-intelligence/docs/oraclebiee_50000user_benchmark_on_solaris_t5440.pdf") |

Collecting the numbers into one table gives this:  
[![benchmarks](/images/2009/09/benchmarks2.webp "benchmarks")](/images/2009/09/benchmarks2.webp)

Based on the details in the documents I think these were all against OBIA’s Service Analytics schema & dashboards/reports.

Interesting to note the side-by-side comparison in benchmark 3 (Sun T2000) of two servers, in one case both running BI and Presentation Services and in the other having the two components separate. It appears to highlight the benefit that clustering provides in making the best use of resources.

For full details of the benchmarks see the source documents linked to above.
