const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const upload = multer();

dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());
app.set('view-engine', 'ejs');

const port = process.env.PORT || 4000;

app.get('/api/checkout', (_req, res) => {
  res.status(200).render('checkout.ejs');
});

app.get('/api/success', (_req, res) => {
  res.status(200).render('success.ejs');
});

app.get('/api/cancel', (_req, res) => {
  res.status(200).render('cancel.ejs');
});

app.post('/api/createCheckoutSession', upload.none(), async (req, res) => {
  try {
    let { name, description, price, quantity } = req.body;

    if (!(name && description && price && quantity)) {
      throw new Error('Please provide all the details');
    }

    price = Number(price);
    quantity = Number(quantity);

    if (isNaN(price) || price <= 0) {
      throw new Error('Price should be a positive number');
    }

    if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Quantity should be a positive integer');
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name,
              description,
            },
            unit_amount: price * 100,
          },
          quantity,
        },
      ],
      mode: 'payment',
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      customer_email: 'shubhampurwar35@gmail.com',
      success_url: 'http://localhost:4000/api/success',
      cancel_url: 'http://localhost:4000/api/cancel',
    });

    res.redirect(303, session.url);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
