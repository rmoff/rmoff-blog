+++
author = "Robin Moffatt"
categories = ["kafka", "kafkacat", "mockaroo", "testing"]
date = 2018-05-10T12:56:00Z
description = ""
draft = false
image = "/images/2018/05/IMG_2304.jpg"
slug = "quick-n-easy-population-of-realistic-test-data-into-kafka-with-mockaroo-and-kafkacat"
tag = ["kafka", "kafkacat", "mockaroo", "testing"]
title = "Quick 'n Easy Population of Realistic Test Data into Kafka"

+++

**tl;dr** Use `curl` to pull data from the Mockaroo REST endpoint, and pipe it into `kafkacat`, thus: 

    curl -s "https://api.mockaroo.com/api/d5a195e0?count=2&key=ff7856d0"| \
    kafkacat -b localhost:9092 -t purchases -P

---
Three things I love…Kafka, `kafkacat`, and Mockaroo. And in this post I get to show all three 😁 

[Mockaroo](https://mockaroo.com/) is a very cool online service that lets you quickly mock up test data. 
![](/content/images/2018/05/2018-05-10_14-59-03.png)

What sets it apart from `SELECT RANDOM(100) FROM DUMMY;` is that it has lots of different classes of test data for you to choose from. Wanting to simulate some users? Here you go: 
![](/content/images/2018/05/2018-05-10_15-00-57.png)

So you can build up realistic datasets at a few clicks of the mouse, and then export them to a bunch of formats, including CSV, JSON, and even SQL `INSERT INTO` statements (and, of course, it also provides the `CREATE TABLE` DDL!). 

I've used Mockaroo many times over the years, often as a source for analytics visualisation tools that I've been working with. Now I'm doing a bunch of work with [KSQL](https://www.confluent.io/product/ksql/), and want some useful test data with which to demonstrate certain queries and concepts. KSQL is the streaming SQL engine for Apache Kafka, and so as such I needed to get a bunch of test data into Kafka topics. First up, create my schema: 

![](/content/images/2018/05/2018-05-10_15-03-51.png)

Set the output to `JSON` (make sure it's **not** as a JSON array). 

Mockaroo provides a REST endpoint from which you can pull the data for a given schema. To do this you need to save your schema, and you need to register (for free) to do this. 

With the REST endpoint you can get any number of records, using `curl`: 

```javascript
$ curl -s "https://api.mockaroo.com/api/d5a195e0?count=1&key=ff7856d0"|jq '.'
{
  "order_id": 1,
  "customer_name": "Gustaf Lindro",
  "date_of_birth": "1916-06-24T09:00:55Z",
  "product": "Chicken - Ground",
  "order_total_usd": "9.45",
  "town": "Greensboro",
  "country": "United States"
}
```

So now comes the Kafka bit. I'm using the most-excellent [`kafkacat`](https://github.com/edenhill/kafkacat/) ([about which you can read more here](https://docs.confluent.io/current/app-development/kafkacat-usage.html)), which is a very simple—yet powerful—command line tool for producing data to and consuming data from Kafka. 

When using `kafkacat` as a Producer you can do so interactively, feed it from flat files - or use `stdin` as the input. Therefore we can simply pipe the output of the Mockaroo REST call directly into it: 

```
curl -s "https://api.mockaroo.com/api/d5a195e0?count=2000&key=ff7856d0"|\
kafkacat -b localhost:9092 -t purchases -P
```

This writes `2000` records from the given schema to the `purchases` topic, using the Kafka broker at `localhost:9092`. 

We can use `kafkacat` to inspect the topic (`-C`=run as consumer, `-c1`=read just one message): 

```bash
kafkacat -b localhost:9092 -t purchases -C -c1|jq '.'
{
  "order_id": 1,
  "customer_name": "Maryanna Andryszczak",
  "date_of_birth": "1922-06-06T02:21:59Z",
  "product": "Nut - Walnut, Pieces",
  "order_total_usd": "1.65",
  "town": "Portland",
  "country": "United States"
}
```

There you have it…a super-powerful but simple way to load test data into Kafka.

---

Courtesy of my colleague Chris Matta, you can also use `kafka-console-producer` in this way: 

    curl -s "https://api.mockaroo.com/api/d5a195e0?count=20&key=ff7856d0" | \
    kafka-console-producer \
      --broker-list localhost:9092 \
      --topic users

--- 

Want to slow it down a bit, and loop forever? Use `while` to loop, and `awk` to inject some delay: 

        while [ 1 -eq 1 ]
          do curl "https://api.mockaroo.com/api/d5a195e0?count=5000&key=ff7856d0" | \
             awk '{print $$0;system("sleep 0.5");}' | \
              kafkacat -b kafka:29092 -P -t purchases
          done
