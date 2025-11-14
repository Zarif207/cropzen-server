const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ujnwtbv.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const db = client.db("farmer-db");
    const cropsCollections = db.collection("crops");
    const interestCollections = db.collection("interest");
    const usersCollections = db.collection("users");

    // ------------------- USERS API -------------------
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const existingUser = await usersCollections.findOne({ email });
      if (existingUser) {
        return res.send({ message: "User already exists" });
      }
      const result = await usersCollections.insertOne(newUser);
      res.send(result);
    });

    // ------------------- CROPS API ------------------
    app.get("/crops", async (req, res) => {
      const email = req.query.email;
      const query = email ? { "owner.ownerEmail": email } : {};
      const result = await cropsCollections.find(query).toArray();
      res.send(result);
    });

    app.get("/crops/:id", async (req, res) => {
      const id = req.params.id;
      const result = await cropsCollections.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/latest-crops", async (req, res) => {
      const result = await cropsCollections
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.post("/crops", async (req, res) => {
      const newCrop = req.body;
      const result = await cropsCollections.insertOne(newCrop);
      res.send(result);
    });

    app.delete("/crops/:id", async (req, res) => {
      const id = req.params.id;
      const result = await cropsCollections.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ------------------- INTEREST API -------------------
    app.get("/interest", async (req, res) => {
      const email = req.query.email;
      const query = email ? { userEmail: email } : {};
      const result = await interestCollections.find(query).toArray();
      res.send(result);
    });

    app.get("/crops/interest/:cropId", async (req, res) => {
      const cropId = req.params.cropId;
      const result = await interestCollections
        .find({ cropId })
        .sort({ interest: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/interest/:id", async (req, res) => {
      const id = req.params.id;
      const result = await interestCollections.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/interest", async (req, res) => {
      const newInterest = req.body;
      const result = await interestCollections.insertOne(newInterest);
      res.send(result);
    });

    app.delete("/interest/:id", async (req, res) => {
      const id = req.params.id;
      const result = await interestCollections.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //  PATCH
    app.patch("/interests/:cropId/:interestId", async (req, res) => {
      const { cropId, interestId } = req.params;
      const { status } = req.body;

      try {
       
        const updateInterest = await interestCollections.updateOne(
          { _id: new ObjectId(interestId) },
          { $set: { status } }
        );

    
        if (status === "accepted") {
          const interest = await interestCollections.findOne({
            _id: new ObjectId(interestId),
          });

          if (interest && interest.quantity) {
            await cropsCollections.updateOne(
              { _id: new ObjectId(cropId) },
              { $inc: { quantity: -interest.quantity } } 
            );
          }
        }

        res.send({
          success: true,
          message: `Interest ${status} successfully`,
          updateInterest,
        });
      } catch (error) {
        console.error("Error updating interest:", error);
        res.status(500).send({ success: false, error: "Internal Server Error" });
      }
    });







    // PATCH: update interest status (accept And reject)
app.patch("/interest/:interestId", async (req, res) => {
  const { interestId } = req.params;
  const { cropsId, status } = req.body;

  try {
    const updateInterest = await interestCollections.updateOne(
      { _id: new ObjectId(interestId) },
      { $set: { status } }
    );
    if (status === "accepted") {
      const interest = await interestCollections.findOne({
        _id: new ObjectId(interestId),
      });

      if (interest && interest.quantity) {
        await cropsCollections.updateOne(
          { _id: new ObjectId(cropsId) },
          { $inc: { quantity: -interest.quantity } } 
        );
      }
    }

    res.send({
      success: true,
      message: `Interest marked as ${status}`,
      updateInterest,
    });
  } catch (error) {
    console.error("Error updating interest:", error);
    res.status(500).send({ success: false, error: "Internal server error" });
  }
});

    // ---------------------------------------------------
    // await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connected successfully!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("🌾 Farmer Server is running perfectly!");
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});