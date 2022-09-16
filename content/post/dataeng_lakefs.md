---
draft: false
title: 'Data Engineering in 2022: Exploring LakeFS with Jupyter and PySpark'
date: "2022-09-16T08:54:45Z"
# image: "/images/2022/09/h_IMG_8389.jpeg"
# thumbnail: "/images/2022/09/t_IMG_5037.jpeg"
credit: "https://twitter.com/rmoff/"
categories:
- Data Engineering
- LakeFS
- PySpark
---

With my [foray](/2022/09/14/stretching-my-legs-in-the-data-engineering-ecosystem-in-2022/) into the current world of data engineering I wanted to get my hands dirty with some of the tools and technologies I'd been reading about. The vehicle for this was trying to understand more about LakeFS, but along the way dabbling with PySpark and S3 (MinIO) too. 

I'd forgotten how amazingly useful notebooks are. It's [six years since I wrote about them last](https://www.rittmanmead.com/blog/2016/12/etl-offload-with-spark-and-amazon-emr-part-2-code-development-with-notebooks-and-docker/) (and the last time I tried my hand at PySpark). This blog is basically the notebook, with some more annotations. 


<!--more-->


If you want to run it yourself you can [download the notebook](/images/2022/09/lakefs.ipynb) and run it on the [Everything Bagel](https://github.com/treeverse/lakeFS/tree/master/deployments/compose) Docker Compose environment from LakeFS. 

## tl;dr

With LakeFS you can branch and merge your data just as you would with your code. You can work on a copy of your main dataset to test new code without worrying about overwriting it. You can test destructive changes without committing them until you're sure they work. 

See more thoughts on it [here](/2022/09/14/data-engineering-in-2022-storage-and-access/#_git_for_data_with_lakefs).

## Overview

I wanted to understand and see for myself how LakeFS brings the concept of git to data, and what it looks like in practice. 

I start off with a `main` branch and write some data to it (as a Parquet file). 

From there I create two branches, in which I 

* Add some more rows of data
* Delete some columns from the existing data

Along the way I compare how LakeFS reports the files (acting as a S3 proxy), and what's happening in the actual S3 storage underneath. The latter's interesting because LakeFS does "copy on write", whereby data's not duplicated until it needs to be written (i.e. when, and only when, it changes). This CoW approach is great for storage efficiency, and a solid reason why you'd be looking at something like LakeFS instead of simply actually duplicating data on S3 when you want to test something. 

## Set up connections

### S3

_Connection is configured [here](https://github.com/treeverse/lakeFS/blob/master/deployments/compose/etc/hive-site.xml#L51-L62)_


```python
import boto3

s3 = boto3.resource('s3',
                  endpoint_url='http://minio:9000/',
                  aws_access_key_id='minioadmin',
                  aws_secret_access_key='minioadmin')
```

### LakeFS


```python
import lakefs_client
from lakefs_client import models
from lakefs_client.client import LakeFSClient
from lakefs_client.api import branches_api
from lakefs_client.api import commits_api

# lakeFS credentials and endpoint
configuration = lakefs_client.Configuration()
configuration.username = 'AKIAIOSFODNN7EXAMPLE'
configuration.password = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
configuration.host = 'http://lakefs:8000'

client = LakeFSClient(configuration)
api_client = lakefs_client.ApiClient(configuration)
```

### Spark


```python
from pyspark.context import SparkContext
from pyspark import SparkFiles
from pyspark.sql.session import SparkSession
sc = SparkContext('local')
spark = SparkSession(sc)
```


#### List the current branches in the repository

https://pydocs.lakefs.io/docs/BranchesApi.html#list_branches


```python
repo='example'
```


```python
for b in client.branches.list_branches(repo).results:
    display(b.id)
```


    'main'

## Load and write some data to the main branch

To start with we take a random parquet data file that I found on github, load it, and write it to S3 on the main branch of the repository. 

```python
url='https://github.com/Teradata/kylo/blob/master/samples/sample-data/parquet/userdata1.parquet?raw=true'
sc.addFile(url)
df = spark.read.parquet("file://" + SparkFiles.get("userdata1.parquet"))
```

Inspect the data: 


```python
display(df.count())
```


    1000


What does the data look like?


```python
df.show(n=1,vertical=True)
```

    -RECORD 0--------------------------------
     registration_dttm | 2016-02-03 07:55:29 
     id                | 1                   
     first_name        | Amanda              
     last_name         | Jordan              
     email             | ajordan0@com.com    
     gender            | Female              
     ip_address        | 1.197.201.2         
     cc                | 6759521864920116    
     country           | Indonesia           
     birthdate         | 3/8/1971            
     salary            | 49756.53            
     title             | Internal Auditor    
     comments          | 1E+02               
    only showing top 1 row
    

### Write data to S3

```python
branch='main'
```


```python
df.write.mode('overwrite').parquet('s3a://'+repo+'/'+branch+'/demo/users')
```

## Exploring LakeFS

Let's see how LakeFS handles and see the file that we've just written, and then how to commit it to the branch. 

### The data as seen from LakeFS

https://pydocs.lakefs.io/docs/ObjectsApi.html#list_objects

Note the `physical_address` and its match in the S3 output in the next step


```python
client.objects.list_objects(repo,branch).results
```




    [{'checksum': 'd41d8cd98f00b204e9800998ecf8427e',
      'content_type': 'application/octet-stream',
      'mtime': 1663316305,
      'path': 'demo/users/_SUCCESS',
      'path_type': 'object',
      'physical_address': 's3://example/5e91c0a09d3a4415abd33bc460662e18',
      'size_bytes': 0},
     {'checksum': 'addfab49d691a5d4a18ae0b127a792a0',
      'content_type': 'application/octet-stream',
      'mtime': 1663316304,
      'path': 'demo/users/part-00000-142e4126-aaec-477c-bbcf-c1dd68011369-c000.snappy.parquet',
      'path_type': 'object',
      'physical_address': 's3://example/2895bba44b5b4f5199bf58d80144a9de',
      'size_bytes': 78869}]



### The data as seen from S3


```python
for o in s3.Bucket(repo).objects.all():
    print(o.last_modified, o.key, o.size)
```

    2022-09-16 08:18:24.769000+00:00 1984e4e69777452fb03800bd4c6b1b05 0
    2022-09-16 08:18:23.607000+00:00 2895bba44b5b4f5199bf58d80144a9de 78869
    2022-09-16 08:18:22.900000+00:00 49ad588d52b942c9b682f271f228cb9c 0
    2022-09-16 08:18:25.034000+00:00 5e91c0a09d3a4415abd33bc460662e18 0
    2022-09-16 08:18:24.277000+00:00 c4cae27b7c0a46beb14f79347d77c29d 0
    2022-09-16 08:17:18.615000+00:00 dummy 70


### List diff of branch in LakeFS (this is kinda like a `git status`)

https://pydocs.lakefs.io/docs/BranchesApi.html#diff_branch

_Note that the files show **`'type': 'added'`**_


```python
api_instance = branches_api.BranchesApi(api_client)

api_response = api_instance.diff_branch(repo, branch)
if api_response.pagination.results==0:
    display("Nothing to commit")
else:
    for r in api_response.results:
        display(r)
```


    {'path': 'demo/users/_SUCCESS',
     'path_type': 'object',
     'size_bytes': 78869,
     'type': 'added'}



    {'path': 'demo/users/part-00000-142e4126-aaec-477c-bbcf-c1dd68011369-c000.snappy.parquet',
     'path_type': 'object',
     'size_bytes': 78869,
     'type': 'added'}


### Commit the new file in `main`

https://pydocs.lakefs.io/docs/CommitsApi.html#commit


```python
from lakefs_client.api import commits_api
from lakefs_client.model.commit import Commit
from lakefs_client.model.commit_creation import CommitCreation

api_instance = commits_api.CommitsApi(api_client)
commit_creation = CommitCreation(
    message="Everything Bagel - commit users data (original)",
    metadata={
        "foo": "bar",
    }
) 

api_instance.commit(repo, branch, commit_creation)
```




    {'committer': 'docker',
     'creation_date': 1663316414,
     'id': 'de2ae0f24961f65bf7b525d983b3dbc869ce49a0dea43529920743154ce0ddd0',
     'message': 'Everything Bagel - commit users data (original)',
     'meta_range_id': '',
     'metadata': {'foo': 'bar'},
     'parents': ['a3bfc3317b697cb671665ea44b05b4009a06404c95c56a705fe638a824f1c04e']}



### List branch status again - nothing returned means that there is nothing uncommitted


```python
api_instance = branches_api.BranchesApi(api_client)

api_response = api_instance.diff_branch(repo, branch)
if api_response.pagination.results==0:
    display("Nothing to commit")
else:
    for r in api_response.results:
        display(r)
```


    'Nothing to commit'


_Similar to a `git status` showing `Your branch is up to date with 'main'` / `nothing to commit, working tree clean`_

## Branching to test new code

Now that we've got our main branch set up, let's explore what we can do with. Imagine we have a couple of things that we're working on and want to try out without touching the main dataset (at least until we know that they work). 

First we'll test adding new data, and create a branch on which to try it. 

https://pydocs.lakefs.io/docs/BranchesApi.html#create_branch

Note that at this point there's no additional object created on the object store


```python
branch='add_more_user_data'
```


```python
from lakefs_client.model.branch_creation import BranchCreation

api_instance = branches_api.BranchesApi(api_client)
branch_creation = BranchCreation(
    name=branch,
    source="main",
) 

api_response = api_instance.create_branch(repo, branch_creation)
display(api_response)
```


    'de2ae0f24961f65bf7b525d983b3dbc869ce49a0dea43529920743154ce0ddd0'


### List the current branches in the `example` repository

https://pydocs.lakefs.io/docs/BranchesApi.html#list_branches


```python
for b in client.branches.list_branches(repo).results:
    display(b.id)
```


    'add_more_user_data'
    'main'


### Read the existing data

Note that we're reading from the new branch, and see the data that was committed to `main`. 

```python
xform_df = spark.read.parquet('s3a://'+repo+'/'+branch+'/demo/users')
```

How many rows of data?


```python
display(xform_df.count())
```


    1000


What does the data look like?


```python
xform_df.show(n=1,vertical=True)
```

    -RECORD 0--------------------------------
     registration_dttm | 2016-02-03 07:55:29 
     id                | 1                   
     first_name        | Amanda              
     last_name         | Jordan              
     email             | ajordan0@com.com    
     gender            | Female              
     ip_address        | 1.197.201.2         
     cc                | 6759521864920116    
     country           | Indonesia           
     birthdate         | 3/8/1971            
     salary            | 49756.53            
     title             | Internal Auditor    
     comments          | 1E+02               
    only showing top 1 row
    

### Add some new data

We'll download another file from the same source as originally. It's `userdata2` this time, instead of the `userdata1` used above. 

```python
url='https://github.com/Teradata/kylo/blob/master/samples/sample-data/parquet/userdata2.parquet?raw=true'
sc.addFile(url)
df = spark.read.parquet("file://" + SparkFiles.get("userdata2.parquet"))
```

Look at the new data: 

```python
df.show(n=1,vertical=True)
```

    -RECORD 0---------------------------------
     registration_dttm | 2016-02-03 13:36:39  
     id                | 1                    
     first_name        | Donald               
     last_name         | Lewis                
     email             | dlewis0@clickbank... 
     gender            | Male                 
     ip_address        | 102.22.124.20        
     cc                |                      
     country           | Indonesia            
     birthdate         | 7/9/1972             
     salary            | 140249.37            
     title             | Senior Financial ... 
     comments          |                      
    only showing top 1 row
    
### Write the data (to the branch) and commit it

```python
df.write.mode('append').parquet('s3a://'+repo+'/'+branch+'/demo/users')
```

LakeFS sees that there is an uncommited change


```python
api_instance = branches_api.BranchesApi(api_client)

api_response = api_instance.diff_branch(repo, branch)
if api_response.pagination.results==0:
    display("Nothing to commit")
else:
    for r in api_response.results:
        display(r)
```


    {'path': 'demo/users/part-00000-b90910aa-58a0-42af-84ec-8ec557c56850-c000.snappy.parquet',
     'path_type': 'object',
     'size_bytes': 78729,
     'type': 'added'}


Commit it


```python
from lakefs_client.api import commits_api
from lakefs_client.model.commit import Commit
from lakefs_client.model.commit_creation import CommitCreation

api_instance = commits_api.CommitsApi(api_client)
commit_creation = CommitCreation(
    message="Everything Bagel - add more user data",
    metadata={
        "foo": "bar",
    }
) 

api_instance.commit(repo, branch, commit_creation)
```




    {'committer': 'docker',
     'creation_date': 1663316722,
     'id': '9d7f809d1733ee0f48d89fd6d5d1d915aaf79200e10f26e997db1437b3414794',
     'message': 'Everything Bagel - add more user data',
     'meta_range_id': '',
     'metadata': {'foo': 'bar'},
     'parents': ['de2ae0f24961f65bf7b525d983b3dbc869ce49a0dea43529920743154ce0ddd0']}



## Status check: how's the data look from each branch? 

Let's re-read the `main` and `add_more_user_data` branches and count the rows in each

Original branch (`main`):


```python
add_more_user_data = spark.read.parquet('s3a://'+repo+'/main/demo/users')
display(add_more_user_data.count())
```


    1000


New branch (`add_more_user_data`):


```python
add_more_user_data = spark.read.parquet('s3a://'+repo+'/add_more_user_data/demo/users')
display(add_more_user_data.count())
```


    2000


### Look at the view in LakeFS

#### `main`


```python
client.objects.list_objects(repo,'main').results
```




    [{'checksum': 'd41d8cd98f00b204e9800998ecf8427e',
      'content_type': 'application/octet-stream',
      'mtime': 1663316305,
      'path': 'demo/users/_SUCCESS',
      'path_type': 'object',
      'physical_address': 's3://example/5e91c0a09d3a4415abd33bc460662e18',
      'size_bytes': 0},
     {'checksum': 'addfab49d691a5d4a18ae0b127a792a0',
      'content_type': 'application/octet-stream',
      'mtime': 1663316304,
      'path': 'demo/users/part-00000-142e4126-aaec-477c-bbcf-c1dd68011369-c000.snappy.parquet',
      'path_type': 'object',
      'physical_address': 's3://example/2895bba44b5b4f5199bf58d80144a9de',
      'size_bytes': 78869}]



#### `add_more_user_data`


```python
client.objects.list_objects(repo,'add_more_user_data').results
```




    [{'checksum': 'd41d8cd98f00b204e9800998ecf8427e',
      'content_type': 'application/octet-stream',
      'mtime': 1663316556,
      'path': 'demo/users/_SUCCESS',
      'path_type': 'object',
      'physical_address': 's3://example/8acafaeee021459ba6cc29cfb35bb06b',
      'size_bytes': 0},
     {'checksum': 'addfab49d691a5d4a18ae0b127a792a0',
      'content_type': 'application/octet-stream',
      'mtime': 1663316304,
      'path': 'demo/users/part-00000-142e4126-aaec-477c-bbcf-c1dd68011369-c000.snappy.parquet',
      'path_type': 'object',
      'physical_address': 's3://example/2895bba44b5b4f5199bf58d80144a9de',
      'size_bytes': 78869},
     {'checksum': '90bee97b5d4bf0675f2684664e5993dc',
      'content_type': 'application/octet-stream',
      'mtime': 1663316555,
      'path': 'demo/users/part-00000-b90910aa-58a0-42af-84ec-8ec557c56850-c000.snappy.parquet',
      'path_type': 'object',
      'physical_address': 's3://example/ece3333dd6bd4d6d9ffab3d53fd4e6b2',
      'size_bytes': 78729}]



### The data as seen from S3

Note that there are just two 78k files; there is no duplication of data shared by branches.


```python
for o in s3.Bucket(repo).objects.all():
    print(o.last_modified, o.key, o.size)
```

    2022-09-16 08:18:24.769000+00:00 1984e4e69777452fb03800bd4c6b1b05 0
    2022-09-16 08:18:23.607000+00:00 2895bba44b5b4f5199bf58d80144a9de 78869
    2022-09-16 08:22:35.628000+00:00 31d780e5af4140e895a7c3779fac985d 0
    2022-09-16 08:22:36.105000+00:00 3aec1fd8560f43aaa8667d0b2d3a70be 0
    2022-09-16 08:18:22.900000+00:00 49ad588d52b942c9b682f271f228cb9c 0
    2022-09-16 08:18:25.034000+00:00 5e91c0a09d3a4415abd33bc460662e18 0
    2022-09-16 08:22:36.360000+00:00 8acafaeee021459ba6cc29cfb35bb06b 0
    2022-09-16 08:25:22.454000+00:00 _lakefs/1ddeab3bef4929b69d52e44b94048f47fe17269821ccdf3ba6701c43d691fb34 1239
    2022-09-16 08:20:14.890000+00:00 _lakefs/6f2ea862d75cb1a2cdb4a3a76969c2bb134c51538c74c0d144b781ed12165b83 1390
    2022-09-16 08:20:14.903000+00:00 _lakefs/ae52ce4551b3d0fd1eb49a8568f4a65db007f222953dd2770d55e0f13c4aaeb9 1239
    2022-09-16 08:25:22.447000+00:00 _lakefs/dedf8f514dcf0bb4184e9ebd55ceddcfafc9fb9fd02888566a0ad2052cfb7c12 1609
    2022-09-16 08:22:34.689000+00:00 b3cf0d04badd411da874a6448eead32f 0
    2022-09-16 08:18:24.277000+00:00 c4cae27b7c0a46beb14f79347d77c29d 0
    2022-09-16 08:17:18.615000+00:00 dummy 70
    2022-09-16 08:22:35.017000+00:00 ece3333dd6bd4d6d9ffab3d53fd4e6b2 78729


## Creating another new branch

We've not merged the new user data back into main yet, but in parallel we decide we want to test removing personally identifiable information (PII) from the data that we do have already. We can create another branch to do this. 


```python
branch='remove_pii'
```


```python
from lakefs_client.model.branch_creation import BranchCreation

api_instance = branches_api.BranchesApi(api_client)
branch_creation = BranchCreation(
    name=branch,
    source="main",
) 

api_response = api_instance.create_branch(repo, branch_creation)
display(api_response)
```


    'de2ae0f24961f65bf7b525d983b3dbc869ce49a0dea43529920743154ce0ddd0'


First off we'll confirm that the data in this new branch matches what's in main (a row count alone will suffice for a quick check): 

```python
xform_df = spark.read.parquet('s3a://'+repo+'/'+branch+'/demo/users')
```



```python
display(xform_df.count())
```


    1000

_Note that this shows 1000 per `main`, and not 2000 per the `add_more_user_data` branch above since this has not been merged to `main`_

### Transform the data

Now we'll use `.drop()` to remove sensitive fields from the data. 

```python
df2=xform_df.drop('ip_address','birthdate','salary','email').cache()
df2.show(n=1,vertical=True)
```

    -RECORD 0--------------------------------
     registration_dttm | 2016-02-03 07:55:29 
     id                | 1                   
     first_name        | Amanda              
     last_name         | Jordan              
     gender            | Female              
     cc                | 6759521864920116    
     country           | Indonesia           
     title             | Internal Auditor    
     comments          | 1E+02               
    only showing top 1 row
    

### Write data back to the branch

```python
df2.write.mode('overwrite').parquet('s3a://'+repo+'/'+branch+'/demo/users')
```

### Commit changes


```python
api_instance = commits_api.CommitsApi(api_client)
commit_creation = CommitCreation(
    message="Remove PII",
) 

api_instance.commit(repo, branch, commit_creation)
```




    {'committer': 'docker',
     'creation_date': 1663322293,
     'id': '12718ce62f97df78beb1d49dcd4c5528a1977d2af1b220f22012f8305e72f768',
     'message': 'Remove PII',
     'meta_range_id': '',
     'metadata': {},
     'parents': ['de2ae0f24961f65bf7b525d983b3dbc869ce49a0dea43529920743154ce0ddd0']}

### ℹ️ Reading and writing the same data back

If you try to read and then write the data from the same place you'll get an error like this: 

```
Caused by: java.io.FileNotFoundException: 
No such file or directory: s3a://example/remove_pii/demo/users/part-00000-7a0bbe79-a3e2-4355-984e-bd8b950a4e0c-c000.snappy.parquet
```

One [solution](https://stackoverflow.com/a/65330116/350613) is to use `.cache()`. Alternatively (and probably better, is to read the data from a different path - the reference point from which the branch was created)

_Thanks to Barak Amar on the LakeFS Slack for helping me with this._


### Re-read all branches and inspect data for isolation

Here's the original branch (`main`), with 1k records and full set of fields: 


```python
main = spark.read.parquet('s3a://'+repo+'/main/demo/users')
display(main.count())
main.show(n=1,vertical=True)
```


    1000


    -RECORD 0--------------------------------
     registration_dttm | 2016-02-03 07:55:29 
     id                | 1                   
     first_name        | Amanda              
     last_name         | Jordan              
     email             | ajordan0@com.com    
     gender            | Female              
     ip_address        | 1.197.201.2         
     cc                | 6759521864920116    
     country           | Indonesia           
     birthdate         | 3/8/1971            
     salary            | 49756.53            
     title             | Internal Auditor    
     comments          | 1E+02               
    only showing top 1 row
    


The branch to which we added more data still has that data (as we'd expect; we've not touched it):


```python
add_more_user_data = spark.read.parquet('s3a://'+repo+'/add_more_user_data/demo/users')
display(add_more_user_data.count())
add_more_user_data.show(n=1,vertical=True)
```


    2000


    -RECORD 0--------------------------------
     registration_dttm | 2016-02-03 07:55:29 
     id                | 1                   
     first_name        | Amanda              
     last_name         | Jordan              
     email             | ajordan0@com.com    
     gender            | Female              
     ip_address        | 1.197.201.2         
     cc                | 6759521864920116    
     country           | Indonesia           
     birthdate         | 3/8/1971            
     salary            | 49756.53            
     title             | Internal Auditor    
     comments          | 1E+02               
    only showing top 1 row
    
And our new branch for removing PII is showing the correct data too:  (`remove_pii`):


```python
remove_pii = spark.read.parquet('s3a://'+repo+'/remove_pii/demo/users')
display(remove_pii.count())
remove_pii.show(n=1,vertical=True)
```


    1000


    -RECORD 0--------------------------------
     registration_dttm | 2016-02-03 07:55:29 
     id                | 1                   
     first_name        | Amanda              
     last_name         | Jordan              
     gender            | Female              
     cc                | 6759521864920116    
     country           | Indonesia           
     title             | Internal Auditor    
     comments          | 1E+02               
    only showing top 1 row
    

### Merge `remove_pii` into `main`

Since we're happy with the data transform work, we'll merge the result into main. 

```python
client.refs.merge_into_branch(repository=repo, source_ref='remove_pii', destination_branch='main')
```

    {'reference': 'bb4564d3811586db5db202e8553fa5bfc4c5a235c4d8b8ec22ab62f7ab43b34c',
     'summary': {'added': 0, 'changed': 0, 'conflict': 0, 'removed': 0}}


Now if we read the data from the original branch (`main`), we can see that it's what we merged in, as expected: 

```python
main = spark.read.parquet('s3a://'+repo+'/main/demo/users')
display(main.count())
main.show(n=1,vertical=True)
```


    1000


    -RECORD 0--------------------------------
     registration_dttm | 2016-02-03 07:55:29 
     id                | 1                   
     first_name        | Amanda              
     last_name         | Jordan              
     gender            | Female              
     cc                | 6759521864920116    
     country           | Indonesia           
     title             | Internal Auditor    
     comments          | 1E+02               
    only showing top 1 row
    


----


## Data Engineering in 2022

* [Introduction](/2022/09/14/stretching-my-legs-in-the-data-engineering-ecosystem-in-2022/)
* [Storage and Access](/2022/09/14/data-engineering-in-2022-storage-and-access/)
* Query & Transformation Engines [TODO]
* ETL/ELT tools & Orchestration [TODO]
* Architectures & Terminology [TODO]
* [Resources](/2022/09/14/data-engineering-resources/)
