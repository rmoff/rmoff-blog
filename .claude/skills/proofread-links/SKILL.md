---
name: proofread-links
description: Proofread Interesting Links digest posts. Verifies all links and checks characterizations. Use Haiku model for cost efficiency.
disable-model-invocation: false
allowed-tools: Read, Glob, WebFetch, Edit
---

# Interesting Links Digest Proofreading

**Recommended model**: Run `/model haiku` before invoking this skill for cost efficiency.

## Tasks

1. **Extract all links** from the article

2. **Fetch each link** using WebFetch and verify:
   - Does my summary/characterization accurately reflect the linked content?
   - Have I misrepresented the author's point?
   - Is the link still live?

3. **Typos** - Check the article for typos. I write in en-gb.
   - `automagically` is intentional
   - **For text typos**: Offer to fix them using the Edit tool
   - **For typos in URLs**: DO NOT fix automatically. URLs might contain literal typos (e.g., "whisleblower" in a URL that actually exists as misspelled). Instead:
     - Report the suspected typo in the URL
     - Note whether the URL works as-is
     - Only offer to fix if the URL is broken AND you've verified the corrected version works

4. **Report format**:
   - List any broken links
   - List any mischaracterized links with: what I said vs what it actually says
   - List typos in text (offer to fix these)
   - List suspected typos in URLs (with validation status)
   - Keep it concise - don't repeat back correct characterizations

## Ignore

Header and footer boilerplate (author bio, navigation, copyright).
