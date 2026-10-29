---
name: proofread-links
description: Proofread Interesting Links digest posts. Verifies all links and checks characterizations. Use Haiku model for cost efficiency.
disable-model-invocation: false
---

# Interesting Links Digest Proofreading

**Recommended model**: Run `/model haiku` before invoking this skill for cost efficiency.

## Tasks

1. **Extract all links** from the article using `grep` or similar tools directly from the file. Do NOT manually transcribe URLs — transcription errors are easy to make (e.g., confusing `3.6.0` with `3-6-0`) and will cause false positives/negatives in curl checks. Extract programmatically, then verify extracted URLs match the source file before testing.

2. **Check all links are live** using a single Bash call with `curl -sI -o /dev/null -w "%{url} %{http_code}\n"` for every URL. This is cheap and fast. Report any that return 4xx/5xx or fail to connect.

   **Medium links** (`medium.com`, `*.medium.com`) always return 403 to curl — even bogus URLs do, so a raw curl can't validate them. Instead, validate them through Freedium: `curl -sI -o /dev/null -w "%{http_code}\n" "https://freedium-mirror.cfd/<medium-url>"`. Freedium returns 200 for real articles and 404 for non-existent ones. If Freedium returns 200, treat the Medium link as clean.

   **TLS errors are not broken links.** If curl fails with exit 60 / `000` and an SSL error ("unable to get local issuer certificate", "certificate has expired"), check the issuer with `echo | openssl s_client -connect <host>:443 -servername <host> 2>/dev/null | grep 'i:'`. If the issuer is Confluent's TLS-inspection CA, the problem is this machine's proxy, not the site: confirm the page via `curl -s "https://r.jina.ai/<url>"` (returns the page's text) and don't report it as broken.

   **Bash here runs zsh:** `export -f` + `xargs` doesn't work (write the checker to a script file instead), and `$VAR[...]` is parsed as an array subscript (use `${VAR}` or write URLs literally).

3. **Check characterizations** — does my summary/characterization reflect the linked content, and have I misrepresented the author's point?

   **WebFetch is for gist only — it is never evidence.** WebFetch does not return the page; it returns a small model's answer *about* the page, which can drop, invent or misread details. Use it to skim whether a characterization is broadly right. Anything it flags is a *lead*, not a finding.

   **Every correction must be confirmed against the raw page source before it is reported.** That means anything saying the post is wrong: names/bylines, affiliations, quotes, numbers, dates, release status, and above all "X isn't on the page". Download the HTML and grep it:

   ```bash
   UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'
   curl -sL -m 30 -A "$UA" -o <scratchpad>/raw/page.html '<url>'
   grep -o -i '.\{0,120\}<term>.\{0,120\}' <scratchpad>/raw/page.html
   ```

   - **Grep the whole raw HTML, not just the visible text.** Bylines, author bios and dates often live only in JSON-LD, `<meta>` tags or inline JSON — e.g. InfoQ's author bio is a `"minibio"` JSON field behind "Show more", so stripping `<script>` hides it.
   - **Absence needs the original page.** Only say "X isn't on the page" if grepping the *original's* raw HTML finds nothing. A mirror cannot establish absence: Freedium re-renders Medium posts, and its `Author:` header is the Medium account's display name, which can differ from the article's byline.
   - **No raw source, no correction.** If the original's raw HTML can't be fetched (Medium, bot walls such as lore.kernel.org's Anubis, the skipped domains below), the item goes under *Couldn't verify* — never under errors.
   - **"Not on the linked page" ≠ "wrong".** I sometimes add context from elsewhere (e.g. when a company was acquired). If the linked page neither supports nor contradicts a claim, report it as *not supported by the link*, not as an error.

   _Why: in the Oct 2026 run, WebFetch- and agent-sourced "errors" were reported as fact and several were false — a byline "missing" a middle name (judged from Freedium's header) and an employer "not on the page" (it was in the InfoQ author-bio JSON)._

   **Domain handling:**
   - **Medium posts** (`medium.com`, `*.medium.com`): for gist, rewrite the URL through `https://freedium-mirror.cfd/` (e.g. `https://freedium-mirror.cfd/https://medium.com/...`) to bypass the paywall/403. Mirror text can confirm something *is* in the article, but per the rules above it can't show something *isn't*.
   - **Skip these domains** — they block WebFetch and can only be checked via curl for HTTP status:
     - `linkedin.com`, `www.linkedin.com`
     - `x.com`, `twitter.com`
     - `old.reddit.com`, `www.reddit.com`
     - `youtube.com`, `www.youtube.com`
     - `notion.so`
   - All other domains: WebFetch for gist; curl + grep for anything you'll report as wrong.

4. **Parallelisation** — use 2-3 Task agents (Haiku model) to verify links in parallel, splitting the article into roughly equal chunks. Don't use more than 3 agents — the overhead outweighs the benefit.
   - Give agents the step 3 rules, and require each finding to come back with the **verbatim source text** and **how it was obtained** (raw-HTML grep, mirror, or WebFetch summary).
   - **Agent findings are leads.** Before anything an agent flags goes in the report, re-verify it yourself with a raw-HTML grep (step 3). Re-asking WebFetch does not count — it is the same summariser.

5. **Typos** - Check the article for typos. I write in en-gb.
   - `automagically` is intentional
   - **For text typos**: Offer to fix them using the Edit tool
   - **For typos in URLs**: DO NOT fix automatically. URLs might contain literal typos (e.g., "whisleblower" in a URL that actually exists as misspelled). Instead:
     - Report the suspected typo in the URL
     - Note whether the URL works as-is
     - Only offer to fix if the URL is broken AND you've verified the corrected version works

6. **Category placement** - Check each link is in the right section using this heuristic:
   - **Data Platforms, Architectures, and Modelling**: architecture/design/thinking — posts about *why* or *how to structure* a system, data modelling
   - **Data Engineering, Pipelines, and CDC**: building/tooling/operating — posts about *building or operating* a specific pipeline/tool, CDC-specific content
   - **Kafka and Event Streaming**: Kafka ecosystem, messaging, event streaming platforms
   - **Stream Processing**: Flink, Kafka Streams, Spark Streaming, stream processing frameworks
   - **Analytics**: OLAP engines, dashboards, query engines (StarRocks, ClickHouse, BigQuery, etc.)
   - **OTF**: Iceberg, Delta Lake, Hudi, Paimon, Fluss, catalogs, lakehouse patterns, file formats (Parquet, Lance, etc.)
   - **RDBMS**: Postgres, MySQL, DuckDB, database internals, SQL
   - **General Data Stuff**: anything data-related that doesn't fit above
   - **AI**: all AI/ML content
   - **And finally**: non-data content
   - Flag any links that seem miscategorised, with a suggested alternative section

7. **Punctuation consistency** — every bullet should end with a full stop (or other appropriate terminal punctuation, e.g. `?`, `!`, `…`). This applies even to bare "Author - [title]" entries. Flag any bullet missing terminal punctuation and offer to fix.

8. **Images** — check the frontmatter `image:` (header) and `thumbnail:` paths:
   - **Format**: must be `.webp`. If the post points at a `.jpeg`/`.jpg`/`.png` source, regenerate the webp via `cwebp -q 80 -resize <width> 0 <src> -o <dest>` and update the frontmatter.
   - **Dimensions**: match the existing IL pattern in `static/images/<year>/<month>/`:
     - Header (`h_` prefix): **1800px wide**, height free (typical full crops are 1800×1350, banner crops 1800×~600)
     - Thumbnail (`t_` prefix): **800px wide**, height free (typical 800×1067 portrait)
   - **File size**: header should be roughly 200KB–800KB, thumbnail 100KB–300KB. Anything ≫1MB means the source wasn't resized — regenerate.
   - Verify by sampling the previous month's `h_*.webp` / `t_*.webp` with `identify` or `ls -l` to confirm the current convention before resizing.

9. **Report format**:
   - List any broken links (from curl check)
   - Characterization problems, in three separate buckets:
     - **Contradicted by the source** — what I said, the **verbatim source text** from the raw-HTML grep, and where it came from (original page or mirror). No verbatim quote, no entry here.
     - **Not supported by the linked page** — the claim isn't on the page but may be true from elsewhere; let me decide.
     - **Couldn't verify** — one line each, saying why (blocked, mirror only, skipped domain).
   - Never present a WebFetch- or agent-summary-only finding as an error.
   - List any potentially miscategorised links with suggested section
   - List typos in text (offer to fix these)
   - List suspected typos in URLs (with validation status)
   - List any bullets missing terminal punctuation (offer to fix)
   - Keep it concise - don't repeat back correct characterizations or correctly-placed links

## Ignore

Header and footer boilerplate (author bio, navigation, copyright).
