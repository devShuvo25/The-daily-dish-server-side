const admin = require("../config/firebase.config");
const verifyUser = async (req, res, next) => {
  try{
    const idToken = req.headers.authorization;
    console.log("ID Token:", idToken);
  if(!idToken){
    return res.status(401).send({ message: "Unauthorized: No token provided" });
  }
  const token = idToken.split(" ")[1];
  try {
    const decodedToken = await admin.admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.log('Errot from JWR',error);
    return res.status(401).send({ message: "Unauthorized: Invalid token" ,});
  }
  }
  catch{
    return res.status(500).send({ message: "Internal Server Error" });
  }
  
}
exports.verifyUser = verifyUser;