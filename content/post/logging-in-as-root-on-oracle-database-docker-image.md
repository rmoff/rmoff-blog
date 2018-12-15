+++
author = "Robin Moffatt"
categories = ["oracle", "docker", "sudo", "root"]
date = 2018-11-30T12:13:41Z
description = ""
draft = false
image = "/images/2018/11/IMG_7280-EFFECTS.jpg"
slug = "logging-in-as-root-on-oracle-database-docker-image"
tags = ["oracle", "docker", "sudo", "root"]
title = "Logging in as root on Oracle Database Docker image"

+++

tl;dr: 

    docker exec --interactive \
                --tty \
                --user root \
                --workdir / \
                oracle-container-name bash

---


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