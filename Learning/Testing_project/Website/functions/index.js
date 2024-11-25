/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
// Import 
const admin = require('firebase-admin');
const mqtt = require('mqtt');

// Sử dụng dotenv để lấy thông tin MQTT từ file .env
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

// Sử dụng Realtime Database
const db = admin.database();

// Kết nối tới HiveMQ broker
const mqttClient = mqtt.connect(mqttBroker, {
  port: mqttPort,
  username: mqttUser,
  password: mqttPass,
});

// Biến để theo dõi trạng thái xử lý
let isProcessingFromMQTT = false;
let isProcessingFromFirebase = false;

// Sự kiện kết nối MQTT
mqttClient.on('connect', () => {
  console.log('Đã kết nối HiveMQ');
  
  // Subscribe tất cả các topic của ESP32/test
  mqttClient.subscribe('ESP32/test/#', (err) => {
    if (!err) {
      console.log('Đã subscribe topic: ESP32/test/#');
    } else {
      console.error('Lỗi khi subscribe:', err);
    }
  });
});

// Lắng nghe sự thay đổi từ `ESP32/test/recieve` trên Firebase
const recieveRef = db.ref('ESP32/test/recieve');
recieveRef.on('value', (snapshot) => {
  if (isProcessingFromMQTT) {
    // Bỏ qua nếu thay đổi đến từ MQTT
    console.log('Bỏ qua dữ liệu từ Firebase (do thay đổi từ MQTT)');
    return;
  }

  const data = snapshot.val();
  if (data !== null) {
    console.log('Nhận dữ liệu từ recieve:', data);

    isProcessingFromFirebase = true; // Đặt cờ xử lý từ Firebase

    // Gửi dữ liệu tới MQTT topic `ESP32/test/recieve`
    mqttClient.publish('ESP32/test/recieve', data, { qos: 1 }, (err) => {
      if (err) {
        console.error('Lỗi khi gửi dữ liệu tới MQTT:', err);
      } else {
        console.log('Đã gửi dữ liệu từ recieve tới MQTT:', data);
      }
      isProcessingFromFirebase = false; // Xóa cờ sau khi xử lý
    });
  } else {
    console.log(`Dữ liệu không hợp lệ: ${data}. Chỉ chấp nhận "ON" hoặc "OFF".`);
  }
}, (error) => {
  console.error('Lỗi khi theo dõi recieve:', error);
});

// Lắng nghe tin nhắn từ MQTT và lưu vào Firebase
mqttClient.on('message', (topic, message) => {
  if (isProcessingFromFirebase) {
    // Bỏ qua nếu thay đổi đến từ Firebase
    console.log('Bỏ qua dữ liệu từ MQTT (do thay đổi từ Firebase)');
    return;
  }

  console.log(`Nhận dữ liệu từ topic ${topic}: ${message}`);
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (e) {
    data = { value: message.toString() }; // Nếu không phải JSON, lưu dạng chuỗi
  }
    // Chuyển đổi timestamp từ epoch sang ISO
    if (data.timestamp) {
      const date = new Date(data.timestamp * 1000); // Chuyển đổi từ giây sang mili giây
      data.timestamp = date.toISOString(); // Chuyển đổi sang định dạng ISO
    }

  // Lưu dữ liệu vào Firebase theo đúng cấu trúc topic
  const ref = db.ref(topic.replace(/\//g, '/')); 
  isProcessingFromMQTT = true; // Đặt cờ xử lý từ MQTT
  ref.push(data, (error) => {
    if (error) {
      console.error('Lỗi lưu dữ liệu vào Firebase:', error);
    } else {
      console.log(`Dữ liệu từ topic ${topic} đã được lưu vào Firebase.`);
    }
    isProcessingFromMQTT = false; // Xóa cờ sau khi xử lý
  });
});

