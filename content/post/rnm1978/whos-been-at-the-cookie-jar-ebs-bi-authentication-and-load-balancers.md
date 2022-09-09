---
title: "Who's been at the cookie jar? EBS-BI authentication and Load Balancers"
date: "2010-03-05"
categories: 
  - "cluster"
  - "load-balancing"
  - "obiee"
  - "sawserver"
  - "support"
---

We hit a very interesting problem in our Production environment recently. We'd made no changes for a long time to the configuration, but all of a sudden users were on the phone complaining. They could login to BI from EBS but after logging in the next link they clicked took them to the OBIEE "You are not logged in" screen.

Our users login to EBS R12 and then using EBS authentication log in to OBIEE (10.1.3.4). Our OBIEE is deployed on OAS, load balanced across two servers by an F5 BIG-IP hardware load balancer.

In the OBIEE NQServer.log we started to see a lot of these errors around the time users started complaining: `[nQSError: 13011] Query for Initialization Block 'EBS Security Context' has failed. [nQSError: 23006] The session variable, NQ_SESSION.ACF, has no value definition.`

The EBS/BI authentication configuration was not done by me, and the theory of it was one of the things on my to-do list to understand but as is the way had never quite got around to it. Here was a good reason to learn very quickly! [This posting](http://www.beyeblogs.com/eyeonbi/archive/2007/06/oracle_bi_fusion_intelligence.php) by Gerard Braat is fantastic and brought me up to speed quickly. There's also a doc on My Oracle Support, [552735.1](https://supporthtml.oracle.com/ep/faces/secure/km/DocumentDisplay.jspx?id=552735.1), and some more info from Gareth Roberts on the [OTN forum here](http://forums.oracle.com/forums/message.jspa?messageID=3393051#3393051).

We stopped Presentation Services on one of the servers, and suddenly users could use the system again. If we reversed the stopped/started servers, users could use the system. With **one** Presentation Services server running, the system was fine. With both up, users got "You are not logged in". What did this demonstrate? That on their own, there was nothing wrong with our Presentation Services instances.

We soon suspected the load balancer. The load balancer sets a cookie on each user's web browser at the initial connection as they connect to BI. The cookie is used in each subsequent connection to define which application server the user should be routed to. This is because Presentation Services cannot maintain state across instances and so the user must always come through to the same application server that they initially connected to (and therefore authenticated on).

What had happened was that the Load Balancer was issuing cookies with an **expiry date already in the past** (the clock was set incorrectly on it \*facepalm\*). This meant that the initial connection from EBS to BI was successful, because authentication was done as expected. But - the next time the client came back to the BI server for a new or updated report, they hit the Load Balancer and since **the cookie holding the BI app server affinity was invalid (it had already expired) the Load Balancer sends them to any BI app server**. If it's not the one that they authenticated against then BI **tries to authenticate them again**, but they don't have the acf URL string (which comes through in the initial EBS click through to BI), and hence the "The session variable, NQ\_SESSION.ACF, has no value definition." error in the NQServer.log and "You are not logged in" error shown to the user.

As soon as the date was fixed on the load balancer cookies were served properly, we brought up both Presentation Services, and everything worked again. Phew.

Footnote: I cannot recommend this tool highly enough : [Fiddler2](http://www.fiddler2.com/fiddler2/). It makes tracing HTTP traffic, request headers, cookies, etc, a piece of cake (cookie?).
