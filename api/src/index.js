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

app.patch('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (!price) {
    return res.status(400).json({ message: 'O campo "price" é obrigatório.' });
  }

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { price },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    await publishToQueue({
      id: product._id,
      name: product.name,
      url: product.url,
      price: product.price,
      ecommerce: product.ecommerce,
    });

    res.status(200).json({ message: 'Preço atualizado e publicado para monitoramento.', product });
  } catch (error) {
    console.error('Erro no PATCH /products/:id:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
