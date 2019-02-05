+++
author = "Robin Moffatt"
categories = ["obiee", "obiee12c", "rpd", "downloadrpd", "uploadrpd", "data-model-cmd", "web service", "rest", "curl", "sysdig"]
date = 2016-05-28T20:30:00Z
description = ""
draft = false
image = "/images/2016/05/1__oracle_demo____ssh_.png"
slug = "lifting-the-lid-on-obiee-12c-web-services-part-2"
tag = ["obiee", "obiee12c", "rpd", "downloadrpd", "uploadrpd", "data-model-cmd", "web service", "rest", "curl", "sysdig"]
title = "Lifting the Lid on OBIEE 12c Web Services - Part 2"

+++

In OBIEE 12c `data-model-cmd` is a wrapper for some java code which ultimately calls an internal RESTful web service in OBIEE 12c, `bi-lcm`. We saw in the [previous post](http://rmoff.net/2016/05/24/lifting-the-lid-on-obiee-12c-web-services-part-1/) how these internal web services can be opened up slightly, and we're going to do the same again here. Which means, time for the same caveat:

---

**None of these Web Services are documented, and they should therefore be assumed to be completely unsupported by Oracle. This article is purely for geek interest. Using undocumented APIs leaves you at risk of the API changing at any time.**

---

With that out of the way, let's go! Firstly, a simple example of downloading the RPD. The way that OBIEE 12c works with RPDs is significantly different from previous versions, since there is now the concept of customisations and layering. You may have noticed `liverpd.rpd` or `default_diff.xml`, both of which are related to this. The nett result is that there is no longer a single RPD file uploaded to the server which can be downloaded again for editing, as there was in 11g and before. You now need to submit a request to OBIEE to retrieve the latest version of the RPD, which it will pull together on the fly and pass back to you. This is done using `data-model-cmd`:

    $ /app/oracle/biee/user_projects/domains/bi/bitools/bin/data-model-cmd.sh downloadrpd -O ~/myRPD.rpd -W Admin123 -U weblogic -P Admin123 -SI ssi

This writes a local file, myRPD.rpd. In the background, it's calling `bi-lcm` to retrieve the file, as we can see from two diagnostic routes:

* First, my favourite, `sysdig`, sniffing any traffic on ports 7780 (managed server public listen port) and 7783 (managed server internal listen port, as used by intra-component REST calls etc):

        sudo sysdig -s 2000 -A -c echo_fds "(fd.port=7780 or fd.port=7783)"

    This captures the following `POST` request:

        POST /bi-lcm/v1/si/ssi/rpd/downloadrpd HTTP/1.1
        Content-Type: application/x-www-form-urlencoded
        Authorization: Basic d2VibG9naWM6QWRtaW4xMjM=
        User-Agent: Jersey/2.21.1 (HttpUrlConnection 1.8.0_51)
        Host: demo.us.oracle.com:7780
        Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
        Connection: keep-alive
        Content-Length: 24

* Just as useful, in this case, is the `bi-lcm` log file itself, `DOMAIN_HOME/servers/bi_server1/logs/bi-lcm-rest.log.0`:

        47 > POST http://demo.us.oracle.com:7780/bi-lcm/v1/si/ssi/rpd/downloadrpd
        47 > Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
        47 > Authorization: Basic d2VibG9naWM6QWRtaW4xMjM=
        47 > Connection: keep-alive
        47 > Content-Length: 24
        47 > Content-Type: application/x-www-form-urlencoded
        47 > Host: demo.us.oracle.com:7780
        47 > User-Agent: Jersey/2.21.1 (HttpUrlConnection 1.8.0_51)
        target-password=Admin123

So the syntax of the RESTful call is pretty simple -- call the `downloadrpd` endpoint, passing in the password that is to be used to encrypt the generated RPD. Authentication is done by Basic HTTP.

What can we do with this? Two things - neither of which are spectacularly useful as such, but additional ways and means to achieve the same. It may be you've got a bespoke code integration system that needs to integrate with a RESTful endpoint, or simply it's just another useful tool to have at one's disposal. Before we get into it, it's probably time for that caveat again:

---

**None of these Web Services are documented, and they should therefore be assumed to be completely unsupported by Oracle. This article is purely for geek interest. Using undocumented APIs leaves you at risk of the API changing at any time.**

---

[`cURL`](https://curl.haxx.se/) is a commandline utility for sending HTTP (amongst other) requests. We can use it to request the RPD to be downloaded to any machine on which we can run cURL. Because it adheres to the *nix philosophy of making the output available as a pipe, we can redirect it to a file:  (_if you don't, you'll get a screen full of gibberish..._)

```bash
curl -X "POST" "http://192.168.56.101:7780/bi-lcm/v1/si/ssi/rpd/downloadrpd" \
--data-urlencode "target-password=Admin123" \
--basic --user weblogic:Admin123 \
> downloadedRPD.rpd
```

Note that I've used `\` line continuation character to break the command over multiple lines simply for legibility. 

It's pretty clear, hopefully, how to parameterise this for your own use. The server and port are your OBIEE managed server and port (the same that `/analytics` is on). The rest are credentials, for the downloaded RPD, and to access the OBIEE system, respectively.

Taking the same method, but via a web page, we can run this HTML file anywhere we want:

```html
<html>
   <head></head>
   <body>
      <FORM action="http://192.168.56.101:7780/bi-lcm/v1/si/ssi/rpd/downloadrpd"
         enctype="application/x-www-form-urlencoded"
         method="post">
         <P>
           New password for downloaded RPD file? <INPUT type="text" name="target-password"><BR>
            <INPUT type="submit" value="Send"> <INPUT type="reset">
      </FORM>
   </body>
</html>
```

Load it into a web browser, enter a password for the generated RPD:

![](/images/2016/05/rpd_download_html.png)

and enter your credentials for OBIEE when prompted:

![](/images/2016/05/rpddl02.png)

The RPD file is downloaded as `downloadrpd`, which you can rename to whatever you want.

---

So, we can do `downloadrpd` -- what about `uploadrpd`? Because that really would be useful for some people, being able to deploy an RPD without needing to dive into the commandline.

Here's the `uploadrpd` command:

```bash
$ /app/oracle/biee/user_projects/domains/bi/bitools/bin/data-model-cmd.sh \ 
uploadrpd -I /home/oracle/chng1.rpd -W Admin123 -U weblogic -P Admin123 -SI ssi
```

The resulting POST request looks like this:

    POST http://demo.us.oracle.com:7780/bi-lcm/v1/si/ssi/rpd/uploadrpd
    Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
    Authorization: Basic d2VibG9naWM6QWRtaW4xMjM=
    Connection: keep-alive
    Content-Length: 1221056
    Content-Type: multipart/form-data;boundary=Boundary_1_1010953501_1464461679148
    Host: demo.us.oracle.com:7780
    MIME-Version: 1.0
    User-Agent: Jersey/2.21.1 (HttpUrlConnection 1.8.0_51)

The upload has two parts; the RPD password, and the RPD itself.

    --Boundary_1_1010953501_1464461679148
    Content-Type: text/plain
    Content-Disposition: form-data; name="rpd-password"

    Admin123
    --Boundary_1_1010953501_1464461679148
    Content-Type: application/vnd.oracle.rpd
    Content-Disposition: form-data; filename="myRPD.rpd"; modification-date="Sat, 28 May 2016 18:53:14 GMT"; size=1220668; name="file"

    [whole bunch of encoded RPD binary file]

~~But - I couldn't replicate this HTTP request successfully; called manually through Paw, or cURL, or a manual webpage like the above, it would fail with the error:~~

    oracle.bi.lcm.rest.si.rpd.RpdEndpointV1 SEVERE - Exception during RPD file upload: java.lang.NullPointerException

~~Or on other attempts:~~

    java.net.SocketTimeoutException : Read time out after 30000 millis

~~My guess (based on ruling out all the other stuff) is it's down to how I was encoding the file and/or specifying its length. A challenge for [you Neos](https://oracleus.activeevents.com/2014/connect/fileDownload/session/75F302D730BDB9CA14ADAB3477574D4D/UGF9144_Berg-OOW_Neos_Voyage_2014.pdf) out there to crack?~~

**Update:** [Neo has risen to the challenge](https://twitter.com/fomin_andrew/status/739189964097851393), showing that the force is strong in this one... Andrew Fomin ([twitter](https://twitter.com/fomin_andrew) | [blog](https://bisoftdiary.com/)) has figured out the correct syntax in order to use `curl` to upload an RPD:

```bash
curl -X POST \
     "http://192.168.1.41:7780/bi-lcm/v1/si/ssi/rpd/uploadrpd" \
     --form "file=@myRPD.rpd;type=application/vnd.oracle.rpd" \
     --form "rpd-password=Password01" \
     --basic --user weblogic:Admin123
```

The key bit in this is that the content-type of the upload RPD file is set to `application/vnd.oracle.rpd` -- without this the upload fails. 

When run, the JSON payload returned shows success (parsed here through `jq`):

```json
{
  "clazz": [
    "rpd-response"
  ],
  "links": [
    {
      "href": "http://192.168.1.41:7780/bi-lcm/v1/si/ssi/rpd/uploadrpd",
      "rel": [
        "self"
      ]
    }
  ],
  "properties": {
    "entry": [
      {
        "key": "si",
        "value": {
          "type": "string",
          "value": "ssi"
        }
      },
      {
        "key": "description",
        "value": {
          "type": "string",
          "value": "RPD upload completed successfully."
        }
      },
      {
        "key": "desc_code",
        "value": {
          "type": "string",
          "value": "DESC_CODE_RPD_UPLOAD_SUCCESSFUL"
        }
      },
      {
        "key": "status",
        "value": {
          "type": "string",
          "value": "SUCCESS"
        }
      }
    ]
  },
  "title": "RPD-LCM response, SI=ssi, action=Upload RPD"
}
```

Thanks Andrew!

---

**None of these Web Services are documented, and they should therefore be assumed to be completely unsupported by Oracle. This article is purely for geek interest. Using undocumented APIs leaves you at risk of the API changing at any time.**

---

