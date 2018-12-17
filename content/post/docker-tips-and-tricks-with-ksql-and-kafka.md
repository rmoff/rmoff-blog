+++
author = "Robin Moffatt"
categories = ["docker", "Docker Compose", "ksql", "ksql-cli", "ksql-server", "kafka connect"]
date = 2018-12-15T22:00:55Z
description = ""
image = "/images/2018/12/IMG_7431.jpg"
slug = "docker-tips-and-tricks-with-ksql-and-kafka"
tag = ["docker", "Docker Compose", "ksql", "ksql-cli", "ksql-server", "kafka connect"]
title = "Docker Tips and Tricks with KSQL and Kafka"

+++

A few years ago a colleague of mine told me about this thing called Docker, and I must admit I dismissed it as a fad…how wrong was I. Docker, and Docker Compose, are one of my key tools of the trade. With them I can build self-contained environments for tutorials, demos, conference talks etc. Tear it down, run it again, without worrying that somewhere a local config changed and will break things. 

So, here's a collection of tricks I use with Docker and Docker Compose that might be useful, particularly for those working with Apache Kafka and Confluent Platform. 

### Wait for an HTTP endpoint to be available

Often a container will be 'up' before it's _actually_ up. So Docker Compose's `depends_on` dependencies don't do everything we need here. For a service that exposes an HTTP endpoint (e.g. Kafka Connect, KSQL Server, etc) you can use this bash snippet to force a script to wait before continuing execution of something that requires the service to actually be ready and available: 

{{< highlight shell >}}

