// Import 
const admin = require('firebase-admin');
const mqtt = require('mqtt');

//comment doan code duoi day neu khong dung file .env de chua thong tin MQTT
require('dotenv').config();
const mqttBroker = process.env.MQTT_BROKER;
const mqttPort = process.env.MQTT_PORT;
const mqttUser = process.env.MQTT_USER;
const mqttPass = process.env.MQTT_PASS;

// Cấu hình Firebase
const serviceAccount = require('./iot-testing-e3617-firebase-adminsdk-n9xo2-0d141ebcc1.json');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://iot-testing-e3617-default-rtdb.asia-southeast1.firebasedatabase.app"
  });

// Chọn Realtime Database hoặc Firestore
const db = admin.database(); // Dùng Realtime Database
// const firestore = admin.firestore(); // Dùng Firestore

// Kết nối tới HiveMQ broker
const mqttClient = mqtt.connect(mqttBroker, {
  port: mqttPort,
  username: mqttUser,
  password: mqttPass,
});

mqttClient.on('connect', () => {
  console.log('Đã kết nối HiveMQ');
  mqttClient.subscribe('ESP32/#', (err) => {
    if (!err) {
      console.log('Đã subscribe topic: ESP32/#');
    } else {
      console.error('Lỗi khi subscribe:', err);
    }
  });
});

mqttClient.on('message', (topic, message) => {
  console.log(`Nhận dữ liệu từ topic ${topic}: ${message}`);

  // Chuyển đổi dữ liệu thành JSON nếu cần
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (e) {
    data = { value: message.toString() }; // Nếu không phải JSON, lưu dạng chuỗi
  }

  // Lưu dữ liệu vào Firebase Realtime Database

  const ref = db.ref(topic); 
  ref.set(data, (error) => {
    if (error) {
      console.error('Lỗi lưu dữ liệu vào Firebase:', error);
    } else {
      console.log('Dữ liệu đã được lưu vào Firebase.');
    }
  });

});
