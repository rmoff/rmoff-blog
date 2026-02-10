---
draft: false
title: 'Authoring Wordpress blogs in Markdown (with Google Docs for review)'
date: "2023-05-03T08:59:17Z"
image: "/images/2023/05/h_IMG_2435.jpeg"
thumbnail: "/images/2023/05/t_IMG_2565.jpeg"
credit: "https://bsky.app/profile/rmoff.net"
categories:
- Markdown
- Wordpress
- Google Docs
- Blogging
---

Wordpress still, to an extent, rules the blogging world. Its longevity is testament to…something about it ;) However, it's not my favourite platform in which to write a blog by a long way. It doesn't support Markdown to the extent that I want. Yes, I've tried the plugins; no, they didn't do what I needed. 

I like to write all my content in a structured format - ideally [Asciidoc](https://asciidoc.org/), but [I'll settle for Markdown too](/2017/09/12/what-is-markdown-and-why-is-it-awesome/). Here's how I stayed [almost] sane whilst composing a blog in Markdown, reviewing it in Google Docs, and then publishing it in Wordpress in a non-lossy way. 

<!--more-->

# Author

1. Write your blog in Markdown. _Perhaps this approach will work with Asciidoc too, since pandoc also works with it - I've just not tried it._

# Review 

Google Docs is still the best way that I've found to collaboratively review a blog. It's accessible to technical and less-technical users alike. 

We'll get your Markdown into GDocs via a `.docx` export/import.

1. `pandoc` to convert the Markdown to `.docx`

    ```bash
    pandoc Securing\ lakeFS\ with\ Role-Based\ Access\ Control\ \(RBAC\).md \
           -o ~/Downloads/blog.docx   
    ```

2. Import the `.docx` file to Google Docs
3. Save GDoc as native Google Doc, share with comment access
4. Review / Copyedit
5. Make edits, accept proposed changes, etc directly in GDocs. 

_If you're using Asciidoc, see this related blog that I wrote on [Converting from AsciiDoc to Google Docs and MS Word](/2020/04/16/converting-from-asciidoc-to-google-docs-and-ms-word/)._

# Publish

At this point the Google Doc is ready to publish. However, Google Docs doesn't have a concept of code blocks (and other formatting such as figure captions) that your Markdown has. We don't want lose these in a straightforward copy and paste into Wordpress' WYSIWYG editor directly

![](/images/2023/05/1.png)

## Import the changed GDoc with edits back into Markdown 

1. Export the copy edited & reviewed [GDoc back to Markdown using a Chrome plugin](https://workspace.google.com/marketplace/app/docs_to_markdown/700168918607?ref=iain-broome)

2. Do a diff and import changes back to original Markdown document (so that code blocks & language are not lost)
	   ![|700](/images/2023/05/CleanShot%202023-03-17%20at%2006.39.02_2x.png)

## Publish the Markdown to Wordpress

1. Convert the markdown to HTML. 

    ```
    cd "/Users/rmoff/my_blogs/"
    pandoc "Here's Something Diff-erent - lakeFS adds support for diff of Delta tables.md" \
        -o ~/Downloads/blog.html \
        --wrap=none \
        --no-highlight \
        --extract-media=/Users/rmoff/Downloads/
    ```

    * `--no-highlight` is important to stop the HTML being generated with syntax highlighting - we want to keep the pure code block intact and let WP doing its highlighting instead. 
    * `extract-media` path does not support `~` and a relative path is from the working directory in which the command is executed.

2. In Wordpress, create a new post.
3. From the top-right dropdown menu select **Code editor** (⇧⌥⌘M) to view the raw HTML. Copy and paste the HTML that pandoc generated into Wordpress. 

   ![|300](/images/2023/05/Pasted%20image%2020230317104543.png)

4. Upload all the images needed to the WordPress Media Library. Look at the resulting URL prefix (e.g. `https://lakefs.io/wp-content/uploads/2023/03/`) and search and replace all the image paths in the source HTML as needed. 

	1. You will need to amend `%20` in the URL for `-` for files with spaces in 

6. At this point the code should render OK, but without syntax highlighting

   ![|500](/images/2023/05/Pasted%20image%2020230317105230.png)

7. To add in the syntax highlighting: 

    1. Search and replace in the raw HTML to replace:  `<pre class="bash"><code>` with `<pre class="bash"><code lang="bash" class="language-bash">`. You can do this in your favourite text editor, or use this little bash snippet: 

        ```bash
        sed -i '.bak' \
            's/<pre class="\(.*\)"><code>/<pre class="\1"><code lang="\1" class="language-\1">/' \
            ~/Downloads/blog.html
        ```

    2. Copy and paste the HTML into the blog's code editor afresh

    2. **Use this one weird trick…** switch back to the visual editor, put the cursor in the editor box, and click the **Convert to blocks** option that appears 

        ![|400](/images/2023/05/CleanShot%202023-03-17%20at%2011.01.58_2x.png)

    4. If you click in one of the code blocks you'll see that it's picked up the language, and when you preview the blog it should highlight its syntax correctly
        ![|400](/images/2023/05/CleanShot%202023-03-17%20at%2011.04.18_2x.png)
        ![|500](/images/2023/05/CleanShot%202023-03-17%20at%2011.11.29_2x.png)

