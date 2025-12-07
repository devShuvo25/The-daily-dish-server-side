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
        // review related apis
        app.get('/reviews', async(req,res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result)
        })
        // favourites related apis
        // add to favourites
        app.post('/favourites', async(req,res) => {
            const {userEmail,mealId}= req.body;
            console.log(userEmail,mealId);
            if(mealId && userEmail){
            const id = {_id: new ObjectId(mealId)};
            const favouriteMeal = await mealsCollection.findOne(id);
            console.log(favouriteMeal);
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
     console.log("This is favourite:",favouriteData);
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
            const result = await favouritesCollection.find(filter).toArray();
            res.send(result)
           }
          }
          catch{
            res.status(500).send({message:"Internal Server Error"})
          }
        })
        // delet from favourites
        app.delete('/favourite-meals/:id', async(req,res) => {
            const id = req.params.id; 
            console.log("From delet favourite:",id); 
            if(id){
          try{
            const filter = {_id: new ObjectId(id)};
            const result = await favouritesCollection.deleteOne(filter);
            console.log(result);
            res.send(result)
          }
          catch{
            res.status(500).send({message:"Internal Server Error"})
          }
            }
    })
    }
    catch{
        console.log("Something went wrong")
    }
}

module.exports = {run};