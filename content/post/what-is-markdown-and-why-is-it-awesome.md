+++
author = "Robin Moffatt"
categories = ["markdown", "marked2", "emacs", "vi"]
date = 2017-09-12T19:00:00Z
description = ""
draft = false
image = "/images/2017/09/screenshot-1.png"
slug = "what-is-markdown-and-why-is-it-awesome"
tags = ["markdown", "marked2", "emacs", "vi"]
title = "What is Markdown, and Why is it Awesome?"

+++

Markdown is a plain-text formatting syntax. It enables you write documents in plain text, readable by others in plain text, and optionally rendered into nicely formatted PDF, HTML, DOCX etc.

It's used widely in software documentation, particularly open-source, because it enables richer formatting than plain-text alone, but without constraining authors or readers to a given software platform.

Platforms such as github natively support Markdown rendering - so you write your `README` etc in markdown, and when viewed on github it is automagically rendered - without you needing to actually do anything.

I've used Markdown for years now, after being introduced to it at my previous company. When I worked as a consultant I would be delivering client reports, and I wrote all of them in Markdown. The final delivered copy was in DOCX or maybe HTML - but the master copy remained as Markdown.

## How Do I Write Markdown?

There's a [comprehensive reference guide here](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet).

<script src="https://gist.github.com/rmoff/8f31d89ad60297b3c63301613a204b85.js"></script>

One of the cool things about Markdown is that it is widely supported. For example, if you're using github (or gist), any file with a `.md` extension automagically gets rendered as Markdown, thus: 

<script src="https://gist.github.com/rmoff/fd71d2f97f2ff4eec41dde180cd03e73.js"></script>

# How Do I Write Markdown? What Tools Do I Need? #

**vi**

Seriously. Well, **emacs** works great too.

Markdown is plain text. **ANY** plain text editor can be used to write Markdown. That's why it's so awesome - it is completely portable. TextWrangler, FoldingText, TextEdit, Notepad, Notepad++, Ultraedit... take your pick

There's a [comprehensive reference guide here](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) that guides you through the syntax.


But, there are other tools that can make your Markdown life even better, such as previewers.

## Markdown Previewers ##

The best of these by a mile on the Mac is [Marked2](http://marked2app.com/). It gives you a nice rendering of any markdown document that you're working on. Used with the El Capitan split-screen it's pretty-near perfect way to write Markdown.

![](/content/images/2017/09/screenshot.png)

Marked2 can also export to DOCX, PDF, HTML, etc.

## Other Useful Tools ##

* [Editorial](http://omz-software.com/editorial/) is a good iOS Markdown editor & previewer
* [Mou](http://25.io/mou/) does quite a good job of an all-in-one Markdown editor & previewer for the Mac. Personally, I prefer running two separate tools that excel at editing and previewing respectively, instead of one single one trying to do both. YMMV.
* Emacs has a good [markdown-mode](http://jblevins.org/projects/markdown-mode/)

# Ways to Generate Output from Markdown #

* [Marked2](http://marked2app.com/) can also export to DOCX, PDF, HTML, etc.
* [pandoc](http://pandoc.org/) can generate a huge range of output formats from markdown input.

# Markdown geek-out #

* [Rmd](http://rmarkdown.rstudio.com/) is a combination of R and Markdown. Pretty cool for writing reports with embedded R output. 
* When you get into the outer-reaches of Markdown, you'll find that there are different "flavours". There's the [original markdown](https://daringfireball.net/projects/markdown/), there's github markdown, there's [Common Markdown](http://blog.codinghorror.com/standard-markdown-is-now-common-markdown/). This only really matters when it comes to trying to do some funky formatting, and if the previewer/renderer that you're using supports a different flavour. Some, like Marked2, will let you choose which to use.
