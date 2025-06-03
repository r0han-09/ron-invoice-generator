const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/invoice/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = {
      id: orderId,
      customer: { name: "John Doe", address: "123 Example St" },
      items: [
        { title: "T-Shirt", quantity: 2, price: 25 },
        { title: "Cap", quantity: 1, price: 15 }
      ],
      total: 65,
      date: new Date().toLocaleDateString()
    };

    const html = `
      <html><head><style>
        body { font-family: Arial; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
      </style></head><body>
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
              <tr><td>${item.title}</td><td>${item.quantity}</td><td>$${item.price}</td></tr>
            `).join('')}
          </tbody>
        </table>
        <h3>Total: $${order.total}</h3>
      </body></html>
    `;

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    res.contentType("application/pdf");
    res.send(pdf);
  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).send('PDF generation failed');
  }
});

app.get('/', (req, res) => {
  res.redirect('/frontend.html');
});

app.listen(port, () => {
  console.log(`RON Invoice Generator running on port ${port}`);
});