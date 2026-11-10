---
draft: false
title: 'Aligning mismatched Parquet schemas in DuckDB'
date: "2023-03-03T14:36:08Z"
image: "/images/2023/03/h_IMG_8795.jpeg"
thumbnail: "/images/2023/03/t_DSCF8426.jpeg"
credit: "https://bsky.app/profile/rmoff.net"
categories:
- DuckDB
- Parquet
aliases:
- "/2023/03/03/aligning-mis-matched-parquet-schemas-in-duckdb/"
---

What do you do when you want to query over multiple parquet files but the schemas don't quite line up? Let's find out 👇🏻

<!--more-->

I've got a set of parquet files in S3 (well, lakeFS[^1], but let's not quibble over details) with the same datail split by year:

```bash
$ lakectl fs ls lakefs://drones03/main/drone-registrations/
object          2023-03-01 09:47:36 +0000 UTC    30.7 kB         Registations-P107-Active-2016.parquet
object          2023-03-01 09:48:54 +0000 UTC    119.7 kB        Registations-P107-Active-2017.parquet
object          2023-03-01 09:44:47 +0000 UTC    594.3 kB        Registations-P107-Active-2018.parquet
object          2023-03-01 09:45:04 +0000 UTC    1.3 MB          Registations-P107-Active-2019.parquet
object          2023-03-01 09:48:12 +0000 UTC    2.8 MB          Registations-P107-Active-2020.parquet
object          2023-03-01 09:48:51 +0000 UTC    3.2 MB          Registations-P107-Active-2021.parquet
```

