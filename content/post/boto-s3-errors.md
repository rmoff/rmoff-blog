+++
categories = ["boto", "s3", "aws", "python"]
date = 2016-10-14T08:41:30Z
description = ""
draft = false
slug = "boto-s3-errors"
tag = ["boto", "s3", "aws", "python"]
title = "boto / S3 errors"

+++

Presented without comment, warranty, or context -  other than these might help a wandering code hacker. 

### When using SigV4, you must specify a 'host' parameter

    boto.s3.connection.HostRequiredError: BotoClientError: When using SigV4, you must specify a 'host' parameter.

To fix, switch

```python
conn_s3 = boto.connect_s3()
```

for

```python
conn_s3 = boto.connect_s3(host='s3.amazonaws.com')
```

You can see a list of endpoints [here](http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region). 

### boto.exception.S3ResponseError: S3ResponseError: 400 Bad Request

Make sure you're specifying the correct hostname (see above) for the bucket's region. Determine the bucket's region from the S3 control panel, and then use the [endpoint listed here](http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region).
