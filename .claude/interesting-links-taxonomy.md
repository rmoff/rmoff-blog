# Interesting Links - Category Taxonomy

Use this reference when categorising links for the monthly Interesting Links blog posts.

## Categories

| Section | What Goes Here | Examples |
|---------|----------------|----------|
| **Kafka & Event Streaming** | Kafka, alternatives (WarpStream, Tansu, etc.), queues, messaging, Kafka Connect | DLQ handling, KRaft deep-dives, Kafka TUIs, Connect intro posts |
| **Stream Processing** | Flink, Kafka Streams, Beam, Fluss | Watermarks, Delta Joins, memory tuning |
| **Analytics** | ClickHouse, StarRocks, Pinot, DuckDB, BigQuery | Query optimization, engine internals, benchmarks |
| **OTFs & Catalogs** | Iceberg, Delta, Hudi, Paimon, DuckLake, catalogs, file formats | Table maintenance, spec comparisons, Parquet/Lance/Vortex |
| **CDC & Data Pipelines** | Debezium, ingestion, pipeline tooling, data movement patterns | Outbox pattern, WAP, Flink CDC |
| **Data Platforms & Architectures** | System design, platform builds, company architectures | Event-driven platforms, lakehouse designs, medallion debates |
| **Data Engineering Practice** | Modelling, career, skills, craft, industry commentary | Joe Reis on modelling, "Mid-Skill DE in Trouble", data contracts |
| **RDBMS** | Postgres, MySQL, SQL, database internals | Index deep-dives, query execution, migrations |
| **General Data Stuff** | Misc tech that doesn't fit above | New tools, industry news, oddities |
| **AI** | *(subsections below)* | |
| ↳ Strategy & Ideas | High-level thinking, industry direction | "Don't fall into anti-AI hype", ambient agents |
| ↳ Using AI—Product | User-facing AI features | Etsy search, Swiggy conversational AI |
| ↳ Using AI—Platforms | ML/AI infrastructure | Feature stores, LLM processing pipelines |
| ↳ Using AI—Engineering | Coding with AI, dev tooling | Claude Code, Spotify background agents |
| ↳ Agents & MCP | Agents, MCP servers, context engineering | 12 Factor Agents, MCP bridges |
| ↳ Philosophy & Society | Ethics, societal impact | Shaping AI's impact, policing and AI |
| **And finally…** | Non-data stuff: fun, think pieces, nerd, watch | Brad Stulberg, Charity Majors, reverse engineering |

## Decision Guidelines

### Kafka Connect
- General Connect posts → **Kafka & Event Streaming**
- Connect used for CDC/ingestion (e.g., Debezium + Connect to Iceberg) → **CDC & Data Pipelines** (if pipeline pattern is the focus)

### StarRocks / Streaming Analytics
- Query engine internals, benchmarks → **Analytics**
- Real-time/streaming features (e.g., Incremental MV) → judgement call, usually **Analytics**

### DuckDB
- Query/performance → **Analytics**
- DuckDB + Iceberg writes → **OTFs & Catalogs**
- DuckDB streaming patterns → **Stream Processing** or **Analytics** depending on focus

### Company Engineering Blogs
- Distribute by primary topic focus
- "How X built their lakehouse" → **Data Platforms & Architectures**
- "How X optimised Iceberg tables" → **OTFs & Catalogs**

### OTFs vs Platforms
- *How Iceberg works* → **OTFs & Catalogs**
- *How someone built something with Iceberg* → **Data Platforms & Architectures**

### Data Contracts
- → **Data Engineering Practice** (they're about the craft of doing DE well)

### Fluss
- → **Stream Processing** (tightly coupled with Flink, despite being "streaming storage")
