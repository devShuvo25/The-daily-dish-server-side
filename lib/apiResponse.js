const { ObjectId } = require("mongodb");
const { client } = require("../config/database");
const { verifyUser } = require("../middleware/verify_user");
/**
 * @param {import('express').Express} app
 */
async function run(app) {
    const db = client.db('myDatabase');
   const usersCollection = db.collection('usersCollection');
   const mealsCollection = db.collection('mealsCollection');
   const reviewsCollection = db.collection('reviewsCollection');
   const favouritesCollection = db.collection('favouritesCollection');
   const ordersCollection = db.collection('ordersCollection');
   
    try{
        app.get('/',(req,res)=> {
            res.send({message:"Server running"})
            console.log('Run Fn succesfully imported');
        })
        // user related apis
        // create user
        app.post('/users', verifyUser, async(req,res) => {
            const user = await req.body;
            if(user){
        const existingUser = await usersCollection.findOne({ email: user.email });

                    if (existingUser) {
                        console.log("User Already Exists");
                        return res.send({ message: "User Already Exists" });
                    }
                const userData = {
                    name: user.displayName || "Anonymous",
                    profile_image: user.photoURL || null,
                    email: user.email,
                    age: user.age || null,
                    status: "Active",
                    role: "User",
                    created_at: new Date()
                }
                const result = await usersCollection.insertOne(userData);
                res.send({message:"User Post Request Received"})
            }
        })

        // meals related apis
        // all meals list
        app.get('/meals', async(req,res) => {
            const result = await mealsCollection.find().toArray();
            res.send(result)
        })

        // specific meal details
        app.get('/meal/:id', async(req,res) => {
            const id =  req.params.id;

            if(id){
                const filter = {_id : new ObjectId(id)};
                const result = await mealsCollection.findOne(filter);
                res.send(result)
            }
        })
        // favourites related apis
        // add to favourites
        app.post('/favourites', async(req,res) => {
            const {userEmail,mealId}= req.body;
            // console.log(userEmail,mealId);
            if(mealId && userEmail){
            const id = {_id: new ObjectId(mealId)};
            const favouriteMeal = await mealsCollection.findOne(id);
            // console.log(favouriteMeal);
            if(favouriteMeal){
    const favouriteData = {
                userEmail: userEmail,
                mealId: mealId,
                mealName: favouriteMeal?.mealName,
                mealImage: favouriteMeal?.foodImage,   
                chefId: favouriteMeal?.chefId,
                chefName: favouriteMeal?.chefName,
                price: favouriteMeal?.price,     
                addedTime: new Date()
             } 
             const existingFavourite = await favouritesCollection.findOne({ mealId: mealId, userEmail: userEmail });
                    if (existingFavourite) {
                        console.log("Meal Already in Favourites");
                        return res.send({ message: "Meal Already in Favourites" });
                    }
                const result = await favouritesCollection.insertOne(favouriteData);
                res.send(result)
                
            }
            }
        })
        app.get('/favourite-meals', async(req,res) => {
            const {userEmail} = req.query;          try{
            if(userEmail){
            const filter = {userEmail: userEmail};
            const meals = await favouritesCollection.find(filter).toArray();
            if(meals){
                // console.log("Finding",meals);
               const ids = meals.map(meal => meal.mealId)
                const ObjectIds = ids.map(id => new ObjectId(id))
                console.log(ObjectIds);
                const query = {_id : {$in: ObjectIds}}
             const result = await mealsCollection.find(query).toArray()   
            //  console.log(result);
             res.send(result)
            }
           }
          }
          catch{
            res.status(500).send({message:"Internal Server Error"})
          }
        })
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
        app.delete('/favourite-meals', async(req,res) => {
            const {id,userEmail} = req.query; 
            console.log("From delet favourite:",id,userEmail); 
            if(id && userEmail){
          try{
            const filter = {mealId : id,userEmail};
            const result = await favouritesCollection.deleteOne(filter);
            console.log(result);
            res.send(result)
          }
          catch{
            res.status(500).send({message:"Internal Server Error"})
          }
            }
    })

    // confirm order api
    app.post('/orders',async(req,res)=> {
        const order = await req.body;
        // console.log(order);
        try{
            if(order){
            const result = await ordersCollection.insertOne(order);
            res.send(result)
        }
        }
        catch{
            res.status(500).send({message:"Internal Server Error"})
        }
    })
    // review related apis
            app.get('/reviews/:id', async(req,res) => {
                const mealId = req.params.id;
                if(mealId){
                    const filter = {mealId}
                    const result = await reviewsCollection.find().filter(filter).sort({date: -1}).toArray();
                    res.send(result)
                }
        })
    app.post("/reviews",async (req,res) => {
        const reviewInfo = req.body;
        if(reviewInfo) {
          try{
           const result = await reviewsCollection.insertOne(reviewInfo)
           res.send(result)
           console.log(result);
          }
          catch{
            res.send({message: "Something went wrong"})
          }
        }
    })
    // my reviews 
    app.get('/my-reviews',async (req,res) => {
        const email = req.query.email;
        console.log(email);
        if(email){
            const filter = {reviewerEmail: email};
            const result = await reviewsCollection.find().filter(filter).sort({date : -1}).toArray()
            res.send(result)
        }
    })
    // ddelet reviews
    app.delete('/reviews/:id', async(req,res) => {
        const id = req.params.id
        if(id){
            console.log(id);
            const filter = {_id : new ObjectId(id)}
            console.log("The obj Id :", filter);
            try{
                const result = await reviewsCollection.deleteOne(filter)
                res.send(result)
            }
            catch{
                console.log("Something went wrong to delete review");
            }
        }
    })
    // edit review
    app.patch('/reviews/:id',async(req,res) => {
        const id = req.params.id;
        const {rating,comment} = req.body;
        console.log(id);
        if(id){
            const filter = {_id : new ObjectId(id)}
            const updateDoc = {
                $set : {rating,comment}
            }
            const result = await reviewsCollection.updateOne(filter,updateDoc)
            console.log(result);
            res.send(result)
        }
        

    })
    }
    catch{
        console.log("Something went wrong")
    }
}

module.exports = {run};