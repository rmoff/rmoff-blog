---
title: "Is it OK to write blog posts with AI?"
# what's wrong with using AI to write blog posts
# writing with AI - ok or not?
# rules for writing blog posts with AI
# is it OK yet to write blog posts with AI?
date: 2026-11-12T16:58:33Z
draft: false
image: "/images/2026/11/"
thumbnail: "/images/2026/11/"
credit: "https://bsky.app/profile/rmoff.net"
categories:
- AI
- Blogging
---

> *Is it OK to write blog posts with AI?*

**NO!** Was my strident cry until just a week or two ago (it was, actually, a much less polite version of that).
Now, I'm wondering if I need to refine that view.
Let me explain.

You see, I have a particularly vitriolic feeling when presented with LLM-generated text.
Articles written with AI give me the ick, I don't trust them, and I lose respect for the author.
I'm not the only one who feels this way; consider this finding from [a survey by Cynthia Dunlop](https://writethatblog.substack.com/p/dev-reaction-to-ai-blog-posts):

> * 98% of readers prefer imperfect-yet-authentic human writing
> * most will stop reading, block you, and downvote you if they suspect AI

Charity Majors [articulates the reaction](https://charity.wtf/p/confessions-of-an-unrepentant-slop) that many people have when they encounter LLM writing:

> If I’m reading a newsletter and I start to sense AI-isms, I delete and unsubscribe.
>
> If I’m reading a blog post, I close the tab.
>
> If I’m on social media, I unfollow or unfriend.

Bryan Cantrill puts it [delightfully thus](https://bcantrill.dtrace.org/2025/12/05/your-intellectual-fly-is-open/):

> \[It is\] as if the writer is walking around with their intellectual fly open.

And yet.

If you enjoy this article, and at the end of it I tell you I wrote it with AI, *does that make it a worse article*?

I compile [a monthly newsletter of content that's been written in the data and AI space](https://rmoff.net/categories/interesting-links/), and in researching it read dozens and dozens of articles every month.
(It's in doing this that prompted me previously to write [previous](https://rmoff.net/2025/11/25/ai-smells-on-medium/) [rants](https://rmoff.net/2026/05/01/its-the-smell/) about LLM slop).
Doing this month on month has triggered a feeling recently that LLM capabilities at writing have moved beyond '_bloody awful_' to '_vaguely plausible_', which is causing me to take another look at the whole issue.

Whilst there are still a plethora of egregious offences committed against the written form on a daily basis by someone mindlessly cranking the LLM handle, there are also some articles that have given me pause.
They perhaps cover a niche subject that I've not seen written about before.
They feel LLM-y when I read them, but not *grossly* so.
My hand hovers over Cmd-W to close the tab, and yet. Am I cutting off my nose to spite my face? Am I any better than those in the coding community who dogmatically refuse to take advantage of the productivity gains of coding agents in any form, or use code that came from one?

In this article I will examine some of my instincts when dealing with LLM-generated writing, and distil them down into some rules that I follow when writing, and would encourage others to do so too.

## Defining "written with AI"

I'm not just talking here about "*hey Claude, write me a blog post about how Kafka works*", or "*Hi Codex, here are my notes, please write it into a blog post kthxbai*" and ship it with nary a moment's thought.

I also include what comes from trying to _revise_ the output of prompting an LLM. It's still written with AI, and it'll read like it.
Some people will swear by having taught the LLM to write "in their style" or use skills to "de-LLM" the voice.
Others will take the LLM output and amend it by hand, much as a school kid plagiarising Wikipedia will do, trying to make it their own.

Ultimately none of these really get rid of the LLM taint, nor address the main issues that I outline below. And as I will discuss shortly: for some types of writing, perhaps this doesn't actually matter.

> NOTE: What I don't object to when writing—and what I positively encourage and mandate when reviewing others' work—is using LLMs to _review_ material that *you* have *written by hand*.

## Objections to LLM-generated content

I've had some fascinating conversations in recent weeks with various folk across the blogging and writing community - those who write, and those who read.
In all of these, I've been trying to put my finger on quite what it is that I, and others, find objectionable in LLM writing.

Above all else, it's trust that bothers me most.

### Trust

If someone has prompted their way to an article, have they really tested their understanding of a subject?
The implication of this for me is that as a reader I'm probably going to take the article as less trustworthy than one which I can tell has been chiselled away and revised and reworked by hand.

Bryan Cantrill nails it [here](https://rfd.shared.oxide.computer/rfd/0576#_llms_as_writers):

> \[Absent\] LLMs, it is presumed that of the reader and the writer, it is the writer that has undertaken the greater intellectual exertion. (That is, it is more work to write than to read!) For the reader, this is important: should they struggle with an idea, they can reasonably assume that the writer themselves understands it — and it is the least a reader can do to labor to make sense of it.
> \[…\]
> \[Our\] writing is an important vessel for building trust — and that trust can be quickly eroded if we are not speaking with our own voice

Perhaps entangled with the matter of trust is the feeling that I cannot shake that someone who's prompted their LLM to write an article has not really _written_ the post, and to claim otherwise is somehow dishonest. I appreciated when I read [Joshua Buss](https://chicagobuss.dev/blog/)' blog recently that he actually tags posts as "Human" or "AI generated".

### Think, FFS

I've known for weeks that I've wanted to write this article. Every time I encounter LLM content, or someone sends me a blog post to review that's come straight from the bowels of Claude, I instinctively recoil, and then try to work out why.
But it's only whilst actually writing this blog post that I'm _really_ forming my amorphous thoughts into hopefully-lucid opinions and rational argument.

I wrote the draft on a sleep-eluding long-haul flight in perhaps 30 minutes. The editing and reworking has taken perhaps 5-10x as long. Part of that is the draft wasn't that good. But most of it was that vomiting forth a stream of consciousness onto a page is only the first step in really understanding an idea. And if you purge your brain into an LLM prompt, you're side-stepping all of that valuable thinking process.

Writing is thinking, writing is forming arguments, and testing those arguments. If you're not _actually_ writing, you're not doing those things. At best you're mumbling around the subject loosely in your mind and having the LLM generate some apparently credible assertions or points of view. This is, perhaps, valuable in its own way *for yourself*, but it's verging on worthless as material to share with others.

### If you can't be bothered to write it, I can't be bothered to read it

As [Cynthia's survey shows](https://writethatblog.substack.com/p/dev-reaction-to-ai-blog-posts), many people will literally _not read a blog post that's been written with AI_.
That's where the acronym **AI;DR** ("AI; Didn't Read") comes from.
Even if you don't care about the thinking, the trust, and so on; even if you're just in it for the clicks and kudos: fewer people will read your post if you write it with an LLM. You damage your brand, and if posting on a company's blog, the company's too.

Asking readers to wade through LLM writing also breaches the social contract (as Bryan Cantrill [writes about](https://rfd.shared.oxide.computer/rfd/0576#_llms_as_writers)) between writer and reader. If I'm asking you to read something (*such as this post*), the bare minimum I can do is invest my time as author in making sure that it's well written and readable. Putting an LLM in the author's chair throws this out of the window. Now as 'author' (I use air quotes deliberately) I'm both spending less time on the post's integrity _and_ asking more of my readers' time because LLM content just does not read as well and needs more time to comprehend.

### Wading through the smelly slop swamp

_Previously: [(AI) Smells on Medium](https://rmoff.net/2025/11/25/ai-smells-on-medium/) / [It’s the Smell](https://rmoff.net/2026/05/01/its-the-smell/)._

There are some aspects that I think are impossible to address mechanically (discussed above, such as trust and thinking), but I wonder if this is one will perhaps improve over time.

Here at the tail end of 2026, LLM written text is often just…weirdly difficult to read. You're not only asking your reader for their time to read it, you're asking _more_ of their time to read it because like using your eyes in ways they aren't meant to be to view those 3D stereoscopic posters of the 1990s, the brain has to do something weird to itself to read LLM material.

LLM-generated material quite often has that daunting feel of a slickly-presented, oh-so-clearly structured, wall of text.
It's moved on from the em-dash. The LLMs figured out not to do that, and the LLM smell _du jour_ became the throat clearing `Honestly,` at the beginning of a response, or the `it's not X, it's Y` construction.
Some of these are easy to spot literally (`Honestly`) whilst others just…smell bad.
Look at a passage of LLM text and you'll soon spot the rhythms and structures that LLMs write in.
Like a chimpanzee sweeping its cage with a stick because it saw its keeper do it, LLMs are just repeating patterns that they've learnt. I say "just" with great respect for what LLMs _can_ do; but writing authentically and naturally is just not one of them yet.

## Am I just scared of being replaced?

As someone whose career is in part built around writing, I've been going through similar existential soul-searching and navel-gazing that my software-engineering brethren have with the advent of LLMs getting seriously good at generating code.
Am I just being some stick in the mud who needs to get used to the new way of doing things?

I think that the role that AI serves in code is very different to that in writing. Generating code is one thing; it's a means to an end (getting a computer to do something). Writing is about thinking and arguing and sharing and validating or disproving a position. The act of putting words down on a page (or a screen) is just the *culmination* of that, whilst AI gives the writer the means to replace _all_ of the process.

My belief is that humans will generally prefer human-written content (of the kind I create; blog posts, etc). Whereas as an end user, so long as something _works_, I don't care how it was written if it does the thing it's supposed to (and that's for the SWE to figure out how to make sure quality stays high with AI building it).

## What is the purpose of writing?

There are multiple types of written content, and I think some sits much more easily as being written whole or in part by LLMs than others.

Let's start with _where you really shouldn't use LLMs_.
If I am wanting to communicate an _argument_, to impart with emotion a viewpoint, then the use of an LLM is simply anathema. The best writing has a _voice_—dare I say even, a *soul*—and an LLM has none.

At the other end of the spectrum is material such as a project's README (c'mon, you're telling me you've _not_ open sourced your vibe-coded itch that Claude scratched yet?!) or a runbook.
As Bryan Cantrill [puts it](https://rfd.shared.oxide.computer/rfd/0576#_llms_in_operational_writing) (so eloquently, I might add; when was the last time you positively _enjoyed_ reading LLM prose?):

>  This is _operational writing_: it is neither highfalutin prose nor quotidian correspondence[…]

If I'm the reader of one of these and it stinks of LLM, I'm gonna be mildly ick'd and possibly annoyed, but it's a purely mechanical artefact. So long as it's accurate (and LLMs are _so_ much better at not hallucinating these days) then I am content to cede this ground. READMEs and runbooks are the classic example of artefacts that often don't get written anyway and languish at the bottom of a Jira list, forever being bumped to the next sprint. In this case, LLM-generated is better than nothing at all. Chances are I'd be pointing my LLM at your LLM output anyway cos I'm not going to actually _read_ the README, sheesh!

Both these (argument/thought piece, and README/runbook) are types of writing, and the use of LLM is just horrifying in one and fairly understandable in the other. So we can't just say "no LLM in writing". What we can say is "_why are you writing this thing?_" to qualify the use of LLM in doing so.

What about writing that lies between these two poles? There are many technical articles whose purpose is more than to simply document a process or project, but are not seeking to change the world, or opinions, either. These are the kinds of pieces that I am coming across much more often when I'm pausing on the close-tab icon, having detected LLM signs but still curious about the content.

Charity Majors articulates a similar (and more nuanced) break down of communication types and where AI can help and where it can breach trust in the [Four types of communication](https://www.honeycomb.io/blog/ai-norms-values-part-3-things-we-hold-true#four-types-of-communication) section of [this article on the Honeycomb blog](https://www.honeycomb.io/blog/ai-norms-values-part-3-things-we-hold-true), and expands on it in her excellent post [Confessions of an Unrepentant Slop Snob](https://charity.wtf/p/confessions-of-an-unrepentant-slop).

I wrote an article in 2023 (pre mass-adoption of AI!) about [writing for developers](https://rmoff.net/2023/07/19/blog-writing-for-developers/), and I illustrated how I think of how informal/formal and freeform/standard the writing has to be depending on its target:

![Diagram placing Reddit, Twitter, personal blogs, LinkedIn, company blogs and documentation on a spectrum from personality and voice to uniformity and standardisation, with clarity needed throughout](/images/2023/07/02.svg)

To this, I would overlay acceptable LLM use roughly like this, where at the far end of the spectrum - technical writing, and perhaps very uniform, straight-laced company blog posts, I can see that LLM use will help (or in the case of company blog posts of _that style_ not hinder).

![The same spectrum with a shaded band at the documentation end, covering the edge of company blogs, labelled "Non-gross LLM use might fit here"](/images/2026/11/llms-in-writing.excalidraw.svg)

So for blog posts, even 'mechanical' ones, I always end up coming back to my—completely subjective—objections that I detail above, including around trust and authenticity. *People generally trust LLM-generated copy less*.
If you're an author using LLMs, or a company publishing blog posts that do, you are already on the back foot when it comes to communicating with your audience. It's up to _you_ if that matters or not.

## My rules for writing blog posts with AI

I've been talking about LLM use overall in writing, but it was blog posts that prompted this article and it's on those that I'll conclude with how I suggest blog authors who are looking to build (or retain) credibility and trust with their audience use LLMs.

### Rule 1: Do not let LLMs write for you

[Readers value](https://writethatblog.substack.com/p/dev-reaction-to-ai-blog-posts) authenticity, however imperfect.
If you value your readers, write your content yourself.

Cynthia Dunlop (of the excellent [Write that blog!](https://writethatblog.substack.com/) Substack and co-author of [Writing for Developers](https://github.com/scynthiadunlop/WritingForDevelopersBook)) has [great advice](https://writethatblog.substack.com/p/dev-reaction-to-ai-blog-posts):

> If you share interesting insights and your target reader can understand what you’re trying to communicate, some rough edges shouldn’t be an issue.
> A natural human voice is way more readable than perfectly predictable LLM prose

There are lots of resources to help with writing blog posts, including [my own](https://rmoff.net/2023/07/19/blog-writing-for-developers/) (available [as a talk](https://rmoff.net/talk/blog-writing-for-developers/) too), and [many](https://www.seangoedecke.com/tags/writing/) [others](https://writethatblog.substack.com/p/advice-for-new-tech-bloggers).


### Rule 2: DO NOT let LLMs write for you

As much as LLMs are an awful tool for writing, they *are* a pretty damn good tool for editing and reviewing.
I use them heavily to proofread (you can see my skill [here](https://github.com/rmoff/rmoff-blog/blob/main/.claude/skills/proofread-blog/SKILL.md), if you're interested).

However, **the golden rule** is to never accept corrections or suggestions **directly** (except for spelling mistakes, I'll allow that one).
Beyond that though, and it's a slippery slope to slop if you give an LLM your writing and—even interactively—get it to revise it for you to make it 'better'. Not only does the LLM smell start to seep in, but the crucial benefit of editing an article in challenging _and thinking_ about structure and arguments gets skipped over.

Take the edits and suggestions and _work them into your writing yourself_.

### Rule 3: Don't trust the weirdo sycophant

A note of caution to the above rule. LLMs are people-pleasers. *You're absolutely right. That's very insightful.*
Just as no-one's gonna tell you that your baby's ugly, an LLM is not going to tell you that you post stinks and is full of logical fallacies and technical errors.
They're getting better (worse?) at this, and can be a lot more critical. But I still see a tendency for them to both over-compliment, as well as sometimes get obsessed over the weirdest arguments.

So spell checking, yes (please!). Grammar, yes (but don’t let it strip your voice. Sometimes it’s ok to end a sentence with a preposition; this is a blog, not something the New York Times would put its name to). But beyond that, definitely use it for _review_, but engage your brain when reading that review and don't let it bounce you into changing something that's perfectly fine. If in doubt get a—gasp—human to review your post too.

## No shame, but use the tool correctly

Bryan Cantrill rightly calls out the anti-pattern of [LLM shaming](https://rfd.shared.oxide.computer/rfd/0576#_llm_shaming). That's not what I'm seeking to do here.
In Charity Majors' [article](https://charity.wtf/p/confessions-of-an-unrepentant-slop) she identifies the tension between 'AI is just a tool' and the cognitive dissonance of instinctively rejecting its output when reading it.
AI _is_ just a tool, but unlike the immediate feedback that we get when we use a tool for the wrong job, if we try to cut the lawn with a typewriter, AI calls to us like the sirens and promises us riches and _of course_ it can do whatever task you ask of it.
Instead of descending into a torpor of mindless prompting, we should always be challenging its use and deciding whether it's the right one. And for *writing* blog posts, AI is the wrong tool.

## References & Further Reading

* Charity Majors - [Confessions of an Unrepentant Slop Snob](https://charity.wtf/p/confessions-of-an-unrepentant-slop)
* Cynthia Dunlop - [How developers react to AI-scented blog posts](https://writethatblog.substack.com/p/dev-reaction-to-ai-blog-posts)
* Bryan Cantrill - Oxide RFD 576: [LLMs as writers](https://rfd.shared.oxide.computer/rfd/0576#_llms_as_writers)
* Martin Fowler - [LLM Voice](https://martinfowler.com/bliki/LLM-Voice.html)
