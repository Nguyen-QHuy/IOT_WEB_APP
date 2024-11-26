/*ESP32 gửi thông tin nhiệt độ, độ ẩm, và thời gian mỗi 30s lên MQTT
  Đồng thời bật tắt relay khi có thông tin gửi về từ MQTT*/


#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

#define DHTPIN 15
#define DHTTYPE DHT11
#define Relay 13

DHT dht(DHTPIN, DHTTYPE);

float temperature = 0;
float humidity = 0;

// Thông tin WiFi
// const char* ssid = "KTXB-B5678"; // Thay bằng tên WiFi của bạn
const char *ssid = "ESP32";        // Thay bằng tên WiFi của bạn
const char *password = "12345678"; // Thay bằng mật khẩu WiFi

// Thông tin MQTT Broker (HiveMQ)
const char *mqtt_server = "4cb3815dfd304d4caecd7b179ed57fae.s1.eu.hivemq.cloud"; // Địa chỉ HiveMQ public broker
const int mqtt_port = 8883;                                                      // Cổng mã hóa
const char *mqtt_username = "ESP32_1";                                           // Username đã ghi nhớ
const char *mqtt_password = "Client001";                                         // Password đã ghi nhớ
const char *mqtt_publish_topic = "ESP32/test/send";                              // Topic để gửi dữ liệu
const char *mqtt_subscribe_topic = "ESP32/test/recieve";                         // Topic để nhận dữ liệu

// Tạo đối tượng WiFi và MQTT client
WiFiClientSecure espClient;
PubSubClient client(espClient);
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 7 * 3600); // GMT+7 (nếu ở Việt Nam)

// Kết nối WiFi
void setupWiFi()
{
  Serial.println("Đang kết nối WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi đã kết nối!");
}

// Hàm callback xử lý khi nhận tin nhắn từ MQTT
void callback(char *topic, byte *payload, unsigned int length)
{
  Serial.print("Nhận tin nhắn từ topic: ");
  Serial.println(topic);

  Serial.print("Nội dung: ");
  for (int i = 0; i < length; i++)
  {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // Xử lý tin nhắn, ví dụ: bật/tắt quạt
  String message = String((char *)payload).substring(0, length);
  if (message == "ON")
  {
    digitalWrite(Relay, 1);
    Serial.println("Quạt bật");
    // Điều khiển thiết bị tại đây
  }
  else if (message == "OFF")
  {
    digitalWrite(Relay, 0);
    Serial.println("Quạt tắt");
    // Điều khiển thiết bị tại đây
  }
}

// Kết nối MQTT broker với thông tin xác thực
void reconnectMQTT()
{
  while (!client.connected())
  {
    Serial.println("Đang kết nối tới MQTT broker...");
    // Kết nối với username và password
    String clientId = "ESP32Client-" + String(WiFi.macAddress());
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password))
    {
      Serial.println("Đã kết nối MQTT!");

      // Đăng ký topic để nhận dữ liệu
      client.subscribe(mqtt_subscribe_topic);
      Serial.println("Đã đăng ký topic: ESP32/test/recieve");
    }
    else
    {
      Serial.print("Kết nối thất bại, mã lỗi: ");
      Serial.println(client.state());
      Serial.println("Thử lại sau 5 giây...");
      delay(5000);
    }
  }
}

void setup()
{
  Serial.begin(115200);
  pinMode(DHTPIN, INPUT);
  pinMode(Relay, OUTPUT);
  pinMode(2, OUTPUT);

  setupWiFi();
  espClient.setInsecure(); // Bỏ qua kiểm tra chứng chỉ SSL

  timeClient.begin();
  timeClient.update();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback); // Đăng ký hàm callback để xử lý tin nhắn

  dht.begin();
}

void loop()
{
  if (!client.connected())
  {
    reconnectMQTT();
  }
  client.loop();

  // Gửi dữ liệu định kỳ lên MQTT broker
  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > 30000)
  { // Mỗi 30 giây gửi 1 lần
    lastMsg = now;
    digitalWrite(2, 1); // Bật đèn LED
    // Cập nhật thời gian thực từ NTP
    timeClient.update();
    unsigned long currentTime = timeClient.getEpochTime(); // Thời gian tính từ 1/1/1970

    float h = dht.readHumidity();
    float t = dht.readTemperature(); // Đọc nhiệt độ
    if (isnan(h) || isnan(t))
    {
      Serial.println("Lỗi đọc dữ liệu từ sensor DHT11");
      return;
    }
    Serial.print("Nhiệt độ: ");
    Serial.print(t);
    Serial.print("°C, Độ ẩm: ");
    Serial.print(h);
    Serial.println("%");

    // Create JSON object
    JsonDocument jsonDoc;
    jsonDoc["temperature"] = t;
    jsonDoc["humidity"] = h;
    jsonDoc["timestamp"] = currentTime;

    // Convert JSON object to string
    char jsonBuffer[256];
    serializeJsonPretty(jsonDoc, jsonBuffer);

    // Publish JSON string
    Serial.print("Gửi dữ liệu JSON: ");
    Serial.println(jsonBuffer);
    client.publish(mqtt_publish_topic, jsonBuffer);
    digitalWrite(2, 0); // Tắt đèn LED
  }
}