echo -e "\n\n⏳ Waiting for KSQL to be available before launching CLI\n"
while [ $$(curl -s -o /dev/null -w %{http_code} http://ksql-server:8088/) -eq 000 ]
do 
  echo -e $$(date) "KSQL Server HTTP state: " $$(curl -s -o /dev/null -w %{http_code} http://ksql-server:8088/) " (waiting for 200)"
  sleep 5
done

{{< /highlight >}}


Here this is assuming that KSQL Server is running on a host accessible as `ksql-server` and on port `8088`. You can use this trick if, for example, you only want to launch the KSQL CLI once the server is available: 

{{< highlight shell >}}
docker-compose exec ksql-cli bash -c 'echo -e "\n\n⏳ Waiting for KSQL to be available before launching CLI\n"; while [ $(curl -s -o /dev/null -w %{http_code} http://ksql-server:8088/) -eq 000 ] ; do echo -e $(date) "KSQL Server HTTP state: " $(curl -s -o /dev/null -w %{http_code} http://ksql-server:8088/) " (waiting for 200)" ; sleep 5 ; done; ksql http://ksql-server:8088'
{{< /highlight >}}


You can also build it into a Docker Compose file as shown below. 

### Wait for a particular message in a container's log

For the same reason as above—waiting for a service to be ready—you can use this trick built around `grep` and bash's [*process substitution*](http://tldp.org/LDP/abs/html/process-sub.html), which will make the script wait until the given phrase is found in the logs from Docker Compose:

{{< highlight shell >}}
export CONNECT_HOST=connect-debezium
echo -e "\n--\n\nWaiting for Kafka Connect to start on $CONNECT_HOST … ⏳"
grep -q "Kafka Connect started" <(docker-compose logs -f $CONNECT_HOST)
{{< /highlight >}}

### Run custom code before launching a container's program

Maybe you want to download a dependency, or move some files around, or do something. You could build a new `Dockerfile`, but often you want to overlay on an existing standard image a slight tweak for a demo. With Docker Compose this is easy enough to do. First you need to figure out what command the container is going to run when it launches, which will either be through `Entrypoint` or `Cmd`: 

{{< highlight shell >}}
$ docker inspect --format='{{.Config.Entrypoint}}' confluentinc/cp-ksql-server:5.0.1
[]

$ docker inspect --format='{{.Config.Cmd}}' confluentinc/cp-ksql-server:5.0.1
[/etc/confluent/docker/run]
{{< /highlight >}}

In the above example it's `/etc/confluent/docker/run`. So now build this into your Docker Compose: 

{{< highlight yaml "hl_lines=8-15">}}

ksql-server:
  image: confluentinc/cp-ksql-server:5.0.1
  depends_on:
    - kafka
  environment:
    KSQL_BOOTSTRAP_SERVERS: kafka:29092
    KSQL_LISTENERS: http://0.0.0.0:8088
  command: 
    - /bin/bash
    - -c 
    - |
      mkdir -p /data/maxmind
      cd /data/maxmind
      curl https://geolite.maxmind.com/download/geoip/database/GeoLite2-City.tar.gz | tar xz 
      /etc/confluent/docker/run 
{{< /highlight >}}

Now the additional bits will run, and _then_ the container's intended process will actually run. 

The `- |` is some YAML magic; we're passing in three arguments to `command`, and the `|` tells YAML that the following lines are all part of the same entry. It makes for a much neater and easier to read file than trying to put everything into a single line as is sometimes done with `command`. 

### Deploy a Kafka Connect connector automatically

In the above example, we run some code _before_ the container's payload (the KSQL Server) starts because of a dependency on it. In the next example we'll do it the other way around; launch the service and wait for it to start, and then run some more code. This is the pattern we need for deploying a Kafka Connect connector. 

{{< highlight yaml "hl_lines=10-25">}}
kafka-connect:
  image: confluentinc/cp-kafka-connect:5.0.1
  environment:
    CONNECT_REST_PORT: 18083
    CONNECT_REST_ADVERTISED_HOST_NAME: "kafka-connect"
    […]
  volumes:
    - $PWD/scripts:/scripts
  command: 
    - bash 
    - -c 
    - |
      /etc/confluent/docker/run & 
      echo "Waiting for Kafka Connect to start listening on $$CONNECT_REST_ADVERTISED_HOST_NAME ⏳"
      while [ $$(curl -s -o /dev/null -w %{http_code} http://$$CONNECT_REST_ADVERTISED_HOST_NAME:$$CONNECT_REST_PORT/connectors) -eq 000 ] ; do 
        echo -e $$(date) " Kafka Connect listener HTTP state: " $$(curl -s -o /dev/null -w %{http_code} http://$$CONNECT_REST_ADVERTISED_HOST_NAME:$$CONNECT_REST_PORT/connectors) " (waiting for 200)"
        sleep 5 
      done
      nc -vz $$CONNECT_REST_ADVERTISED_HOST_NAME $$CONNECT_REST_PORT
      echo -e "\n--\n+> Creating Kafka Connect Elasticsearch sink"
      /scripts/create-es-sink.sh 
      sleep infinity
{{< /highlight >}}

Notes: 

* In the command section, `$` are replaced with `$$` to avoid the error `Invalid interpolation format for "command" option`
* `sleep infinity` is necessary, because we've sent the `/etc/confluent/docker/run` process to a background thread (`&`) and so the container will exit if the main `command` finishes.
* The actual script to configure the connector is a `curl` call in [a separate file](https://github.com/confluentinc/demo-scene/blob/master/ksql-atm-fraud-detection/scripts/create-es-sink.sh). You _could_ build this into the Docker Compose but it feels a bit yucky. 
* You could combine both this and the technique above if you wanted to install a custom connector plugin before launching Kafka Connect, e.g.

        confluent-hub install --no-prompt confluentinc/kafka-connect-gcs:5.0.0 
        /etc/confluent/docker/run


### Execute a KSQL script through ksql-cli

This Docker Compose snippet will run KSQL CLI and pass in a KSQL script for execution to it. The manual `EXIT` is required because of a [NPE bug](https://github.com/confluentinc/ksql/issues/1327). The advantage of this method vs running KSQL Server headless with a queries file passed to it is that you can still interact with KSQL this way, but can pre-build the environment to a certain state. 

{{< highlight yaml "hl_lines=7-25">}}
ksql-cli:
  image: confluentinc/cp-ksql-cli:5.0.1
  depends_on:
    - ksql-server
  volumes:
    - $PWD/ksql-scripts/:/data/scripts/
  entrypoint: 
    - /bin/bash
    - -c
    - |
      echo -e "\n\n⏳ Waiting for KSQL to be available before launching CLI\n"
      while [ $$(curl -s -o /dev/null -w %{http_code} http://ksql-server:8088/) -eq 000 ]
      do 
        echo -e $$(date) "KSQL Server HTTP state: " $$(curl -s -o /dev/null -w %{http_code} http://ksql-server:8088/) " (waiting for 200)"
        sleep 5
      done
      echo -e "\n\n-> Running KSQL commands\n"
      cat /data/scripts/my-ksql-script.sql <(echo 'EXIT')| ksql http://ksql-server:8088
      echo -e "\n\n-> Sleeping…\n"
      sleep infinity
{{< /highlight >}}

Note that the `sleep infinity` is required, otherwise the container will exit since all of the defined `entrypoint` will have executed.
