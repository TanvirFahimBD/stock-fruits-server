const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express()

//! middleware
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello stock fruit Server')
})

app.listen(port, () => {
    console.log(`listening at port`, port)
})