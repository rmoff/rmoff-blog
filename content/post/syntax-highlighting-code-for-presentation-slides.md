+++
author = "Robin Moffatt"
categories = ["pygments", "pygmentize", "jq", "syntax highlighting", "keynote", "presenting", "asciinema"]
date = 2018-06-20T18:32:10Z
description = ""
draft = false
image = "/images/2018/06/IMG_0257.jpg"
slug = "syntax-highlighting-code-for-presentation-slides"
tags = ["pygments", "pygmentize", "jq", "syntax highlighting", "keynote", "presenting", "asciinema"]
title = "Syntax highlighting code for presentation slides"

+++

So you've got a code sample you want to share in a presentation, but whilst it looks beautiful in your text-editor with syntax highlighting, it's fugly in Keynote? You could screenshot it and paste the image into your slide, but you just know that you'll want to change that code, and end up re-snapshotting it…what a PITA. 

Better to have a nicely syntax-highlighted code snippet that you can paste as formatted text into Keynote and amend from there as needed. Here's how. 

[Pygments](http://pygments.org/) is a library that does syntax highlighting for you, and you can access it through the `pygmentize` script. Install: 

    pip install Pygments

Now you can pass it a file: 

    pygmentize -l json /tmp/foo.json

and get some nice output: 

![](/content/images/2018/06/2018-06-20_17-25-43.png)

There's [different styles](https://help.farbox.com/pygments.html) to chose from: 

    pygmentize -l json -f terminal256 -O style=emacs

![](/content/images/2018/06/2018-06-20_17-26-37.png)

Just a tip - black background looks l33t, but sucks for being able to read from a projector. Use iTerm's multiple profiles option to set up a white background for whenever you're projecting your screen or copying formatting text like this. 

![](/content/images/2018/06/2018-06-20_17-28-31.png)

## Getting it into Keynote (or PPTX, if you must)

If you're using iTerm you can select the text and then use the **Copy with Styles** option from the Edit menu (press Alt to access this option), and paste the results directly into Keynote with the formatting preserved. 

![](/content/images/2018/06/2018-06-20_17-29-25.png)

From here you can change the font, size, line spacing etc etc - much easier than having to re-do the screengrab each time. 

If you also want to format your JSON with linebreaks, run it through `jq` first: 

    cat /tmp/foo.json | jq '.' | pygmentize -l json

![](/content/images/2018/06/2018-06-20_20-09-22.png)

## Output to HTML 

As well as writing the highlighted code to the terminal, you can output to things like HTML, for nice embedding in…blogs!

    cat /tmp/foo.json | jq '.' | pygmentize -l json -f html -O noclasses

```
<div class="highlight" style="background: #f8f8f8"><pre style="line-height: 125%"><span></span>{
  <span style="color: #008000; font-weight: bold">&quot;id&quot;</span>: <span style="color: #666666">2</span>,
  <span style="color: #008000; font-weight: bold">&quot;first_name&quot;</span>: <span style="color: #BA2121">&quot;Merilyn&quot;</span>,
  <span style="color: #008000; font-weight: bold">&quot;last_name&quot;</span>: <span style="color: #BA2121">&quot;Doughartie&quot;</span>
}
</pre></div>
```

Which looks like: 

<div class="highlight" style="background: #f8f8f8"><pre style="line-height: 125%"><span></span>{
  <span style="color: #008000; font-weight: bold">&quot;id&quot;</span>: <span style="color: #666666">2</span>,
  <span style="color: #008000; font-weight: bold">&quot;first_name&quot;</span>: <span style="color: #BA2121">&quot;Merilyn&quot;</span>,
  <span style="color: #008000; font-weight: bold">&quot;last_name&quot;</span>: <span style="color: #BA2121">&quot;Doughartie&quot;</span>
}
</pre></div>

There's other [formatters](http://pygments.org/docs/formatters/), including generating images, which is quite nifty.  

![](/content/images/2018/06/json.png)

_For images, run `pip install PILLOW` for the required library first._

## Support for SQL, and more!

Pygments supports [multiple languages](http://pygments.org/languages/) too, and can do things like enforce upper-case for SQL. If you don't pass a file to `pygmentize` then it'll read from `stdin` - press Ctrl-D to end input and see the result: 

    pygmentize -l sql -F keywordcase:case=upper

<script src="https://asciinema.org/a/xH1Wy06DDMtKw0wUbhUsgFSAJ.js" id="asciicast-xH1Wy06DDMtKw0wUbhUsgFSAJ" async></script>

