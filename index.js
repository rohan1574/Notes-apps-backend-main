const express = require('express')
require('dotenv').config()
var cors = require('cors')
var jwt = require('jsonwebtoken');
const app = express()
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vdfwpbk.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const database = client.db("text-node");
        const userCollection = database.collection("users");
        const notesCollection = database.collection("notes");
        const traceCollection = database.collection("trace");
        const copyNotesCollection = database.collection("copynotes");

        // Create Token
        app.post('/jwt', (req, res) => {
            try {
                const token = jwt.sign(req.body, process.env.SEQUIRITY, { expiresIn: '1h' });
                res.send({ token })
            } catch (error) {
                console.log(error)
            }
        })

        // Verify
        const VerifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "unAuthorize access" })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.SEQUIRITY, function (err, decoded) {
                if (err) {
                    return res.status(401).send({ message: "unAuthorize access" })
                }
                req.decoded = decoded;
                next()
            });
        }

        // user save
        app.post('/user', async (req, res) => {
            const findUser = await userCollection.findOne({ email: req.body.email })
            if (!findUser) {
                const result = await userCollection.insertOne(req.body)
                res.send(result)
            }
        })

        // Add a note
        app.post('/note',VerifyToken, async (req, res) => {
            const result = await notesCollection.insertOne(req.body)
            res.send(result)
        })

        // get all note
        app.get('/note',VerifyToken, async (req, res) => {
            const result = await notesCollection.find({ email: req.query.email }).toArray()
            res.send(result)
        })
        // update note
        app.put('/note/:id',VerifyToken, async (req, res) => {
            const filter = { _id: new ObjectId(req.params.id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...req.body
                },
            };
            const result = await notesCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })


        // update note tags
        app.patch('/note/:id',VerifyToken, async (req, res) => {
            const filter = { _id: new ObjectId(req.params.id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...req.body
                },
            };
            const result = await notesCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        // Item delete
        app.delete('/note/:id',VerifyToken, async (req, res) => {
            const data = await notesCollection.findOne({ _id: new ObjectId(req.params.id) })
            if (data) {
                const { _id, ...item } = data
                const saveTrace = await traceCollection.insertOne(item)
                if (saveTrace) {
                    const result = await notesCollection.deleteOne({ _id: new ObjectId(req.params.id) })
                    res.send(result)
                }
            }
        })

        // trease file
        app.get('/trash',VerifyToken, async (req, res) => {
            const result = await traceCollection.find({ email: req.query.email }).toArray()
            res.send(result)
        })

        // trease file
        app.delete('/trash/:id',VerifyToken, async (req, res) => {
            const result = await traceCollection.deleteOne({ _id: new ObjectId(req.params.id) })
            res.send(result)
        })

        app.get('/tags',VerifyToken, async (req, res) => {
            const result = await notesCollection.find({ email: req.query.email }).toArray()
            const mapArray = result.map(item => item?.tags)
            const uniqTags = new Set(mapArray)
            res.send([...uniqTags])
        })

        // Add copy note
        // Add a note
        app.post('/notecopy',VerifyToken, async (req, res) => {
            const result = await copyNotesCollection.insertOne(req.body)
            res.send(result)
        })
        // get all copy notes
        app.get('/notecopy',VerifyToken, async (req, res) => {
            const result = await copyNotesCollection.find({ email: req.query.email }).toArray()
            res.send(result)
        })
        // delete copynotes
        app.delete('/notecopy/:id',VerifyToken, async (req, res) => {
            const result = await copyNotesCollection.deleteOne({ _id: new ObjectId(req.params.id) })
            res.send(result)
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})