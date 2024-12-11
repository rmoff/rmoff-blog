---
draft: false
title: 'Learning Apache Flink S01E05: Installing PyFlink (with some bumps along the way…)'
date: "2023-10-25T15:27:22Z"
image: "/images/2023/10/pyflink1.webp"
thumbnail: "/images/2023/10/IMG_6173.webp"
credit: "https://bsky.app/profile/rmoff.net"
categories:
- LAF
- Apache Flink
- PyFlink
---

When I started [my journey learning Apache Flink](/categories/laf/) one of the things that several people expressed an interest in hearing more about was PyFlink.  This appeals to me too, because whilst Java is just something I don't know and feels beyond me to try and learn, Python is something that I know enough of to at least hack my way around it. I've previously [had fun with PySpark](/2022/09/16/data-engineering-in-2022-exploring-lakefs-with-jupyter-and-pyspark/), and whilst [Flink SQL](/categories/flink-sql/) will probably be one of my main focusses, I also want to get a feel for PyFlink. 

The first step to using PyFlink is installing it - which should be simple, right? 

<!--more-->

Right? 

![Padame looking concerned when she realises that something isn't as she'd assumed](/images/2023/10/padame.webp)

## Step 1: Install PyFlink…

The [docs](https://nightlies.apache.org/flink/flink-docs-release-1.15/docs/dev/python/datastream_tutorial/#how-to-follow-along) are a useful start here, and tell us that we need to install Flink as a Python library first: 

```
$ pip install apache-flink
```

## `No matching distribution found for numpy==1.21.4`

This failed with the following output (truncated, for readability)

```
$ pip install apache-flink
Collecting apache-flink
  Using cached apache-flink-1.18.0.tar.gz (1.2 MB)
  Preparing metadata (setup.py) ... done
[…]
  Installing build dependencies ... error
  error: subprocess-exited-with-error

  × pip subprocess to install build dependencies did not run successfully.
  │ exit code: 1
  ╰─> [12 lines of output]
      Collecting packaging==20.5
        Using cached packaging-20.5-py2.py3-none-any.whl (35 kB)
      Collecting setuptools==59.2.0
        Using cached setuptools-59.2.0-py3-none-any.whl (952 kB)
      Collecting wheel==0.37.0
        Using cached wheel-0.37.0-py2.py3-none-any.whl (35 kB)
      ERROR: Ignored the following versions that require a different python version: 1.21.2 Requires-Python >=3.7,<3.11; 1.21.3 Requires-Python >=3.7,<3.11; 1.21.4 Requires-Python >=3.7,<3.11; 1.21.5 Requires-Python >=3.7,<3.11; 1.21.6 Requires-Python >=3.7,<3.11
      ERROR: Could not find a version that satisfies the requirement numpy==1.21.4 (from versions: 1.3.0, 1.4.1, 1.5.0, 1.5.1, 1.6.0, 1.6.1, 1.6.2, 1.7.0, 1.7.1, 1.7.2, 1.8.0, 1.8.1, 1.8.2, 1.9.0, 1.9.1, 1.9.2, 1.9.3, 1.10.0.post2, 1.10.1, 1.10.2, 1.10.4, 1.11.0, 1.11.1, 1.11.2, 1.11.3, 1.12.0, 1.12.1, 1.13.0, 1.13.1, 1.13.3, 1.14.0, 1.14.1, 1.14.2, 1.14.3, 1.14.4, 1.14.5, 1.14.6, 1.15.0, 1.15.1, 1.15.2, 1.15.3, 1.15.4, 1.16.0, 1.16.1, 1.16.2, 1.16.3, 1.16.4, 1.16.5, 1.16.6, 1.17.0, 1.17.1, 1.17.2, 1.17.3, 1.17.4, 1.17.5, 1.18.0, 1.18.1, 1.18.2, 1.18.3, 1.18.4, 1.18.5, 1.19.0, 1.19.1, 1.19.2, 1.19.3, 1.19.4, 1.19.5, 1.20.0, 1.20.1, 1.20.2, 1.20.3, 1.21.0, 1.21.1, 1.22.0, 1.22.1, 1.22.2, 1.22.3, 1.22.4, 1.23.0rc1, 1.23.0rc2, 1.23.0rc3, 1.23.0, 1.23.1, 1.23.2, 1.23.3, 1.23.4, 1.23.5, 1.24.0rc1, 1.24.0rc2, 1.24.0, 1.24.1, 1.24.2, 1.24.3, 1.24.4, 1.25.0rc1, 1.25.0, 1.25.1, 1.25.2, 1.26.0b1, 1.26.0rc1, 1.26.0, 1.26.1)
      ERROR: No matching distribution found for numpy==1.21.4

      [notice] A new release of pip is available: 23.2.1 -> 23.3
      [notice] To update, run: python3.11 -m pip install --upgrade pip
      [end of output]

  note: This error originates from a subprocess, and is likely not a problem with pip.
error: subprocess-exited-with-error

× pip subprocess to install build dependencies did not run successfully.
│ exit code: 1
╰─> See above for output.

note: This error originates from a subprocess, and is likely not a problem with pip.
```

## Try installing the next newest version

Looking at the error I spot `No matching distribution found for numpy==1.21.4` so maybe I just try a different version? 

```
$ pip install numpy==1.22.0
Collecting numpy==1.22.0
  Downloading numpy-1.22.0.zip (11.3 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 11.3/11.3 MB 443.6 kB/s eta 0:00:00
  Installing build dependencies ... done
  Getting requirements to build wheel ... error
  error: subprocess-exited-with-error

  × Getting requirements to build wheel did not run successfully.
  │ exit code: 1
  ╰─> [93 lines of output]
[…]
     AttributeError: fcompiler. Did you mean: 'compiler'?
      [end of output]
```

Hey, a different error! I found a GitHub issue for this error that suggests [a newer version](https://github.com/pypa/setuptools/issues/3549#issuecomment-1709347140) of numpy will work

## Try installing the latest version of numpy

```
$ pip install numpy==1.26.1
Collecting numpy==1.26.1
  Downloading numpy-1.26.1-cp311-cp311-macosx_11_0_arm64.whl.metadata (115 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 115.1/115.1 kB 471.4 kB/s eta 0:00:00
Downloading numpy-1.26.1-cp311-cp311-macosx_11_0_arm64.whl (14.0 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 14.0/14.0 MB 473.2 kB/s eta 0:00:00
Installing collected packages: numpy
Successfully installed numpy-1.26.1

```

Yay! 

But… still no dice with installing PyFlink

```
$ pip install apache-flink
[…]
      ERROR: No matching distribution found for numpy==1.21.4
      [end of output]
```

## RTFEM (Read The Fscking Error Message)

Going back to the original error, looking at it more closely and breaking the lines you can see this: 

```
      ERROR: Ignored the following versions that require a different python version: 
	  1.21.2 Requires-Python >=3.7,<3.11; 
	  1.21.3 Requires-Python >=3.7,<3.11; 
      1.21.4 Requires-Python >=3.7,<3.11; 
      1.21.5 Requires-Python >=3.7,<3.11; 
      1.21.6 Requires-Python >=3.7,<3.11
```

Let's look at my Python version on the system: 

```bash
$ python3 --version
Python 3.11.5
```

So this matches—the numpy install needs less than 3.11 and we're on 3.11.5. 

## Install a different version of Python

A quick Google throws up `pyenv` as a good tool for managing Python versions (let me know if that's not the case!). It installs on my Mac with brew nice and easily: 

```bash
$ brew install pyenv
$ echo 'PATH=$(pyenv root)/shims:$PATH' >> ~/.zshrc
```

Install a new version:

```bash
$ pyenv install 3.10
```

Activate the newly-installed version

```shell
$ pyenv global 3.10.13
```

Start a new shell to pick up the change, and validate that we're now using this version:

```bash
$ python --version
Python 3.10.13
```

## Try the PyFlink install again

```
$ pip install apache-flink

[…]
Successfully installed apache-beam-2.48.0 apache-flink-1.18.0 apache-flink-libraries-1.18.0 avro-python3-1.10.2 certifi-2023.7.22 charset-normalizer-3.3.1 cloudpickle-2.2.1 crcmod-1.7 dill-0.3.1.1 dnspython-2.4.2 docopt-0.6.2 fastavro-1.8.4 fasteners-0.19 find-libpython-0.3.1 grpcio-1.59.0 hdfs-2.7.3 httplib2-0.22.0 idna-3.4 numpy-1.24.4 objsize-0.6.1 orjson-3.9.9 pandas-2.1.1 pemja-0.3.0 proto-plus-1.22.3 protobuf-4.23.4 py4j-0.10.9.7 pyarrow-11.0.0 pydot-1.4.2 pymongo-4.5.0 pyparsing-3.1.1 python-dateutil-2.8.2 pytz-2023.3.post1 regex-2023.10.3 requests-2.31.0 six-1.16.0 typing-extensions-4.8.0 tzdata-2023.3 urllib3-2.0.7 zstandard-0.21.0

```

👏 Success! 

Now to go and actually use PyFlink…stay tuned :-D

---

_Note: thanks to Sergey Nuyanzin for pointing out that in Flink 1.19 there will be support for Python 3.11 ([FLINK-33030](https://issues.apache.org/jira/browse/FLINK-33030))_