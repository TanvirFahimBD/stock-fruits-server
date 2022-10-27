const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express()

//! middleware
app.use(cors())
app.use(express.json())

//! mongodb client
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hqjnl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        console.log('db connected');
        const fruitCollection = client.db('stockFruits').collection('fruits')

        // ************************ fruit collection *****************
        //! get fruit
        app.get('/fruit', async (req, res) => {
            const query = {}
            const cursor = fruitCollection.find(query)
            const fruit = await cursor.toArray()
            res.send(fruit)
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