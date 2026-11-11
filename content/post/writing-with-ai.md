---
title: "Why I won't write blog posts with AI (and you shouldn't either)"
date: 2026-11-11T16:58:33Z
draft: true
---

*Is it OK to write with AI?*
NO! Was my strident cry until just a week or two ago (it was, actually, a much less polite version of that).

I have a particularly vitriolic feeling when presented with LLM-generated text.
Don't worry, I'm not going soft; I still do.
Articles written with AI give me the ick, I don't trust them, and I lose respect for the author.
I'm not the only one to whom this applies; consider this finding from [a survey by Cynthia Dunlop](https://writethatblog.substack.com/p/dev-reaction-to-ai-blog-posts)
> * 98% of readers prefer imperfect-yet-authentic human writing
> * most will stop reading, block you, and downvote you if they suspect AI

And yet.

If you enjoy this article, and at the end of it I tell you I wrote it with AI, *does that make it a worse article*?

I compile [a monthly newsletter of content that's been written in the data and AI space](https://rmoff.net/categories/interesting-links/), and in researching it read dozens and dozens of articles every month.
(It's in doing this that's prompted me previously to write [previous](https://rmoff.net/2025/11/25/ai-smells-on-medium/) [rants](https://rmoff.net/2026/05/01/its-the-smell/) about LLM slop).
Doing this month on month has prompted a feeling that LLM capabilities at writing have moved beyond 'bloody awful' to 'vaguely plausible', which is causing me to take another look at the whole issue.

Whilst there are still a plethora of egregious offences committed against the written form on a daily basis by someone mindlessly cranking the LLM handle, there are also some articles that have given me pause.
They perhaps cover a niche subject that I've not seen written about before.
They feel LLM-y when I read them, but not *grossly* so.
My hand hovers over Cmd-W to close the tab, and yet. Am I cutting off my nose to spite my face? Am I any better than those in the coding community who dogmatically refuse to take advantage of the productivity gains of coding agents in any form, or use code that came from one?

In this article I will examine some of my instincts when dealing with LLM-generated writing, and distill it down into some rules that I follow when writing, and would encourage others to do too.
## Defining "written with AI"

I'm talking here about "*hey Claude, write me a blog post about how Kafka works*", or "*Hi Codex, here are my notes, please write it into a blog post kthxbai*".
However much you work with the output of prompting an LLM, it's still written with AI, and it'll read like it.

Some people will swear by having taught the LLM to write "in their style" or use skills to "de-LLM" the voice.
Others will take the LLM output and revise it by hand, much as a school kid plagiarising wikipedia will do, trying to make it their own.
Ultimately none of these really get rid of the LLM taint, nor address the main issues that I outline below. And as I will discuss shortly: for some types of writing, perhaps this doesn't actually matter.

NOTE: What I don't object to when writing—and what I positively encourage and mandate when reviewing other's work—is using LLMs to _review_ material that *you* have *written by hand*.

## What is the purpose of writing?

There are multiple types of written content, and I think some sits much more easily as being written whole or in part by LLMs than others.

If I am wanting to communicate an _argument_, to impart with emotion a viewpoint, then the use of an LLM is simply anathema. The best writing has a _voice_—dare I say even, a *soul*—, and an LLM has none.

At the other end of the spectrum is material such as a project's README (c'mon, you're telling me you've _not_ open sourced your vibe-coded itch that Claude scratched yet?!) or a runbook.
As Bryan Cantrill puts it (so eloquently, I might add; when was the last time you positively _enjoyed_ reading LLM prose?):

>  This is _operational writing_: it is neither highfalutin prose nor quotidian correspondence

If I'm the reader of one of these and it stinks on LLM, I'm gonna be mildly ick'd and possibly annoyed, but it's a purely mechanical artefact. So long as it's accurate (and LLMs are _so_ much better at not hallucinating these days) then I am content to cede this ground. READMEs and runbooks are the classic example of artefacts that often don't get written anyway and languish at the bottom of a JIRA list, forever being bumped to the next sprint. In this case, LLM-generated is better than nothing at all. Chances are I'd be pointing my LLM at your LLM output anyway cos I'm not going to actually _read_ the README, sheesh!

Both these (argument/thought piece, and README/runbook) are types of writing, and the use of LLM is just horrifying in one and understandable in the other. So we can't just say "no LLM in writing". What we can say is "_why are you writing this thing?_" to qualify the use of LLM in doing so.

What about writing lies between these two poles? There are many technical articles whose purpose is more than to simply document a process or project, but are not seeking to change the world, or opinions, either. These are the kinds of pieces that I a coming across much more often when I'm pausing on the close-tab icon, having detected LLM signs but still curious about the content.

### Using LLM to write technical blog posts

I don't need to read yet another blog post explaining the basics of how Kafka works that someone's generated and posted in the hope of a few clicks on Medium. I can ask my agent to generate that (with the benefit that my agent probably has memory of my background knowledge so can tailor it better than any generic blog post).

But what about someone who has researched and made a set of notes on a specific aspect of Kafka. Let's suppose that said person is busy, and having researched and learnt something, can either keep it for themselves or share it. I love the sharing of information; it's one of the main reasons I blog. But if said person is so busy that their only way to share the information in a coherent manner is to give it to an LLM. Is that "bad"? Or to the opening rhetorical question of this article - is it *OK*?

NOTE: Who tf am I to decree if something is _OK_ or not? Nobody, really. This is just how I write ;)

What prompted (!) this particular line of thinking for me recently was seeing a new release of a popular Apache technology, and someone had taken the `RELEASE_NOTES.md` and created a pretty decent blog post from them. Yet; it was LLM generated. Pro: more people are aware of the new features and changes in the release (blog posts gain visibility, are more appealing to read and share). Con: Is there one? In the old days a real person would have perhaps taken the release notes and written them up into more easily-accessible content as a blog post. The only difference I see here from that and an LLM doing it is the voice of the author. And for learning about what's new in a piece of software, do we need a 'voice'?
And yet. LLM copy still smells and I would say is less readable than well-written human writing. And I would still rather read a well-written digest from a human than an LLM. The human will have an eye for which features to highlight that an LLM often won't, just as it will for which to skip. Both these particular arguments, that of discernment and "smell" in writing, admittedly get thinner the better the LLMs get.

Ultimately I come back to my completely subjective objections below, around trust. People trust LLM-generated copy less. If you're an author using LLM, you are already on the back foot when it comes to communicating with your audience. It's up to you if that matters or not.

Cynthia Dunlop (of the excellent [Write that blog!](https://writethatblog.substack.com/) Substack and author of [Writing for Developers](https://github.com/scynthiadunlop/WritingForDevelopersBook)) has [great advice](https://writethatblog.substack.com/p/dev-reaction-to-ai-blog-posts):

> If you share interesting insights and your target reader can understand what you’re trying to communicate, some rough edges shouldn’t be an issue.
> A natural human voice is way more readable than perfectly predictable LLM prose

Charity Majors articulates a similar (and more nuanced) break down of communication types and where AI can help and where it can breach trust in the [Four types of communication](https://www.honeycomb.io/blog/ai-norms-values-part-3-things-we-hold-true#four-types-of-communication) section [this article on the Honeycomb blog](https://www.honeycomb.io/blog/ai-norms-values-part-3-things-we-hold-true), and expands on it in her excellent post [Confessions of an Unrepentant Slop Snob](https://charity.wtf/p/confessions-of-an-unrepentant-slop).
## Objections to LLM generated content

I've had some fascinating conversations in recent weeks with various folk across the blogging and writing community - those who write, and those who read.
In all of these, I've been trying to put my finger on quite what it is that I, and others, find objectionable in LLM writing.

Above all else, it's trust that bothers me most.
### Trust

If someone has prompted their way to an article, have they really tested their understanding of a subject?
Therefore, as a reader, I'm probably going to take it as less definitive than one which I can tell has been chiseled away and revised and reworked by hand.

Bryan Cantrill nails it [here](https://rfd.shared.oxide.computer/rfd/0576#_llms_as_writers):

> \[Absent\] LLMs, it is presumed that of the reader and the writer, it is the writer that has undertaken the greater intellectual exertion. (That is, it is more work to write than to read!) For the reader, this is important: should they struggle with an idea, they can reasonably assume that the writer themselves understands it — and it is the least a reader can do to labor to make sense of it.
> \[…\]
> \[Our\] writing is an important vessel for building trust — and that trust can be quickly eroded if we are not speaking with our own voice

Perhaps entangled with the matter of trust is the feeling that I cannot shake that someone who's prompted their LLM to write an article has not really _written_ the post, and to claim otherwise is somehow dishonest. I appreciated when I read [Joshua Buss](https://chicagobuss.dev/blog/)' blog recently that he actually tags posts as "Human" or "AI authored".
I don't know if this is fair. Am I simply objecting to the ease with which it's been done when before LLMs everyone had to _earn_ their badge as an author? As in, _damnit son, **I** had to write by hand and upload my article on a 56k modem link, and so should you!_
### Think, FFS

I've known for weeks that I've wanted to write this article. Every time I encounter LLM content, or someone sends me a blog post to review that's come straight from the bowels of Claude, I instinctively recoil, and then try to work out why.
But it's only whilst actually writing this blog post that I'm _really_ forming my amorphous thoughts into hopefully-lucid opinions and rational argument.

Writing is thinking, writing is forming arguments, and testing those arguments. If you're not _actually_ writing, you're not doing those things. At best you're mumbling around the subject loosely in your mind and having the LLM generate some apparently credible assertions or points of view. This is, perhaps, valuable in its own way *for yourself*, but it's verging on worthless as material to share with others.
### Verbosity and wading through the slop swamp

Many people when opening content that's been LLM'd will just close it again. LLM written text is just…weirdly difficult to read. You're not only asking your reader for their time to read it, you're asking _more_ of their time to read it because their brain has to do that weird thing to parse it. Like using your eyes in ways they aren't meant to be to view those 3D stereoscopic posters of the 1990s, the brain has to slightly defocus itself to read LLM material.
### If you can't be bothered to write it, I can't be bothered to read it

Otherwise known as AI;DR ("AI; Didn't Read", an homage to "Too Long; Didn't Read").
This actually works on multiple dimensions.
First, the accessibility of what you're asking your reader to spend their time trying to parse.
LLMs are quite content to burn tokens and crap out pages and pages of content, and LLM-generated material quite often has that daunting feel of a slickly-presented, oh-so-clearly structured, wall of text.

Secondly, it breaches the social contract (as Bryan Cantrill [writes about](https://rfd.shared.oxide.computer/rfd/0576#_llms_as_writers)) between writer and reader. If I'm asking you to read something (*such as this post*), the bare minimum I can do is invest the time (my own time) in making sure that it's well written and readable. Putting an LLM in the author's chair throws this out of the window. Now as 'author' (I use air quotes deliberately) I'm both spending less time on the post's integrity _and_ asking more of my readers' time because LLM content just does not read as well and needs more time to comprehend.
### The LLM 'smell'

Previously: [(AI) Smells on Medium](https://rmoff.net/2025/11/25/ai-smells-on-medium/) / [It’s the Smell](https://rmoff.net/2026/05/01/its-the-smell/)

There are some aspects that I think are impossible to address mechanically (discussed above, such as trust and thinking), but this one will probably get a lot better over time.
A year or more ago everyone felt very clever noting that the em-dash was a symptom of LLM generated text.
Those of us like me were horrified! I use the em-dash—a lot—and I would be mortified to be accused to LLM writing.

Then the LLMs figured out not to do that, and move on to the LLM smell _de jour_, whether it's the throat clearing `Honestly,` at the beginning of a response , or the `it's not X, it's Y` construction.
Some of these are easy to spot literally (`Honestly`) whilst others just…smell bad.
Look at a passage of LLM text and you'll soon spot the rhythms and structures that LLMs write in.
Like a chimpanzee sweeping its cage with a stick because it saw its keeper do it, LLMs are just repeating patterns that they've learnt. I say "just" with great respect for what LLMs _can_ do; but writing authentically and naturally is just not one of them yet.

### It's not just me (a.k.a. Appeal to Authority)

Charity Majors [articulates the reaction](https://charity.wtf/p/confessions-of-an-unrepentant-slop) that many people have when the encounter LLM writing:

> If I’m reading a newsletter and I start to sense AI-isms, I delete and unsubscribe.
> If I’m reading a blog post, I close the tab
> If I’m on social media, I unfollow or unfriend

Bryan Cantrill puts it [delightfully thus](https://bcantrill.dtrace.org/2025/12/05/your-intellectual-fly-is-open/):

> \[It is\] as if the writer is walking around with their intellectual fly open.

### Am I just scared of being replaced?

As someone whose career is in part built around writing, I've been going through similar existential soul-searching and navel gazing that my software-engineering bretheren have with the advent of LLMs getting seriously good at generating code.
Am I just being some stick in the mud who needs to get used to the new way of doing things?

Generating code is one thing; it's a means to an end (getting a computer to do something). I think that fundamentally the role that AI plays in code is very different to that from writing. It serves different purposes.

Writing is about thinking and arguing and sharing and validating or disproving a position. The act of putting words down on a page (or a screen) is just the *culmination* of that, whilst AI gives the writer the means to replace _all_ of the process.
## My rules for writing blog post with AI

### Rule 1: ~~~We do not talk about Fight Club~~~ Do not let LLMs write for you

[Readers value](https://writethatblog.substack.com/p/dev-reaction-to-ai-blog-posts) authenticity, however imperfect.
If you value your readers, write your content yourself.

There are lots of resources to help with writing blog posts, including [my own](https://rmoff.net/2023/07/19/blog-writing-for-developers/) (available [as a talk](https://rmoff.net/talk/blog-writing-for-developers/) too), and [many](https://www.seangoedecke.com/tags/writing/) [others](https://writethatblog.substack.com/p/advice-for-new-tech-bloggers).
### Rule 2: ~~~We DO NOT talk about Fight Club~~~ DO NOT let LLMs write for you

As much as LLMs are an awful tool for writing, they *are* a pretty damn good tool for editing and reviewing.
I use them heavily to proofread (you can see my skill [here](https://github.com/rmoff/rmoff-blog/blob/main/.claude/skills/proofread-blog/SKILL.md), if you're interested).

However, **the golden rule** is to never accept corrections or suggestions **directly** (except for spelling mistakes, I'll allow that one).
Beyond that though, and it's a slippery slope to slop if you give an LLM your writing and—even interactively—get it to revise it for you to make it 'better'. Not only does the LLM smell start to seep in, but the crucial benefit of editing an article in challenging _and thinking_ about structure and arguments gets skipped over.

### Rule 3: Don't trust the weirdo sycophant

A note of caution to the above rule. LLMs are people-pleasers. *You're absolutely right. That's very insightful.*
Just as no-one's gonna tell you that you're baby's ugly, an LLM is not going to tell you that you post stinks and is full of logical fallacies and technical errors.
They're getting better (worse?) at this, and can be a lot more critical. But I still see a tendency for them to both over-compliment, as well as sometimes get obsessed over the weirdest arguments.

So spell checking, yes (please!). Grammar, yes (but don’t let it strip your voice. Sometimes it’s ok to end a sentence with a preposition; this is a blog, not something the New York Times would put its name to.). But beyond that, definitely use it for _review_, but engage your brain when reading that review and don't let it bounce you into changing something that's perfectly fine. If in doubt get a—gasp—human to review your post too.
## No shame, but use the tool correctly

Bryan Cantrill rightly calls out the anti-pattern of [LLM shaming](https://rfd.shared.oxide.computer/rfd/0576#_llm_shaming). That's not what I'm seeking to do here.
In Charity Majors' [article](https://charity.wtf/p/confessions-of-an-unrepentant-slop) she identifies the tension between 'AI is just a tool' and the cognitive dissonance of instinctively rejecting its output when reading it.
AI _is_ just a tool, but unlike the immediate feedback that we get when use a tool for the wrong job, if we try to cut the lawn with a typewriter, AI calls to us like the sirens and promises us riches and _of course_ it can do whatever task you ask of it.
Instead of descending into a torpor of mindless prompting, we should always be challenging its use and if it's the right one. And for *writing* blog posts, AI is the wrong tool.

## References & Further Reading

* Charity Majors - [Confessions of an Unrepentant Slop Snob](https://charity.wtf/p/confessions-of-an-unrepentant-slop)
* Cynthia Dunlop - [How developers react to AI-scented blog posts](https://writethatblog.substack.com/p/dev-reaction-to-ai-blog-posts)
* Bryan Cantrill - Oxide RFD 576: [LLMs as writers](https://rfd.shared.oxide.computer/rfd/0576#_llms_as_writers)
