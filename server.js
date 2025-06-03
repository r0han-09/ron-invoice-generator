
const puppeteer = require('puppeteer');

require('dotenv').config();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const auth = require('./auth');





const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public')); // Serve frontend.html

function getOrderById(id) {
  return {
    id,
    customer: {
      name: "John Doe",
      address: "123 Main St, NY, USA"
    },
    items: [
      { title: "T-Shirt", quantity: 2, price: 20 },
      { title: "Cap", quantity: 1, price: 10 }
    ],
    total: 50,
    date: new Date().toLocaleDateString()
  };
}

function renderInvoiceHTML(order) {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 40px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Invoice #${order.id}</h1>
        <p>Date: ${order.date}</p>
        <p>Customer: ${order.customer.name}</p>
        <p>Address: ${order.customer.address}</p>
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.title}</td>
                <td>${item.quantity}</td>
                <td>$${item.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <h3>Total: $${order.total}</h3>
        <div class="footer">Thank you for shopping with us!</div>
      </body>
    </html>
  `;
}

app.get('/api/invoice/:id', async (req, res) => {
  const order = getOrderById(req.params.id);
  const html = renderInvoiceHTML(order);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();

  res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
  res.contentType("application/pdf");
  res.send(pdf);
});

app.use(cookieParser());
app.use(session({ secret: 'ron-secret', resave: false, saveUninitialized: true }));

app.get('/auth', auth.startAuth);
app.get('/auth/callback', auth.authCallback);

app.get('/', (req, res) => {
  res.redirect('/frontend.html');
});


app.get('/api/invoice/:id', async (req, res) => {
  try {
    const order = {
      id: req.params.id,
      customer: {
        name: "John Doe",
        address: "123 Main St, New York, USA"
      },
      items: [
        { title: "T-Shirt", quantity: 2, price: 20 },
        { title: "Cap", quantity: 1, price: 10 }
      ],
      total: 50,
      date: new Date().toLocaleDateString()
    };

    const html = `
      <html>
      <head><style>
        body { font-family: Arial; padding: 40px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
      </style></head>
      <body>
        <h1>Invoice #${order.id}</h1>
        <p>Date: ${order.date}</p>
        <p>Customer: ${order.customer.name}</p>
        <p>Address: ${order.customer.address}</p>
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.title}</td>
                <td>${item.quantity}</td>
                <td>$${item.price}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <h3>Total: $${order.total}</h3>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    res.contentType("application/pdf");
    res.send(pdf);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).send('Failed to generate PDF');
  }
});

app.listen(port, () => console.log(`RON Invoice Generator running at http://localhost:${port}`));