#DQT 2.0

The new Loris Data Query Tool.

##Prerequisites

Before using this code, you must have the following prerequisites installed

* CouchDB >= 1.2 (http://couchdb.apache.org)
* Erica (https://github.com/benoitc/erica)

##Installation

### The Easy Way

Create a database on your local CouchDB instance, and clone the code from
the server https://couchdb.loris.ca:5984/dataquerytool-$VERSION where $VERSION
is separated by underscores rather than dots (because dots are not allowed
in CouchDB database names.)

ie.

```bash
curl -H 'Content-Type: application/json' -X POST http://$YOURCOUCHDBADMIN:$YOURCOUCHADMINPASS@$YOURSERVERNAME:5984/_replicate -d '{"source":"https://couchdb.loris.ca:5984/dataquerytool-1_0_0", "target":"$YOURDATABASENAME"}'
```

### The Hard Way (for development)

First, create a CouchDB database using Futon (http://127.0.0.1:5984/\_utils/index.html).
In the following example, the database is named "dqg".

Next, clone this repository:

```bash
git clone git@github.com:aces/Data-Query-Tool.git
```

Finally, push to CouchDB using erica

```bash
cd Data-Query-Tool
erica push http://adminuser:adminpass@127.0.0.1:5984/dqg
```

Visit http://127.0.0.1:5984/dqg/_design/DQG-2.0/_rewrite/ to ensure code was pushed.

##Populating data from Loris

Amend the section of your LORIS config.xml

```xml
<CouchDB>
    <SyncAccounts>true</SyncAccounts>
    <database>dqg</database>
    <hostname>localhost</hostname>
    <port>5984</port>
    <admin>adminuser</admin>
    <adminpass>adminpass</adminpass>
</CouchDB>
```

In your Loris tools directory run the CouchDB_Import_* scripts

```bash
cd $lorisroot/tools

#Import the base candidate data
php CouchDB_Import_Demographics.php

#Import the Loris instrument data
#This step is optional and not required if
#only the MRI portion of Loris is used
php CouchDB_Import_Instruments.php

#Import the Loris MRI data
#This step is optional and not required
#if the MRI portion of Loris isn't installed
php CouchDB_Import_MRI.php
```
