+++
author = "Robin Moffatt"
categories = ["sawserver", "logging", "diagnostics"]
date = 2016-06-01T11:03:00Z
description = ""
draft = false
slug = "presentation-services-logsources-in-obiee-12c"
tags = ["sawserver", "logging", "diagnostics"]
title = "Presentation Services Logsources in OBIEE 12c"

+++

Presentation Services can provide some very detailed logs, useful for troubleshooting, performance tracing, and general poking around. [See here](http://www.rittmanmead.com/2014/11/auditing-obiee-presentation-catalog-activity-with-custom-log-filters/) for details.

There's no `bi-init.sh` in 12c, so need to set up the `LD_LIBRARY_PATH` ourselves: 

```bash
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/app/oracle/biee/bi/bifoundation/web/bin/:/app/oracle/biee/bi/lib/:/app/oracle/biee/lib/:/app/oracle/biee/bi/bifoundation/odbc/lib/
```

Run `sawserver` with flag to list all log sources
```
/app/oracle/biee/bi/bifoundation/web/bin/sawserver -logsources > saw_logsources_12.2.1.txt
```

Full list: https://gist.github.com/rmoff/e3be9009da6130839c71181cb58509a0
