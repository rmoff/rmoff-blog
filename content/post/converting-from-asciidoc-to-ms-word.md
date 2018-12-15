+++
author = "Robin Moffatt"
categories = ["adoc", "asciidoc", "ms word", "docx", "pandoc", "markdown"]
date = 2018-08-22T18:50:53Z
description = ""
draft = false
image = "/images/2018/08/IMG_4821-1.jpg"
slug = "converting-from-asciidoc-to-ms-word"
tags = ["adoc", "asciidoc", "ms word", "docx", "pandoc", "markdown"]
title = "Converting from AsciiDoc to MS Word"

+++

Short and sweet this one. I've written in the past how [I love Markdown](https://rmoff.net/2017/09/12/what-is-markdown-and-why-is-it-awesome/) but I've actually moved on from that and now firmly throw my hat in the [AsciiDoc](http://www.methods.co.nz/asciidoc/) ring. I'll write another post another time explaining why in more detail, but in short it's just more powerful whilst still simple and readable without compilation. 

So anyway, I use AsciiDoc (ADOC) for all my technical (and often non-technical) writing now, and from there usually dump it out to HTML which I can share with people as needed: 

```
asciidoctor --backend html5 -a data-uri my_input_file.adoc
```

(`-a data-uri` embeds any images as part of the HTML file, for easier sharing)

But today I needed to generate a MS Word (DOCX) file, and found a neat combination of tools to do this: 

```
INPUT_ADOC=my_input_file.adoc
asciidoctor --backend docbook --out-file - $INPUT_ADOC|pandoc --from docbook --to docx --output $INPUT_ADOC.docx
# On the Mac, this will open the generated file in MS Word
open $INPUT_ADOC.docx
```

Ref: 

* [Asciidoctor](https://asciidoctor.org/)
  * On the mac: `brew install asciidoctor`
* [Pandoc](https://pandoc.org/)
  * On the mac: `brew install pandoc`
* [AsciiDoc extension for VS Code](https://marketplace.visualstudio.com/items?itemName=joaompinto.asciidoctor-vscode)
  * VSCode is my new favourite editor (but I still ❤️ emacs for org-mode)