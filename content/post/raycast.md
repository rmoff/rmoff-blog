---
draft: false
title: 'Making the move from Alfred to Raycast'
date: "2023-03-03T23:14:06Z"
image: "/images/2023/03/h_DSCF8395.jpeg"
thumbnail: "/images/2023/03/t_DSCF8412.jpeg"
credit: "https://bsky.app/profile/rmoff.net"
categories:
- Alfred
- Raycast
---

It all started with a tweet.

<!--more-->

{{< x user="dcwj" id="1623373904612888588" >}}

You see, [I have a soft spot for Alfred](/2021/07/29/why-i-use-alfred-app-and-maybe-you-should-too/) so this piqued my interest on two fronts. First, *how dare anyone say anything about this great tool*. Second…what if I'm missing out?

The subsequent short thread only drew me in further

{{< x user="rewtraw" id="1623715318958034944" >}}

{{< x user="rewtraw" id="1623730947358359553" >}}

🔥 Not gonna lie…this bit stung:

> idc keep using Alfred if you can’t be bothered to try new things>

And so here we are. And I'm rather glad that we are.

## Stressing my Alfred fanboi credentials

Before we get into things, let me say this. I've used Alfred since almost as long as I've been using Macs, becoming a powerpack subscriber back in 2012 with v1. Alfred would be one of the first applications I'd install on any new Mac. Using a Mac without Alfred installed felt like trying to tie my shoelaces with one hand behind my back, and wearing a thick glove on the other.

But…time moves on.

## What is Raycast?

