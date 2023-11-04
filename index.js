const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware 
app.use(cors())
app.use(express.json())

// 2nd Task - jwt middleware

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    // bearer token 
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded
        next()
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ur5kyvu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const tasksCollection = client.db('taskDB').collection('task')
        const usersCollection = client.db('taskDB').collection('users')


        // 1st Task - jwt token

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
            res.send({ token })
        })


        // Users Collection 

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existUser = await usersCollection.findOne(query)
            if (existUser) {
                return res.send({ message: 'User Already exists' })
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })


        // Task Collection 

        app.get('/tasks', async (req, res) => {
            const result = await tasksCollection.find().sort({ createdAt: -1 }).toArray()
            res.send(result)
        })

        app.post('/add-task', async (req, res) => {
            const tasks = req.body
            tasks.createdAt = new Date()
            const result = await tasksCollection.insertOne(tasks)
            res.send(result)
        })

        app.delete('/delete-task/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await tasksCollection.deleteOne(query)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Task Management Appp running...')
})

app.listen(port, () => {
    console.log("Sever is running on port : ", port);
})