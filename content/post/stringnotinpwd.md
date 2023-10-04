---
draft: true
title: 'cd: string not in pwd'
date: "2023-10-04T15:36:35Z"
image: "/images/2023/10/h_DSCF7802.webp"
thumbnail: "/images/2023/10/t_IMG_8657.webp"
credit: "https://twitter.com/rmoff/"
categories:
- zsh
---

A brief diversion from my [journey learning Apache Flink](/categories/laf/) to document an interesting `zsh` oddity that briefly tripped me up: 

```shell
cd: string not in pwd: flink-1.17.1
```

<!--more-->

This was on the third step of [Flink First Steps](https://nightlies.apache.org/flink/flink-docs-release-1.17/docs/try-flink/local_installation/#browsing-the-project-directory), in which you're instructed to browse the project directory after having downloaded and unarchived the tar. 

```shell
$ pwd
/Users/rmoff/flink

$ ls -l
total 917512
drwxr-xr-x@ 13 rmoff  staff        416 19 May 12:14 flink-1.17.1
-rw-r--r--@  1 rmoff  staff  469413690  4 Oct 15:52 flink-1.17.1-bin-scala_2.12.tgz
```

```shell
$ cd flink-*
cd: string not in pwd: flink-1.17.1
```

Looking at the directory listing, or simply hammering the tab key to auto-complete, most of us wouldn't bother this much more than just entering the full directory name instead: 

```shell
$ cd flink-1.17.1
$ ls -l
total 320
-rw-r--r--@  1 rmoff  staff   11357 19 May 09:43 LICENSE
-rw-r--r--@  1 rmoff  staff  145829 19 May 12:14 NOTICE
-rw-r--r--@  1 rmoff  staff    1309 19 May 09:43 README.txt
drwxr-xr-x@ 24 rmoff  staff     768 19 May 12:14 bin
drwxr-xr-x@ 13 rmoff  staff     416 19 May 12:14 conf
[…]
```

But the fix isn't half as interesting as the reason :) 

## What's old is new?

Turns out zsh has more than one form of the `cd` command. By using a wildcard the tutorial's instructions avoid having to hard code the version. However, as a result the second type of invocation of zsh's `cd` command is triggered. 

Remember that the directory we're currently in has the archive that we've downloaded and expanded. 

```shell
$ ls -l
total 917512
drwxr-xr-x@ 13 rmoff  staff        416 19 May 12:14 flink-1.17.1
-rw-r--r--@  1 rmoff  staff  469413690  4 Oct 15:52 flink-1.17.1-bin-scala_2.12.tgz
```

This means that the wildcard matches not just the unpacked directory, but the archive too. 

```shell
$ print flink-*
flink-1.17.1 flink-1.17.1-bin-scala_2.12.tgz
```
The important point here is that there is **more than one match to the glob**.

If there is more than one argument passed then the [second form of zsh's `cd`](https://zsh.sourceforge.io/Doc/Release/Shell-Builtin-Commands.html#index-cd) is used: _`cd old new`_. Here, the second argument is substituted for the first, which means that we're effectively entering (if you expand the wildcard):

```bash
cd flink-1.17.1 flink-1.17.1-bin-scala_2.12.tgz
```

Which per the syntax will try to replace the value for the "old" parameter (`flink-1.17.1`) in `pwd` (the working directory) with the value for the "new" parameter (`flink-1.17.1-bin-scala_2.12.tgz`)—but the working directory is `/Users/rmoff/flink` and thus the error `string not in pwd: flink-1.17.1`. 

## How is `cd old new` useful? 

Imagine you've got this directory structure: 

```shell
foo
├── v1
│   └── bar
│       └── wibble
│           └── bork
│               └── bork
│                   └── bork
└── v2
    └── bar
        └── wibble
            └── bork
                └── bork
                    └── bork
```

You're in the `v1` set of the folders, deep in the structure: 

```shell
$ pwd
/Users/rmoff/foo/v1/bar/wibble/bork/bork/bork
```

Now you want to be in same place but `v2`. You could `cd ../../../../..` and lose count. You could start again from the top (`cd ~/foo/v2/` and type out the full path again). You could probably do other shell magic that you can [tell me about on ~~Twitter~~X](https://twitter.com/rmoff/). Or you could do this: 

```shell
$ cd v1 v2
~/foo/v2/bar/wibble/bork/bork/bork
```

So—possibly useful, but definitely derailing bash `cd` glob assumptions for plenty of folk ;)

([h/t](https://github.com/ohmyzsh/ohmyzsh/issues/10092#issuecomment-894804081))