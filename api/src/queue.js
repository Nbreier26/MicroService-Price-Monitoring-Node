const amqp = require('amqplib');

let channel, connection;

async function connectQueue() {
  try {
    connection = await amqp.connect('amqp://rabbitmq');
    channel = await connection.createChannel();
    await channel.assertQueue('product_monitoring_queue');
  } catch (error) {
    console.error('Erro conectando na fila:', error);
  }
}

async function publishToQueue(message) {
  try {
    if (!channel) {
      await connectQueue();
    }
    channel.sendToQueue('product_monitoring_queue', Buffer.from(JSON.stringify(message)));
  } catch (error) {
    console.error('Erro publicando na fila:', error);
  }
}

module.exports = { publishToQueue };
