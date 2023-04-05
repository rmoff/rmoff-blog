---
draft: false
title: 'Using Delta from pySpark - `java.lang.ClassNotFoundException: delta.DefaultSource`'
date: "2023-04-05T15:51:41Z"
image: "/images/2023/04/h_IMG_7944.jpeg"
thumbnail: "/images/2023/04/t_IMG_2117.jpeg"
credit: "https://twitter.com/rmoff/"
categories:
- PySpark
- Delta Lake
---

No great insights in this post, just something for folk who Google this error after me and don't want to waste three hours chasing their tails… 😄

<!--more-->

I wanted to use Delta Lake with [PySpark](https://spark.apache.org/docs/latest/api/python/) from within a Jupyter Notebook. Easy, right? Not if you're like me and perhaps are new to it and rely on copy and paste of snippets you find across the internet to start with. 

Whatever I tried, I kept hitting this error: 

```
Py4JJavaError: An error occurred while calling o45.save.
: java.lang.ClassNotFoundException: 
Failed to find data source: delta.
```

**In short, the problem was that I was creating both a `SparkSession` *and* a `SparkContext`**. I honestly don't understand enough about Spark to tell you why this causes the error, but through a lot of painful trial and error I can tell you that it does. _Someone more knowledgable than me can perhaps tell me ([email](mailto:robin@rmoff.net) / [twitter](https://twitter.com/rmoff/) / [mastodon](https://data-folks.masto.host/@rmoff)) why this is and if what I've ended up with is the right code_. 

Here're the salient points of the Jupyter notebook: 

## Versions and stuff

```python
import sys
print("Kernel:", sys.executable)
print("Python version:", sys.version)

import pyspark
print("PySpark version:", pyspark.__version__)

```

    Kernel: /opt/conda/bin/python
    Python version: 3.9.7 | packaged by conda-forge | (default, Oct 10 2021, 15:08:54)
    [GCC 9.4.0]
    PySpark version: 3.2.0

## This worked

### Initialise Spark with Delta Lake config


```python
from pyspark.context import SparkContext
from pyspark import SparkFiles
from pyspark.sql.session import SparkSession
spark = (
    SparkSession.builder.master("local[*]")
    .config("spark.jars.packages", "io.delta:delta-core_2.12:2.0.0")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .config("spark.delta.logStore.class", "org.apache.spark.sql.delta.storage.S3SingleDriverLogStore")
    .getOrCreate()
)
```

### Test delta


```python
data = spark.range(0, 5)
data.write.format("delta").save("/tmp/delta-table2")
```


```python
df = spark.read.format("delta").load("/tmp/delta-table2")
df.show()
```

    +---+
    | id|
    +---+
    |  2|
    |  1|
    |  4|
    |  3|
    |  0|
    +---+

## This didn't work

### Initialise Spark with Delta Lake config

(notice line 5 sets the `SparkContext`, unlike the example above)

```python
from pyspark.context import SparkContext
from pyspark import SparkFiles
from pyspark.sql.session import SparkSession

sc = SparkContext('local[*]')

spark = (
    SparkSession.builder.master("local[*]")
    .config("spark.jars.packages", "io.delta:delta-core_2.12:2.0.0")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .config("spark.delta.logStore.class", "org.apache.spark.sql.delta.storage.S3SingleDriverLogStore")
    .getOrCreate()
)        
```

### Test delta


```python
data = spark.range(0, 5)
data.write.format("delta").save("/tmp/delta-table")
```


    ---------------------------------------------------------------------------

    Py4JJavaError                             Traceback (most recent call last)

    /tmp/ipykernel_983/939553335.py in <module>
          1 data = spark.range(0, 5)
    ----> 2 data.write.format("delta").save("/tmp/delta-table")
    

    /usr/local/spark/python/pyspark/sql/readwriter.py in save(self, path, format, mode, partitionBy, **options)
        738             self._jwrite.save()
        739         else:
    --> 740             self._jwrite.save(path)
        741 
        742     @since(1.4)


    /usr/local/spark/python/lib/py4j-0.10.9.2-src.zip/py4j/java_gateway.py in __call__(self, *args)
       1307 
       1308         answer = self.gateway_client.send_command(command)
    -> 1309         return_value = get_return_value(
       1310             answer, self.gateway_client, self.target_id, self.name)
       1311 


    /usr/local/spark/python/pyspark/sql/utils.py in deco(*a, **kw)
        109     def deco(*a, **kw):
        110         try:
    --> 111             return f(*a, **kw)
        112         except py4j.protocol.Py4JJavaError as e:
        113             converted = convert_exception(e.java_exception)


    /usr/local/spark/python/lib/py4j-0.10.9.2-src.zip/py4j/protocol.py in get_return_value(answer, gateway_client, target_id, name)
        324             value = OUTPUT_CONVERTER[type](answer[2:], gateway_client)
        325             if answer[1] == REFERENCE_TYPE:
    --> 326                 raise Py4JJavaError(
        327                     "An error occurred while calling {0}{1}{2}.\n".
        328                     format(target_id, ".", name), value)


    Py4JJavaError: An error occurred while calling o45.save.
    : java.lang.ClassNotFoundException: 
    Failed to find data source: delta. Please find packages at
    http://spark.apache.org/third-party-projects.html
           
    	at org.apache.spark.sql.errors.QueryExecutionErrors$.failedToFindDataSourceError(QueryExecutionErrors.scala:443)
    	at org.apache.spark.sql.execution.datasources.DataSource$.lookupDataSource(DataSource.scala:670)
    	at org.apache.spark.sql.execution.datasources.DataSource$.lookupDataSourceV2(DataSource.scala:720)
    	at org.apache.spark.sql.DataFrameWriter.lookupV2Provider(DataFrameWriter.scala:852)
    	at org.apache.spark.sql.DataFrameWriter.saveInternal(DataFrameWriter.scala:256)
    	at org.apache.spark.sql.DataFrameWriter.save(DataFrameWriter.scala:239)
    	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
    	at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
    	at java.base/java.lang.reflect.Method.invoke(Method.java:566)
    	at py4j.reflection.MethodInvoker.invoke(MethodInvoker.java:244)
    	at py4j.reflection.ReflectionEngine.invoke(ReflectionEngine.java:357)
    	at py4j.Gateway.invoke(Gateway.java:282)
    	at py4j.commands.AbstractCommand.invokeMethod(AbstractCommand.java:132)
    	at py4j.commands.CallCommand.execute(CallCommand.java:79)
    	at py4j.ClientServerConnection.waitForCommands(ClientServerConnection.java:182)
    	at py4j.ClientServerConnection.run(ClientServerConnection.java:106)
    	at java.base/java.lang.Thread.run(Thread.java:829)
    Caused by: java.lang.ClassNotFoundException: delta.DefaultSource
    	at java.base/java.net.URLClassLoader.findClass(URLClassLoader.java:476)
    	at java.base/java.lang.ClassLoader.loadClass(ClassLoader.java:589)
    	at java.base/java.lang.ClassLoader.loadClass(ClassLoader.java:522)
    	at org.apache.spark.sql.execution.datasources.DataSource$.$anonfun$lookupDataSource$5(DataSource.scala:656)
    	at scala.util.Try$.apply(Try.scala:213)
    	at org.apache.spark.sql.execution.datasources.DataSource$.$anonfun$lookupDataSource$4(DataSource.scala:656)
    	at scala.util.Failure.orElse(Try.scala:224)
    	at org.apache.spark.sql.execution.datasources.DataSource$.lookupDataSource(DataSource.scala:656)
    	... 16 more

## Notebook Log 

I did notice in the notebook that in the version I ran without setting `SparkContext` the Delta library was downloaded: 

```
WARNING: An illegal reflective access operation has occurred
WARNING: Illegal reflective access by org.apache.spark.unsafe.Platform (file:/usr/local/spark-3.2.0-bin-hadoop3.2/jars/spark-unsafe_2.12-3.2.0.jar) to constructor java.nio.DirectByteBuffer(long,int)
WARNING: Please consider reporting this to the maintainers of org.apache.spark.unsafe.Platform
WARNING: Use --illegal-access=warn to enable warnings of further illegal reflective access operations
WARNING: All illegal access operations will be denied in a future release
:: loading settings :: url = jar:file:/usr/local/spark-3.2.0-bin-hadoop3.2/jars/ivy-2.5.0.jar!/org/apache/ivy/core/settings/ivysettings.xml
Ivy Default Cache set to: /home/jovyan/.ivy2/cache
The jars for the packages stored in: /home/jovyan/.ivy2/jars
io.delta#delta-core_2.12 added as a dependency
:: resolving dependencies :: org.apache.spark#spark-submit-parent-86ca6813-f39f-472c-b6a2-dfe988ab0404;1.0
    confs: [default]
    found io.delta#delta-core_2.12;2.0.0 in central
    found io.delta#delta-storage;2.0.0 in central
    found org.antlr#antlr4-runtime;4.8 in central
    found org.codehaus.jackson#jackson-core-asl;1.9.13 in central
:: resolution report :: resolve 94ms :: artifacts dl 4ms
    :: modules in use:
    io.delta#delta-core_2.12;2.0.0 from central in [default]
    io.delta#delta-storage;2.0.0 from central in [default]
    org.antlr#antlr4-runtime;4.8 from central in [default]
    org.codehaus.jackson#jackson-core-asl;1.9.13 from central in [default]
    ---------------------------------------------------------------------
    |                  |            modules            ||   artifacts   |
    |       conf       | number| search|dwnlded|evicted|| number|dwnlded|
    ---------------------------------------------------------------------
    |      default     |   4   |   0   |   0   |   0   ||   4   |   0   |
    ---------------------------------------------------------------------
:: retrieving :: org.apache.spark#spark-submit-parent-86ca6813-f39f-472c-b6a2-dfe988ab0404
    confs: [default]
    0 artifacts copied, 4 already retrieved (0kB/3ms)
23/04/05 16:29:30 WARN NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
Using Spark's default log4j profile: org/apache/spark/log4j-defaults.properties
Setting default log level to "WARN".
To adjust logging level use sc.setLogLevel(newLevel). For SparkR, use setLogLevel(newLevel).
```

whilst the version that did set `SparkContext` didn't. 

```
WARNING: An illegal reflective access operation has occurred
WARNING: Illegal reflective access by org.apache.spark.unsafe.Platform (file:/usr/local/spark-3.2.0-bin-hadoop3.2/jars/spark-unsafe_2.12-3.2.0.jar) to constructor java.nio.DirectByteBuffer(long,int)
WARNING: Please consider reporting this to the maintainers of org.apache.spark.unsafe.Platform
WARNING: Use --illegal-access=warn to enable warnings of further illegal reflective access operations
WARNING: All illegal access operations will be denied in a future release
Using Spark's default log4j profile: org/apache/spark/log4j-defaults.properties
Setting default log level to "WARN".
To adjust logging level use sc.setLogLevel(newLevel). For SparkR, use setLogLevel(newLevel).
23/04/05 16:30:36 WARN NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
23/04/05 16:30:36 WARN Utils: Service 'SparkUI' could not bind on port 4040. Attempting port 4041.
```