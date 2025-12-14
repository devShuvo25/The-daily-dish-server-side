const { ObjectId } = require("mongodb");
const { client } = require("../config/database");
const { verifyUser } = require("../middleware/verify_user");
/**
 * @param {import('express').Express} app
 */
async function run(app) {
  const db = client.db("myDatabase");
  const usersCollection = db.collection("usersCollection");
  const mealsCollection = db.collection("mealsCollection");
  const reviewsCollection = db.collection("reviewsCollection");
  const favouritesCollection = db.collection("favouritesCollection");
  const ordersCollection = db.collection("ordersCollection");
  const requestCollection = db.collection("requestCollection");

  try {
    app.get("/", (req, res) => {
      res.send({ message: "Server running" });
      console.log("Run Fn succesfully imported");
    });
    // user related apis
    // create user
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        console.log(user, "This is user info");

        if (!user || !user.email) {
          return res.status(400).send({
            message: "Invalid user data",
          });
        }

        const existingUser = await usersCollection.findOne({
          email: user.email,
        });

        if (existingUser) {
          console.log("User Already Exists");
          return res.status(409).send({
            message: "User Already Exists",
          });
        }

        const result = await usersCollection.insertOne(user);

        return res.status(201).send({
          result,
          message: "User created successfully",
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          message: "Internal Server Error",
        });
      }
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    // update user as fraud
    app.patch("/update-user/:id", async (req, res) => {
      const id = req.params.id;
      if (id) {
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { status: "Fraud" },
        };
        try {
          const result = await usersCollection.updateOne(filter, updateDoc);
          console.log(result);
          res.send(result);
        } catch {
          console.log("Something went wrong to update user");
        }
      }
    });
    // role
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      if (email) {
        console.log(email);
        const filter = { email: email };
        console.log(filter);
        try {
          const result = await usersCollection.findOne(filter);
          // console.log('This is current user',result);
          res.send(result);
        } catch {
          console.log("Something went wrong to get user");
        }
      }
    });
    app.get("/userinfo/:email", async (req, res) => {
      const email = req.params.email;
      if (email) {
        console.log(email);
        const filter = { email: email };
        console.log(filter);
        try {
          const result = await usersCollection.findOne(filter);
          console.log("This is current user", result);
          res.send(result);
        } catch {
          console.log("Something went wrong to get user");
        }
      }
    });

    // meals related apis
    // all meals list
    app.get("/meals", async (req, res) => {
      const result = await mealsCollection.find().toArray();
      res.send(result);
    });
    // add a new meal by chef
    app.post("/add-meal", async (req, res) => {
      const mealData = req.body;
      if (mealData) {
        try {
          const result = await mealsCollection.insertOne(mealData);
          console.log("meal successfully inserted");
          res.send(result);
        } catch {
          console.log("Meal not inserted");
        }
      }
    });
    // order a meal
    app.get("/meal/:id", async (req, res) => {
      const id = req.params.id;
      if (id) {
        const filter = { _id: new ObjectId(id) };
        try {
          const result = await mealsCollection.findOne(filter);
          console.log(result);
          res.send(result);
        } catch {
          console.log("Something went wrong to get orderd meal");
        }
      }
    });
    // chef's meals
    app.get("/meals/user/:email", async (req, res) => {
      const email = req.params.email;
      if (email) {
        console.log(email);
        const filter = { chefEmail: email };
        try {
          const result = await mealsCollection.find(filter).toArray();
          res.send(result);
        } catch {
          console.log("Something went wrong to get meals");
        }
      }
    });
    // chef's meals order request
    app.get("/order-request/:chefId", async (req, res) => {
      const chefId = req.params.chefId;
      console.log(chefId);
      if (chefId) {
        const filter = { chefId };
        try {
          const result = await ordersCollection.find(filter).toArray();
          console.log(result);
          res.send(result);
        } catch {
          console.log("Something went wrong to get order request");
        }
      }
    });
    // chef meals delete
    app.delete("/my-meals/:id", async (req, res) => {
      const id = req.params.id;
      if (id) {
        const filter = { _id: new ObjectId(id) };
        try {
          const result = await mealsCollection.deleteOne(filter);
          console.log("Delete:", result);
          res.send(result);
        } catch {
          console.log("Something Went wrong to delete meals");
        }
      }
    });
    // chef's meal update
    app.patch("/update-meal/:id", async (req, res) => {
      const updateInfo = req.body;
      const id = req.params.id;
      if (updateInfo && id) {
        console.log(updateInfo, id);
        try {
          const filter = { _id: new ObjectId(id) };
          const updateDoc = {
            $set: updateInfo,
          };
          const result = await mealsCollection.updateOne(filter, updateDoc);
          console.log(result);
          res.send(result);
        } catch {
          console.log("Something went wrong to update the meal");
        }
      }
    });
    // specific meal details
    app.get("/meals/:id", async (req, res) => {
      const id = req.params.id;

      if (id) {
        const filter = { _id: new ObjectId(id) };
        const result = await mealsCollection.findOne(filter);
        res.send(result);
      }
    });
    // favourites related apis
    // add to favourites
    app.post("/favourites", async (req, res) => {
      const { userEmail, mealId } = req.body;
      // console.log(userEmail,mealId);
      if (mealId && userEmail) {
        const id = { _id: new ObjectId(mealId) };
        const favouriteMeal = await mealsCollection.findOne(id);
        // console.log(favouriteMeal);
        if (favouriteMeal) {
          const favouriteData = {
            userEmail: userEmail,
            mealId: mealId,
            mealName: favouriteMeal?.mealName,
            mealImage: favouriteMeal?.foodImage,
            chefId: favouriteMeal?.chefId,
            chefName: favouriteMeal?.chefName,
            price: favouriteMeal?.price,
            addedTime: new Date(),
          };
          const existingFavourite = await favouritesCollection.findOne({
            mealId: mealId,
            userEmail: userEmail,
          });
          if (existingFavourite) {
            console.log("Meal Already in Favourites");
            return res.send({ message: "Meal Already in Favourites" });
          }
          const result = await favouritesCollection.insertOne(favouriteData);
          res.send(result);
        }
      }
    });
    app.get("/favourite-meals", async (req, res) => {
      const { userEmail } = req.query;
      try {
        if (userEmail) {
          const filter = { userEmail: userEmail };
          const meals = await favouritesCollection.find(filter).toArray();
          if (meals) {
            // console.log("Finding",meals);
            const ids = meals.map((meal) => meal.mealId);
            const ObjectIds = ids.map((id) => new ObjectId(id));
            console.log(ObjectIds);
            const query = { _id: { $in: ObjectIds } };
            const result = await mealsCollection.find(query).toArray();
            //  console.log(result);
            res.send(result);
          }
        }
      } catch {
        res.status(500).send({ message: "Internal Server Error" });
      }
    });
    // app.get('/favourite-meals', async(req,res) => {
    //     const {userEmail} = req.query;          try{
    //     if(userEmail){
    //     const filter = {userEmail: userEmail};
    //     const result = await favouritesCollection.find(filter).toArray();
    //     res.send(result)
    //    }
    //   }
    //   catch{
    //     res.status(500).send({message:"Internal Server Error"})
    //   }
    // })
    // delet from favourites
    app.delete("/favourite-meals", async (req, res) => {
      const { id, userEmail } = req.query;
      console.log("From delet favourite:", id, userEmail);
      if (id && userEmail) {
        try {
          const filter = { mealId: id, userEmail };
          const result = await favouritesCollection.deleteOne(filter);
          console.log(result);
          res.send(result);
        } catch {
          res.status(500).send({ message: "Internal Server Error" });
        }
      }
    });

    // confirm order api
    app.post("/orders", async (req, res) => {
      const order = await req.body;
      // console.log(order);
      try {
        if (order) {
          const result = await ordersCollection.insertOne(order);
          res.send(result);
        }
      } catch {
        res.status(500).send({ message: "Internal Server Error" });
      }
    });
    // my orders
    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      if (email) {
        console.log("id from", email);
        const filter = { userEmail: email };
        try {
          const result = await ordersCollection.find(filter).sort({orderTime: -1}).toArray();
          console.log(result);
          res.send(result);
        } catch {
          console.log("Something went wrong");
        }
      }
    });
    // update order status
    app.post('/update-order',async(req,res) => {
      const {id,action} = req.query;
      console.log(id,action);
      if(id && action){
        const filter = {_id : new ObjectId(id)}
        const updateDoc = {
          $set:{orderStatus: action}
        }
        const result = await ordersCollection.updateOne(filter,updateDoc)
        console.log(result);
        res.send(result)
      }
    })
    // review related apis
    app.get("/reviews/:id", async (req, res) => {
      const mealId = req.params.id;
      if (mealId) {
        const filter = { mealId };
        const result = await reviewsCollection
          .find()
          .filter(filter)
          .sort({ date: -1 })
          .toArray();
        res.send(result);
      }
    });
    // review for home page
    app.get("/custommer-reviews", async (req, res) => {
      const result = await reviewsCollection.find().limit(6).toArray();
      res.send(result);
    });
    app.post("/reviews", async (req, res) => {
      const reviewInfo = req.body;
      if (reviewInfo) {
        try {
          const result = await reviewsCollection.insertOne(reviewInfo);
          res.send(result);
          console.log(result);
        } catch {
          res.send({ message: "Something went wrong" });
        }
      }
    });
    // my reviews
    app.get("/my-reviews", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      if (email) {
        const filter = { reviewerEmail: email };
        const result = await reviewsCollection
          .find()
          .filter(filter)
          .sort({ date: -1 })
          .toArray();
        res.send(result);
      }
    });
    // ddelet reviews
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      if (id) {
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        console.log("The obj Id :", filter);
        try {
          const result = await reviewsCollection.deleteOne(filter);
          res.send(result);
        } catch {
          console.log("Something went wrong to delete review");
        }
      }
    });
    // edit review
    app.patch("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const { rating, comment } = req.body;
      console.log(id);
      if (id) {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { rating, comment },
        };
        const result = await reviewsCollection.updateOne(filter, updateDoc);
        console.log(result);
        res.send(result);
      }
    });
    // admin apis
    app.post("/user-role", async (req, res) => {
      try {
        const requestData = req.body;

        if (!requestData || !requestData.user_email) {
          return res.status(400).send({
            message: "Invalid request data",
          });
        }

        const filter = {
          user_email: requestData.user_email,
          request_status: "Pending",
        };

        // 🔍 check if already pending request exists
        const existingRequest = await requestCollection.findOne(filter);

        if (existingRequest) {
          return res.status(409).send({
            message: "Already has a pending request",
          });
        }

        // ✅ insert new request
        const result = await requestCollection.insertOne({
          ...requestData,
          request_status: "Pending",
          created_at: new Date(),
        });

        res.status(201).send({
          message: "Role request submitted successfully",
          result,
        });
      } catch (error) {
        console.error("Error posting role request:", error);
        res.status(500).send({
          message: "Something went wrong while posting request",
        });
      }
    });

    // get all request
    app.get("/user-request", async (req, res) => {
      res.send(
        await requestCollection.find().sort({ request_time: -1 }).toArray()
      );
    });
    // manage request
    app.patch("/user-request", async (req, res) => {
      const { id, action, type, email } = req.query;
      console.log(id, action, type);
      if (id && action) {
        const filter1 = { _id: new ObjectId(id) };
        const user = await requestCollection.findOne(filter1);

        const filter2 = { email: user?.user_email };
        console.log(filter2);
        // console.log(filter2);
        const updateRequest = {
          $set: { request_status: action },
        };
        let updateUser = {};
        if (type === "Admin") {
           updateUser = {
            $set: { role: type },
          };
        } else {
           updateUser = {
            $set: {
              role: type,
              chefId: `Ch- ${(Math.floor(100 + Math.random() * 900))}`,
            },
          };
        }

        if (action === "Accepted") {
          const result1 = await requestCollection.updateOne(
            filter1,
            updateRequest
          );
          const result2 = await usersCollection.updateOne(filter2, updateUser);
          console.log("Both result", result1, result2);
          return res.send({
            success: true,
            requestUpdate: result1,
            userUpdate: result2,
          });
        } else {
          const result1 = await requestCollection.updateOne(
            filter1,
            updateRequest
          );
          console.log("The result1", result1);
          res.send(result1);
        }
      }
    });
  } catch {
    console.log("Something went wrong");
  }
}

module.exports = { run };
