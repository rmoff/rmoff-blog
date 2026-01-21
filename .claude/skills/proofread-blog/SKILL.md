---
name: proofread-blog
description: Proofread blog articles for typos, errors, readability, and logical consistency. Use when reviewing blog posts before publication.
disable-model-invocation: false
allowed-tools: Read, Grep, Glob, Edit
---

# Blog Article Proofreading

This is the draft of a blog article I am about to publish.

## Critical Standards

**Be direct and critical.** Do not LLM-nod through the content. If something is:
- Lazy or hand-wavy → Say it's lazy
- Poorly argued → Call it out as weak
- Illogical → Point out the logical flaw
- Repetitive or circular → Flag it

But don't be contrary for the sake of it. Focus on genuine issues, not manufactured problems.

**Exception: Learning in Public**
When the article explicitly signals that I'm learning/exploring a new subject (phrases like "I'm new to X", "learning about Y", "first time trying Z"), adjust criticism accordingly:
- Still catch typos and factual errors
- Flag actual misconceptions that could mislead readers
- But don't hammer tentative conclusions or exploratory thinking
- Recognize that uncertainty and questions are features, not bugs, in learning posts

## Primary Tasks

1. **Typos** - Check the article five times to catch everything. I write in en-gb. Do not challenge en-gb spellings.
   - Note: `automagically` is intentional and good
   - Offer to fix typos using the Edit tool

2. **Factual errors or inconsistencies** - Be ruthless here

3. **Readability** - Brief but honest assessment. My voice is technical yet informal, aimed at developers. I use colloquialisms and snark. But if the writing gets convoluted or loses its thread, say so.

4. **Logic and Arguments** - This is where you should be most critical:
   - Highlight lazy arguments ("it just works better")
   - Call out unsupported claims
   - Flag inconsistent reasoning
   - Point out when I'm hand-waving through complexity
   - Identify where I've made leaps without evidence

If the article is genuinely solid, say so. But if it's not, be specific about what's wrong.

Ignore the header and footer content, which is this:

header (dates and categories will vary)

```
rmoff's random ramblingsabout talks
Interesting links - March 2025
Published Mar 24, 2025 in Interesting Links
```

Footer:
```
Robin Moffatt

 Robin Moffatt works on the DevRel team at Confluent. He likes writing about himself in the third person, eating good breakfasts, and drinking good beer.

Story logo
© 2025
```
