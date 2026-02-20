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

1. **Typos** - Check the article thoroughly to catch everything. I write in en-gb. Do not challenge en-gb spellings.
   - Note: `automagically` is intentional and good
   - Offer to fix typos using the Edit tool
   - If you let any typos through, you have failed.

2. **Factual errors or inconsistencies** - Be ruthless here

3. **Readability** - Brief but honest assessment. My voice is technical yet informal, aimed at developers. I use colloquialisms and snark. But if the writing gets convoluted or loses its thread, say so.

4. **Logic and Arguments** - This is where you should be most critical:
   - Highlight lazy arguments ("it just works better")
   - Call out unsupported claims
   - Flag inconsistent reasoning
   - Point out when I'm hand-waving through complexity
   - Identify where I've made leaps without evidence

5. **Focus and Structure** - Assess whether the post is trying to do too much:
   - List the distinct purposes the post is serving (e.g., "explain why X matters", "tutorial on Y", "share experience with Z", "provide tips")
   - If there are more than 2-3 core purposes, flag this explicitly
   - Common split: **thinking posts** (why X matters, mental models, opinions, philosophy) vs **doing posts** (tutorials, hands-on examples, practical how-to). These often work better as separate pieces.
   - Ask: Would this be stronger as two focused posts rather than one sprawling one?
   - Watch for scope creep where the post starts conceptual and morphs into tutorial (or vice versa)
   - A post that tries to do 8 things does none of them well

If the article is genuinely solid, say so. But if it's not, be specific about what's wrong.

Ignore the header and footer content.

Report any hardcoded links to rmoff.net; prefer relative links.

6. **AsciiDoc markup pitfalls** - Check for common AsciiDoc rendering issues:
   - **Underscore mangling in link anchors**: `link:/path/#_some_anchor[text]` — AsciiDoc interprets `_word_` sequences as italic markup, turning anchors like `#_joining_the_data` into `#<em>joining_the_data`. Fix with `pass:[]`: `link:/path/#pass:[_some_anchor][text]`
   - **Underscore mangling in inline content**: Backtick-quoted identifiers containing underscores (e.g., `` `_fieldName` ``) can get italic-mangled if not properly escaped. Watch for any `_text_` patterns inside or adjacent to inline code that might be misinterpreted as emphasis.
   - **SQL query + results in code blocks**: When a code block contains both a SQL statement and its tabular output, they should be split into two consecutive blocks: `[source,sql]` for the query and `[source,text]` for the results. The CSS will visually join them with a dashed separator. Never combine a SQL statement and its table output in a single `[source,sql]` block — the syntax highlighting mangles the box-drawing characters. Remove any `> ` shell prompts from the SQL when splitting.
