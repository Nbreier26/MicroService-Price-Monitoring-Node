const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Product = require('./models');
const { publishToQueue } = require('./queue');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://mongo:27017/api', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Erro conectando no MongoDB:', err));

app.post('/products', async (req, res) => {
  const { name, url, price, ecommerce } = req.body;

  if (!name || !url || !price || !ecommerce) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const product = new Product({ name, url, price, ecommerce });
    await product.save();

    await publishToQueue({ id: product._id, name, url, price, ecommerce });

    res.status(201).json({ message: 'Produto salvo e publicado para monitoramento.', product });
  } catch (error) {
    console.error('Erro no POST /products:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
