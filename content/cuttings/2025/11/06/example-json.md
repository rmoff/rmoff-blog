---
title: "example.json"
date: 2025-11-06T11:55:52Z
link: "https://gist.github.com/rmoff/38aff14bfe070b7b37dbb7033c75e7cb"
domain: gist.github.com
author: "262588213843476"
---
duckDB question - is there a smart way to expose all the `value` string fields without manually unpacking them by name?

e.g. this is tedious:

SELECT value.animalName.string, value.deviceID.string

Sample record
