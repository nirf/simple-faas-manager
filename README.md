# lumigo-developer-test
**Implement a simple auto scale mechanism**
## Architecture
![Architecture](assets/images/smily.jpeg)

## Usage
### Push a message
```
curl --header "Content-Type: application/json" --request POST --data '{"message":"xyz"}' http://localhost:8000/messages
```
### Get statistics
```
curl http://localhost:8000/statistics
```