const express = require('express');
const mongoose = require('mongoose');
const { startConsumer } = require('./queue');

const app = express();

// Conexão com MongoDB
mongoose.connect("mongodb://mongo:27017/monitoring", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Conectado ao MongoDB para monitoramento');
  startConsumer();
})
.catch(err => console.error('Erro de conexão com MongoDB:', err));
