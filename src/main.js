const express = require('express')
const bodyParser = require('body-parser')
const Queue = require('queue-fifo')
const { v4: uuidv4 } = require('uuid')
const { fork } = require('child_process')
const fs = require('fs')
const { init } = require('./config')

const config = init()
const queue = new Queue()
const activeInstancesMap = new Map()
const warmInstancesQueueMap = new Map()
let totalInvocations = 0
const app = express()
const sharedFile = fs.openSync(config.FILE_NAME, 'a+')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.post('/messages', (req, res) => {
    const message = req.body
    message.id = uuidv4()
    queue.enqueue(message)
    res.status(200).send('Message received successfully')
})

app.get('/statistics', (req, res) => {
    res.json({
        active_instances: activeInstancesMap.size,
        total_invocation: totalInvocations
    })
})

app.listen(config.PORT, () => {
    console.log(`App is Listening on port ${config.PORT}`)
})

setInterval(() => {
    let i = 0
    while (!queue.isEmpty() && i < config.POLLING_BATCH_SIZE) {
        const message = queue.dequeue()
        console.log('Polling a message from the queue', message)
        const childProcess = getOrCreateProcess()
        console.log(childProcess.created ? 'Create a new process instance' : 'Get a warm process instance')
        if (childProcess.created) {
            listenOnChildProcessMessageEvent(childProcess.instance)
        }
        childProcess.instance.send({
            action: 'start',
            ...message
        })
        activeInstancesMap.set(message.id, {
            retries: 0,
            process: childProcess.instance
        })
        i++
    }
}, config.POLLING_INTERVAL_MS)

function getOrCreateProcess() {
    if (warmInstancesQueueMap.size > 0) {
        // (FIFO) The Map object holds key-value pairs and remembers the original insertion order of the keys
        const warmInstanceChildProcess = warmInstancesQueueMap.entries().next().value
        warmInstancesQueueMap.delete(warmInstanceChildProcess[0])
        return {instance: warmInstanceChildProcess[1], created: false}
    } else {
        return {instance: fork('src/worker.js'), created: true}
    }
}

function listenOnChildProcessMessageEvent(childProcess) {
    childProcess.on('message', (msg) => {
        console.log('Listening for child message', msg)
        switch (msg.action) {
            case 'finish':
                finishProcessById(msg.id)
                break
            case 'kill':
                killProcessById(msg.id)
                break
            case 'error':
                handleErrorById(msg.id, msg.message)
                break
        }
    })
}

function finishProcessById(id) {
    totalInvocations++
    const processData = activeInstancesMap.get(id)
    activeInstancesMap.delete(id)
    warmInstancesQueueMap.set(id, processData.process)
}

function killProcessById(id) {
    if (warmInstancesQueueMap.has(id)) {
        const childProcess = warmInstancesQueueMap.get(id)
        warmInstancesQueueMap.delete(id)
        childProcess.kill()
    }
}

function handleErrorById(id, message) {
    const processData = activeInstancesMap.get(id)
    processData.retries++
    if (processData.retries <= config.MAX_RETRY_ATTEMPTS) {
        console.log(`Retry message:${id} for the ${processData.retries}'rd time`)
        activeInstancesMap.set(id, processData)
        processData.process.send({
            action: 'start',
            id,
            message
        })
    } else {
        console.log(`Reached the Maximum number of retries (${config.MAX_RETRY_ATTEMPTS}) on message:${id}`)
        activeInstancesMap.delete(id)
        processData.process.kill()
    }
}

process.on('SIGINT', () => {
    if (sharedFile) {
        fs.closeSync(sharedFile)
    }
    process.exit(0)
})

if (!config.SHOW_LOGS) {
    console.log = () => {
    }
}