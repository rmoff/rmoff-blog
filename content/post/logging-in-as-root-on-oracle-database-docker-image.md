+++
categories = ["oracle", "docker", "sudo", "root"]
date = 2021-01-13T12:13:41Z
description = ""
draft = false
image = "/images/2018/11/IMG_7280-EFFECTS.jpg"
slug = "running-as-root-on-docker-image-without-sudo"
tag = ["oracle", "docker", "sudo", "root"]
title = "Running as root on Docker images that don't use root"
aliases = [
    "/2018/11/30/logging-in-as-root-on-oracle-database-docker-image/"
]
+++


tl;dr: specify the `--user root` argument: 

{{< highlight shell >}}
docker exec --interactive \
            --tty \
            --user root \
            --workdir / \
            container-name bash

{{< /highlight >}}

<!--more-->

There are [good reasons](https://engineering.bitnami.com/articles/why-non-root-containers-are-important-for-security.html) why running in a container as root is not a good idea, and that's why many images published nowadays avoid doing this. [Confluent Platform's Docker images](https://hub.docker.com/r/confluentinc/) changed to using `appuser` with the 6.0 release. 

## Checking the container user

You can check what user your container is running with: 

```bash
$ docker exec --interactive --tty kafka bash
[appuser@b59043522a44 ~]$ whoami
appuser
```

or more directly: 

```bash
$ docker exec --interactive --tty kafka whoami
appuser
```

## Changing the container user 

Using the `--user root` argument when launching the Docker exec command you can override the container's user: 

```bash
$ docker exec --interactive --tty --user root kafka bash
[root@b59043522a44 appuser]# whoami
root
```

or

```bash
$ docker exec --interactive --tty --user root kafka whoami
root
```

## What, no `sudo`?

Imagine this nightmare scenario 🙀 : 

```bash
$ docker exec --interactive --tty kafka bash
[appuser@b59043522a44 ~]$ yum install jq
Error: This command has to be run under the root user.
[appuser@b59043522a44 ~]$ sudo yum install jq
bash: sudo: command not found
[appuser@b59043522a44 ~]$
```

Now, installing into Docker containers is not The Right Way - you should amend the Docker image to install what's needed before invocation as a container. *BUT* sometimes needs must. Whether a quick hack, or just a PoC that you want to get running - sometimes you do want to install into a container, and that can be more difficult without root. 

You can use the same approach as above (`--user root`): 

```bash
$ docker exec --interactive --tty --user root kafka bash
[root@b59043522a44 appuser]# yum install -y jq
Confluent repository                                                                                                                                         13 kB/s |  29 kB     00:02
Red Hat Universal Base Image 8 (RPMs) - BaseOS                                                                                                              978 kB/s | 772 kB     00:00
Red Hat Universal Base Image 8 (RPMs) - AppStream                                                                                                           1.8 MB/s | 4.9 MB     00:02
Red Hat Universal Base Image 8 (RPMs) - CodeReady Builder                                                                                                    40 kB/s |  13 kB     00:00
zulu-openjdk - Azul Systems Inc., Zulu packages                                                                                                              95 kB/s | 123 kB     00:01
[…]
]
Installed:
  jq-1.5-12.el8.x86_64                                                                     oniguruma-6.8.2-2.el8.x86_64

Complete!
```
## Logging in as `root` on Oracle's Database Docker Image

Using Oracle's [Docker database image](https://github.com/oracle/docker-images/blob/master/OracleDatabase/SingleInstance/README.md) I wanted to install some additional apps, without modifying the `Dockerfile`. 

Connect to the container: 

```
$ docker exec --interactive --tty docker-compose_oracle_1_479e7fa05ab5 bash
```

No sudo: 

```
[oracle@a37d6e99353b ~]$ sudo whoami
bash: sudo: command not found
```

Googled, found the the `--user` flag for Docker, tried that: 

```
$ docker exec --interactive --tty --user root docker-compose_oracle_1_479e7fa05ab5 bash
OCI runtime exec failed: exec failed: container_linux.go:348: starting container process caused "chdir to cwd (\"/home/oracle\") set in config.json failed: permission denied": unknown
```

Evidently, the Docker image tries to change directory to the Oracle home folder which Docker's not happy doing as another user (even though it's `root`?). 

Googled some more, found the `--workdir` flag to override the `WORKDIR` setting of [the Dockerfile from which the image is built](https://github.com/oracle/docker-images/blob/master/OracleDatabase/SingleInstance/dockerfiles/12.2.0.1/Dockerfile#L105): 

```
$ docker exec --interactive --tty --user root --workdir / docker-compose_oracle_1_479e7fa05ab5 bash
bash-4.2# whoami
root
```
