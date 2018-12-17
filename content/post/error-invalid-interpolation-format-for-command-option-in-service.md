+++
author = "Robin Moffatt"
categories = ["docker", "docker-compose"]
date = 2018-11-20T17:47:54Z
description = ""
draft = false
image = "/images/2018/11/IMG_6965-EFFECTS.jpg"
slug = "error-invalid-interpolation-format-for-command-option-in-service"
tag = ["docker", "docker-compose"]
title = "ERROR: Invalid interpolation format for \"command\" option in service…"

+++

Doing some funky Docker Compose stuff, including: 

    …
    kafkacat:
      image: confluentinc/cp-kafkacat:latest
      depends_on:
        - kafka
      command: 
        - bash 
        - -c 
        - |
          echo "Waiting for Kafka ⏳"
          cub kafka-ready -b kafka:29092 1 300 && 
          while [ 1 -eq 1 ]
            do awk '{print $0;system("sleep 0.5");}' /data/data.json | \
                kafkacat -b kafka:29092 -P -t purchases
            done
      volumes: 
        - $PWD:/data
    …

Run it: 

    $ docker-compose up -d


Oh noes! Error! 

`ERROR: Invalid interpolation format for "command" option in service "kafkacat": "echo 'Waiting for Kafka'
`

The cause? `$` in the embedded `command`:

    …
    do awk '{print $0;system("sleep 0.5");}' /data/data.json | \
    …



The fix? Double it up: 


    kafkacat:
      image: confluentinc/cp-kafkacat:latest
      depends_on:
        - kafka
      command: 
        - bash 
        - -c 
        - |
          echo "Waiting for Kafka ⏳"
          cub kafka-ready -b kafka:29092 1 300 && 
          while [ 1 -eq 1 ]
            do awk '{print $$0;system("sleep 0.5");}' /data/data.json | \
                kafkacat -b kafka:29092 -P -t purchases
            done
      volumes: 
        - $PWD:/data
