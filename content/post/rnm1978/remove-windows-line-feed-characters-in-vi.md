---
title: "Remove windows line feed characters in vi"
date: "2009-03-27"
categories: 
  - "unix"
---

If you work with a file in Windows and Unix at some point you might end up with windows line feed characters in your Unix file. It'll look like this:

  

> one line of text ^M  
> next line ^M  
> and next line with more ^M

To remove the ^M character, load the file into vi on unix and enter as a line command the following:  

> :1,$s/^M//

but instead of typing ^M do Ctrl-V Ctrl-M to get the charaters  
  
Alternatively, load the file in Windows into [Notepad++](http://notepad-plus.sourceforge.net/) and use Format -> Convert to UNIX format, then FTP the file back to Unix
