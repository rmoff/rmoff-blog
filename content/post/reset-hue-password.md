+++
categories = ["hue", "django", "python", "cdh"]
date = 2016-07-05T13:27:06Z
description = ""
draft = false
slug = "reset-hue-password"
tag = ["hue", "django", "python", "cdh"]
title = "Reset Hue password"

+++

([Ref](http://gethue.com/password-management-in-hue/))

The bit that caught me out was this kept failing with 

	Error: Password not present	
	
and a Python stack trace that ended with 

	subprocess.CalledProcessError: Command '/var/run/cloudera-scm-agent/process/78-hue-HUE_SERVER/altscript.sh sec-1-secret_key' returned non-zero exit status 1
	
The answer (it *seems*) is to ensure that `HUE_SECRET_KEY` is set (to any value!)

Launch shell:

	export HUE_SECRET_KEY=foobar
	/opt/cloudera/parcels/CDH-5.7.1-1.cdh5.7.1.p0.11/lib/hue/build/env/bin/hue shell

Reset password for `hue`, activate account and make it superuser

	from django.contrib.auth.models import User
	user = User.objects.get(username='hue')
	user.is_active=True
	user.save()
	user.is_superuser=True
	user.save()
	user.set_password('hue')
	user.save()
