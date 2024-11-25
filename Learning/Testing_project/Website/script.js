// Cấu hình Firebase
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, onChildAdded, onValue } = require("firebase/database");


// Firebase Config
const firebaseConfig = {
apiKey: "AIzaSyAzBDFA3CBKidV3p0SGPO4qwypw5xhRxg4",
  authDomain: "iot-testing-e3617.firebaseapp.com",
  databaseURL: "https://iot-testing-e3617-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iot-testing-e3617",
  storageBucket: "iot-testing-e3617.firebasestorage.app",
  messagingSenderId: "373986598271",
  appId: "1:373986598271:web:0af0d2f61ac0e0a527ce4a"
};

// Khởi tạo Firebase app và Database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Tham chiếu tới đường dẫn nhiệt độ trong Firebase
const tempRef = ref(database, "ESP32/test/send/temperature");

// Biến lưu dữ liệu cho biểu đồ
let labels = []; // Thời gian
let data = [];   // Giá trị nhiệt độ

// Lắng nghe dữ liệu từ Firebase
onChildAdded(tempRef, (snapshot) => {
  const value = snapshot.val();
  labels.push(value.timestamp); // Timestamp
  data.push(value.temperature); // Nhiệt độ
  updateChart(); // Cập nhật biểu đồ
});

// Tham chiếu tới đường dẫn dữ liệu
const dataRef = ref(database, 'ESP32/test/send');

// Lắng nghe và lấy dữ liệu
onValue(dataRef, (snapshot) => {
  const data = snapshot.val(); // Dữ liệu trả về

  console.log('Dữ liệu từ Firebase:', data.temperature);

  // Hiển thị dữ liệu trên giao diện
  document.getElementById("output").innerText = JSON.stringify(data.temperature, null, 2);
});

// // Cập nhật dữ liệu
// import { set, ref } from "firebase/database";

// // Ghi dữ liệu vào đường dẫn
// const writeData = (path, data) => {
//   set(ref(database, path), data)
//     .then(() => {
//       console.log('Dữ liệu đã được ghi thành công');
//     })
//     .catch((error) => {
//       console.error('Lỗi khi ghi dữ liệu:', error);
//     });
// };

// Ghi dữ liệu mẫu
// writeData('path/to/your/data', { name: "John", age: 30 });

