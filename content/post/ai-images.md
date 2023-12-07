---
draft: false
title: 'Productivity tools: AI Image Generators'
date: "2023-12-07T19:59:41Z"
image: "/images/2023/12/firefly.webp"
thumbnail: "/images/2023/12/pyflink.webp"
credit: "https://twitter.com/rmoff/"
categories:
- AI
- Blogging
- Productivity Tools
---

AI, what a load of hyped-up bollocks, right? Yet here I am, legit writing a blog about it and not for the clickbait but…_gasp_…because it's actually useful.

Used correctly, it's just like any other tool on your desktop. It helps you get stuff done quicker, better—or both. 

<!--more-->

I've spent a fair amount of time experimenting with several AI image generation tools in the last couple of months, in particular to illustrate my [Learning Apache Flink](/categories/laf/) blog series. Below I'll discuss the ones I've used and key points about them including:

* UX & Interface (lol discord wtf)
* General capabilities
* Customisation & iteration on images
* Cost
* Ability to generate accurate text

There are several that I've tried:

* [DALL·E 3](#dalle-3httpsopenaicomdall-e-3-openaihttpsopenaicomchatgpt)
* [Adobe Firefly](#adobe-fireflyhttpsfireflyadobecom)
* [Midjourney](#midjourneyhttpswwwmidjourneycomhome)
* [Ideogram](#ideogramhttpsideogramai)

_I would be delighted to know if there are others that I should try (drop me [an email](mailto:robin@rmoff.net) or DM me on [Twitter](https://twitter.com/rmoff/))._

Disclaimer: I don't actually know what I'm doing with these 😁. I'm using them purely as an end-user, clicking random buttons until they seem to do something. I'm sure there's a ton of theory that'd be interesting and relevant to learn; I haven't though.

## [DALL·E 3](https://openai.com/dall-e-3) ([OpenAI](https://openai.com/chatgpt))

* Part of the [ChatGPT](https://openai.com/chatgpt) Plus plan ($20 pcm) which includes ChatGPT 4, custom GPTs, etc - well worth it!
* Accessible through a nice web app or mobile app
* Seamlessly switches between text chat and image generation
* Does a pretty good job at text, getting it right perhaps 30% of the time
* The ChatGPT side of things makes it possible to have realistic conversation, discussing aspects of the generated image and having DALL·E generate a new image based on this
* Refuses to generate images based on trademarks/copywritten material (whether actually the case or not). For example, it'll happily use the Python logo, but not the Kubernetes one (even if you refer it to the licence which permits it)

![](/images/2023/12/CleanShot_2023-12-07_at_17.22.15.webp)

This is the ChatGPT iOS app and its first attempt at the prompt shown - pretty impressive, IMHO: 

> Draw a picture of a festive squirrel at a computer. Make it bright and 8-bit style

![](/images/2023/12/Screenshot_2023-12-07_at_17.26.37.webp)

## [DALL·E 3](https://openai.com/dall-e-3) ([Bing](https://www.bing.com/) and [Designer](https://www.bing.com/images/create))

* Same as above, but provided by Microsoft
* Bogged down in the other junk that Bing includes, complicated "Microsoft Rewards", "Boosts", etc. 
* Haven't stuck around long enough to figure out cost, since I'm paying for ChatGPT Plus already which includes DALL·E 3

![](/images/2023/12/CleanShot_2023-12-07_at_17.16.30.webp)

## [Adobe Firefly](https://firefly.adobe.com/)

* Tightly integrated with the Adobe suite of image software. 
* Free to use but images are watermarked if you download them. £4.49 pcm to subscribe to Firefly.
* Web-based interface with lots of buttons for customising what I guess you would build into the text prompt otherwise. 
	* That is, it's more suited to just generating images than faffing about with prompt engineering tricks
* Doesn't seem to have a way to easily iterate and refine a generated image
* Utterly hopeless at generating text. I've never once got it to do it remotely closely.

    ![](/images/2023/12/CleanShot_2023-12-07_at_17.27.15.webp)

* The ability to give it reference images is nice. Here's a prompt for christmas squirrels mixed with one of the existing landscape images (shown in the `Style reference` box to the left of the prompt). The `; winter; cold; blue; red` section of the prompt was offered as an auto-completion so I included it

    ![](/images/2023/12/CleanShot_2023-12-07_at_19.06.31.webp)

* The integration with other Adobe tools gives you a seamless experience moving into Adobe Express, for example: 

    ![](/images/2023/12/CleanShot_2023-12-07_at_19.08.19.webp)

## [Midjourney](https://www.midjourney.com/home)

* One of the originals, but feeling a little bit long in the tooth now because of its interface. Quite possibly still one of the most powerful and flexible if you take the time to learn how to engineer its prompts.
* Interface is through Discord, which is fairly awful. You DM a bot, which sends you some images. You click a button to iterate on a given image. It's painful, given the other options available now.
	* There appear to be changes in the works to add a web interface
* Free to start with, images are public. Subscriptions start at $10 pcm. 
* Like Firefly, hopeless at text generation.

    ![](/images/2023/12/CleanShot_2023-12-07_at_19.16.28.webp)
* You can do some really great stuff with Midjourney, but it doesn't hit the mark straight out of the door in the same way as DALL·E 3 does now. Perhaps there's more to be got out of it with extensive prompt engineering, but that's where this crosses over from **tool** to discipline/hobby…

    ![](/images/2023/12/CleanShot_2023-12-07_at_19.13.49.webp)

* To be fair to it, once you get used to the Discord interface, it is actually ok. Here I'm selecting the fourth image (from top to bottom, left to right) to create a new version: 
  ![](/images/2023/12/CleanShot_2023-12-07_at_19.24.44.webp)

	From there you use the scaled up image, or opt to vary it: 
	![](/images/2023/12/CleanShot_2023-12-07_at_19.24.55.webp)
	
    This is with `Vary (Strong)` applied:
	![](/images/2023/12/CleanShot_2023-12-07_at_19.28.07.webp)
## [Ideogram](https://ideogram.ai/)

* I don't know much about this site, but it was recommended to me when I was struggling to get the other tools to generate an image with accurate text. It does a pretty good job of it. 
* The interface is web-based, and somewhat rudimentary.
* You can remix images, but iterating on what's been generated isn't obvious in the way that it is with ChatGPT
* Free to use to a given limit, [paid plans](https://ideogram.ai/t/trending) start at $8 pcm
* The [trending gallery](https://ideogram.ai/t/trending) is useful for getting inspiration and seeing the prompt text that others use
* Doesn't seem to have any qualms about creating images in the style of known brands, copyright, etc.  
  ![](/images/2023/12/CleanShot_2023-12-07_at_19.23.54.webp)
* Ideogram does the best job of writing text that I've found so far (I would **love** to hear of any other suggestions as this is my biggest pain point so far). Even here you can see it doesn't quite nail it, perhaps taking `with` as part of the scene descriptor than the sign text.

    ![](/images/2023/12/CleanShot_2023-12-07_at_20.22.55.webp)

For comparison, this is how the other generators deal with the same prompt: 

* Midjourney
    ![](/images/2023/12/Pasted_image_20231207202647.webp)

	From a bit of reading around it seems that Midjourney perhaps deals with shorter words, so I tried that and a couple of iterations - but whilst I got symbols recognisable as text, it wasn't very good: 
	
	![](/images/2023/12/CleanShot_2023-12-07_at_20.37.52.webp)

* Firefly
  ![](/images/2023/12/CleanShot_2023-12-07_at_20.26.59.webp)
  
  I also gave it a chance with the shorter word which I also repeated - and it managed to get it right on one (of four) attempts:
  
  > `A robot holding a sign that says "ERROR". text: "ERROR".`

  ![](/images/2023/12/CleanShot_2023-12-07_at_20.41.04.webp)


* DALL·E 3
  
    ![](/images/2023/12/DALLE_2023-12-07_20.28.26_.webp)

    with shorter text DALL·E 3 got it spot on:

    ![](/images/2023/12/Pasted_image_20231207204227.webp)

## Summary

There's not one tool which beats all the others. If I had to have access to just one, I'd go with DALL·E 3 for sure. But some of the Midjourney image styles are really nice, the text generation on Ideogram is best, and the tooling in Firefly is rather handy too.
