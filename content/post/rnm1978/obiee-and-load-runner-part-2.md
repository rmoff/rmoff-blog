---
title: "OBIEE and Load Runner - part 2"
date: "2009-08-21"
categories: 
  - "loadrunner"
  - "OBIEE"
  - "performance"
  - "sawserver"
---

**UPDATED: See a HOWTO for OBIEE and LoadRunner here: [/2009/10/01/performance-testing-obiee-using-hp-performance-center-a.k.a.-loadrunner/](/2009/10/01/performance-testing-obiee-using-hp-performance-center-a.k.a.-loadrunner/)**

* * *

This is following on from [my first post about OBIEE and LoadRunner](/2009/08/19/obiee-and-load-runner-part-1/), in which I failed dismally to get a simple session replaying.

In a nutshell where I'd got to was using the "Web (Click and Script)" function which worked fine for logging in but when running a report resulted in an error on the rendered page. Digging around showed the error was from the javascript of the OBIEE front end.

AJAX (Asynchronous Javascript And XML) is a combination of technologies but in essence lets a web page load once whilst refreshing its contents with calls back to the web server. In the context of OBIEE this means a dashboard page can load with placeholders for reports and as the data comes back (from the datasource via the BI Server and then parsed through sawserver) each dashboard report can update immediately, without the whole webpage reloading. I'm sure this is where the problem lies with LoadRunner, and it's going to be important to get it right otherwise the numbers we get out won't be reliable.

