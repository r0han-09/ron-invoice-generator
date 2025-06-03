const crypto = require('crypto');
const querystring = require('querystring');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const scopes = process.env.SCOPES;
const host = process.env.HOST;

exports.startAuth = (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send("Missing shop parameter");

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${host}/auth/callback`;

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&state=${state}&redirect_uri=${redirectUri}`;

  res.redirect(installUrl);
};

exports.authCallback = async (req, res) => {
  const { shop, hmac, code } = req.query;
  const map = { ...req.query };
  delete map['hmac'];
  delete map['signature'];

  const message = querystring.stringify(map);
  const generatedHash = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');

  if (generatedHash !== hmac) {
    return res.status(400).send('HMAC validation failed');
  }

  try {
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: apiKey,
      client_secret: apiSecret,
      code
    });

    const accessToken = tokenRes.data.access_token;

    // For now, just show success
    res.redirect(`/frontend.html?shop=${shop}`);
  } catch (error) {
    res.status(500).send('Failed to get access token');
  }
};