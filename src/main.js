const express = require('express')
const bodyParser = require('body-parser')
const Queue = require('queue-fifo')
const {v4: uuidv4} = require('uuid')
const {fork} = require('child_process')
const fs = require('fs')

const queue = new Queue()
const activeInstancesMap = new Map()
const warmInstancesQueueMap = new Map()
let totalInvocations = 0
const app = express()
let sharedFile = fs.openSync(process.env.FILE_NAME, 'a+')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))


app.get('/', (req, res) => {
    res.send('OK')
})

app.post('/messages', (req, res) => {
    const message = req.body
    message.id = uuidv4()
    queue.enqueue(message)
    res.status(200).send('Message received successfully')
})

app.get('/statistics', (req, res) => {
    res.json({
        active_instances: activeInstancesMap.size, total_invocation: totalInvocations
    })
})

app.listen(process.env.PORT, () => {
    console.log(`App is Listening on port ${process.env.PORT}`)
})

setInterval(() => {
    let i = 0
    while (!queue.isEmpty() && i < process.env.POLLING_BATCH_SIZE) {
        const message = queue.dequeue()
        console.log('Polling a message from the queue', message)
        const childProcess = getOrCreateProcess()
        console.log(childProcess.created ? 'Create a new process instance' : 'Get a warm process instance')
        if (childProcess.created) {
            listenForChildProcessEvents(childProcess.instance)
        }
        childProcess.instance.send({
            action: 'start',
            ...message
        })
        activeInstancesMap.set(message.id, childProcess.instance)
        i++
    }
}, process.env.POLLING_INTERVAL_MS)

function getOrCreateProcess() {
    if (warmInstancesQueueMap.size > 0) {
        const warmInstanceChildProcess = warmInstancesQueueMap.entries().next().value
        warmInstancesQueueMap.delete(warmInstanceChildProcess[0])
        return {instance: warmInstanceChildProcess[1], created: false}
    } else {
        return {instance: fork('src/worker.js'), created: true}
    }
}

function listenForChildProcessEvents(childProcess) {
    childProcess.on('message', (msg) => {
        console.log('Listening for child message', msg)
        switch (msg.action) {
            case 'finish':
                finishProcessById(msg.id)
                break
            case 'kill':
                killProcessById(msg.id)
                break
        }
    })

    childProcess.on('uncaughtException', (err, origin) => {
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
        console.log(err, origin)
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
    })
}

function finishProcessById(id) {
    totalInvocations++
    const childProcess = activeInstancesMap.get(id)
    activeInstancesMap.delete(id)
    warmInstancesQueueMap.set(id, childProcess)
}

function killProcessById(id) {
    if (warmInstancesQueueMap.has(id)) {
        const childProcess = warmInstancesQueueMap.get(id)
        warmInstancesQueueMap.delete(id)
        childProcess.kill()
    }
}

process.on('SIGINT', () => {
    if (sharedFile) {
        fs.closeSync(sharedFile)
    }
    process.exit(0)
})