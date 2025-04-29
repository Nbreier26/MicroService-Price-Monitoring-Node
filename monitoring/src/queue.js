const amqp = require('amqplib');
const mongoose = require('mongoose');
const PriceHistory = require('./models/PriceHistory');

async function startConsumer() {
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
    await channel.assertQueue('price_alert_queue', { durable: true });

    channel.consume('product_monitoring_queue', async (msg) => {
      if (msg !== null) {
        try {
          const product = JSON.parse(msg.content.toString());
          console.log('Monitoring product:', product.id);

          const productId = new mongoose.Types.ObjectId(product.id);

          const latestHistory = await PriceHistory.findOne({ productId }).sort({ timestamp: -1 });

          let shouldAlert = false;
          let percentageDifference = 0;

          if (latestHistory) {
            const previousPrice = latestHistory.price;
            const currentPrice = product.price;

            if (previousPrice === 0) {
              percentageDifference = currentPrice !== 0 ? Infinity : 0;
            } else {
              const difference = Math.abs(currentPrice - previousPrice);
              percentageDifference = (difference / previousPrice) * 100;
            }

            if (percentageDifference > 10) {
              shouldAlert = true;
            }
          }

          const newPriceHistory = new PriceHistory({
            productId,
            price: product.price
          });
          await newPriceHistory.save();

          const alertMsg = {
              productId: product.id,
              oldPrice: product.price,
              newPrice: product.price,
              percentageChange: percentageDifference.toFixed(2),
              message: `Alerta de preço para ${product.name}: ${percentageDifference.toFixed(2)}% de variação`
            };
          //bypass para sempre acionar o notificação para teste
          channel.sendToQueue(
            'price_alert_queue',
            Buffer.from(JSON.stringify(alertMsg)),
            { persistent: true }
          );

          if (shouldAlert) {
            const alertMsg = {
              productId: product.id,
              oldPrice: latestHistory.price,
              newPrice: product.price,
              percentageChange: percentageDifference.toFixed(2),
              message: `Alerta de preço para ${product.name}: ${percentageDifference.toFixed(2)}% de variação`
            };
            channel.sendToQueue(
              'price_alert_queue',
              Buffer.from(JSON.stringify(alertMsg)),
              { persistent: true }
            );
            console.log('Alerta publicado:', alertMsg.message);
          }

          channel.ack(msg);
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
          channel.nack(msg, false, false);
        }
      }
    });

    console.log('Monitoramento iniciado ✅');
  } catch (error) {
    console.error('Erro no serviço de monitoramento:', error);
    setTimeout(startConsumer, 5000);
  }
}

module.exports = { startConsumer };