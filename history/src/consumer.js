const amqp = require('amqplib');
const PriceHistory = require('./models/PriceHistory');
const mongoose = require('mongoose');

async function startHistoryConsumer() {
  try {
    const connection = await amqp.connect({
      protocol: 'amqp',
      hostname: 'rabbitmq',
      port: 5672,
      username: 'guest',
      password: 'guest',
      frameMax: 8192,
    });
    const channel = await connection.createChannel();

    await channel.assertQueue('product_monitoring_queue', { durable: true });

    console.log('📦 Aguardando produtos para armazenar histórico...');

    channel.consume('product_monitoring_queue', async (msg) => {
      if (msg !== null) {
        try {
          const product = JSON.parse(msg.content.toString());
          console.log(`📝 Gravando histórico do produto ${product.name}`);

          const newHistory = new PriceHistory({
            productId: new mongoose.Types.ObjectId(product.id),
            price: product.price,
            timestamp: new Date(),
          });

          await newHistory.save();
          console.log('✅ Histórico salvo');

          channel.nack(msg);
        } catch (err) {
          console.error('Erro ao salvar histórico:', err);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error('Erro no serviço de histórico:', error);
    setTimeout(startHistoryConsumer, 5000);
  }
}

module.exports = { startHistoryConsumer };