I checked Metalink 3 for any entries and [Doc 496417.1](https://metalink3.oracle.com/od/faces/secure/km/DocumentDisplay.jspx?id=496417.1) says that LoadRunner's been used with OBIEE successfully before..

VUGen (LoadRunner Virtual User Generator) offers several protocols. I'd been working with "Web (Click and Script)" but after a fair bit of Googling tried "AJAX (Click and Script)" which didn't work any better, and then "Web (HTTP/HTML)".

In the Options dialog prior to Recording there are some Siebel correlations defined including one called Siebel\_Analytic\_ViewState. Correlation is how LoadRunner deals with a data in a session that is passed back to the server in a subsequent step. For example, at login a user might get a sessionID of some sort which the web server requires in any subsequent calls back. LoadRunner can automatically detect some of these, and you have to define the rest. The correlations I picked up were:

- \_scid
- ViewState

The replay still wasn't working properly, the replay screenshots showed this error: ![invalidstate](/images/rnm1978/invalidstate.png "invalidstate")

Using Fiddler2 again to analyse the traffic showed this pattern of requests/responses:

saw.dll?Dashboard This is the main dashboard with placeholders for content saw.dll?DocPart&\_scid=3QNnUBQ3IJo&StateID=943636977 this is a dashboard flash component saw.dll?DocPart&\_scid=3QNnUBQ3IJo&StateID=943636978 this is a dashboard flash component saw.dll?DocPart&\_scid=3QNnUBQ3IJo&StateID=943636979 this is a dashboard flash component saw.dll?DocPart&\_scid=3QNnUBQ3IJo&StateID=943636980 this is a dashboard flash component

The StateID in the URL is embedded in the dashboard template, and is unique so can't be hardcoded in the VUser script. The script as recorded is hardcoding these numbers and thus requesting flash charts from a dashboard query long-gone, hence the very true "invalid state identifier"

LoadRunner has a feature called ContentCheck (accessed from the Run-time Settings dialog) which can be configured to halt the test if pre-defined text is found, so I added "invalid state identifier" and "! Error : Response from server contained an error" into it and clicked the Set as Default so they'd come up for each script from now \[edit\] this doesn't fire for "! Error : Response from server contained an error", maybe because it's inserted through ajax rather than the HTML response? \[/edit\] ![contentcheck](/images/rnm1978/contentcheck.png "contentcheck")

After tinkering around a bit more I recorded another VUser, using "Web (Click and Script)" but on the Recording Options screen set it to URL mode instead of GUI. This captured **all** of the content requests (css, js, gif, etc), and gave a better replay: ![replay03](/images/rnm1978/replay03.png "replay03")

The Help text explains:

- "..GUI-based script option instructs VuGen to record HTML actions as context sensitive GUI functions such as web\_text\_link..."
- "..URL-based script mode option instructs VuGen to record all browser requests and resources from the server that were sent due to the user's actions. It automatically records every HTTP resource as URL steps (web\_url statements). For normal browser recordings, it is not recommended to use _the URL-based mode since is more prone to correlation related issues_..."

(my emphasis)

Looking at the script it's still got saw.dll?DocPart calls with a hardcoded StateID. This means that flash-content won't be being returned. To an extent this doesn't matter so long as it's still being generated (i.e. imposing the desired load on the server), but it's not a full simulation of user activity because there's less network traffic as a result.

So using the URL-based mode generates better results (i.e. no server error) but looks pretty much hardcoded to the specific scenario recorded. It's all very well getting a single dashboard working, but I want to simulate hundreds of users using tens of dashboards. In an ideal world I'd define a login action with parametrised username/password, then a dashboard navigation / refresh action with a parametrised list of dashboard titles, and then a logout action.

With the caveat here that I have no training in LoadRunner, it appears to my untrained eye that the only way I'm going to get repeatable, reusable scripts is using the GUI recording, that is, using the **web\_text\_link** function to simulate a user clicking, rather than the **web\_submit\_data** function which simulates the POST behaviour of ajax but is specific to the dashboard in question and needs some hardcore LR coding to correlate IDs embedded in the HTML with server requests to populate them.

Going back to the Click and Script (GUI Mode) and Fiddler2 I did a line-by-line comparison of the Fiddler-captured HTTP traffic between the recording session and replay. The login action was the same. The clicking onto the dashboard was as follows: ![fiddler](/images/rnm1978/fiddler.png "fiddler") This shows that the initial dashboard request works, and that the first "ReloadDashboard" ajax call correctly retrieves some of the data, but (a) this isn't 'rendered' correctly, and (b) no further data is retrieved (there should be a second ReloadDashboard saw call, plus four flash charts). (_Fiddler's copy -> full summary is useful for this, as is the breakpoint feature so you can pause after each response and see how it's rendered to determine what the content was._)

**So**, web\_text\_link is great for navigating but is the case that LR's replay engine doesn't honour the ajax sufficiently, and/or I'm misunderstanding the principle of the tool? Using "URL mode" captures the ajax behaviour, eg:


```html
web\_submit\_data("saw.dll\_13", "Action=http://myserver:7777/analytics/saw.dll?ReloadDashboard&\_scid={CSRule\_1\_UID2}", "Method=POST", "RecContentType=text/html", "Referer=http://myserver:7777/analytics/saw.dll?Dashboard&\_scid={CSRule\_1\_UID2}&PortalPath=/shared/Financials/\_portal/General%20Ledger&Page=Overview&Action=RefreshAll&ViewState={Siebel\_Analytic\_ViewState199}&StateAction=samePageState", "Snapshot=t96.inf", "Mode=HTTP", ITEMDATA, "Name=InFrameset", "Value=false", ENDITEM, "Name=Page", "Value=Overview", ENDITEM, "Name=\_scid", "Value={CSRule\_1\_UID2}", ENDITEM, "Name=Embed", "Value=true", ENDITEM, "Name=PortalPath", "Value=/shared/Financials/\_portal/General Ledger", ENDITEM, "Name=Caller", "Value=Dashboard", ENDITEM, "Name=ViewState", "Value=tvr45qs2u7d1glbfaopqlvvinu", ENDITEM, "Name=reloadTargets", "Value=d:dashboard~p:d127730sp2eqcj54~r:ojn7k4k6te44d9ag", ENDITEM, "Name=ajaxType", "Value=iframe", ENDITEM, LAST);
```


but as you can see the POSTed data is full of IDs that I assume must correlate with the dashboard HTML. Given enough time and enough monkeys I'm sure it would be possible to write a LR script that did this - but that would be with the net result of a _single_ dashboard being replayable.

We can get a semblance of load testing on the database server by using web\_text\_link, but since the data coming back isn't rendered properly it's not possible to simulate a real user's session, only one-off hits of dashboards.
