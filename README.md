# grenache-exchange

### Setting up the DHT

```
npm i -g grenache-grape
```

```
# boot two grape servers

grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

### Setting up Grenache in your project

```
npm install --save grenache-nodejs-http
npm install --save grenache-nodejs-link
```

### Run the project

#### Server
```
cd grenache-nodejs-example-fib-server
node server.js
```
#### Client
```
cd grenache-nodejs-example-fib-client
node client.js
```
