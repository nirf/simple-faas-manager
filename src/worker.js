/*
1. receive as input the messages
2. then sleep for 5 seconds
3. and will print the content of the messages to a shared file (append only)
*/
process.on('message', async (msg) => {
    if (msg.action === 'start') {
        await invokeHandler(msg)
    }
})

async function invokeHandler(msg) {
    await sleep(5 * 1000)
    // append message to shared file
    const textMessage = msg.message
    process.send({
        action: 'finish',
        id: msg.id
    })
    // entering freezing state ("warm")
    await sleep(2 * 1000)
    process.send({
        action: 'kill',
        id: msg.id
    })
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}