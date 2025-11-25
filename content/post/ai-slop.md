---
draft: false
title: '(AI) Smells on Medium'
date: "2025-11-25T12:46:34Z"
image: "/images/2025/11/h_IMG_3224.webp"
thumbnail: "/images/2025/11/t_IMG_3232.webp"
credit: "https://bsky.app/profile/rmoff.net"
categories:
- Blogging
- Rant
---

As part of compiling the monthly [interesting links](/categories/interesting-links/) posts, I go through a ton of RSS feeds, sourced from specific blogs that I follow as well as general aggregators.
These aggregators include quality sources like InfoQ, and certain tags on lobste.rs.
Here I'll often find some good articles that I missed in my general travels around the social media feeds in the previous month.
I also, so you don't have to, dive into the AI slop-pit that is Medium and various categories feeds.
In amongst the detritus and sewage of LLMs left to ramble unchecked are the occasional proverbial diamonds in the rough.

I thought it might be interesting—and a useful vent to preserve my sanity—to note down some of the "smells" I've noticed.
<!--more-->
Far be it from my place to police how people write articles, but this is a common pattern I've noticed in online discussion of blog writing recently.
If you're writing on any platform then you might consider the signals you're sending if you do any of these.

Some of these are specifically LLM smells (you are so right! I know!!), whilst others are the pre-LLM lazy copy-paste meanderings that get caught up in my general frustration with the state of the online content ecosystem.
The latter would probably have been nothing more than a slight annoyance in the past, but the AI slop has increased to such volume that finding _any_ good content becomes much more difficult.

Side note: If you are genuinely interested in writing blog posts for developers, I've [written](/2023/07/19/blog-writing-for-developers/) and [spoken](/talk/blog-writing-for-developers/ ) about it and would be delighted if you want to get in touch with any questions.

## Step 1: The Title

