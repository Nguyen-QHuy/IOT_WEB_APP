# I. Tạo MQTT broker và Firebase
## 1. Tạo MQTT broker với HIveMQ:
1. Đăng ký tài khoản HiveMQ cloud tại [đây](https://www.hivemq.com/company/get-hivemq/)
2. Chọn "**Create new clusster**"
3. Tại Cluster free vừa tạo, truy cập "Access Management --> Authentication --> Edit --> Add new credential"
4. Tạo một Username và password để truy cập đến broker sau này

## 2. Tạo Project Firebase
1. Truy cập [Firebase](https://firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Nhấn **Get Started**, sau đó nhấn **Add project** để tạo một dự án mới.
3. Đặt tên cho dự án của bạn.
4. **Tắt** tùy chọn "Enable Google Analytics for this project" (vì không cần thiết) và nhấn **Create project**.
5. Nhấn **Continue** để được chuyển hướng đến trang điều khiển của dự án (Project console page).
6. Ở thanh bên trái, nhấn vào **Authentication**, sau đó nhấn **Get started**.
7. Để mục đích thử nghiệm, chọn **Anonymous user** (cho phép xác thực mà không cần người dùng đăng nhập bằng cách tạo các tài khoản ẩn danh tạm thời).
8. Bật tùy chọn này và nhấn **Save**.

## 2. Tạo Realtime Database
1. Ở thanh bên trái, nhấn vào **Realtime Database**, sau đó nhấn **Create Database**.
2. Chọn vị trí cơ sở dữ liệu. Vị trí này nên là nơi gần bạn nhất.
3. Cài đặt các quy tắc bảo mật cho cơ sở dữ liệu: Để thử nghiệm, chọn **Start in test mode**.

# II. Kết nối phần cứng ESP32

| **ESP32 Pin** | **DHT11** | **Relay** |
|---------------|-----------|-----------|
| Vin           | +         | +         |
| GND           | -         | -         |
| GPIO 13       |           | S         |
| GPIO 15       | S         |           |

# III. Kết nối ESP32 với MQTT
Lấy [code ESP32](https://github.com/Nguyen-QHuy/IOT_WEB_APP/blob/main/Learning/Testing_project/Client/Esp32_Client/src/main.cpp) và thay đổi đoạn code phía dưới bằng thông tin wifi và HiveMQ của bạn.
``` C++
const char *ssid = "SSID";        // Thay bằng tên WiFi của bạn
const char *password = "PASSWORD"; // Thay bằng mật khẩu WiFi

// Thông tin MQTT Broker (HiveMQ)
const char *mqtt_server = "Your_HiveMQ_URL"; // Địa chỉ HiveMQ public broker
const int mqtt_port = 8883;                                                      // Cổng mã hóa
const char *mqtt_username = "Your_username";                                           // Username đã ghi nhớ
const char *mqtt_password = "Your_password";                                         // Password đã ghi nhớ
const char *mqtt_publish_topic = "Your_publish_topic";                              // Topic để gửi dữ liệu
const char *mqtt_subscribe_topic = "Your_subscribe_topic";                         // Topic để nhận dữ liệu
```

# IV. Kết nối MQTTT với Firebase

## 1. Cài đặt Node.js
  - Tải và cài đặt [Node.js](https://nodejs.org/en)
  - Để kiểm tra đã cài đặt thành công Node.js và npm hay chưa: Mở Powershell và dán lệnh
```
  node -v
  npm -v
```
![image](https://github.com/user-attachments/assets/f562c076-e925-47de-bb99-ba7936ab23da)
> Nếu Powershell trả về số phiên bản của node và npm là thành công, nếu không được hãy cài đặt lại Node.js

## 2. Cài đặt thư viện:
  - `mqtt`: Để kết nối HiveMQ broker.
  - `firebase-admin`: Để kết nối Firebase.
  - `dotenv`: Để chứa các thông tin đăng nhập MQTT để tránh bị lộ (có thể không cài) 
Mở Terminal hoặc Powershel trỏ đén Folder chứa dự án (sử dụng lệnh `cd <đường dẫn>) và nhập lệnh dưới để cài đặt thư viện:
```
npm install mqtt firebase-admin
```
## 3. Cấu hình Firebase
- Tải xuống tệp JSON khóa dịch vụ:
    - Trong Firebase Console, vào Project Settings > Service Accounts.
    - Nhấn Generate New Private Key và tải tệp JSON về.
    - Thêm tệp JSON vào dự án Node.js:
- Đặt tệp JSON vào thư mục dự án, ví dụ: firebase-admin.json.
## 4. Code:
Lấy code [MQTT-Firebase](https://github.com/Nguyen-QHuy/IOT_WEB_APP/blob/main/Learning/Testing_project/Website/MQTT.js) và thay đổi các thông tin dưới đây
``` Javascript
// Sử dụng dotenv để lấy thông tin MQTT từ file .env
require('dotenv').config();
const mqttBroker = process.env.MQTT_BROKER;
const mqttPort = process.env.MQTT_PORT;
const mqttUser = process.env.MQTT_USER;
const mqttPass = process.env.MQTT_PASS;

// Cấu hình Firebase
const serviceAccount = require('Your/path/to/firebase-admin.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "Your_databaseURL"
});
```
> [!IMPORTANT]
> Thay đổi thành topic mà ESP32 bạn đang sử đụng
``` JS
// Sự kiện kết nối MQTT
mqttClient.on('connect', () => {
  console.log('Đã kết nối HiveMQ');
  
  // Subscribe tất cả các topic của Your/topic
  mqttClient.subscribe('Your/topic/#', (err) => {
    if (!err) {
      console.log('Đã subscribe topic: Your/topic/#');
    } else {
      console.error('Lỗi khi subscribe:', err);
    }
  });
});
```
> [!IMPORTANT]
> Thay đổi đường dẫn Firebase trong đoạn code sau cho đúng với cấu trúc Firebase của bạn
```JS
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
```
> [!TIP]
> Nếu không chạy được file node.js này, mở Powershell dùng `cd` chuyển đường dẫn đến folder chứa file và chạy lệnh `node Your_file.js`
# V. Cấu hình trang web lấy dữ liệu từ firease
# VI. Firebase Hosting
