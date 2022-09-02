const lockfile = require('proper-lockfile')
const fsPromises = require('fs').promises

process.on('message', async (msg) => {
    if (msg.action === 'start') {
        await invokeHandler(msg)
    }
})

async function invokeHandler(msg) {
    await sleep(5 * 1000)
    // append message to shared file
    const releaseFun = await lockfile.lock(process.env.FILE_NAME)
    await fsPromises.appendFile(process.env.FILE_NAME, msg.message + '\n')
    await releaseFun()
    process.send({
        action: 'finish',
        id: msg.id
    })
    // entering freezing state ("warm")
    await sleep(process.env.FREEZE_STATE_MS)
    process.send({
        action: 'kill',
        id: msg.id
    })
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}