I use [Inoreader](https://inoreader.com) to organise and consume my RSS feeds.
This is the view I get:

![](/images/2025/11/rss.webp)

In my first pass I'll not open each article, but just skim the titles.

Smells here:

- ✨⚡🤔 Emojis❗ 💡💪

  Humans can use them too, but LLMs love them. Add +2 to the smell-o-meter.
- 𝓤𝓷𝓲𝓬𝓸𝓭𝓮 𝒇𝒐𝒓𝒎𝒂𝒕𝒕𝒊𝒏𝒈 𝐭𝐞𝐱𝐭 𝓮𝒻𝒻𝓮𝒸𝓉𝓈

  Perhaps not an AI-smell per se, but invariably some kind of "HoT TakE!!11111" that is about as hot as cold cat sick, and just as appealing
- "How to use $OLD_TECHNOLOGY"

  Less LLM and more likely regurgitated content found elsewhere
- Clickbait-y titles:
	- "We replaced Kafka with COBOL and shocked everyone"
	- "I replaced Kafka with happy puppies and halved our cloud bills"

  The LLMs love this pattern at the moment. Invariably the article is complete BS - 100% made up.

## Step 2: The Preview Image

RSS as a specification doesn't _require_ the full article in the body; oftentimes it's a snippet from the top.
So for articles that have piqued my interest I'll open the preview and see what's brewing:

![](/images/2025/11/preview.webp)

The first huge rotten stinky smell is the AI-generated header image.

> What's this, I hear you cry! _I_ use AI-generated headers and I'm not writing crap!

The problem is that "boomer art" has become so ubiquitous now that it's meaningless.
What started off as unique or witty has become tedious and passé.

Who am I to comment on design and trends? No-one.
But let me ask you this: when you see this on the Q&A slide of a presentation do you think (a) oh good! or (b) oh god!

![](/images/2025/11/37eff3dab76472c5e92e9a688bd4e36988f4db9d.webp)

I mean, we may as well go full 2000s and bring in some MS WordArt too, right?

![](/images/2025/11/AISlopisruiningtheinternet.webp)

Like it or not, AI-generated header images are a smell.

If the image also has spelling errors, **then do not pass go, do not collect 200 page views, go straight to jail**.
Spelling errors means you used AI _and could not be arsed to fix it._
If that's your quality bar for images, what does it mean for the quality of your article?
Second to spelling errors are nonsensical word-salad text diagrams. Also a red flag.

* Are there good examples of AI-generated header images? yes.
* Have I used them myself, extensively, [in the past](https://www.decodable.co/blog-author/robin-moffatt)? also yes!

Done thoughtfully, I still think they're OK `¯\_(ツ)_/¯`.
But taken as a heuristic for a blog post amongst all the other candidates for my time, they work pretty well for weeding out the slop. Sorry.

## Step 3: The Article

(See how shallow and picky I am? I've not even _read_ the article yet!)

### Oddly-specific but unspecific

Consider this as the _very opening_ of an article:

> Our event-streaming cluster was sputtering during partition reshuffles. Every time a subscriber crashed or another replica spun up, the whole consumer cohort stalled for roughly ten to twenty seconds. Tasks stacked, retries swamped the failure queue, and the duty engineer was alerted several times weekly. We replaced the broker with a wire-compatible alternative, kept the identical protocol and client SDKs, and saw p95 latency slide from 360ms to 180ms while retry volume fell to none.

OK, that's nice. But *who* are you? This is a random blog by a random person on Medium. This is not a company engineering blog. A little bit weird not to set _some_ kind of context, right?
I mean, every man and his dog loves to open any conference abstract with some BSD stats about what it is they've built (even if no-one actually cares).
But here, no, straight into the detail. But, weirdly specific yet _unspecific_ detail.

Spidey senses tingling.

(Another stinky AI opening that I've noticed is the "_$thing had been happening for months. We kept throwing money at it. Then this one weird thing happened that changed everything_")

### ASCII Art diagrams

Next up is a real stinker that has so far given me 100% detection rate: **ASCII art diagrams**.
Don't get me wrong; as a child of the 90s, I love a good ASCII art as much as the next BBS sysop.
But it's almost like…it's easier for an LLM to create these than for a real human to draw it in Excalidraw or similar?… Surely not.

```
        [ microservice-a ]
                |
                v
           ( Kafka )
          /    |    \
         v     v     v
[ microservice-b ][ microservice-c ][ microservice-d ]
         |               |                 |
         v               v                 v
     ( Kafka ) ------ ( Kafka ) ------ ( Kafka )
         ^               ^                 ^
         |               |                 |
     [ microservice-e ][ microservice-f ][ microservice-g ]

```

### Deep-dive content that's only a few paragraphs long

Like with the oddly-specific content I mention above—if you're writing about things like Kafka retry rates or P95 latencies, you're going to be explaining what the system is, why these things matter, what you'd tried, what you fixed, how it went, etc. It's going to be a detailed blog and a really good read. Or, it's going to be super-high level, for the exec-board: Kafka had a problem, and we fixed it. Yay us.

But the AI stink is real on these posts that purport to be detailed, yet somehow wrap up a whole story in just four or five paragraphs. And you read them and still aren't quite sure what happened. It's like eating white bread; your mouth knows it's consumed several slices, but your brain is confused because your stomach is still telling it that it's empty.

### If it's too good to be true… / If it's hyping $NEW_TECH
Just as the LLMs are trained on basically everything on StackOverflow and Reddit, they're presumably trained on HackerNews.
And there's nothing HackerNews likes more than a spicy "we replaced $OLD_TECH with $NEW_TECH". Even better if you did it in 30 lines of $NEW_TECH. And with one person. Overnight. And saved a gazillion pounds. etc, etc.
So this one becomes tricky, because isn't the job of any developer advocate to talk up $NEW_TECH? Well, yes. But with justification and for use-cases that make sense, and with suitable nods towards caveats and compromises.

There are plenty of Medium articles of the ilk of "We rewrote Kafka in Go/Rust/etc in 20 lines"; the occasional one is true, most are BS.

### The Usual AI signs

* Bullet point paragraphs
* Oh my sweet, much-maligned—and unfairly so—em-dashes. I write with them for real, unfortunately so do the AI slop machines 😢
* Emojis
* Short section headings
* etc etc

### Author profile

Some of these signs are dead-certs, others are just smells that might prompt you to consider twice whether what you're consuming is off or not. One way to check for certain, usually, is look at the author's profile.

Good content takes time to write. Especially if you're doing it around the pressured business of re-writing your (anonymous) company's platform in Rust. But it turns out some Medium authors are not only extremely proficient in their copious output, but my gosh they're diverse in their subject matter expertise—imagine being able to publish all of these in **one week**:

* Java 21 Made My Old Microservice Faster Than Our New Go Service
* Bun Just Killed Node.js For New Projects — And npm Did Not See It Coming
* Tokio Made My Rust Service 10x Faster — Then It Made My Life 10x Harder
* The 10x Engineer Is Real. I’ve Worked With Three
* Redis Is Dead: How We Replaced It With 200 Lines of Go
* Why Senior Engineers Can’t Pass FizzBuzz (And Why That’s Fine)
* Turning Off ORM Lazy Loading Dropped Queries 93%
* Why Big Tech Quietly Killed Scrum (And What Replaced It)
* […]
* _(the list goes on; this was not some writer's block that was suddenly relieved)_

The other thing is whether can you find them on LinkedIn.
Not everyone is on LinkedIn and that's totally fine.
But if you can find them, have they been working in a line of work that justifies what they're claiming in their writing? I don't mean this in a gatekeeping way; what I mean is a junior engineer with six months experience out of college claiming to have re-implemented a production system overnight is possibly stretching the truth.

## The Enshittification is here and AI is making it much, much, worse.

**[Enshittification](https://en.wikipedia.org/wiki/Enshittification) /ɛnˌʃɪtɪfɪˈkeɪʃən/, noun**

As I mentioned at the top: crap content on the internet has always been around. And some of that is fine; we all cut our teeth somewhere.
The beauty of an open internet is that anyone can write anything and that's totally fine. I can write this article, and be rude and objectionable. People might not like it, and that's also fine.

But what's not fine is the deafening roar of shit that is now being generated at orders of magnitude greater than ever before.

At least there was a cost to writing poor quality content before. Even the laziest plagiariser had to manually find the content to nick and copy-paste it into their own blog that they'd taken the time to set up. Now, all it needs is a muppet with a Medium account and an LLM. God forbid they hook it up to an agent and automate the process. Except, they probably do, given the scale of the shit that's being pumped out.
