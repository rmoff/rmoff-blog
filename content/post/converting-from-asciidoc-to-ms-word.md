+++
author = "Robin Moffatt"
categories = ["adoc", "asciidoc", "ms word", "docx", "pandoc", "markdown"]
date = 2018-08-22T18:50:53Z
description = ""
draft = false
image = "/images/2018/08/IMG_4821-1.jpg"
slug = "converting-from-asciidoc-to-ms-word"
tag = ["adoc", "asciidoc", "ms word", "docx", "pandoc", "markdown"]
title = "Converting from AsciiDoc to MS Word"

+++

Short and sweet this one. I've written in the past how [I love Markdown](https://rmoff.net/2017/09/12/what-is-markdown-and-why-is-it-awesome/) but I've actually moved on from that and now firmly throw my hat in the [AsciiDoc](http://www.methods.co.nz/asciidoc/) ring. I'll write another post another time explaining why in more detail, but in short it's just more powerful whilst still simple and readable without compilation. 

So anyway, I use AsciiDoc (adoc) for all my technical (and often non-technical) writing now, and from there usually dump it out to HTML which I can share with people as needed: 

```
asciidoctor --backend html5 -a data-uri my_input_file.adoc
```

(`-a data-uri` embeds any images as part of the HTML file, for easier sharing)

But today I needed to generate a MS Word (docx) file, and found a neat combination of tools to do this: 

```
INPUT_ADOC=my_input_file.adoc
asciidoctor --backend docbook --out-file - $INPUT_ADOC| \
pandoc --from docbook --to docx --output $INPUT_ADOC.docx

# On the Mac, this will open the generated file in MS Word
open $INPUT_ADOC.docx
```


## Customising code highlighting 

You can customise the syntax highlighting used for code sections by setting `--highlight-style` when calling `pandoc`, e.g.: 

```
asciidoctor --backend docbook --out-file - $INPUT_ADOC| \
pandoc --from docbook --to docx --output $INPUT_ADOC.docx \
       --highlight-style espresso
open $INPUT_ADOC.docx
```

![](/images/2020/04/docx.png)

Use `pandoc --list-highlight-styles` to get a list of available styles. You can also customise a theme by writing it to a file (`pandoc --print-highlight-style pygments > my.theme`), editing the file (`my.theme`) and then passing it as the argument to `--highlight-style` e.g. 

```
asciidoctor --backend docbook --out-file - $INPUT_ADOC| \
pandoc --from docbook --to docx --output $INPUT_ADOC.docx \
       --highlight-style my.theme
open $INPUT_ADOC.docx
```

## Converting Asciidoc to Google Docs format

Using the above process is the best way I've found to write content in asciidoc and then import it, with embedded images, into Google Docs. It's not an ideal workflow (it's solely one-way only), but it does mean that if Google Docs is your preferred collaboration & review tool you can still prepare your content in asciidoc. 

Once you've got your asciidoc ready, you export it to docx (via the above asciidoctor & pandoc route), and then upload the `.docx` to Google Drive, from where you can "Open in Google Docs"

![](/images/2020/04/adoc_to_google_docs.png)

## References

* [Asciidoctor](https://asciidoctor.org/)
  * On the mac: `brew install asciidoctor`
* [Pandoc](https://pandoc.org/)
  * On the mac: `brew install pandoc`
* [AsciiDoc extension for VS Code](https://marketplace.visualstudio.com/items?itemName=joaompinto.asciidoctor-vscode)
  * VSCode is my new favourite editor (but I still ❤️ emacs for org-mode)
