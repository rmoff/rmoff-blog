---
draft: false
title: 'Troubleshooting OBIEE – LDAP (ADSI) authentication'
date: "2010-12-02T17:52:05+0100"
image: "/images/2010/12/snag-2010-11-22-20-43-57-0000.webp"
categories:
- obiee
- unix
---

They say about travelling that it’s the journey and not the destination, and the same is true with this problem we hit during a deployment to Production.

<!--more-->
We were deploying a new OBIEE 10g implementation, with authentication provided by Microsoft Active Directory (AD) through the LDAP functionality in OBIEE. As a side note, it’s a rather nice way to do authentication, although maybe I’m biased coming from our previous implementation which used EBS integrated authentication and was a bugger to set up and work with.

## The Error

Testing of the LDAP authentication worked fine, but when we moved to Production we started hitting this error, **intermittently**. When we did hit the error, we saw the OBIEE “Logging On…” screen for a while before the error.  
![](/images/2010/12/snag-2010-11-22-20-43-57-0000.webp "SNAG-2010-11-22-20.43.57-0000")  
![](/images/2010/12/snag-2010-11-22-20-42-27-000021.webp "SNAG-2010-11-22-20.42.27-00002")

```

     [nQSError: 13011] Query for Initialization Block 'LDAP User Access Initialization Block' has failed.
     [53003] LDAP bind failure: Can't contact LDAP server.
```

Sporadically, it would all start working, until BI Server was next bounced, at which point it often stopped again.

## The Cause

I’ll jump ahead to the answer here in case you’re not interested in the diagnostics.

Our Active Directory domain has multiple Domain Controllers (DCs). The Active Directory server defined in the LDAP connection is a DNS entry with multiple IPs, for the different DCs (for resilience). The IPs are returned in round-robin fasion, not load-balanced. *For some reason one of the IPs returned by DNS lookup was not valid.*

What was happening was that OBIEE was sporadically hitting the duff IP from the resolution of the AD server address. It would timeout after failing to connect to the duff IP, which is when we would get the “**LDAP bind failure: Can’t contact LDAP server**” error. An SR we raised confirmed that OBIEE won’t retry a failed connection, otherwise I guess we might have moved on to the next (valid) IP.

To workaround this until DNS could be fixed, we hardcoded (yuck)the AD server name as a specific IP rather than DNS entry, and crossed our fingers that the server doesn’t go pop 🙂  
A permanent solution would be to specify multiple LDAP servers in the RPD.

## Diagnostics

(OBIEE 10.1.3.4.1, HP-UX Itanium 11.31)  
Starting off with the most obvious, and then getting more and more detailed as the problem still couldn’t be resolved (pun intended).

- Opening up the RPD in online mode and testing the LDAP Init Block and LDAP Server connection from within the Admin Tool both worked, proving that the connectivity from the BI Server to the LDAP server was not the problem
- Pinging the AD server name from the BI Server, worked

As well as proving the connection between BI Server and LDAP, we checked the LDAP server. As our corporate AD, any problems with it would be well known before little BI got involved.

Next up we used **ldapsearch** to prove connectivity and valid LDAP credentials with the AD server:

```

$whereis ldapsearch
ldapsearch: /opt/ldapux/bin/ldapsearch
$/opt/ldapux/bin/ldapsearch -v -b "dc=mycompany, dc=co, dc=uk" -h adserver.co.uk -p 389 -D "cn=SVC_OBIEE, ou=service accounts, ou=service management, dc=mycompany, dc=co, dc=uk" -w Password "(sAMAccountName=testuser)" sAMAccountName
```

This should return output from the LDAP server. You can fiddle with the latter parameters to get different information out of LDAP – use the -help flag if you want to know more.

```

ldapsearch: started Thu Dec  2 12:33:18 2010

ldap_init( adserver.co.uk, 389 )
filter pattern: (sAMAccountName=testuser)
returning: sAMAccountName
filter is: (sAMAccountName=testuser)
version: 1
dn: CN=Fred Bloggs,OU=Users,OU=MyCompany,OU=Data Management,DC=mycompany,
 DC=co,DC=uk
sAMAccountName: TESTUSER
1 matches
$
```

