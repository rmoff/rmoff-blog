---
draft: false
title: 'Building Better Docs - Automating Jekyll Builds and Link Checking for PRs'
date: "2023-04-20T08:54:12Z"
image: "/images/2023/04/h_IMG_8828.jpeg"
thumbnail: "/images/2023/04/t_IMG_9850.jpeg"
credit: "https://twitter.com/rmoff/"
categories:
- Documentation
- Jekyll
- GitHub Actions
---

One of the most important ways that a project can help its developers is providing them good documentation. Actually, scratch that. _Great_ documentation. 

<!--more-->

![Kathy Sierra - If you want them to RTFM, make a better FM](/images/2023/04/Pasted%20image%2020230419164830.png)

The [lakeFS documentation](https://docs.lakefs.io/) is built as a static site using [Jekyll](https://jekyllrb.com/) and the [Just the Docs](https://just-the-docs.github.io/just-the-docs/) theme, hosted on [GitHub Pages](https://pages.github.com/). The documentation itself is stored on GitHub, and _any_ changes to it go through a PR review process.

There were two points of friction that I wanted to fix to make it easily and quicker to improve the docs: 

1. The local build process for docs was not instantaneous, meaning that *contributors* would either just not test their changes ("*it's just a small docs change"*, amiright?), or would diligently test them and wasting literally minutes between each build (if you've any tips to fix this [let me know](https://github.com/treeverse/lakeFS/issues/5404)!). On top of this, reviewers of PRs would need to clone the repo and build the docs site to be able to review the changes properly…so very tedious 

   ![BORING](/images/2023/04/zzzzzzz-gif.gif)
2. There were broken links, and no automated checking on incoming Pull Requests (PRs) that a change didn't break things further.

## GitHub Actions are MAGIC

If you're already using GitHub PRs then using [Actions](https://docs.github.com/en/actions) fits in with the workflow beautifully. Actions are defined per-repository and can be triggered by, amongst other things, a new PR. Actions can do lots of things including building and testing your code itself. The two actions I set up do the following: 

1. Build the docs site from the code in the PR, and deploy it as a static site hosted temporarily on surge.sh
2. Run a link checker on the whole site, and if broken links are found fail the job ❌ and log the problems

You can see the action definition [here](https://github.com/treeverse/lakeFS/blob/master/.github/workflows/docs-pr.yaml) - feel free to take it and customise it for your own use! Below I explain a bit more about how each works. 

## Triggering the Action

The action is triggered by any PR to `master` branch and touching files under `/docs` (there's no point rebuilding the docs site if it's only code in the repo that changed and not docs)

```yaml
on:
  pull_request:
    paths:
      - "docs/**"
    branches:
      - master
```

## Build the docs site

The action runs as a single job covering both purposes (preview deploy, and link checker). I guess it could be split and the build run twice. The job is executed on a container (defined in the `runs-on: ubuntu-20.04` step) that lives for the duration of the job. 

The build itself is just as it is in the live docs deployment, running Jekyll's `build` command against the `docs` folder of the repo and writing the static site to a `_site` path on the container. 

```yaml
  - name: Build latest
	id: build-latest
	working-directory: docs
	run: bundle exec jekyll build --config _config.yml -d _site/ --verbose
```

## Deploy a Preview of Docs Changes

Before deploying the preview the action some shell script which overlays on each page of the docs site a label to show that it's a preview build, and linking back to the PR from which it was generated: 

![](/images/2023/04/CleanShot_2023-04-19_at_17.47.05.png)

I wish I could claim credit for the code, but it was all the handiwork of chatGPT (pretty cool, right!). This updates the HTML files in place. 

```yaml
  - name: Overlay PR message on each page
	working-directory: docs/_site
	run: |
	  PR_URL=${{ github.event.pull_request.html_url }}
	  PR_NUMBER=${{ github.event.pull_request.number }}

	  html_files=$(find . -name '*.html')

	  for file in $html_files; do
		sed -i -e "s|\(.*\)\(</body>\)|<div style=\"position: fixed; top: 5px; left: 5px; padding: 3px; background-color: #e8ac07; font-weight: bold; z-index: 9999; box-shadow: 0 0 10px rgba(0,0,0,0.5);\">ℹ️ This is a preview of PR <a href=\"$PR_URL\" style=\"color: black;\">#$PR_NUMBER</a></div>\n\1\2|" $file
	  done
```

The next step then uses a [pre-built Action](https://github.com/afc163/surge-preview) to deploy a given folder to [surge.sh](https://surge.sh/) (a static site hosting service which provides a free plan that's perfect for this use). You can read more about setting up surge.sh [here](/2022/04/06/using-github-actions-to-build-automagic-hugo-previews-of-draft-articles/#_setting_up_an_account_on_surge_sh).

The action also updates the PR itself with the link to the preview, so the submitter and reviewer both can easily see the impact of the PR on the docs site. 

![](/images/2023/04/CleanShot_2023-04-19_at_17.51.29.png)

## Checking for Broken Links

This requires a single step in the job to invoke the link checking tool [lychee](https://lychee.cli.rs/) using the supplied [GitHub Action](https://github.com/lycheeverse/lychee-action)

The root of the built docs site (`docs/_site` ) is supplied as the first argument, along with an exclusion file of pages and URLs to not check. I added to this things like URLs in the documentation that referred to sample instances of the lakeFS server (e.g. http://127.0.0.1:8000 is indeed a link, but not a link that we want to check because it's not going to be valid). Some other external sites also needed adding to the ignore file as they appeared to block the automated checking and caused false positives. 

```yaml
  - name: Check links
	id: lychee
	uses: lycheeverse/lychee-action@v1.6.1
	with:
	  args: docs/_site --no-progress --exclude-file=docs/.lycheeignore
	  fail: true
	  jobSummary: true
	  format: markdown
	env:
	  GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

If any broken links are found the Action logs these in a very readable and useful way: 

![](/images/2023/04/CleanShot_2023-04-19_at_17.58.16.png)

## Go and try it out

The GitHub Action configuration that I used is [here](https://github.com/treeverse/lakeFS/blob/master/.github/workflows/docs-pr.yaml). Give it a try, and let me know any other cool tricks you have for keeping documentation in tip-top shape :) 
