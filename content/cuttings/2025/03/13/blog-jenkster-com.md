---
title: "blog.jenkster.com"
date: 2025-03-13T10:38:53Z
link: "https://blog.jenkster.com/2022/10/sett"
domain: blog.jenkster.com
---
Much as I love kcat (🤫 _it'll always be kafkacat to me_…), this morning I nearly fell out with it 👇

😖 I thought I was going stir crazy, after listing topics on a broker *and seeing topics from a different broker*.
😵‍💫 WTF 😵‍💫
Turns out that the ~/.config.kcat.conf I created last week and was so proud to thinking to do takes 🚨PRIORITY🚨 over any CLI arguments provided.

So I was merrily telling it with CLI flag -b to use broker X and it was merrily listing topics from broker Y that's specified in the config file.

I still like the config file idea (@Kris Jenkins wrote a nice blog article about it here: I just need to remember about it next time 🤦
