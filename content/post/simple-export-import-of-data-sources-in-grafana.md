+++
author = "Robin Moffatt"
categories = ["curl", "grafana", "bash", "jq"]
date = 2017-08-08T19:32:00Z
description = ""
draft = false
image = "/images/2017/08/Grafana_-_Click_Stream_Analysis_--.png"
slug = "simple-export-import-of-data-sources-in-grafana"
tags = ["curl", "grafana", "bash", "jq"]
title = "Simple export/import of Data Sources in Grafana"

+++

[Grafana API Reference](http://docs.grafana.org/http_api/data_source/)

### Export all Grafana data sources to data_sources folder

    mkdir -p data_sources && curl -s "http://localhost:3000/api/datasources"  -u admin:admin|jq -c -M '.[]'|split -l 1 - data_sources/

This exports each data source to a separate JSON file in the `data_sources` folder.
	
### Load data sources back in from folder

This submits every file that exists in the `data_sources` folder to Grafana as a new data source definition.

	for i in data_sources/*; do \
		curl -X "POST" "http://localhost:3000/api/datasources" \
	    -H "Content-Type: application/json" \
	     --user admin:admin \
	     --data-binary @$i
	done
