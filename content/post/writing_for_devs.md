---
draft: false
title: Blog Writing for Developers
date: "2023-07-19T20:59:09Z"
image: "/images/2023/07/h_IMG_3288.jpeg"
thumbnail: "/images/2023/07/t_IMG_3731.jpeg"
credit: "https://twitter.com/rmoff/"
categories:
- DevRel
- Blogging
---

Writing is one of the most powerful forms of communication, and it’s useful in a multitude of roles and contexts. As a [blog-writing](https://rmoff.net), [documentation-authoring](https://github.com/treeverse/lakeFS/pulls?q=is%3Apr+label%3Adocs+author%3Armoff+), [twitter-shitposting](https://twitter.com/rmoff/status/1587382202781913089) DevEx engineer I spend a lot of my time writing. Recently, someone paid me a very nice compliment about a blog I’d written and asked how they could learn to write like me and what resources I’d recommend.

Never one to miss a chance to write and share something, here’s my response to this :)

<!--more-->

To begin with I want to cover briefly the motivations behind writing. 

## Why Do **I** Write?

Firstly, I like **to share information**. That could be a new [tool](https://rmoff.net/2021/03/04/quick-profiling-of-data-in-apache-kafka-using-kafkacat-and-visidata/) or [technique](https://lakefs.io/blog/data-engineering-patterns-write-audit-publish/) that I’ve learnt, [a clever trick](https://rmoff.net/2020/09/30/setting-key-value-when-piping-from-jq-to-kafkacat/) I’ve discovered, or sometimes away from the technical and into the realms of [life pondering](https://rmoff.net/2019/02/09/travelling-for-work-with-kids-at-home/) and [navel gazing](https://rmoff.net/2023/05/23/what-does-this-devex-engineer-do/). In the case of this very blog, it’s to share my thoughts on something that interests me. I could have written some notes and sent them directly back to the person who asked the original question, but if it was useful to them it’s hopefully useful to others—so therefore it’s worth writing up and publishing.

The second reason that I’ll write is **to learn about something**. It’s one thing to hand-wave one’s way through a presentation. It’s another to commit pen to paper (well, bytes to disk) and [explain something](https://rmoff.net/2018/08/02/kafka-listeners-explained/). Quite often I’ll realise that there’s a gap—or gaps—in my knowledge that I need to explore first before I can properly write about something, and that’s the very reason that I do it.

There are several pleasant side-effects from writing too. Anything in the public domain (such as your blog, but also open-source project documentation, etc) helps establish your credibility in an area and awareness by others of you. We may never reach the stratospheric heights of someone such as Kelsey Hightower, who has wowed a generation of developers with their [Tetris-playing skills](https://youtu.be/HlAXp0-M6SY?t=718), but being known as _that guy_ who wrote a really useful blog that helped others is still a really nice feeling :)

## HOW do I Write for Developers?

### 🛑 STOP! Watch This First 🎥

Go and watch this excellent lecture called [The Craft of Writing Effectively](https://www.youtube.com/watch?v=vtIzMaLkCaM). It’s given by Larry McEnerney who is the Director of the University of Chicago’s Writing Program and knows a thing or two about writing. There are direct parallels between his observations on how and why academics communicate, and communication between developers.

👉🏻 I’ve seen it recommended several times but to my embarrassment, the length put me off—but I wish it hadn’t as it’s superb. 

_If you’d rather listen instead of watch you can use [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) to download it as audio (`--extract-audio --audio-format mp3`)._

### So, how do I write for developers? 

Each writer will have their own approach to writing, and it will vary based on the audience and purpose too. A report for publication in an academic journey will have a different structure to a shitpost on Twitter. A blog aimed at developers will read very differently from the documentation from the depths of a product manual. Each medium and audience is valid; the knack is making sure that your writing lines up with it.

When I write I try to write for myself—a developer, interested in a thing. That could be a new technology, an in-depth explanation, a random musing on life, or anything else. Would I like to read the thing I’ve read? Does it avoid the pitfalls that plague the soulless bland crap that some companies churn out, stick an emoji on, and call developer marketing?

There are three key dimensions that it’s useful to consider here: 

* clarity
* personality (also called voice)
* uniformity of content.

You can roughly overlay these dimensions across the range of written materials that we might write:

<img src="/images/2023/07/01.svg" width=600/>

Things aren’t always so simple, and for some platforms in particular there’s quite a range:

<img src="/images/2023/07/02.svg" width=600/>

What do these different dimensions mean in practice? Let’s explore that.

#### Clarity is Key

The first of these dimensions is pretty straightforward and shouldn’t really vary. Whatever you write, for whomever you write it, **it has to be clear**. Writing clearly means everything from sentence construction and paragraph breaks through to the structure of your article. It can be surprisingly hard to do but is crucial if you want to write material that people will _want_ to read.

One neat trick when it comes to clarity is to remember that _what you leave out_ is as important as what you leave in. This is going to be very context-specific. Documentation, by definition, should be comprehensive. A blog, on the other hand, might want to get to the point sooner and just provide a link to background material for the reader should they want it. Less is often more, as they say.

Some types of writing are going to have greater scope for individuality than others, but all have the potential to at least be accessible and clear. For example, just because you’re writing documentation doesn’t give you a pass to copy and paste the requirements doc in all its generic and obscure complexity. Write documentation that you as a developer would like to read. It can be complex and precise, yet still accessible.

#### Personality and Voice

Should the 'voice' of the author be allowed to come through in the writing? 

This is very much a sliding scale. I’ve jotted down _some_ of the characteristics you might associate with either extreme of the scale. This is not to say that by definition you’d put cuss words into a blog so as to convey your voice—but as an example of something that you might see at that end of the spectrum and definitely not at the other.

<img src="/images/2023/07/03.svg" height=300/>

How you decide where to pitch your voice on this scale will come down to your preference, audience, and general area and discipline. If you spend much time on Twitter you’ll notice that InfoSec Twitter is different from DevOps Twitter, which is different again from DataEng Twitter. Each has its own cliques and customs, and also a varying range to which an author’s voice shines through in published writing.

You’ll generally find that generally writing mediums such as a project report to stakeholders or product documentation requires a neutral voice. That’s not to say _boring_, but it is to say that a certain uniformity is required. In the case of a project report, the message mustn’t be obscured by colloquialisms and the such. And can you imagine the cognitive dissonance if a set of documentation were written by multiple writers each looking to stamp their personality on the pages?

When we get to things like blogs and other types of writing we _deliberately_ want to include some personality. How much is up to you to calibrate with your audience and yourself. There is a “Goldilocks” zone here—enough personality and genuine voice coming through to convince the reader that they are reading something that was written by someone who is actually interested and informed on the matter, but not so much that it gets in the way of the content.

#### Uniformity and Standardisation

This has a strong relationship with personality and voice but relates a lot more to the structure and content of the material

<img src="/images/2023/07/04.svg" height=300/>

Using the example of blogs, you’ll find that blogs for a company or project are going to have a strong focus on the consistency of messaging and structure. There’ll be an introduction, there’ll be context; it’ll be comprehensive.

Compare that to a personal blog that may sometimes be not much more than the gutterings of a developer wanting to log an error message and solution for future Googlers. They _might_ flesh it out into a longer article, but that’s not necessary for it still to have value.

#### A Holistic View

It may seem like there’s going to be a linear relationship between the two dimensions. As we decrease the amount of personality coming through in an author’s writings, we’re also going to move towards a much more standardised set of writing.

I’d suggest that it’s not always the case.

A startup may value personality much more over standardisation, perhaps only really dropping the voice when it comes to something like documentation (and even then, perhaps not entirely).

<img src="/images/2023/07/05.svg" height=300/>

At the other end of the scale, some companies—usually large corporations—have the habit of squeezing the last inch of life out of any kind of writing, making the relationship a much different one. 

Here there’s little voice even where you might hope to find it, and that rapidly drops off into nothing very soon after:

<img src="/images/2023/07/06.svg" height=300/>

The wildcard within this is the social media teams of large companies who _are_ given the remit to be `Funny` and `Engaging`, but this is usually outside the scope of developer writing and more into the field of [condiments and fast food chains](https://www.boredpanda.com/sassiest-responses-from-companies)

## Structuring your Blog Writing

Like a favourite pair of jeans that’s well-worn, comfy, and slightly saggy round the arse, I have a go-to structure for writing. Come to think of it, I use it for lots of conference talks too. It looks like this: 

1. Tell them what you’re going to tell them
2. Tell them
3. Tell them what you told them

What this looks like in practice is something along these lines:

1. **An intro**

    What is this thing, and why should the reader ~~give af~~ be interested?

    This could be a brief explanation of why I am interested in it, or why you would want to read my take on it. The key thing is you’re relating to your audience here. Not everyone wants to read everything you write, and that’s ok.
    
    Let people self-select out (or in, hopefully) at this stage, but make it nice and easy. For example, if you’re writing about data engineering, make it clear to the appdev crowd that they should move on as there’s nothing to see here (or stick around and learn something new, but as a visitor, not the target audience).

2. **The article itself**
3. **A recap**

    Make sure you don’t just finish your article with a figurative mic drop—tie up it nicely with a bow (a 🙇🏻 or a 🎀, either works).
    
    This is where marketing would like to introduce you to the acronym CTA (Call To Action) 😉. As an author you can decide how or if to weave that into your narrative.

    Either way, you’re going to summarise what you just did and give people something to _do_ with it next. Are there code samples they can go and run or inspect? A new service to sign up for? A video to watch? Or just a general life reflection upon which to ponder. 
    

## ✍🏻 The Physical Act of Writing: JFDI ;-)

![](/images/2023/07/07.png)

At the risk of repeating the [owl meme](https://knowyourmeme.com/memes/how-to-draw-an-owl) I would give the following advice: just start writing!

I don’t mean just go write an article. I mean start writing **something**, **_anything._**

Some notes, some snippets, some whole paragraphs. It might even look like this

![](/images/2023/07/08.png)

The point is you now have _something_. The sections and threads of a story start to fall out as you write more. What starts as one section perhaps becomes two as you realise there are individual elements to tease out.

Iterate, iterate, and then iterate some more.

That random link you made a note of, where does it fit in what you want to say? Is it pushing the need for a new section or tangent, or is it actually not so relevant and you can park it? Not sure? Well just leave it there and think about it again on the next pass round.

I’ve recently found that using a [Pomodoro timer](https://en.wikipedia.org/wiki/Pomodoro_Technique) is an effective way of getting me to focus, and to take a break. Instead of staring at a screen, descending into a pit of despair at the stagnation of an article, you spend a chunk of time and then step away. Perhaps you come back to it after the break or maybe wait longer. Like many problems in life, things resolve themselves given time to marinade in the recesses of one’s brain. That paragraph that just wouldn’t write itself will come spilling out of your eager fingers onto the keyboard. The section you thought you’d _nailed_—turns out you didn’t and it needs a rewrite. But all these things come with time and iteration through the text.

## Find a really good reviewer and copyeditor

You might think you’re good at writing. You’re probably not _that_ good at writing that the eye of an excellent copyeditor won’t improve it, nor the tactful input of a good reviewer enhance it.

Good copyeditors will respect the voice that’s present in your writing and work to preserve it whilst improving the clarity and grammatical accuracy of what you’ve written.

Good reviewers will grok what you’re saying and help distil and mould it into a better shape.

## Tools

Ah, the meta-blog post about tooling. Each to their own, but here’s my stack:

* [Obsidian](https://obsidian.md/) for authoring
* [CleanShot X](https://cleanshot.com/) for screen grabs and markup
* [Grammarly](https://www.grammarly.com/) for proofreading (and please, for the sak of your readers, profread, noone wnats to red a baydly writen blog)
* [Hugo and GitHub Pages](https://rmoff.net/categories/hugo/) for publishing and hosting

## Resources

* A [useful list of resources](https://github.com/sixhobbits/technical-writing/blob/master/resources.md) from [Gareth Dwyer](https://twitter.com/sixhobbits)
* 📧 An email-based course called [Blogging for Devs](https://bloggingfordevs.com/). It’s quite focussed on the mechanics of a blogging but has some useful nuggets - and it’s free
* 📕[Technical Blogging](https://pragprog.com/titles/actb2/technical-blogging-second-edition/), by [Antonio Cangiano](https://antoniocangiano.com/)
* [Avoiding Anti-patterns in Technical Communication](https://www.youtube.com/watch?v=kOnZovTFTHc) - good conference talk from [Sophie Watson](https://www.linkedin.com/in/sophwats/)
* A nice blog from [Dmitry Kudryavtsev](https://www.linkedin.com/in/kudmitry/) on [Why engineers should focus on writing](https://www.yieldcode.blog/post/why-engineers-should-write)

## Footnote: _What_ Should I Write?

_We’ve covered the why and the how - but what about the what?_

What to write will often come from the “Why” above, but let’s imagine that the creative juices aren’t flowing and you still really want to get a blog written.

A really excellent place for ideas is the community around the thing you want to write about. Go and lurk (or even better, join in) at StackOverflow, Twitter, Slack, Discord…wherever the community is:

* What questions do people repeatedly ask?
* What are the anti-patterns and misunderstandings that you see?
* What are the new trends?
* What cool things can you do with `$THING`

In short, if it would be interesting to me then I would write about it.

Make sure to also watch [this lecture](https://www.youtube.com/watch?v=vtIzMaLkCaM) in which the concept of *value* and *ideas* is discussed. tl;dr if you aren’t writing about something interesting to the reader, it has no value, regardless of its value to you.

### What Not to Write?

This is a _very_ personal preference. I’m not keen at all on growth-driven blogging styles. You know the sort: listicles, SEO bait, etc. It’s low-grade, developers see through it, and it tarnishes the blogger’s image IMHO. That said, if you write a good blog, there’s no reason not to structure it such (“_Top Five Tips for Successful Developer Writing_”) but put the horse before the cart, not the other way around.

---

## Recap

To summarise this whole article, bear in mind that these two statements are not mutually exclusive: 

1. Write for yourself. Work out what _you_ would like to read, and write it.
2. Think of the reader and what value you’re providing to them in your writing. 

That’s because as a developer writing for developers, you **are** the reader. 

Oh, and did you watch [Larry McEnerney’s lecture](https://www.youtube.com/watch?v=vtIzMaLkCaM) yet? 😊
