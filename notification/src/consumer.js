const amqp = require('amqplib');

async function startNotificationConsumer() {
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

    await channel.assertQueue('price_alert_queue', { durable: true });

    console.log('🔔 Aguardando alertas de preço...');

    channel.consume('price_alert_queue', (msg) => {
      if (msg !== null) {
        try {
          const alert = JSON.parse(msg.content.toString());

          console.log('\n🔔 Notificação de Preço:\n', {
            Produto: alert.productId,
            De: alert.oldPrice,
            Para: alert.newPrice,
            Variação: `${alert.percentageChange}%`,
            Mensagem: alert.message,
          });

          channel.ack(msg);
        } catch (err) {
          console.error('Erro ao processar alerta:', err);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error('Erro no serviço de notificação:', error);
    setTimeout(startNotificationConsumer, 5000);
  }
}

module.exports = { startNotificationConsumer };
