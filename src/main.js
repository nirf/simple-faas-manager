import express from 'express'
import bodyParser from 'body-parser'

const app = express()
const port = process.env.PORT || 8000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', (req, res) => {
    res.json({status: 'health'})
})

app.post('/messages', (req, res) => {
    res.json(req.body)
})

app.get('/statistics', (req, res) => {
    res.json({
        active_instances: 5,
        total_invocation: 20
    })
})

app.listen(port, () => {
    console.log(`App is Listening on port ${port}`)
})