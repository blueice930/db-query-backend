require('dotenv').config()

const bcrypt = require('bcryptjs')
const cors = require('cors');

const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
app.use(express.json(), cors({
  origin: '*'
}));



const dbUrl = process.env.DB_URL
const client = new MongoClient(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

client.connect(err => {
  if (err) return console.log(err)
  console.log('Connected to Database.')

  const dataCollection = client.db(process.env.ENV).collection('data');
  const adminCollection = client.db(process.env.ENV).collection('admin');

  // app.get('/', async (req, res) => {
  //   const data = await dataCollection.find({}).toArray();
  //   res.json(data);
  // })
  
  app.post('/query', async (req, res) => {
    const phone = req?.body?.phone;
    if (!phone) {
      res.json({
        success: false,
        data: "Invalid param"
      })
    }
    try {
      const data = await dataCollection.find({phone: phone}).toArray();
      res.json(data);
    } catch(e) {
      res.json({e})
    }
  })

  app.post('/auth', async (req, res) => {
    const email = req?.body?.email;
    const password = req?.body?.password;
    if (!email || !password) {
      res.json({
        success: false,
        data: "Invalid email or password"
      })
    }
    try {
      const data = await adminCollection.findOne({email: email});
      const isAuthed = bcrypt.compareSync(password, data?.pwHash);
      const sessionId = isAuthed ? Date.now() : null;

      if (isAuthed) {
        adminCollection.updateOne({email}, {
          $set: {
            sessionId,
          }
        })
      }
      res.json({
        success: isAuthed,
        data: { sessionId },
      });
    } catch(e) {
      res.json({e})
    }
  })

  app.post('/insert', async (req, res) => {
    const email = req?.body?.email;
    const sessionId = req?.body?.sessionId;
    const entries = req?.body?.entries;

    if (!email || !sessionId) {
      res.json({
        success: false,
        data: "Session Expired"
      })
    }
    if (!entries) {
      res.json({
        success: false,
        data: "Nothing to update"
      })
    }

    try {
      const data = await adminCollection.findOne({email: email});
      const isAuthed = data?.sessionId === sessionId;

      if (isAuthed) {
        const response = await dataCollection.insertMany(entries);
        if (response?.acknowledged) {
          res.json({
            success: true,
            data: response?.insertedIds,
          });
        } else {
          res.json({
            success: false,
            data: "Unknown error",
          });
        }
      } else {
        res.json({
          success: false,
          data: "Session Expired"
        })
      }
    } catch(e) {
      res.json({e})
    }
  })
  
  app.listen(8080, () => {
    console.log('Express server running...');
  })
});


