+++
author = "Robin Moffatt"
categories = ["kibana", "timelion", "holt"]
date = 2017-01-18T19:53:10Z
description = ""
draft = false
slug = "kibana-timelion-anomaly-detection"
tag = ["kibana", "timelion", "holt"]
title = "Kibana Timelion - Anomaly Detection"

+++

Using the `holt` function in Timelion to do anomaly detection on Metricbeat data in Kibana: 

![](/content/images/2017/01/holt_-_Timelion_-_Kibana.png)

Expression: 

    $thres=0.02, .es(index='metricbeat*',metric='max:system.cpu.user.pct').lines(1).if(eq, 0, null).holt(0.9, 0.1, 0.9, 0.5h).color(#eee).lines(10).label('Prediction'), .es(index='metricbeat*',metric='max:system.cpu.user.pct').color(#666).lines(1).label(Actual), .es(index='metricbeat*',metric='max:system.cpu.user.pct').lines(1).if(eq, 0, null).holt(0.9, 0.1, 0.9, 0.5h).subtract(.es(index='metricbeat*',metric='max:system.cpu.user.pct')).abs().if(lt, $thres, null, .es(index='metricbeat*',metric='max:system.cpu.user.pct')).points(10,3,0).color(#c66).label('Anomaly').title('max:system.cpu.user.pct / @rmoff')

References:

* https://twitter.com/rashidkpc/status/762754396111327232
* https://github.com/elastic/timelion/issues/87
* https://github.com/elastic/timelion/blob/master/FUNCTIONS.md
