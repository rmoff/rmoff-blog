+++
categories = ["kafka connect", "bash", "jq", "peco", "xargs", "rest api"]
date = 2018-12-03T14:50:45Z
description = ""
draft = false
image = "/images/2018/12/IMG_7311.jpg"
slug = "kafka-connect-cli-tricks"
tag = ["kafka connect", "bash", "jq", "peco", "xargs", "rest api"]
title = "Kafka Connect CLI tricks"

+++

I do lots of work with Kafka Connect, almost entirely in [Distributed mode](https://docs.confluent.io/current/connect/concepts.html#distributed-workers)—even just with 1 node -> makes scaling out much easier when/if needed. Because I'm using Distributed mode, I use the [Kafka Connect REST API](https://docs.confluent.io/current/connect/references/restapi.html) to configure and manage it. Whilst others might use GUI REST tools like Postman etc, I tend to just use the commandline. Here are some useful snippets that I use all the time. 

I'm showing the commands split with a line continuation character (`\`) but you can of course run them on a single line. You might also choose to get fancy and set the Connect host and port as environment variables etc, but I leave that as an exercise for the reader :) 

<script id="asciicast-jYF38DsTB4PQbdoittTz1QARn" src="https://asciinema.org/a/jYF38DsTB4PQbdoittTz1QARn.js" async></script>

### List all running connectors: 

```bash
curl -s "http://localhost:8083/connectors"| \
jq '.[]'| \
xargs -I{connector_name} curl -s "http://localhost:8083/connectors/"{connector_name}"/status"| jq -c -M '[.name,.connector.state,.tasks[].state]|join(":|:")'| \
column -s : -t| \
sed 's/\"//g'| \
sort
```

### Selectively delete a connector

(h/t to [@madewithtea](https://twitter.com/madewithtea/status/1068467440202514432) for the idea of using `peco`)

```bash
curl -s "http://localhost:8083/connectors"| \
jq '.[]'| \
peco | \
xargs -I{connector_name} curl -s -XDELETE "http://loc
alhost:8083/connectors/"{connector_name}
```

### Delete all connectors

**CAUTION** with this one, as it will delete all your connectors!

```bash
curl -s "http://localhost:8083/connectors"| \
jq '.[]'| \
xargs -I{connector_name} curl -s -XDELETE "http://localhost:8083/connectors/"{connector_name}
```


