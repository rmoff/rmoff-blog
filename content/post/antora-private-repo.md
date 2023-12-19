---
draft: false
title: 'Deploying Antora with GitHub Actions and a private GitHub repo'
date: "2023-12-19T13:35:19Z"
image: "/images/2023/12/h_IMG_6979.webp"
thumbnail: "/images/2023/12/t_IMG_6978.webp"
credit: "https://twitter.com/rmoff/"
categories:
- Antora
- GitHub
- Cloudflare
---

[Antora](https://antora.org/) is a modern documentation site generator with many nice features including sourcing documentation content from one or more separate git repositories. This means that your docs can be kept under source control (yay 🎉) and in sync with the code of the product that they are documenting (double yay 🎉🎉).

As you would expect for a documentation tool, the [Antora documentation](https://docs.antora.org/antora/latest/) is thorough but there was one sharp edge involving GitHub that caught me out which I'll detail here.

<!--more-->

## Overview

I've got two git repositories in GitHub, under the same organisation. Both are private. One holds the Antora configuration including the list of content sources which includes source files in the second repository.

![](/images/2023/12/gh1.png)

## Building Antora using a GitHub Action

The Antora docs [show how](https://docs.antora.org/antora/latest/publish-to-github-pages/#using-github-actions) to publish to GitHub Pages. I've modified this slightly to work with Cloudflare Pages (of which more below), but the salient steps are as follows:

```yaml
[…]
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
    - name: Install Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    - name: Install Antora with the Antora Lunr Extension
      run: npm i antora @antora/lunr-extension
    - name: Generate Site
      run: npx antora antora-playbook.yml
[…]
```

That is: 

1. Checkout the current repository (i.e. `docs-platform`). An important point to note is that this holds the Antora configuration but *not* the documentation source files themselves
2. Install node.js and lunr-extension
3. Generate the site. It's at *this* point that Antora is run, reads the `antora-playbook.yml` configuration, and goes to fetch the documentation source files.

## Accessing a private GitHub repository from Antora on GitHub Actions

Again, the Antora docs discuss how to handle [private repository authentication](https://docs.antora.org/antora/latest/playbook/private-repository-auth/). Because [the docs](https://docs.antora.org/antora/latest/playbook/private-repository-auth/#credential-types) are based around git and not GitHub specifically there is a bit of groking to do if you're working with GitHub but it boils down to:

1. You _could_ use your GitHub credentials (username/password) but this would be a really bad security practice, and also not even possible if you've got two-factor authentication (2FA) enabled (which you really should have).
2. You should use a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#about-personal-access-tokens) (PAT).

**NOTE:** per the docs you cannot use deploy tokens or keys on GitHub:

> Deploy keys cannot be used with Antora since they require the use of SSH authentication, which the git client in Antora does not support.
> GitHub does not support deploy tokens at this time [December 2023 / Antora 3.1]

### Types of PAT

GitHub has [two types of PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#types-of-personal-access-tokens)

* Classic
* Fine-grained

Fine-grained PATs were [announced in October 2022](https://github.blog/2022-10-18-introducing-fine-grained-personal-access-tokens-for-github/) and are marked as beta in the UI. However, they are necessary to use, as I eventually found out. This is because an organisation can be configured to [block the use of classic PATs](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization#restricting-access-by-personal-access-tokens-classic), but the message that Antora returns when it _is_ blocked doesn't explain this, hence writing this blog :)

### GitHub Authentication and Authorization error messages with Antora

When Antora builds a site and pulls in content from a git repository it will throw an error if it hits a problem, but unfortunately not always surface the full reponse from the server. One way to test your PAT is going to work (and rule it out as a problem when other bits of the GitHub Actions pipeline don't work!) is using `curl`:

```bash
curl  -w "\n\nHTTP code: %{http_code}\n" -s -L \
      -H "Authorization: Bearer $PAT" \
      https://api.github.com/repos/$ORG/$REPO/contents/
```

(replace `$PAT`, `$ORG`, `REPO` accordingly)

This gives you both the response, and the HTTP code. 

In conjunction with this you can hardcode the credentials into the `antora-playbook.yml` (**WHICH IS A REALLY BAD IDEA M'KAY**) to avoid any complications with environment variables (which we get into later), like this:

```yaml
content:
  sources:
   - url: https://my_pat_goes_here:@github.com/my_org/my_repo.git
```

_Note the trailing `:` after the PAT and before the `@`_.

I used this to iterate over different permutations below to figure out quite what was going on.

#### ✅ Valid Token, Valid Permissions

This is what we're aiming for - a valid token, which has the necessary permissions to access the repository.

* **HTTP code**: 200
* **Antora message**: Site generation complete!

To create a fine-grained PAT go to your GitHub's account [Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens](https://github.com/settings/tokens?type=beta). Specify the organisation's repository that Antora needs to access, and add **Read access to code and metadata** for permissions. Depending on your organisations settings, you may need to get the org owner to grant the PAT request before you can use it.

#### ❌ Valid Token, Invalid Permissions

This is the problem that I hit. My PAT was valid—I check literally a gazillion times—but still the Antora build failed.

* **HTTP code**: 403
* **HTTP response message**: `` `my_org` forbids access via a personal access token (classic). Please use a GitHub App, OAuth App, or a personal access token with fine-grained permissions.``
* **Antora message**: `FATAL (antora): HTTP Error: 403 Forbidden`

As the HTTP reponse message tells me, I'm using a "classic" PAT, and the GitHub org whose repo I'm trying to access prohibits this. Looking at the Antora message this is literally true (403 Forbidden) but if you're not clued up on the nuances of PATs may well escape you (it had me scratching my head for several hours).

#### ❌ Invalid Token

This looks similar to the above, but you get a different error:

* **HTTP code**: 401
* **HTTP response message**: ``Bad credentials``
* **Antora message**: `FATAL (antora): Content repository not found or credentials were rejected`

To fix this one you need to generate a valid PAT. Also make sure that you're configuring it in the correct format with a trailing `:` after the PAT and before the `@`:

```bash
https://my_pat_goes_here:@github.com
```

## Using PATs with GitHub Actions and Antora

So…we've now got a valid PAT with the necessary permissions. Let's finish this up by making the PAT available in a secure way to the GitHub Action. As noted above, hardcoding credentials into your `antora-playbook.yml` is a horrible idea (and the docs tell you this very clearly too), so we'll remove them and just reference the repository's bare URL:

```yaml
content:
  sources:
   - url: https://github.com/my_org/my_repo.git
```

To make the credentials available to Antora we make use of the [`GIT_CREDENTIALS` environment variable](https://docs.antora.org/antora/latest/playbook/private-repository-auth/#git-credentials-environment-variable) which Antora will automagically use if it's available.

In the repository under which the Antora build GitHub Action will be running (`docs-platform` in the example I'm using here) add a [Repository secret](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) called `GIT_CREDENTIALS`:

![](/images/2023/12/gh2.png)

With that repository secret set you can now access it from your GitHub Action workflow with the `env` key:

```yaml
    env:
      GIT_CREDENTIALS: ${{ secrets.GIT_CREDENTIALS }}
```

![](/images/2023/12/gh3.png)

## Building and Deploying Antora to Cloudflare Pages

Once you've built your docs site with Antora you need somewhere to host it. For various reasons I'm trying out Cloudflare Pages (in part because of the support for preview deployments which GitHub Pages doesn't currently have).

You can use the [`cloudflare/pages-action`](https://github.com/cloudflare/pages-action) GitHub Action to publish the built site to CloudFlare Pages. Here's my complete workflow:

```yaml
name: Publish to Cloudflare
on:
  push:
    branches: [main]
  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      GIT_CREDENTIALS: ${{ secrets.GIT_CREDENTIALS }}
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
    - name: Install Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    - name: Install Antora with the Antora Lunr Extension
      run: npm i antora @antora/lunr-extension
    - name: Generate Site
      run: npx antora antora-playbook.yml
    - name: Publish to Cloudflare Pages
      uses: cloudflare/pages-action@v1
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: my_account_id
        projectName: my_cf_project
        directory: build/site
        gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

Note that you need to add `CLOUDFLARE_API_TOKEN` as a repository secret too. `GITHUB_TOKEN` is a special secret which is [automagically created](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#about-the-github_token-secret), and therefore you don't need to add it.