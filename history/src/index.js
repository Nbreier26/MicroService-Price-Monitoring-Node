const mongoose = require('mongoose');
const { startHistoryConsumer } = require('./consumer');

async function start() {
  try {
    await mongoose.connect('mongodb://mongo:27017/precos', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado ao MongoDB');

    startHistoryConsumer();
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
  }
}

start();
