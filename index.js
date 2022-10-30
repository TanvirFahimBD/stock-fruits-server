const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express()

//! middleware
app.use(cors())
app.use(express.json())

//! middle tare
function verifyJWT(req, res, next) {
    const authHeader = req?.headers?.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}

//! mongodb client
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hqjnl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        console.log('db connected');
        const fruitCollection = client.db('stockFruits').collection('fruits')

        // ************************ fruit collection *****************

        //! get fruit base on user email
        app.get('/fruit/:email', verifyJWT, async (req, res) => {
            const email = req?.params?.email;
            const decodedEmail = req?.decoded?.email;
            if (email === decodedEmail) {
                const query = { email: email }
                const cursor = fruitCollection.find(query)
                const fruits = await cursor.toArray()
                res.send(fruits)
            } else {
                res.status(403).send({ message: 'forbidden' })
            }
        })

        //! get fruit
        app.get('/fruit', async (req, res) => {
            const page = parseFloat(req.query.page);
            const size = parseFloat(req.query.size);
            const query = {}
            const cursor = fruitCollection.find(query)
            let fruits;
            if (page || size) {
                fruits = await cursor.skip(page * size).limit(size).toArray();
            } else {
                fruits = await cursor.toArray()
            }
            res.send(fruits)
        })

        //! get fruit count
        app.get('/fruitCount', async (req, res) => {
            const count = await fruitCollection.estimatedDocumentCount()
            res.send({ count })
        })

        //! put fruit
        app.put('/fruit/:id', async (req, res) => {
            const id = req.params.id;
            const newFruit = req.body;
            const query = { _id: ObjectId(id) }
            const filter = { upsert: true }
            const updateFruit = {
                $set: {
                    itemName: newFruit.itemName,
                    image: newFruit.image,
                    description: newFruit.description,
                    price: newFruit.price,
                    quantity: newFruit.quantity,
                    supplierName: newFruit.supplierName
                }
            }
            const result = await fruitCollection.updateOne(query, updateFruit, filter)
            res.send(result)
        })

        //! delete fruit
        app.delete('/fruit/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await fruitCollection.deleteOne(query)
            res.send(result)
        })

        //! Post fruit
        app.post('/fruit', async (req, res) => {
            const query = req.body;
            const result = await fruitCollection.insertOne(query)
            res.send(result)
        })

        // **************** JWT Verify request
        //! login api for token generate & send client side
        app.post('/login', (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken })
        })

    }
    finally {
        // await client.close()
    }
}
run().catch(console.dir);


//! server get
app.get('/', (req, res) => {
    res.send('Hello stock fruit Server')
})

//! server listen
app.listen(port, () => {
    console.log(`listening at port`, port)
})