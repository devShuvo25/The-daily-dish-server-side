const Stripe = require("stripe");
const { client } = require("../config/database"); // import Mongo client if needed
const stripe = Stripe(process.env.STRIPE_SECRET); // must match .env key
console.log(process.env.STRIPE_SECRET);
const fetch = require('node-fetch');
const { ObjectId } = require("mongodb");

/**
 * @param {import('express').Express} app
 */
async function stripeRoutes(app) {
  const db = client.db("myDatabase");
  const ordersCollection = db.collection("ordersCollection");
  const paymentsCollection = db.collection('paymentsCollection')


async function getConversionRate() {
  const response = await fetch("https://v6.exchangerate-api.com/v6/c334fe63cfcba756f76dc089/latest/USD");
  const data = await response.json();
  console.log('Data from Conversion',data.conversion_rates.BDT);
  return data?.conversion_rates?.BDT; // current BDT → USD rate
}


  // Create a checkout session
  app.post("/create-checkout-session", async (req, res) => {
    try {
      const paymentInfo = req.body;
      console.log("PymentInfo",paymentInfo);
      const rate = await getConversionRate()
      if (!paymentInfo.amount || !paymentInfo.customer_email) {
        return res.status(400).send({ message: "Price and email are required" });
      }

      const amountExact = (parseInt(paymentInfo.amount) / rate) * 100; 

      const amount = Math.floor(amountExact)
      
      console.log(amountExact,amount);// Stripe expects cents
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
              name: paymentInfo.foodName || "Meal Order", 
              },
            },
            quantity: 1,
          },
        ],
        customer_email: paymentInfo.customer_email, // correct spelling
        mode: "payment",
        metadata: {
          parcelId: paymentInfo.parcelId,
        },
        success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}&id=${paymentInfo.parcelId}`,
        cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancel`,
      });

      console.log("Stripe Session Created:", session.id);
      console.log(session);
      res.send({ url: session.url });

    } catch (error) {
    //   console.error("Stripe checkout error:", error);
      res.status(500).send({ message: "Stripe checkout session failed", error });
    }
  });
app.patch('/payment-success', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent"],
    });
    
    if (session.payment_status !== 'paid') {
      return res.status(200).json({ message: "Payment not completed yet" });
    }

    const mealId = session.metadata.parcelId;
    if (!mealId) {
      return res.status(400).json({ message: "parcelId not found in session metadata" });
    }

    const filter = { _id: new ObjectId(mealId) };
    const updateDoc = { $set: { paymentStatus: "Paid" } };

    const result = await ordersCollection.updateOne(filter, updateDoc);
    const payment = {
      parcelId:session.metadata.parcelId,
      parcelName: session.metadata.parcelName,
      custommerEmail:session.customer_email,
      paymentStatus: session.payment_status,
      amount: session.amount_total,
      paidAt:session.created,
      transectionId: session.payment_intent
    }
    if(session.payment_status === 'paid'){
      const resultPayment = await paymentsCollection.insertOne(payment)
    }
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Order not found or already updated" });
    }

    // Success response
    res.status(200).json({ message: "Payment status updated successfully", result });
  } catch (error) {
    console.error("Error in /payment-success:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


}

module.exports = { stripeRoutes };