[Raycast](https://www.raycast.com/) is a launcher, kinda like Spotlight that comes built into macOS. To say that is to understate things somewhat significantly. It's an all-singing and all-dancing productivity tool for your Mac that you really should try out.

## Introducing Raycast, the new(ish) kid on the block.

Raycast is like Alfred, but better. Sorry Alfred. Whatever Alfred can do, Raycast can do, and usually better, in a simpler and more intuitive user interface.

Almost everything in Raycast is driven through its menu system which has been brilliantly thought out, along with a fantastic ecosystem of extensions accessed through the built-in "store".

## A Superb User Experience

The user interface of Raycast has been superbly thought out to make it joyfully simple and straightforward, but also richly featured for more advanced uses when you need it - without the need to context switch.

Let's say we've launched the GitHub extension to interact with our PRs etc.

![](/images/2023/03/Pasted%20image%2020230303224304.png)

We hit enter to select `My Pull Requests`. The next screen has the same UI as all others in Raycast:

![](/images/2023/03/Pasted_Image_03_03_2023__22_44.png)


## The Store 🛒

Alfred was Alfred. You can have the car in any colour so long as it's black. Well, there are [workflows](https://www.alfredapp.com/workflows/) but I need to go to a web page to browse and read and … gosh it's just not as simple as pressing `Cmd-Space`, typing `Store` (or the first couple of characters), and then searching for whatever you want.

Interested in ~~losing all your money on a ponzi scheme~~ crypto? Let's see what Raycast has for that:

1. Cmd-Space to launch
2. Start to type `store` and hit enter
3. Start to type `Crypto` and hit enter
4. Pick an extension and hit enter
5. Press enter to launch the extension

![](/images/2023/03/Kapture%202023-03-03%20at%2022.37.23.gif)

This is all without your hands leaving the keyboard, which I think is probably where the power of Raycast comes in. It soon becomes part of your muscle-memory.

Raycast becomes the platform for a potentially vast ecosystem of plugins. It's the kitchen utensils for making whatever nice meal you'd like, instead of the pre-packaged ready meal you bought from the supermarket. That ready meal might be really nice, but you get what you get and nothing more. The half-assed metaphor breaks down because of course you *can* extend Alfred. It just never felt like it was designed from the outset to be used that way.

## Searching for files

Searching for files is fairly basic table-stakes for a laucher app like this. But Raycast does it with style and aplomb. Each file can be directly dragged to a target application (useful when working with images, uploading PDFs, etc), as well as handled with a multitude of actions from the Cmd-K menu. These include copying the path of the file to the clipboard, opening it in an application of your choosing, or even deleting it. All of these options are available at your finger tips without needing to go anywhere near your touchpad or mouse.

![](/images/2023/03/Pasted%20image%2020230303231855.png)

## Clipboard History

_This one weird trick_ … will make you *so* much more productive. Using a clipboard manager lets you access things you've copied to the clipboard previously, not just the most recent one. Alfred does that, plenty of other app do that… but Raycast potentially does it the best of all of them.

You get your text, obviously, but also your images. You get the metadata for each item, and you can filter by type.

![](/images/2023/03/Pasted%20image%2020230303225558.png)
You can drag and drop from the clipboard history onto a file prompt or into an application.

<video autoplay="true" loop="true" width=800 src="/images/2023/03/Kapture 2023-03-03 at 22.57.46.mp4"></video>

## Emojis

Who doesn't like a good emoji? The emoji plugin in Raycast is just much smarter and less clunky than the [Alfred workflow which I was using before](https://github.com/mr-pennyworth/alfred-fastest-emoji#fastest-emoji-search-famos).
![](/images/2023/03/CleanShot%202023-02-13%20at%2011.29.45.png)

## Alfred was first, now Raycast's coming for you too…

Because Raycast has such a good framework for extensions and each command within an extension can have a hotkey bound to it there are other apps that Raycast can actually replace. One example is [Moom](https://manytricks.com/moom/). Previously a favourite of mine for getting control of a cluttered workspace by resizing windows based on a hotkey press, this is now just done by the Window Management extension which is built in to Raycast.

![](/images/2023/03/Pasted%20image%2020230303230601.png)

## Quicklinks

Similar to the search engines you can define in Chrome, Quicklinks in Chrome lets you take a URL with a pattern for a search term and make it into a command accessible from the launcher at any time. Here's an example for being able to search LinkedIn without first opening your web browser.

1. Create Quicklink (which itself is accessed through the Raycast menu)

    ![](/images/2023/03/CleanShot%202023-02-14%20at%2009.28.51.png)

2. Define the Quicklink based on the URL syntax of a LinkedIn search page URL `https://www.linkedin.com/search/results/all/?keywords={Query}`

    ![](/images/2023/03/CleanShot%202023-02-14%20at%2009.29.38.png)
3. Now you can enter the name of the quicklink (or partial) and search to your heart's content:

    ![](/images/2023/03/CleanShot%202023-02-14%20at%2009.30.10.png)

## Switch windows with filtering
Like command-tab but without all the annoyance of a mouse 🤯

![](/images/2023/03/Raycast%202023-02-14%20at%2011.29.23.png)

## Alfred snippets -> Raycast snippets = easy peasy

Along with clipboard history, _snippets_ are a fantastic productivity tool. Whether auto-expanding your email address when you type `ep`, entering the current timestamp, or even pasting your resume, it just speeds things up. The good news is that Raycast supports snippets, and [David Brownman](https://xavd.id/) wrote a nice tutorial on [how to migrate your Alfred snippets to Raycast](https://xavd.id/blog/post/migrating-alfred-snippets-to-raycast/). Just make sure that each snippet has a name otherwise the import will fail. It's fine to give it a dummy name - but it can't be blank.

## GitHub extension

Think of all the tasks that you do on your computer each day. Many of those will have a Raycast extension that you can use to make it quicker and easier to get things done. Here's an example with the GitHub extension to merge [the PR](https://github.com/rmoff/rmoff-blog/pull/34) to publish this blog :)

<video autoplay="true" loop="true" width=800 src="/images/2023/03/gh.mp4"></video>

## Sorry, but the time has come.

It *is* you, not me. Raycast does everything Alfred did, but better.

![](/images/2023/03/Kapture%202023-02-27%20at%2022.04.04%201.gif)
