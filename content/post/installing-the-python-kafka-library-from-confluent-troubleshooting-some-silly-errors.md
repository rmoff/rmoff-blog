+++
author = "Robin Moffatt"
categories = ["kafka", "confluent", "python", "apt-get"]
date = 2018-03-06T22:18:24Z
description = ""
draft = false
image = "/images/2018/03/2018-03-06_22-17-48.png"
slug = "installing-the-python-kafka-library-from-confluent-troubleshooting-some-silly-errors"
tags = ["kafka", "confluent", "python", "apt-get"]
title = "Installing the Python Kafka library from Confluent - troubleshooting some silly errors…"

+++

System: 

```
rmoff@proxmox01:~$ uname -a
Linux proxmox01 4.4.6-1-pve #1 SMP Thu Apr 21 11:25:40 CEST 2016 x86_64 GNU/Linux

rmoff@proxmox01:~$ head -n1 /etc/os-release
PRETTY_NAME="Debian GNU/Linux 8 (jessie)"

rmoff@proxmox01:~$ python --version
Python 2.7.9
```
Following: 

* https://www.confluent.io/blog/introduction-to-apache-kafka-for-python-programmers/
* https://github.com/confluentinc/confluent-kafka-python

Install `librdkafka`, which is a pre-req for the Python library: 

    wget -qO - https://packages.confluent.io/deb/4.0/archive.key | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://packages.confluent.io/deb/4.0 stable main"
    sudo apt-get install librdkafka-dev python-dev

Setup virtualenv: 

    sudo apt-get install virtualenv
    virtualenv kafka_push_notify
    source ./kafka_push_notify/bin/activate.fish

Try to install `confluent-kafka`: 

    pip install confluent-kafka

Fails: 

    Cleaning up...
    Command /home/rmoff/kafka_push_notify/bin/python2 -c "import setuptools, tokenize;__file__='/tmp/pip-build-Nkr6wJ/confluent-kafka/setup.py';exec(compile(getattr(tokenize, 'open', open)(__file__).read().replace('\r\n', '\n'), __file__, 'exec'))" install --record /tmp/pip-OlKYHm-record/install-record.txt --single-version-externally-managed --compile --install-headers /home/rmoff/kafka_push_notify/include/site/python2.7 failed with error code 1 in /tmp/pip-build-Nkr6wJ/confluent-kafka
    Traceback (most recent call last):
      File "/home/rmoff/kafka_push_notify/bin/pip", line 11, in <module>
        sys.exit(main())
      File "/home/rmoff/kafka_push_notify/local/lib/python2.7/site-packages/pip/__init__.py", line 248, in main
        return command.main(cmd_args)
      File "/home/rmoff/kafka_push_notify/local/lib/python2.7/site-packages/pip/basecommand.py", line 161, in main
        text = '\n'.join(complete_log)
    UnicodeDecodeError: 'ascii' codec can't decode byte 0xe2 in position 75: ordinal not in range(128)

