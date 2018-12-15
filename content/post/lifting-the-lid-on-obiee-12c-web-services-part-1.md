+++
author = "Robin Moffatt"
categories = ["obiee", "obiee12c", "rest", "paw", "postman", "api", "visual analyzer", "process substitution", "command substitution", "sysdig"]
date = 2016-05-24T21:15:00Z
description = ""
draft = false
image = "/images/2016/05/rest03.png"
slug = "lifting-the-lid-on-obiee-12c-web-services-part-1"
tags = ["obiee", "obiee12c", "rest", "paw", "postman", "api", "visual analyzer", "process substitution", "command substitution", "sysdig"]
title = "Lifting the Lid on OBIEE 12c Web Services - Part 1"

+++

Architecturally, OBIEE 12c is - on the surface - pretty similar to OBIEE 11g. Sure, we've lost [OPMN in favour of Node Manager](https://docs.oracle.com/middleware/1221/biee/BIESG/whatsnew.htm#CJAFBCJC), but all the old favourites are there - WebLogic Servers, BI Server (nqsserver / OBIS), Presentation Services (sawserver / OBIPS), and so on. 

But, scratch beneath the surface, or have a gander at [slide decks such as this one from BIWA this year](http://www.ioug.org/p/cm/ld/fid=985&tid=743&sid=7207), and you realise that change is afoot. Whilst the OBIEE core is still built around proprietary 'black box' protocols (SAW from analytics to sawserver on port 9710, NQS ODBC from sawserver to nqsserver, cluster management on 9706 to nqsclustercontroller), there are now [REST-based](https://en.wikipedia.org/wiki/Representational_state_transfer) web services springing up (in addition to the [existing SOAP](https://docs.oracle.com/middleware/1221/biee/BIEIT/soa_overview.htm#BABHJJAC) services that have been there since at least 10g). Whilst the REST services are there under the covers, **they are not documented nor user-servicable**, but they are there. But let me re-iterate:  

---

**None of these Web Services are documented, and they should therefore be assumed to be completely unsupported by Oracle. This article is purely for geek interest. Using undocumented APIs leaves you at risk of the API changing at any time.**

---


So with that caveat out of the way, let's have a poke around. My tool of choice, [as before](http://www.rittmanmead.com/2016/05/under-the-covers-of-obiee-12c-configuration-with-sysdig/), is sysdig. This time I'm dumping out at `GET` or `POST` traffic with the Managed Server (which hosts the bulk of the java deployments, including Visual Analyzer, BI Publisher, and so on). I'm using sysdig on the server, because I'm also interested to pick up intra-component communications.

    sudo sysdig -s 2000 -A  "fd.port=7780 and (evt.buffer contains GET or evt.buffer contains POST)"

To explain the syntax: 

* `-s 2000` : include 2000 bytes of the captured event buffer
* `-A` : Print ASCII, i.e. human-readable data
* A filter condition made up of two clauses: 
  * `fd.port=7780` : traffic on port 7780, on which the Managed Server listens
  * `(evt.buffer contains GET or evt.buffer contains POST)` : Only include traffic that includes GET or POST. Without this, you get a dump of *all* traffic to and from the Managed Server

Now let's do something on the front end, and see what catch in our trap...

## Dataset Storage Limits

I'd already logged into Visual Analyzer, and went to the **Data Sources** page, which triggered this capture: 

```
7240765 15:35:40.448761171 3 java (6623) < read res=677 data=
GET /va/api/v1/dataset/limits HTTP/1.1
Host: 192.168.56.101:7780
Connection: keep-alive
Accept: */*
Cache-Control: no-cache
X-CSRF-Token: K9grcZRjBJsfCgd0tmADK54uwvZtXMPeOcTtXqz4itGuyCit
X-Requested-With: XMLHttpRequest
Accept-Language: en-GB,en;q=0.8,en-US;q=0.6
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Postman/4.2.0 Chrome/47.0.2526.73 Electron/0.36.2 Safari/537.36
Content-Type: application/json; charset=UTF-8
Accept-Encoding: gzip, deflate
Cookie: JSESSIONID=ZzzePh4y0-JXAQqQZiSl9RyVKCeD2MFurbj-SQt3BdTLa-ThG3kW!-946065168; JSESSIONID=iUfeNud-YlgVcSWMocIIs18T28ea2ckDbSmwLyQHEylz-d4aKl2H!-946065168
```

Which presumably drives this in the UI: 

![va_storage_01.png](/content/images/2016/05/va_storage_01.png)

So we've got an endpoint (`/va/api/v1/dataset/limits`), but can we use it ourselves, just by requesting that address? Yep:

![va_rest_01.png](/content/images/2016/05/va_rest_01.png)

But what happens if I try it on another machine, or from a clean browsing session? If I do that I just get dumped back to the VA login page. Using Chrome's Developer Tools I can see that I'm getting served a `302 Moved Temporarily` which tells the browser that the document I've asked for (`limits`) has moved somewhere else - or in plain speak, there's nothing to see here, move along now...

![va_login_01.png](/content/images/2016/05/va_login_01.png)

So I'm guessing my first attempt worked because I was in the same session as my "real" VA session, and had some cookies that identified me as such, whereas on my re-started browser session I didn't. This is obviously a Good Thing, because we don't want VA giving out information to non-authorised users.

Let's see now what we do actually need in order to call this REST API ourselves. Less so because we want to programatically query the amount of space used by datasets (although that could well be useful), but more because it's a fair bet that the framework will be the same and so with this figured out, the rest of the REST (see what I did there...) API will be open for business. 

Looking at VA traffic in Chrome's dev tools again, we can see two cookies are submitted as part of a successful call to the `limits` API: 

![va_rest_02.png](/content/images/2016/05/va_rest_02.png)

There's also a bunch of other headers in here too, such as User Agent. We can't assume that just cookies alone will do the job - for example, from past hacking on OBIEE I've seen Presentation Services behave differently based on User Agent (presumably to detect whether JavaScript was available?). So here we want to work out the minimum set of headers that we need to send across in order for the request to be valid. Enter [Paw](https://luckymarmot.com/paw). 

[Paw](https://luckymarmot.com/paw) is a REST API client for the Mac, and an awesome one at that. I also tried out [Postman](https://www.getpostman.com/), but Paw 'just worked' and had the better UX for me. Here's a cool trick to transition from session traffic sniffing into full-blown REST API hacking. 

1. Perform the action of interest in Chrome, with Developer Tools capturing the traffic. Make sure the request succeeds (i.e. you have a "known good" traffic capture). 

2. Right-click on the request and select **Copy as cURL**

  ![va_rest_03.png](/content/images/2016/05/va_rest_03.png)

    [cURL](https://curl.haxx.se/) is a tool in its own right for making HTTP (and other) requests from the command line, and we'll revisit it later on in this article. For our use here, cURL is sometimes used as a common format of HTTP requests across tools, enabling us to transport it from Chrome to Paw

3. Open Paw and select **Edit** > **Paste and Import**, selecting (and installing if necessary) **cURL Importer**

Now you've got the HTTP request in Paw you can work with it in a great more detail. First up, go to the **Request** menu and hit **Send**. You should get a successful response - because this is the same request as you fired from Chrome. That it's a different program sending it makes no difference - it's only the HTTP request headers and body that actually get sent to and parsed by the receiving web server. Note how Paw automagically presents the response as formatted JSON:

![paw01.png](/content/images/2016/05/paw01.png)

Now we can start whittling down the base request that we can send in order for it still to be valid. Firstly untick *every header*, and resend the request. You'll see the HTML source code for the "302 Moved Temporarily" response, which if you followed the URL would give you the VA login page

![paw02.png](/content/images/2016/05/paw02-1.png)

So, we definitely need some headers. Let's add back in the Cookie header; it still works. Now looking at the Cookies, there are two; `ADMINCONSOLESESSION` and `JSESSIONID`. Trying the request with just `JSESSIONID` still works. Bingo! So we've got a minimum viable REST request - it just needs a valid `JSESSIONID` cookie. 

Now in Paw go to the **View** menu and select **Show Code Generator**. You might need to install another addin here, but you can then see the cURL equivalent for the current request: 

![paw03.png](/content/images/2016/05/paw03-1.png)

Taking this cURL and running it from the terminal gives...

![rest01.png](/content/images/2016/05/rest01.png)

...an error?! Wat? And what's "event not found"? [Bash quoting](https://en.wikipedia.org/wiki/Representational_state_transfer) fun times ... replace the double quotes (which bash will parse the contents of and get upset at the `!`) with single quotes (bash [shall not pass](https://www.youtube.com/watch?v=2eMkth8FWno)): 

![rest02.png](/content/images/2016/05/rest02.png)

Job's a good 'un. And for bonus points, let's use the excellent  [`jq`](https://stedolan.github.io/jq/) to format the JSON: 

![rest03.png](/content/images/2016/05/rest03-1.png)

or even parse out specific values from it (*use [jqplay](https://jqplay.org/) to help figure out the syntax of filters*)

![rest04.png](/content/images/2016/05/rest04.png)

And why's this useful? Because we can now programatically do things with the data that we can access. Like, check a user's remaining quota: 

    echo 'User has ' $(curl -s -X 'GET' 'http://192.168.56.101:7780/va/api/v1/dataset/limits' -H 'Cookie: JSESSIONID=Dp3h6i4FcuIfoTYAYsvb8Z8TYDOcnuxDl52KVdRREYlNfn8w1D49!-946065168' | jq '.limits."user-remaining-quota-kilobytes"') ' KB remaining in their quota'

![rest05.png](/content/images/2016/05/rest05.png)

Sure, you need the user's session cookie to literally do this, but it still gives you an idea of what's possible. A final mention for now for Paw -- as well as exporting to cURL, you can generate code to many formats, not least including Python: 

```python
# Install the Python Requests library:
# `pip install requests`

import requests


def send_request():
    # cURL
    # GET http://192.168.56.101:7780/va/api/v1/dataset/limits

    try:
        response = requests.get(
            url="http://192.168.56.101:7780/va/api/v1/dataset/limits",
            headers={
                "Cookie": "JSESSIONID=hR7h7JkB-rTZq-QiYtTfZx6kYe-bpWoeSH9xxhv-2P1J1W6ZWQJk!-946065168",
            },
        )
        print('Response HTTP Status Code: {status_code}'.format(
            status_code=response.status_code))
        print('Response HTTP Response Body: {content}'.format(
            content=response.content))
    except requests.exceptions.RequestException:
        print('HTTP Request failed')

```


---

**None of these Web Services are documented, and they should therefore be assumed to be completely unsupported by Oracle. This article is purely for geek interest. Using undocumented APIs leaves you at risk of the API changing at any time.**

---

## Getting a Session Cookie

So all we need to call the `va` web service is a valid `JSESSIONID` cookie, and then the world is our oyster ... but how do we get one in the first place? 

We've got to assume that it gets set as part of the authentication process when we login to VA. Let's stick Chrome Dev Tools on and see what we get: 

![va_login_02.png](/content/images/2016/05/va_login_02.png)

You can see from this the URL that gets called, how it's called (HTTP `POST`), the format of the body with the username/password we're logging in as -- and the all-important response header that gives us our `JSESSIONID` value. 

*As a side note, observe that the credentials are in plain text. This is why TLS/SSL is so important in general on the internet, because otherwise anyone on the network can observe these (assuming they can access the network traffic)*

Using the same trick as above (Copy as cURL from Chrome, import to Paw), I can run the same request in Paw: 

![paw04.png](/content/images/2016/05/paw04.png)

Clicking on the **Headers** option in the response pane shows the cookie being set:

![paw05.png](/content/images/2016/05/paw05-2.png)

Using the Paw Code Generator, I can run this as a cURL command - but by default cURL won't give me the cookie: 

```bash
$ curl -X "POST" "http://192.168.56.101:7780/va/j_security_check" -H "Content-Type: application/x-www-form-urlencoded; charset=utf-8" --data-urlencode "j_password=Admin123" --data-urlencode "j_username=prodney"
<html><head><title>303 See Other</title></head>
<body bgcolor="#FFFFFF">
<p>This document you requested has moved
temporarily.</p>
<p>It's now at <a href="http://192.168.56.101:7780/va">http://192.168.56.101:7780/va</a>.</p>
</body></html>
```

So I force it to, using the `--cookie-jar` option and a clever bash trick called [process substitution](http://tldp.org/LDP/abs/html/process-sub.html) so that it writes to stdout instead of the file (as would usually be used for the cookie jar). 


```bash
curl -X "POST" "http://192.168.56.101:7780/va/j_security_check" --data-urlencode "j_password=Admin123" --data-urlencode "j_username=prodney" --cookie-jar >(cat)
<html><head><title>303 See Other</title></head>
<body bgcolor="#FFFFFF">
<p>This document you requested has moved
temporarily.</p>
<p>It's now at <a href="http://192.168.56.101:7780/va">http://192.168.56.101:7780/va</a>.</p>
</body></html>
# Netscape HTTP Cookie File
# http://curl.haxx.se/docs/http-cookies.html
# This file was generated by libcurl! Edit at your own risk.

#HttpOnly_192.168.56.101	FALSE	/va	FALSE	0	JSESSIONID	XLjkp1KgOt8KBTFr1cLz-cXUaAf32yRESzk1r6yr0Yq9aE4IrODd!-946065168
```

Still a bit noisy, so let's add `-s` (silent - suppresses the progress bar which otherwise gets echo'd ) and `-o /dev/null` (send the main output to /dev/null)

```bash
$ curl -X "POST" "http://192.168.56.101:7780/va/j_security_check" \ 
--data-urlencode "j_password=Admin123" --data-urlencode "j_username=prodney" \ 
--cookie-jar >(cat) -o /dev/null -s
# Netscape HTTP Cookie File
# http://curl.haxx.se/docs/http-cookies.html
# This file was generated by libcurl! Edit at your own risk.

#HttpOnly_192.168.56.101	FALSE	/va	FALSE	0	JSESSIONID	-QrkqNASv-4aKk8UUvtD5CWBvXT4qgTnx50QhdLU8VgG8vBUiVI9!-946065168
```

Now let's round off with a bit more bash-magic, to capture just the value of `JSESSIONID` using `grep` and `awk`:

```bash
curl -X "POST" "http://192.168.56.101:7780/va/j_security_check" \ 
--data-urlencode "j_password=Admin123" --data-urlencode "j_username=prodney" \
--cookie-jar >(cat) -o /dev/null -s|grep JSESSIONID|awk '{print $7}'
EePkqTVa7OCVqO7h5j-4FPfkNnyVTitdZNIDU4SSiWJq0q3AKSh5!-946065168
```

Final party trick - using [command substitution](http://www.tldp.org/LDP/abs/html/commandsub.html) and combining it with the the `limits` call above, passing the dynamically-obtained session cookie: 

```bash
USER=$1
PW=$2
JSESSIONID=$(curl -X "POST" "http://192.168.56.101:7780/va/j_security_check" --data-urlencode "j_password=$PW" --data-urlencode "j_username=$USER" --cookie-jar >(cat) -o /dev/null -s|grep JSESSIONID|awk '{print $7}')
echo "Session cookie for $USER is $JSESSIONID"

echo 'User has ' $(curl -s -X 'GET' 'http://192.168.56.101:7780/va/api/v1/dataset/limits' -H "Cookie: JSESSIONID=$JSESSIONID" | jq '.limits."user-remaining-quota-kilobytes"') ' KB remaining in their quota'
```

```bash
$ ./tmp.sh prodney Admin123
Session cookie for prodney is f0Pkyfb_sVxDzjIGL8NlZHtS2XY-cDO9Hy5m81NUcdnemxElukYC!-946065168
User has  20955017  KB remaining in their quota
$ ./tmp.sh weblogic Admin123
Session cookie for weblogic is QsLkzFahsLcJDMZbeoruCN1xBG6XmYdxKAi9UmDANju7YVTQwAZ5!-946065168
User has  20971462  KB remaining in their quota
```

So there we have it - a flavour of what the REST web services in OBIEE 12c can do, and how to go about accessing them. Next time we'll dig a bit more into VA, and uncover the Data Set Service (`datasetsvc`).

And did I mention yet ... : 


**None of these Web Services are documented, and they should therefore be assumed to be completely unsupported by Oracle. This article is purely for geek interest. Using undocumented APIs leaves you at risk of the API changing at any time.**

