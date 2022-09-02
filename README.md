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
## Test
### install loadtest globally
``
npm i -g loadtest
``
</br>
``
loadtest -n 100 -c 10  -T 'application/json' --data '{"message":"it is better to burn out than to fade away"}' -m POST --rps 10  http://localhost:8000/messages
``