Same error if I clone the repo (https://github.com/confluentinc/confluent-kafka-python.git) and do `pip install .`

If I try to install it outside of virtualenv it fails with : 

    [...]
    confluent_kafka/src/confluent_kafka.c: In function ‘_init_cimpl’:
    confluent_kafka/src/confluent_kafka.c:1590:56: error: ‘RD_KAFKA_TIMESTAMP_NOT_AVAILABLE’ undeclared (first use in this function)
      PyModule_AddIntConstant(m, "TIMESTAMP_NOT_AVAILABLE", RD_KAFKA_TIMESTAMP_NOT_AVAILABLE);
                                                            ^
    confluent_kafka/src/confluent_kafka.c:1591:54: error: ‘RD_KAFKA_TIMESTAMP_CREATE_TIME’ undeclared (first use in this function)
      PyModule_AddIntConstant(m, "TIMESTAMP_CREATE_TIME", RD_KAFKA_TIMESTAMP_CREATE_TIME);
                                                          ^
    confluent_kafka/src/confluent_kafka.c:1592:58: error: ‘RD_KAFKA_TIMESTAMP_LOG_APPEND_TIME’ undeclared (first use in this function)
      PyModule_AddIntConstant(m, "TIMESTAMP_LOG_APPEND_TIME", RD_KAFKA_TIMESTAMP_LOG_APPEND_TIME);
                                                              ^
    confluent_kafka/src/confluent_kafka.c:1597:54: error: ‘RD_KAFKA_OFFSET_INVALID’ undeclared (first use in this function)
             PyModule_AddIntConstant(m, "OFFSET_INVALID", RD_KAFKA_OFFSET_INVALID);
                                                          ^
    error: command 'x86_64-linux-gnu-gcc' failed with exit status 1

    ----------------------------------------
    Command "/usr/bin/python -u -c "import setuptools, tokenize;__file__='/tmp/pip-build-8U7Wwr/confluent-kafka/setup.py';f=getattr(tokenize, 'open', open)(__file__);code=f.read().replace('\r\n', '\n');f.close();exec(compile(code, __file__, 'exec'))" install --record /tmp/pip-k1Yd7x-record/install-record.txt --single-version-externally-managed --compile" failed with error code 1 in /tmp/pip-build-8U7Wwr/confluent-kafka/


Check [the issues on github](https://github.com/confluentinc/confluent-kafka-python/issues/) - many point to problem being old version of `librdkafka`

    $ dpkg -l librdkafka-dev
    Desired=Unknown/Install/Remove/Purge/Hold
    | Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend
    |/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)
    ||/ Name                                                 Version                         Architecture                    Description
    +++-====================================================-===============================-===============================-==============================================================================================================
    ii  librdkafka-dev:amd64                                 0.8.5-2                         amd64                           library implementing the Apache Kafka protocol (development headers)

That's weird - the latest version is 0.11 or so. 

The problem? I forgot to run `apt-get update` after adding the repo. Looking back at my session history I can see that it pulled down: 

    http://ftp.uk.debian.org/debian/ jessie/main librdkafka-dev amd64 0.8.5-2 [106 kB]

So let's fix that!

    sudo apt-get update
    sudo apt-get install librdkafka-dev

And now the package comes from the horse's mouth, as it were: 

    https://packages.confluent.io/deb/4.0/ stable/main librdkafka-dev amd64 0.11.1~1confluent4.0.0-1 [412 kB]

Check the version : 
    
    dpkg -l librdkafka-dev
    Desired=Unknown/Install/Remove/Purge/Hold
    | Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend
    |/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)
    ||/ Name                                                 Version                         Architecture                    Description
    +++-====================================================-===============================-===============================-==============================================================================================================
    ii  librdkafka-dev:amd64                                 0.11.1~1confluent4.0.0-1        amd64                           library implementing the Apache Kafka protocol (development headers)

Happy days. Now let's try the install again: 

    (kafka_push_notify)rmoff@proxmox01 ~/confluent-kafka-python> pip install confluent-kafka
    Downloading/unpacking confluent-kafka
      Downloading confluent-kafka-0.11.0.tar.gz (42kB): 42kB downloaded
      Running setup.py (path:/tmp/pip-build-O1tSQm/confluent-kafka/setup.py) egg_info for package confluent-kafka

    Installing collected packages: confluent-kafka
      Running setup.py install for confluent-kafka
        building 'confluent_kafka.cimpl' extension
        x86_64-linux-gnu-gcc -pthread -DNDEBUG -g -fwrapv -O2 -Wall -Wstrict-prototypes -fno-strict-aliasing -D_FORTIFY_SOURCE=2 -g -fstack-protector-strong -Wformat -Werror=format-security -fPIC -I/usr/include/python2.7 -c confluent_kafka/src/confluent_kafka.c -o build/temp.linux-x86_64-2.7/confluent_kafka/src/confluent_kafka.o
        x86_64-linux-gnu-gcc -pthread -DNDEBUG -g -fwrapv -O2 -Wall -Wstrict-prototypes -fno-strict-aliasing -D_FORTIFY_SOURCE=2 -g -fstack-protector-strong -Wformat -Werror=format-security -fPIC -I/usr/include/python2.7 -c confluent_kafka/src/Producer.c -o build/temp.linux-x86_64-2.7/confluent_kafka/src/Producer.o
        x86_64-linux-gnu-gcc -pthread -DNDEBUG -g -fwrapv -O2 -Wall -Wstrict-prototypes -fno-strict-aliasing -D_FORTIFY_SOURCE=2 -g -fstack-protector-strong -Wformat -Werror=format-security -fPIC -I/usr/include/python2.7 -c confluent_kafka/src/Consumer.c -o build/temp.linux-x86_64-2.7/confluent_kafka/src/Consumer.o
        x86_64-linux-gnu-gcc -pthread -shared -Wl,-O1 -Wl,-Bsymbolic-functions -Wl,-z,relro -fno-strict-aliasing -DNDEBUG -g -fwrapv -O2 -Wall -Wstrict-prototypes -D_FORTIFY_SOURCE=2 -g -fstack-protector-strong -Wformat -Werror=format-security -Wl,-z,relro -D_FORTIFY_SOURCE=2 -g -fstack-protector-strong -Wformat -Werror=format-security build/temp.linux-x86_64-2.7/confluent_kafka/src/confluent_kafka.o build/temp.linux-x86_64-2.7/confluent_kafka/src/Producer.o build/temp.linux-x86_64-2.7/confluent_kafka/src/Consumer.o -lrdkafka -o build/lib.linux-x86_64-2.7/confluent_kafka/cimpl.so

    Successfully installed confluent-kafka
    Cleaning up...

Phew. All good. 
