---
title: "When is a bug not a bug? When it's a \"design decision\""
date: "2010-10-18"
categories: 
  - "informatica"
  - "obia"
  - "rant"
  - "support"
---

[Last month I wrote about a problem](/post/rnm1978/misbehaving-informatica-kills-oracle/) that Informatica as part of OBIA was causing us, wherein an expired database account would bring Oracle down by virtue of multiple connections from Informatica.

I raised an SR with Oracle (under OBIA support), who after some back-and-forth with Informatica, were told:

> _**This is not a bug. That the two error messages coming back from Oracle are handled differently is the result of a design decision and as such not a product fault.**_

Is "design decision" the new "undocumented feature" ?
