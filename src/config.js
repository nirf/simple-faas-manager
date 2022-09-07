const Joi = require('joi')

function init() {
    const schema = Joi.object({
        POLLING_INTERVAL_MS: Joi.number().positive().required(),
        POLLING_BATCH_SIZE: Joi.number().positive().required(),
        FREEZE_STATE_MS: Joi.number().positive().required(),
        PORT: Joi.number().positive().required(),
        FILE_NAME: Joi.string().required(),
        MAX_RETRY_ATTEMPTS: Joi.number().positive().required(),
        SHOW_LOGS: Joi.boolean().required(),
        LOCK_FILE_RETRIES: Joi.number().positive().required()
    })

    const {error, value} = schema.validate({
        POLLING_INTERVAL_MS: process.env.POLLING_INTERVAL_MS,
        POLLING_BATCH_SIZE: process.env.POLLING_BATCH_SIZE,
        FREEZE_STATE_MS: process.env.FREEZE_STATE_MS,
        PORT: process.env.PORT,
        FILE_NAME: process.env.FILE_NAME,
        MAX_RETRY_ATTEMPTS: process.env.MAX_RETRY_ATTEMPTS,
        SHOW_LOGS: process.env.SHOW_LOGS,
        LOCK_FILE_RETRIES: process.env.LOCK_FILE_RETRIES
    })
    if (error) {
        throw new Error(`Config validation error: ${error.message}`)
    }

    return value
}

module.exports = { init }

