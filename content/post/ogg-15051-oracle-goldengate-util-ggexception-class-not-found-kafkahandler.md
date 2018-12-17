+++
author = "Robin Moffatt"
categories = ["kafka", "goldengate", "ogg", "ogg-15051"]
date = 2016-07-29T07:47:30Z
description = ""
draft = false
image = "/images/2016/07/download1.jpg"
slug = "ogg-15051-oracle-goldengate-util-ggexception-class-not-found-kafkahandler"
tag = ["kafka", "goldengate", "ogg", "ogg-15051"]
title = "OGG-15051 oracle.goldengate.util.GGException:  Class not found: \"kafkahandler\""

+++

Similar to the [previous issue](http://rmoff.net/2016/07/28/ogg-class-not-found-com-company-kafka-customproducerrecord/), the [sample config](http://docs.oracle.com/goldengate/bd1221/gg-bd/GADBD/GUID-2561CA12-9BAC-454B-A2E3-2D36C5C60EE5.htm#GADBD457) in the docs causes another snafu: 

```
OGG-15051  Java or JNI exception:
oracle.goldengate.util.GGException:  Class not found: "kafkahandler". kafkahandler
 	Class not found: "kafkahandler". kafkahandler
```

This time it's in the `kafka.props` file: 

```
gg.handler.kafkahandler.Type = kafka
```

Should be
```
gg.handler.kafkahandler.type = kafka
```

No capital T in Type!

---

(Image credit: https://unsplash.com/@vanschneider)