From here, I set about building a test case. Test cases serve a dual purpose – they give the support team something to work with and reproduce the failure, but they also enforce a strictness in method which often reveals the problem itself. In an ideal [BAAG](http://www.battleagainstanyguess.com/baag/) world everything would only be approached in a methodical manner. However there is that no-man’s land between discovering a problem and beginning to properly diagnose it – the trick is to make the time in no-man’s land as short as possible (lest one gets shot down in a hail of irrational guesses and uncontrolled system changes).

The problem so far was one seen when a login to BI Server via Presentation Services was attempted, which by its nature is a GUI work pattern. To make it reproducible I ideally wanted a command line solution that could be run on demand to generate the failure. I dug out nqcmd, which executes commands against the BI Server directly and is fully scriptable. This had the added benefit of removing Presentation Services from consideration, which assuming the problem could be reproduced with nqcmd would be one less complex factor to debug.

You’ll find nqcmd in BIServer/server/Bin (or Bin64). On Unix don’t forget to set the environment paths first with sa-init.sh (or sa-init64.sh).

First I created a file q1.lsql with some valid Logical SQL (what Presentation Presentation Services fires at BI Server), which can then be called by nqcmd and executed:

```

SELECT Organisation."Store Name" saw_0 FROM "Loss Prevention" ORDER BY saw_0
```

Initially I ran nqcmd using Administrator login, to remove LDAP from consideration and prove everything else worked:

```

$nqcmd -d AnalyticsWeb64 -u Administrator -p adminPW -s q1.lsql -q

-------------------------------------------------------------------------------
          Oracle BI Server
          Copyright (c) 1997-2009 Oracle Corporation, All rights reserved
-------------------------------------------------------------------------------

[...]
Row count: 437
---------------------------------------------------------------------------------------------------------[...]
Processed: 1 queries
```

Next I tried to use my user ID to test the LDAP connectivity.

```

$date;nqcmd -d AnalyticsWeb64 -u myuserID -p RightPW -s q1.lsql -q;date
Tue Nov 23 08:42:33 GMT 2010

-------------------------------------------------------------------------------
          Oracle BI Server
          Copyright (c) 1997-2009 Oracle Corporation, All rights reserved
-------------------------------------------------------------------------------

[10018][State: 08004] [NQODBC] [SQL_STATE: 08004] [nQSError: 10018] Access for the requested connection is refused.
[53003] LDAP bind failure: Can't contact LDAP server.
Connect open failed

Connection open failed:
[10018][State: 08004] [NQODBC] [SQL_STATE: 08004] [nQSError: 10018] Access for the requested connection is refused.
[53003] LDAP bind failure: Can't contact LDAP server.
Connection open failed
Tue Nov 23 08:43:51 GMT 2010
```

By prefixing and suffixing the call to nqcmd with “date” and I record in my test case the time spend on nqcmd. In this case (lines 2 and 17 above) you can see it takes over a minute for BI Server to fail the login.

To rule out an error in parsing what the LDAP server returned on a successful connection, I tried it with the wrong password, but hit the same error:

```

$date;nqcmd -d AnalyticsWeb64 -u myuserID -p wrongPW -s q1.lsql -q
Tue Nov 23 08:12:38 GMT 2010

-------------------------------------------------------------------------------
          Oracle BI Server
          Copyright (c) 1997-2009 Oracle Corporation, All rights reserved
-------------------------------------------------------------------------------

date
[10018][State: 08004] [NQODBC] [SQL_STATE: 08004] [nQSError: 10018] Access for the requested connection is refused.
[53003] LDAP bind failure: Can't contact LDAP server.
Connect open failed

Connection open failed:
[10018][State: 08004] [NQODBC] [SQL_STATE: 08004] [nQSError: 10018] Access for the requested connection is refused.
[53003] LDAP bind failure: Can't contact LDAP server.
Connection open failed
$date
Tue Nov 23 08:13:55 GMT 2010
```

My next attempt with the right password crashed the BI Server process, and on restart LDAP authentication worked!

```

$date;nqcmd -d AnalyticsWeb64 -u myuserID -p RightPW -s q1.lsql -q;date
Tue Nov 23 08:44:01 GMT 2010

[...]
Row count: 437
[...]
Processed: 1 queries
Tue Nov 23 08:44:03 GMT 2010
```

I also saw the error messages I’d expect with an invalid password or username:

```

$date;nqcmd -d AnalyticsWeb64 -u myuserID -p WrongPW -s q1.lsql -q;date
Tue Nov 23 08:50:37 GMT 2010

-------------------------------------------------------------------------------
          Oracle BI Server
          Copyright (c) 1997-2009 Oracle Corporation, All rights reserved
-------------------------------------------------------------------------------

[10018][State: 08004] [NQODBC] [SQL_STATE: 08004] [nQSError: 10018] Access for the requested connection is refused.
[53012] User authentication failure: myuserID.
Connect open failed

Connection open failed:
[10018][State: 08004] [NQODBC] [SQL_STATE: 08004] [nQSError: 10018] Access for the requested connection is refused.
[53012] User authentication failure: myuserID.
Connection open failed
Tue Nov 23 08:50:37 GMT 2010
```

```

$date;nqcmd -d AnalyticsWeb64 -u badgerbadgermyuserID -p WrongPW -s q1.lsql -q;date
Tue Nov 23 08:51:20 GMT 2010

-------------------------------------------------------------------------------
          Oracle BI Server
          Copyright (c) 1997-2009 Oracle Corporation, All rights reserved
-------------------------------------------------------------------------------

[10018][State: 08004] [NQODBC] [SQL_STATE: 08004] [nQSError: 10018] Access for the requested connection is refused.
[53012] User authentication failure: badgerbadgermyuserID.
Connect open failed

Connection open failed:
[10018][State: 08004] [NQODBC] [SQL_STATE: 08004] [nQSError: 10018] Access for the requested connection is refused.
[53012] User authentication failure: badgerbadgermyuserID.
Connection open failed
Tue Nov 23 08:51:20 GMT 2010
```

Having already run a ping from the BI Server to LDAP server, I had no reason to run it again so I thought, but did anyway:

```

$/usr/sbin/ping mycompany.co.uk -n 1
PING 10.3.5.0: 64 byte packets

----10.3.5.0 PING Statistics----
1 packets transmitted, 0 packets received, 100% packet loss
```

100% packet loss. uh oh.

From here I did an nslookup up of the AD server name that we were using, and pinged each of the addresses returned – one of them was the one I happened to hit above, and was dead. The rest I’ve explained above under “The Cause”.

## Geeky footnote

With that wonderful thing known as hindsight, I dug too deep too quickly, as I should have understood more around our AD server and what its name resolved to. Instead, I got stuck in to some **tusc** tracing:

```

# Determine the process ID of nqserver, and attach tusc to it
echo "Starting tusc"
ps -ef|grep nqsserver|grep -v grep|awk '{print $2}'|xargs tusc -aDeEfT "%F-%H:%M:%S" -Ao ~/tusc.`hostname`.out &
```

This writes acres of wonderful gobbledegook like this:

```

time(0x1ffffffff3abf628) ...............................
gettimeofday(0x1ffffffff3abf600, NULL) .................
write(6, "2 0 1 0 - 1 1 - 2 3   0 7 : 4 3 ".., 131) ....
send(20, "~ \0\0\002\0\0\0\0  \0\001\0\0\0".., 134, 0) .
gettimeofday(0x1ffffffff3ac0e10, NULL) .................
recv(20, "\f\0\0\0! ' \0\0", 8, 0) .....................
recv(20, "01\0\0\0U 17h ) \0\0- q ", 12, 0) ............
gettimeofday(0x1ffffffff3ac0e10, NULL) .................
send(20, "\b\0\0\002\0\0\0\0\0\0\0\0\0\0\0", 16, 0) ....
gettimeofday(0x1ffffffff3ac0e10, NULL) .................
recv(20, "\f\0\0\011' \0\0", 8, 0) .....................
recv(20, "01\0\0\0U 17h ) \0\0- q ", 12, 0) ............
gettimeofday(0x1ffffffff3ac0e10, NULL) .................
send(20, "04\0\0\002\0\0\0\0\0\0\0", 12, 0) ............
gettimeofday(0x1ffffffff3ac0e10, NULL) .................
```

but which also included this:

```

connect(22, 0x6000000000546540, 16) ................................................................................................... ERR#242 EHOSTUNREACH
```

A bit of google-fu throws up “EHOSTUNREACH: No route to host. A socket operation was attempted to an unreachable host.” and a figure of 75 seconds as the timeout – which matches with the delay observed before BI Server throws the error.  
So in this case tusc wasn’t necessary but with a bit more nouse would have got me to the result sooner than a lucky ping did.
