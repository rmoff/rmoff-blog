---
title: "libnnz10.so: cannot restore segment prot after reloc: Permission denied"
date: "2009-12-18"
categories: 
  - "OBIEE"
  - "oel"
---

Quick post as the snow's coming down and I wanna go home ...

I've been working on building a VM based on OEL5.4 and OBIEE 10.1.3.4.1. After installing XE 10.2 I tried to fire my RPD up, but hit this:

> /usr/lib/oracle/xe/app/oracle/product/10.2.0/server/lib/libnnz10.so: cannot restore segment prot after reloc: Permission denied \[nQSError: 46029\] Failed to load the DLL /app/oracle/product/obiee/server/Bin/libnqsdbgatewayoci10g.so. Check if 'Oracle OCI 10G' database client is installed.

If you trace the 'stack' back you find that it parses down to this nub of an error:

> libnnz10.so: cannot restore segment prot after reloc: Permission denied

Google throws up a few hits, but not terribly detailed.

The error's to do with SELinux security. I'll hold my hand up now and say that I don't understand SELinux nor the implications of these commands except that it fixes my problem and I'm working in a sandbox environment. If you are working anywhere that this kind of thing matters then please consult with someone who knows what they're talking about first!

1. As root, generate a file of blocked activity (tail gets and follows the file, tee echoes it to stdout -the console- as well as writing it to the file oracle.log)
    
    tail -f /var/log/audit/audit.log | tee oracle.log
    
2. Do something in OBIEE to generate the error (run a report etc), you should see more output appear from the root session, like this:
    
    type=AVC msg=audit(1261159266.277:119): avc:  denied  { execmod } for  pid=9396 comm="nqsserver" path="/usr/lib/oracle/xe/app/oracle/product/10.2.0/server/lib/libnnz10.so" dev=dm-0 ino=3834074 scontext=user\_u:system\_r:unconfined\_t:s0 tcontext=system\_u:object\_r:lib\_t:s0 tclass=file
    type=SYSCALL msg=audit(1261159266.277:119): arch=40000003 syscall=125 success=no exit=-13 a0=3611000 a1=1dd000 a2=5 a3=b73313c0 items=0 ppid=1 pid=9396 auid=500 uid=500 gid=500 euid=500 suid=500 fsuid=500 egid=500 sgid=500 fsgid=500 tty=pts1 ses=1 comm="nqsserver" exe="/app/oracle/product/obiee/server/Bin/nqsserver" subj=user\_u:system\_r:unconfined\_t:s0 key=(null)
    
3. You can see snippets in there that are recognisable - the nqsserver program name and path. Press Ctrl-C to halt the tail command and return to the prompt.
4. Use the audit2allow program to add rules to permit the blocked behaviour:
    
    audit2allow -M nqsserver -i oracle.log
    
    Where -M defines a new module name (i've called it after nqsserver), and -i is the input file of blocked audit
5. You should be prompted to run semodule to activate the change:
    
    semodule -i nqsserver.pp
    
6. Now tail (no need to tee this time) the /var/log/audit/audit.log and repeat the activity you did before (run a report etc), and hopefully you won't get any entries this time. Doublecheck NQServer.log to make sure.
7. ? If a malicious program could do its blocked activity whilst you were 'recording' the audit file for blocked nqsserver might you end up allowing the malicious program inadvertently?

(Based on information from here: [http://forums.oracle.com/forums/thread.jspa?messageID=1285844](http://forums.oracle.com/forums/thread.jspa?messageID=1285844))
