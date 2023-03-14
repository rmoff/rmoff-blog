---
draft: false
title: 'Quickly Convert CSV to Parquet with DuckDB'
date: "2023-03-14T15:12:31Z"
image: "/images/2023/03/h_DSCF8416.jpeg"
thumbnail: "/images/2023/03/t_IMG_1672.jpeg"
credit: "https://twitter.com/rmoff/"
categories:
- DuckDB
---

Here's a neat little trick you can use with [DuckDB](https://duckdb.org/) to convert a CSV file into a Parquet file:

```sql
COPY (SELECT *
	    FROM read_csv('~/data/source.csv',AUTO_DETECT=TRUE))
  TO '~/data/target.parquet' (FORMAT 'PARQUET', CODEC 'ZSTD');
```

<!--more-->

You can modify the schema too if you want, selecting specific fields and renaming them too if you want: 

```sql
COPY (SELECT col1, col2, col3 AS foo
	    FROM read_csv('~/data/source.csv',AUTO_DETECT=TRUE))
  TO '~/data/target.parquet' (FORMAT 'PARQUET', CODEC 'ZSTD');
```

Read more on the DuckDB [CSV](https://duckdb.org/docs/data/csv/overview) and [Parquet](https://duckdb.org/docs/data/parquet/overview) docs pages.