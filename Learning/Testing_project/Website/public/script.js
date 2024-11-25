// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, onChildAdded, onValue, query, orderByKey, limitToLast, get, set } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAzBDFA3CBKidV3p0SGPO4qwypw5xhRxg4",
    authDomain: "iot-testing-e3617.firebaseapp.com",
    databaseURL: "https://iot-testing-e3617-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "iot-testing-e3617",
    storageBucket: "iot-testing-e3617.firebasestorage.app",
    messagingSenderId: "373986598271",
    appId: "1:373986598271:web:0af0d2f61ac0e0a527ce4a"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Tham chiếu đến dữ liệu trong Realtime Database
const dbRef = ref(database, 'ESP32/test/send');
const dataRef = ref(database, 'ESP32/test/recieve');

// Tạo truy vấn để lấy dữ liệu mới nhất
const latestDataQuery = query(dbRef, orderByKey(), limitToLast(1));
let latestData = null;

// Biến lưu dữ liệu cho biểu đồ
let labels = []; // Thời gian
let chart_data = [];   // Giá trị nhiệt độ
// Lấy dữ liệu và hiển thị
const temperatureElement = document.getElementById('temperature');
const humidityElement = document.getElementById('humidity');

let lastDataTimestamp = null;
const connectionStatusElement = document.getElementById('connection-status');
const toggleSwitch = document.getElementById('toggle-switch');

function updateConnectionStatus() {
    const now = Date.now();
    if (lastDataTimestamp && (now - lastDataTimestamp) <= 60000) {
        connectionStatusElement.textContent = 'Trạng thái kết nối: Online';
        connectionStatusElement.style.color = 'green';
    } else {
        connectionStatusElement.textContent = 'Trạng thái kết nối: Offline';
        connectionStatusElement.style.color = 'red';
    }
}

setInterval(updateConnectionStatus, 1000);

// Lắng nghe và cập nhật dữ liệu theo thời gian thực
onValue(latestDataQuery, (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        const latestKey = Object.keys(data)[0];  // Lấy key mới nhất
        const latestValue = data[latestKey];     // Lấy giá trị tương ứng

        // Kiểm tra dữ liệu
        if (data) {

            // Hiển thị nhiệt độ và độ ẩm
            temperatureElement.textContent = `${latestValue.temperature} °C`;
            humidityElement.textContent = `${latestValue.humidity} %`;
        } else {
            dataList.innerHTML = '<li>No data available</li>';
        }
        // Cập nhật biến toàn cục
        latestData = {
            key: latestKey,
            ...latestValue,  // Trích xuất các thuộc tính (vd: temperature, humidity)
        };
        lastDataTimestamp = Date.now();
        console.log('Dữ liệu mới nhất (đã cập nhật):', latestData);

        // Thêm dữ liệu vào biểu đồ
        labels.push(latestData.timestamp); // Timestamp
        chart_data.push(latestData.temperature); // Nhiệt độ
        updateChart(); // Cập nhật biểu đồ

    } else {
        console.log('Không có dữ liệu!');
    }
}, (error) => {
    console.error('Lỗi khi lắng nghe dữ liệu:', error);
});

toggleSwitch.addEventListener('change', (event) => {
    if (event.target.checked) {
        console.log('Switch is ON');
        set(dataRef,'ON').then(() => {
            console.log('Dữ liệu đã được cập nhật vào "recieve"!');
        }).catch((error) => {
            console.error('Lỗi khi cập nhật dữ liệu:', error);
        });
    } else {
        console.log('Switch is OFF');
        set(dataRef,'OFF').then(() => {
            console.log('Dữ liệu đã được cập nhật vào "recieve"!');
        }).catch((error) => {
            console.error('Lỗi khi cập nhật dữ liệu:', error);
        });
    }
});

// Tạo biểu đồ bằng Chart.js
const ctx = document.getElementById("tempChart").getContext("2d");
const chart = new Chart(ctx, {
    type: "line",
    data: {
        labels: labels,
        datasets: [
            {
                label: "Nhiệt độ theo thời gian",
                data: chart_data,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
            },
        ],
    },
    options: {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute',
                    stepSize: 60,
                    displayFormats: {
                        minute: 'HH:mm'
                    },
                    tooltipFormat: 'HH:mm',
                    // timezone: 'Asia/Ho_Chi_Minh' // Adjust the timezone
                },
                title: {
                    display: true,
                    text: "Thời gian"
                }
            },
            y: {
                title: {
                    display: true,
                    text: "Nhiệt độ (°C)"
                }
            }
        },
    },
});

// Hàm cập nhật biểu đồ
function updateChart() {
    chart.update(); // Cập nhật biểu đồ mỗi khi có dữ liệu mới
}
