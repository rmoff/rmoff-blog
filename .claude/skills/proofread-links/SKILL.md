---
name: proofread-links
description: Proofread Interesting Links digest posts. Verifies all links and checks characterizations. Use Haiku model for cost efficiency.
disable-model-invocation: false
---

# Interesting Links Digest Proofreading

**Recommended model**: Run `/model haiku` before invoking this skill for cost efficiency.

## Tasks

1. **Extract all links** from the article

2. **Check all links are live** using a single Bash call with `curl -sI -o /dev/null -w "%{url} %{http_code}\n"` for every URL. This is cheap and fast. Report any that return 4xx/5xx or fail to connect.

3. **Fetch fetchable links** to verify characterizations — use WebFetch and verify:
   - Does my summary/characterization accurately reflect the linked content?
   - Have I misrepresented the author's point?

   **Domain handling:**
   - **Medium posts** (`medium.com`, `*.medium.com`): Rewrite the URL through `https://freedium-mirror.cfd/` (e.g. `https://freedium-mirror.cfd/https://medium.com/...`) to bypass the paywall/403
   - **Skip these domains** — they block WebFetch and can only be checked via curl for HTTP status:
     - `linkedin.com`, `www.linkedin.com`
     - `x.com`, `twitter.com`
     - `old.reddit.com`, `www.reddit.com`
     - `youtube.com`, `www.youtube.com`
     - `notion.so`
   - All other domains: fetch normally with WebFetch

4. **Parallelisation** — use 2-3 Task agents (Haiku model) to verify links in parallel, splitting the article into roughly equal chunks. Don't use more than 3 agents — the overhead outweighs the benefit.

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

7. **Report format**:
   - List any broken links (from curl check)
   - List any mischaracterized links with: what I said vs what it actually says
   - List any potentially miscategorised links with suggested section
   - List typos in text (offer to fix these)
   - List suspected typos in URLs (with validation status)
   - Keep it concise - don't repeat back correct characterizations or correctly-placed links

## Ignore

Header and footer boilerplate (author bio, navigation, copyright).
