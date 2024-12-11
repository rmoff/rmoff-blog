---
draft: false
title: 'Learning Apache Flink S01E03: Running my First Flink Cluster and Application'
date: "2023-10-05T14:29:02Z"
image: "/images/2023/10/h_IMG_8835.webp"
thumbnail: "/images/2023/10/t_IMG_5439.webp"
credit: "https://bsky.app/profile/rmoff.net"
categories:
- LAF
- Apache Flink
---

🎉 I just ran my first Apache Flink cluster and application on it 🎉

<!--more-->

![](/images/2023/10/flinkrun.webp)


I followed the [**First Steps** quickstart from the Flink docs](https://nightlies.apache.org/flink/flink-docs-release-1.17/docs/try-flink/local_installation/) which is a nicely-paced walk through: 

0️⃣ make sure you've got Java 11

1️⃣ install Flink ([download](https://flink.apache.org/downloads/), unpack (with a [little detour](/2023/10/04/cd-string-not-in-pwd/)))

2️⃣ run it (`./bin/start-cluster.sh`)

3️⃣ submit the sample WordCount app

4️⃣ see the execution in the web UI

5️⃣ examine the output

![](/images/2023/10/flinktail.webp)


The WebUI is a nice touch - sometimes just running everything on the CLI gives you a technically correct finish but if you're new to something leaves you underwhelmed. The webUI lets you click around a bit and start to get a feel for what's going on. 

![The Flink web UI](/images/2023/10/flinkui01.webp)

![The Flink web UI](/images/2023/10/flinkui02.webp)

You can find the source for the WordCount app [here](https://github.com/apache/flink/blob/release-1.17/flink-examples/flink-examples-batch/src/main/java/org/apache/flink/examples/java/wordcount/WordCount.java), and further tutorials on Flink [here](https://nightlies.apache.org/flink/flink-docs-release-1.17/docs/try-flink/local_installation/).
