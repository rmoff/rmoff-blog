---
title: "OBIEE and Load Runner - part 1"
date: "2009-08-19"
url: "/2009/08/19/obiee-and-load-runner-part-1/"
categories: 
  - "loadrunner"
  - "OBIEE"
  - "performance"
---

**UPDATED: See a HOWTO for OBIEE and LoadRunner [here](/2009/10/01/obiee-and-loadrunner-howto/)**

* * *

## Introduction

LoadRunner is a tool from HP (bought from Mercury) that can be used to simulate user activity. It supports a whole host of protocols but for OBIEE I'm obviously using the Web one.

There are two flavours, "Web (Click and Script)" and "Web (HTTP/HTML)". The latter simply shoves HTTP requests at the server, whereas "Click and Script" simulates mouse and keyboard entry and thus is more appropriate for this user-based application. \[edit\]_I'm not sure if this is actually the case_\[/edit\]

You can write the script from scratch if you've more time than sense, or you can "record" a session where LoadRunner scrapes all activity from a session and then generates a script based on it. From this you can then refine your script. A script is called a VUser (Virtual User).

It's a good idea to have mapped out what you are trying to test and how, rather than just randomly clicking through the application. Doing this has two disadvantages:

1. Your script will be a pig to debug & customise
2. Your script will be little use other than replicating multiple instances of randomly clicking.

Much better to do something simple like this:

1. Login (record it under the "vuser\_init" action)
2. Navigate to a dashboard
3. Logout (record it under the "vuser\_end" action)

Once you've got your simple script you can then get funky. Parametrise the username and password, and then the dashboard that you select. Suddenly what looked like a simple script can be set to go and open all your dashboards!

## Validating VUser script

Now you have a simple script that you should be able to replay. Using the Verify Replay option you can test what you've recorded. On replay I got "No Errors Detected" :![replay01](/images/rnm1978/replay01.png "replay01")

but the screenshots thumbnails showed an difference :

![replay02](/images/rnm1978/replay021.png "replay02")

Going to View -> Test Results and examining the full-size screenshots showed the error ! Error : Response from server contained an error

![error01](/images/rnm1978/error01.png "error01")

Doc ID 735158.1 on Metalink details this problem, but doesn't have a solution. The error message is apparently not from OBI but the webserver. I don't know enough about the web technology to trace this through to source. In the HTML there is always a placeholder for a message :


```html

```


I did a detailed examination of the sawserver log (using detailed logging level) but couldn't find any errors. I checked the analytics web app log too, and the oc4j and apache logs. All turned up nothing. Using [Fiddler2](http://www.fiddlertool.com/) I set up a trace of the network traffic from LoadRunner to OBIEE (define Fiddler2 as a proxy in LoadRunner) - and the blasted thing worked! No error! So then I removed the proxy setting and again it worked, no problem. How frustrating.

Taking a step back, I restarted sawserver, ran the Replay and got the error again. Changed to go via Fiddler2, no error. Bounced sawserver again, ran the Replay through Fiddler2 first this time - and got the error. Phew. So it looks like it's maybe cache-based, and at least it's repeatable.

Analysing the Fiddler2 output revealed:

- DashboardErrorDiv is populated in res/b\_mozilla/dashboards/portalscript.js saw.dashboard.showError, which is an error handler
- The error itself is thrown in res/b\_mozilla/common/ajax.js (header indicates that it is for _Server Calls - used to retrieve XML from server_)

[FireBug](http://getfirebug.com/) was also useful for backing up the analysis in capturing known-good sessions.

I'm not convinced the Metalink article is entirely truthful, since it is still OBI throwing the error, just clientside javascript. The problem is that OBIEE is heavily relient on ajax, and running it on the simulated browser of LoadRunner is not working. I'm hoping the solution is somewhere in tweaking the LoadRunner replay config. I've tried using "AJAX (Click and Script)" but get the same results.