I want to query and manipulate the data. DuckDB is my friend since it works with [parquet files](https://duckdb.org/docs/data/parquet). I fire it up with an empty database: 

```bash
$ duckdb drones.duckdb
```

A `DESCRIBE` gives me the schema: 
```sql
D DESCRIBE SELECT * FROM read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-*.parquet') ;
┌─────────────────────────┬─────────────┬─────────┬─────────┬─────────┬─────────┐
│       column_name       │ column_type │  null   │   key   │ default │  extra  │
│         varchar         │   varchar   │ varchar │ varchar │ varchar │ varchar │
├─────────────────────────┼─────────────┼─────────┼─────────┼─────────┼─────────┤
│ Registration Date       │ VARCHAR     │ YES     │         │         │         │
│ Registion Expire Dt     │ VARCHAR     │ YES     │         │         │         │
│ Asset Type              │ VARCHAR     │ YES     │         │         │         │
│ RID Equipped            │ BOOLEAN     │ YES     │         │         │         │
│ Asset Model             │ VARCHAR     │ YES     │         │         │         │
│ Physical City           │ VARCHAR     │ YES     │         │         │         │
│ Physical State/Province │ VARCHAR     │ YES     │         │         │         │
│ Physical Postal Code    │ BIGINT      │ YES     │         │         │         │
│ Mailing City            │ VARCHAR     │ YES     │         │         │         │
│ Mailing State/Province  │ VARCHAR     │ YES     │         │         │         │
│ Mailing Postal Code     │ BIGINT      │ YES     │         │         │         │
├─────────────────────────┴─────────────┴─────────┴─────────┴─────────┴─────────┤
│ 11 rows                                                             6 columns │
└───────────────────────────────────────────────────────────────────────────────┘
```

Now I should be able to query a [sample](https://duckdb.org/docs/sql/query_syntax/sample) of the data to check it out, right. Right? 

```sql
D SELECT * 
  FROM read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-*.parquet') 
  USING SAMPLE 5 ROWS;
100% ▕████████████████████████████████████████████████████████████▏ 
Error: Conversion Error: Could not convert string 'V1M 2K9' to INT64
```

## Spoiler: `UNION_BY_NAME`

After posting this blog, two people both suggested using the `UNION_BY_NAME` option which was [added to DuckDB recently](https://github.com/duckdb/duckdb/pull/5716). This worked perfectly: 

```sql
D SELECT *
    FROM read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-*.parquet',
                      union_by_name=True)
    USING SAMPLE 5 ROWS;
100% ▕████████████████████████████████████████████████████████████▏
┌──────────────────────┬─────────────────────┬───────────────┬──────────────┬───┬──────────────────────┬──────────────┬──────────────────────┬─────────────────────┐
│  Registration Date   │ Registion Expire Dt │  Asset Type   │ RID Equipped │ … │ Physical Postal Code │ Mailing City │ Mailing State/Prov…  │ Mailing Postal Code │
│       varchar        │       varchar       │    varchar    │   boolean    │   │       varchar        │   varchar    │       varchar        │       varchar       │
├──────────────────────┼─────────────────────┼───────────────┼──────────────┼───┼──────────────────────┼──────────────┼──────────────────────┼─────────────────────┤
│ 2021-09-27 17:17:1…  │ 2024-09-27          │ HOMEBUILT_UAS │ false        │ … │ 32177                │ Palatka      │ FL                   │ 32177               │
│ 2020-12-06 02:18:5…  │ 2023-12-05          │ PURCHASED     │              │ … │ 10065                │ New York     │ NY                   │ 10065               │
│ 2019-10-08 15:33:3…  │ 2022-10-08          │ PURCHASED     │              │ … │ 83706                │ Boise        │ ID                   │ 83706               │
│ 2020-12-03 14:26:0…  │ 2023-12-03          │ PURCHASED     │              │ … │ 49506                │ Grand Rapids │ MI                   │ 49506               │
│ 2020-01-27 18:57:0…  │ 2023-01-27          │ HOME_BUILT    │              │ … │ 35758                │ Madison      │ AL                   │ 35758               │
├──────────────────────┴─────────────────────┴───────────────┴──────────────┴───┴──────────────────────┴──────────────┴──────────────────────┴─────────────────────┤
│ 5 rows                                                                                                                                      11 columns (8 shown) │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Thanks [`@mraasveldt`](https://twitter.com/mraasveldt) and [`@__AlexMonahan__`](https://twitter.com/__AlexMonahan__)👍🏻

Problem solved. But if you want to follow along with another option, read on… 

## Back to the Detective Story

So, we have this problem: 

```sql
D SELECT * 
  FROM read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-*.parquet') 
  USING SAMPLE 5 ROWS;
100% ▕████████████████████████████████████████████████████████████▏ 
Error: Conversion Error: Could not convert string 'V1M 2K9' to INT64
```

Huh. That sucks. Let's try it on a single file: 

```sql
D SELECT * FROM read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet') USING SAMPLE 5 ROWS;
┌──────────────────────┬─────────────────────┬─────────────────┬──────────────┬───┬──────────────────────┬────────────────┬──────────────────────┬─────────────────────┐
│  Registration Date   │ Registion Expire Dt │   Asset Type    │ RID Equipped │ … │ Physical Postal Code │  Mailing City  │ Mailing State/Prov…  │ Mailing Postal Code │
│       varchar        │       varchar       │     varchar     │   boolean    │   │        int64         │    varchar     │       varchar        │        int64        │
├──────────────────────┼─────────────────────┼─────────────────┼──────────────┼───┼──────────────────────┼────────────────┼──────────────────────┼─────────────────────┤
│ 2016-09-28 19:27:5…  │ 2025-09-28          │ TRADITIONAL_UAS │ false        │ … │                80203 │ Denver         │ CO                   │               80203 │
│ 2016-10-26 13:10:2…  │ 2022-10-26          │ PURCHASED       │              │ … │                33611 │ Tampa          │ FL                   │               33611 │
│ 2016-10-25 15:58:4…  │ 2022-10-25          │ PURCHASED       │              │ … │                23337 │ Wallops Island │ VA                   │               23337 │
│ 2016-11-30 17:17:1…  │ 2022-11-30          │ PURCHASED       │              │ … │                32114 │ Daytona Beach  │ FL                   │               32114 │
│ 2016-10-25 15:58:4…  │ 2022-10-25          │ PURCHASED       │              │ … │                23337 │ Wallops Island │ VA                   │               23337 │
├──────────────────────┴─────────────────────┴─────────────────┴──────────────┴───┴──────────────────────┴────────────────┴──────────────────────┴─────────────────────┤
│ 5 rows                                                                                                                                          11 columns (8 shown) │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
D
```

That works, so we're going to have to narrow down the problem. _As a side note, I should probably log an enhancement request for more detailed error messages (for example, which file had the error, and which field)._

Looking at the error message there's a data type problem with an `INT64` field (`BIGINT`). In the schema there are two fields with that: 

```
Physical Postal Code
Mailing Postal Code
```

DuckDB's [parquet docs page](https://duckdb.org/docs/data/parquet#parquet-schema) points me to the `parquet_schema` function, so let's have a look at these fields over the files in question: 

```sql
SELECT file_name, name, type, logical_type
  FROM parquet_schema('s3://drones03/main/drone-registrations/Registations-P107-Active-*.parquet')
 WHERE name like '%Postal Code%';
┌──────────────────────────────────────────────────────────────────────────────┬──────────────────────┬────────────┬──────────────┐
│                                  file_name                                   │         name         │    type    │ logical_type │
│                                   varchar                                    │       varchar        │  varchar   │   varchar    │
├──────────────────────────────────────────────────────────────────────────────┼──────────────────────┼────────────┼──────────────┤
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ Physical Postal Code │ INT64      │              │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ Mailing Postal Code  │ INT64      │              │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet │ Physical Postal Code │ BYTE_ARRAY │ StringType() │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet │ Mailing Postal Code  │ BYTE_ARRAY │ StringType() │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2018.parquet │ Physical Postal Code │ BYTE_ARRAY │ StringType() │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2018.parquet │ Mailing Postal Code  │ BYTE_ARRAY │ StringType() │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2019.parquet │ Physical Postal Code │ BYTE_ARRAY │ StringType() │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2019.parquet │ Mailing Postal Code  │ BYTE_ARRAY │ StringType() │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2020.parquet │ Physical Postal Code │ BYTE_ARRAY │ StringType() │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2020.parquet │ Mailing Postal Code  │ BYTE_ARRAY │ StringType() │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │ Physical Postal Code │ BYTE_ARRAY │ StringType() │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │ Mailing Postal Code  │ BYTE_ARRAY │ StringType() │
├──────────────────────────────────────────────────────────────────────────────┴──────────────────────┴────────────┴──────────────┤
│ 12 rows                                                                                                               4 columns │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

So there's the problem; the 2016 file uses `INT64` for those fields whilst the remaining files use a string. The `SELECT` that I ran above against all the files failed because when it tried to apply the schema of the first file against the data read from the others it ended up trying to convert a string to a number, which is never going to end well. 

Here's one way to fix things with a `UNION ALL`. Note the use of `filename` metadata column to help verify the data we're getting is what's expected. To start with let's just try it against two files:  

```sql
SELECT filename, CAST("Physical Postal Code" AS VARCHAR) AS "Physical Postal Code"
  FROM read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet', filename=true)
USING SAMPLE 5 ROWS
UNION  ALL
SELECT filename, "Physical Postal Code"
  FROM read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet', filename=true)
USING SAMPLE 5 ROWS;
```

```
┌──────────────────────────────────────────────────────────────────────────────┬──────────────────────┐
│                                   filename                                   │ Physical Postal Code │
│                                   varchar                                    │       varchar        │
├──────────────────────────────────────────────────────────────────────────────┼──────────────────────┤
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ 80237                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ 35222                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ 36112                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ 87123                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ 35806                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet │ 68179                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet │ 32114                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet │ 93637                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet │ 33611                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet │ 36112                │
├──────────────────────────────────────────────────────────────────────────────┴──────────────────────┤
│ 10 rows                                                                                   2 columns │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Now we just need to specify the remainder of the files. Previously we wildcarded, but we can't include the 2016 file in that (since we're handling that with a `CAST` in the first block of the `UNION`), so we need to modify it. We'll test our new selection pattern first: 

```sql
SELECT filename
  FROM read_parquet(['s3://drones03/main/drone-registrations/Registations-P107-Active-201[7-9].parquet',
                     's3://drones03/main/drone-registrations/Registations-P107-Active-202*.parquet'],
                     filename=true) 
GROUP BY filename;
┌──────────────────────────────────────────────────────────────────────────────┐
│                                   filename                                   │
│                                   varchar                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2018.parquet │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2019.parquet │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2020.parquet │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │
└──────────────────────────────────────────────────────────────────────────────┘
```

Let's test this with the `UNION`: 

```sql
SELECT filename, CAST("Physical Postal Code" AS VARCHAR) AS "Physical Postal Code"
  FROM read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet', filename=true)
USING SAMPLE 5 ROWS
UNION  ALL
SELECT filename, "Physical Postal Code"
  FROM read_parquet(['s3://drones03/main/drone-registrations/Registations-P107-Active-201[7-9].parquet',
                     's3://drones03/main/drone-registrations/Registations-P107-Active-202*.parquet'], filename=true)
USING SAMPLE 5 ROWS;
```

```
┌──────────────────────────────────────────────────────────────────────────────┬──────────────────────┐
│                                   filename                                   │ Physical Postal Code │
│                                   varchar                                    │       varchar        │
├──────────────────────────────────────────────────────────────────────────────┼──────────────────────┤
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ 87123                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ 32114                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ 67301                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ 35806                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │ 32114                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet │ 35806                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │ 98290                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │ 07641                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │ 33133                │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │ 20166                │
├──────────────────────────────────────────────────────────────────────────────┴──────────────────────┤
│ 10 rows                                                                                   2 columns │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Now we can put this all together to do what we were trying to do in the first place; look at a sample of rows from across the set of files - but making allowances for the mismatched datatypes of the schema. 

```sql
WITH x AS (SELECT   "Registration Date",
                    "Registion Expire Dt",
                    "Asset Type",
                    "RID Equipped",
                    "Asset Model",
                    "Physical City",
                    "Physical State/Province",
                    CAST("Physical Postal Code" AS VARCHAR) AS "Physical Postal Code",
                    "Mailing City",
                    "Mailing State/Province",
                    CAST("Mailing Postal Code" AS VARCHAR) AS "Mailing Postal Code",
                    filename
            FROM    read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet', filename=true)
            UNION ALL 
            SELECT *
            FROM   read_parquet  (['s3://drones03/main/drone-registrations/Registations-P107-Active-201[7-9].parquet',
                                   's3://drones03/main/drone-registrations/Registations-P107-Active-202*.parquet'], 
                                   filename=true)
            )
SELECT * FROM x
USING SAMPLE 10 ROWS;
```

```
┌────────────────────────────┬─────────────────────┬─────────────────┬──────────────┬──────────────────┬───────────────┬─────────────────────────┬──────────────────────┬──────────────┬────────────────────────┬─────────────────────┬──────────────────────────────────────────────────────────────────────────────┐
│     Registration Date      │ Registion Expire Dt │   Asset Type    │ RID Equipped │   Asset Model    │ Physical City │ Physical State/Province │ Physical Postal Code │ Mailing City │ Mailing State/Province │ Mailing Postal Code │                                   filename                                   │
│          varchar           │       varchar       │     varchar     │   boolean    │     varchar      │    varchar    │         varchar         │       varchar        │   varchar    │        varchar         │       varchar       │                                   varchar                                    │
├────────────────────────────┼─────────────────────┼─────────────────┼──────────────┼──────────────────┼───────────────┼─────────────────────────┼──────────────────────┼──────────────┼────────────────────────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ 2021-03-24 13:35:06.817000 │ 2024-03-24          │ TRADITIONAL_UAS │ false        │ Phantom 4 Pro V2 │ Minneapolis   │ MN                      │ 55423                │ Minneapolis  │ MN                     │ 55423               │ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │
│ 2021-12-06 12:43:38.265000 │ 2024-12-06          │ TRADITIONAL_UAS │ false        │ Air 2S           │ Wo;;ots       │ CA                      │ 95490                │ Wo;;ots      │ CA                     │ 95490               │ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │
│ 2021-12-11 01:49:20.235000 │ 2024-12-10          │ TRADITIONAL_UAS │ false        │ Mavic Air        │ Rocklin       │ CA                      │ 95677                │ Rocklin      │ CA                     │ 95677               │ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │
│ 2020-06-01 12:43:09.114000 │ 2023-06-01          │ PURCHASED       │              │ Mavic 2 Air      │ Loveland      │ CO                      │ 80538                │ Loveland     │ CO                     │ 80538               │ s3://drones03/main/drone-registrations/Registations-P107-Active-2020.parquet │
│ 2021-10-19 22:03:03.630000 │ 2024-10-19          │ HOMEBUILT_UAS   │ false        │ X1               │ Philadelphia  │ PA                      │ 19146                │ Philadelphia │ PA                     │ 19146               │ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │
│ 2020-12-31 00:59:16.326000 │ 2023-12-30          │ PURCHASED       │              │ SP7100           │ Cornelius     │ OR                      │ 97113                │ Cornelius    │ OR                     │ 97113               │ s3://drones03/main/drone-registrations/Registations-P107-Active-2020.parquet │
│ 2020-10-14 18:31:39.662000 │ 2023-10-14          │ PURCHASED       │              │ Phantom Rtk 4    │ San Antonio   │ TX                      │ 78216                │ San Antonio  │ TX                     │ 78216               │ s3://drones03/main/drone-registrations/Registations-P107-Active-2020.parquet │
│ 2019-05-14 23:10:35.507000 │ 2025-05-14          │ TRADITIONAL_UAS │ false        │ Mavic Pro 2      │ Greensboro    │ NC                      │ 27409                │ Greensboro   │ NC                     │ 27409               │ s3://drones03/main/drone-registrations/Registations-P107-Active-2019.parquet │
│ 2019-05-29 14:50:18.922000 │ 2025-05-29          │ TRADITIONAL_UAS │ false        │ Phantom 4 Pro    │ Brighton      │ CO                      │ 80601                │ Brighton     │ CO                     │ 80601               │ s3://drones03/main/drone-registrations/Registations-P107-Active-2019.parquet │
│ 2021-02-06 14:56:38.651000 │ 2024-02-06          │ PURCHASED       │              │ Mavic 2 Pro      │ Louisville    │ KY                      │ 40204                │ Louisville   │ KY                     │ 40204               │ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │
├────────────────────────────┴─────────────────────┴─────────────────┴──────────────┴──────────────────┴───────────────┴─────────────────────────┴──────────────────────┴──────────────┴────────────────────────┴─────────────────────┴──────────────────────────────────────────────────────────────────────────────┤
│ 10 rows                                                                                                                                                                                                                                                                                                 12 columns │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

This looks good, but we should check we're getting data from all files. We'll do that with a `COUNT` aggregate against the CTE: 

{{< highlight sql "hl_lines=20-26" >}}
WITH x AS (SELECT   "Registration Date",
                    "Registion Expire Dt",
                    "Asset Type",
                    "RID Equipped",
                    "Asset Model",
                    "Physical City",
                    "Physical State/Province",
                    CAST("Physical Postal Code" AS VARCHAR) AS "Physical Postal Code",
                    "Mailing City",
                    "Mailing State/Province",
                    CAST("Mailing Postal Code" AS VARCHAR) AS "Mailing Postal Code",
                    filename
            FROM    read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet', filename=true)
            UNION ALL 
            SELECT *
            FROM   read_parquet  (['s3://drones03/main/drone-registrations/Registations-P107-Active-201[7-9].parquet',
                                   's3://drones03/main/drone-registrations/Registations-P107-Active-202*.parquet'], 
                                   filename=true)
            )
SELECT filename, COUNT(*) 
FROM x 
GROUP BY filename
ORDER BY filename;
{{< / highlight >}}

```
┌──────────────────────────────────────────────────────────────────────────────┬──────────────┐
│                                   filename                                   │ count_star() │
│                                   varchar                                    │    int64     │
├──────────────────────────────────────────────────────────────────────────────┼──────────────┤
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet │         1280 │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2017.parquet │         5819 │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2018.parquet │        24695 │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2019.parquet │        60105 │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2020.parquet │       143670 │
│ s3://drones03/main/drone-registrations/Registations-P107-Active-2021.parquet │       162826 │
└──────────────────────────────────────────────────────────────────────────────┴──────────────┘
```

Looks good to me! 

For a finishing touch we could even wrap it in a `VIEW`: 

{{< highlight sql "hl_lines=1" >}}
CREATE OR REPLACE VIEW Registations_P107_Active AS
WITH x AS (SELECT   "Registration Date",
                    "Registion Expire Dt",
                    "Asset Type",
                    "RID Equipped",
                    "Asset Model",
                    "Physical City",
                    "Physical State/Province",
                    CAST("Physical Postal Code" AS VARCHAR) AS "Physical Postal Code",
                    "Mailing City",
                    "Mailing State/Province",
                    CAST("Mailing Postal Code" AS VARCHAR) AS "Mailing Postal Code",
                    filename
            FROM    read_parquet('s3://drones03/main/drone-registrations/Registations-P107-Active-2016.parquet', filename=true)
            UNION ALL 
            SELECT *
            FROM   read_parquet  (['s3://drones03/main/drone-registrations/Registations-P107-Active-201[7-9].parquet',
                                   's3://drones03/main/drone-registrations/Registations-P107-Active-202*.parquet'], 
                                   filename=true)
            )
SELECT * FROM x;
{{< / highlight>}}

Which then can be used the same as above like this:

```sql
SELECT filename, COUNT(*) 
FROM Registations_P107_Active
GROUP BY filename;
```

[^1]: _DID YOU KNOW…you can work with Parquet files in lakeFS directly from DuckDB? I didn't until I read [this doc](https://docs.lakefs.io/integrations/duckdb.html)_ :) 
