---
draft: false
title: 'Hugo not detecting changed pages on Mac'
date: "2023-11-16T15:27:22Z"
image: "/images/2023/11/h_IMG_5046.webp"
thumbnail: "/images/2023/11/t_IMG_6379.webp"
credit: "https://twitter.com/rmoff/"
categories:
- Hugo
- Docker
- OrbStack
---



I've used Hugo for my blog for several years now, and it's great. One of the things I love about it is the fast build time coupled with it's live-reload feature. Using this I can edit my source (Markdown or Asciidoc) in one window, hit save, and see the preview update in my browser window next to it pretty much instantaneously. For copy-editing, experimenting with images, etc this is really helpful. 

😭 But then it stopped working. 

🤔 Running Hugo on my M1 MacBookPro it would build and serve the site locally, but if I changed a file it wouldn't get detected, let alone re-built. 

[Various](https://discourse.gohugo.io/t/live-reload-not-detecting-changes-after-first-edit/14155) [Google](https://discourse.gohugo.io/t/hugo-server-watch-not-er-watching/1592) [hits](https://discourse.gohugo.io/t/live-reload-not-detecting-changes-after-first-edit/14155) were either old, irrelevant, or dead-ends. And then I thought…what else has changed? 

💡 Docker. Or rather, not Docker. 

I run Hugo with Docker because it's self-contained, reproducable, portable, and all those good things: 

```bash
docker run --rm -it \
  -v $(pwd):/src \
  -p 1313:1313 \
  klakegg/hugo:0.105.0-asciidoctor-onbuild \
  server --buildFuture --buildDrafts
```

And the one thing that had changed was that I'd moved from running [Docker Desktop](https://www.docker.com/products/docker-desktop/) to [Orbstack](https://orbstack.dev/). Until now I'd not noticed a single difference—it's the same `docker` CLI commands as before, it's just not Docker Desktop. 

👉 Switching back to Docker Desktop and re-running Hugo resolved the issue. My changes are now being detected automagically and rebuilt: 

```
Change detected, rebuilding site.
2023-11-16 16:33:59.561 +0000
Source changed WRITE         "/src/content/post/lafs01e05.md"
Total in 163 ms
```

---

I found [this issue](https://github.com/orbstack/orbstack/issues/58) but it says it's fixed in OrbStack  0.8, and I'm running 1.1.0. 

[This issue](https://github.com/orbstack/orbstack/issues/739) is more recent but not directly relevant from what I can see.

