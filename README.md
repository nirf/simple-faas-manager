# lumigo-developer-test
**Implement a simple auto scale mechanism**
## Architecture
![Architecture](assets/images/architecture.png)

## Environment variables
Project environment variable are found here [.env](.env)
```
POLLING_INTERVAL_MS=10    // message queue polling interval
POLLING_BATCH_SIZE=10     // message queue polling batch size
FREEZE_STATE_MS=1000      // child process freeze ("warm") state in milliseconds
PORT=8000                 // server port     
FILE_NAME=shared-file.txt // name of the shared file
MAX_RETRY_ATTEMPTS=20     // maximum retry attempts in case of process failure
```

## Usage
### Install project dependencies
```
npm i
```
### Start project
```
npm start
```
### Push a message
```
curl --header "Content-Type: application/json" --request POST --data '{"message":"xyz"}' http://localhost:8000/messages
```
### Get statistics
```
curl http://localhost:8000/statistics
```
## Test
### Install loadtest globally
``
npm i -g loadtest
``
### Run loadtest
```
loadtest -n 1000 -c 100  -T 'application/json' --data '{"message":"My my, hey hey"}' -m POST --rps 50  http://localhost:8000/messages
```