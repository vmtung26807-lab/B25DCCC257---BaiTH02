import { useState, useEffect, useMemo } from "react";
import "./App.css";

// Danh sách 8 thành phố theo đúng tọa độ đề bài
const CITIES = [
  { id: "hanoi", name: "Hà Nội", lat: 21.0285, lon: 105.8542 },
  { id: "haiphong", name: "Hải Phòng", lat: 20.8449, lon: 106.6881 },
  { id: "hue", name: "Huế", lat: 16.4637, lon: 107.5909 },
  { id: "danang", name: "Đà Nẵng", lat: 16.0544, lon: 108.2022 },
  { id: "nhatrang", name: "Nha Trang", lat: 12.2388, lon: 109.1967 },
  { id: "dalat", name: "Đà Lạt", lat: 11.9404, lon: 108.4583 },
  { id: "hcm", name: "TP. Hồ Chí Minh", lat: 10.8231, lon: 106.6297 },
  { id: "cantho", name: "Cần Thơ", lat: 10.0452, lon: 105.7469 },
];

// Hàm ánh xạ mã thời tiết WMO (weather_code) sang biểu tượng, mô tả và theme nền
const getWeatherInfo = (code) => {
  if (code === 0)
    return { icon: "☀️", desc: "Trời quang", theme: "theme-clear" };
  if (code === 1 || code === 2)
    return { icon: "⛅", desc: "Ít mây", theme: "theme-cloudy" };
  if (code === 3)
    return { icon: "☁️", desc: "Nhiều mây", theme: "theme-cloudy" };
  if (code === 45 || code === 48)
    return { icon: "🌫️", desc: "Sương mù", theme: "theme-cloudy" };
  if (code >= 51 && code <= 57)
    return { icon: "🌦️", desc: "Mưa phùn", theme: "theme-rain" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { icon: "🌧️", desc: "Có mưa", theme: "theme-rain" };
  if (code >= 95)
    return { icon: "⛈️", desc: "Giông bão", theme: "theme-storm" };
  return { icon: "🌤️", desc: "Thời tiết ổn định", theme: "theme-default" };
};

// Hàm bỏ dấu tiếng Việt để tìm kiếm (Yêu cầu nâng cao)
const removeAccents = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

export default function App() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState("C"); // 'C' hoặc 'F' (YC5)
  const [searchTerm, setSearchTerm] = useState("");

  // Lưu danh sách thành phố yêu thích vào localStorage (Nâng cao)
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorite_cities");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("favorite_cities", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e, cityId) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId]
    );
  };

  // Gọi API lấy dữ liệu thời tiết
  const fetchWeather = async (city) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FHo_Chi_Minh&forecast_days=7`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu thời tiết từ máy chủ.");
      }
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    fetchWeather(city);
  };

  // Chuyển đổi nhiệt độ °C <-> °F không gọi lại API (YC5)
  const formatTemp = (tempC) => {
    if (tempC === undefined || tempC === null) return "--";
    if (unit === "F") {
      return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(tempC)}°C`;
  };

  // Định dạng thứ và ngày cho dự báo 7 ngày (YC3)
  const formatDayAndDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const dayName = days[date.getDay()];
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    return { dayName, formattedDate };
  };

  // Lọc danh sách thành phố không phân biệt dấu và ưu tiên yêu thích lên đầu
  const filteredCities = useMemo(() => {
    return CITIES.filter((city) =>
      removeAccents(city.name).includes(removeAccents(searchTerm))
    ).sort((a, b) => {
      const aFav = favorites.includes(a.id) ? -1 : 1;
      const bFav = favorites.includes(b.id) ? -1 : 1;
      return aFav - bFav;
    });
  }, [searchTerm, favorites]);

  // Xác định màu nền theo thời tiết hiện tại (Nâng cao)
  const currentTheme = weatherData?.current
    ? getWeatherInfo(weatherData.current.weather_code).theme
    : "theme-default";

  return (
    <div className={`app-wrapper ${currentTheme}`}>
      <header className="app-header">
        <h1>Dự Báo Thời Tiết Việt Nam</h1>
        <button
          className="unit-toggle-btn"
          onClick={() => setUnit((prev) => (prev === "C" ? "F" : "C"))}
        >
          Đơn vị: <strong>°{unit}</strong> (Đổi sang °{unit === "C" ? "F" : "C"})
        </button>
      </header>

      <main className="main-container">
        {/* CỘT TRÁI: Danh sách thành phố (YC1) */}
        <aside className="sidebar">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm thành phố (không cần gõ dấu)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <ul className="city-list">
            {filteredCities.map((city) => {
              const isSelected = selectedCity?.id === city.id;
              const isFav = favorites.includes(city.id);
              return (
                <li
                  key={city.id}
                  className={`city-item ${isSelected ? "active" : ""}`}
                  onClick={() => handleSelectCity(city)}
                >
                  <span>{city.name}</span>
                  <button
                    className={`fav-btn ${isFav ? "fav-active" : ""}`}
                    onClick={(e) => toggleFavorite(e, city.id)}
                    title="Đánh dấu yêu thích"
                  >
                    {isFav ? "★" : "☆"}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* CỘT PHẢI: Nội dung hiển thị thời tiết (YC2, YC3, YC4) */}
        <section className="content-area">
          {/* Trạng thái 1: Chưa chọn thành phố (YC4) */}
          {!selectedCity && (
            <div className="state-box">
              <p>👈 Vui lòng chọn một thành phố ở danh sách bên cạnh để xem thời tiết.</p>
            </div>
          )}

          {/* Trạng thái 2: Đang tải (YC4) */}
          {selectedCity && loading && (
            <div className="state-box">
              <div className="spinner"></div>
              <p>Đang tải dữ liệu thời tiết cho {selectedCity.name}...</p>
            </div>
          )}

          {/* Trạng thái 3: Lỗi + Nút thử lại (YC4) */}
          {selectedCity && !loading && error && (
            <div className="state-box error-box">
              <p>⚠️ Lỗi: {error}</p>
              <button
                className="retry-btn"
                onClick={() => fetchWeather(selectedCity)}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Hiển thị dữ liệu khi tải thành công (YC2 & YC3) */}
          {selectedCity && !loading && !error && weatherData && (
            <div className="weather-details">
              {/* Thời tiết hiện tại (YC2) */}
              <div className="current-weather-card">
                <div className="current-header">
                  <h2>{selectedCity.name}</h2>
                  <span className="update-time">
                    Cập nhật lúc:{" "}
                    {new Date(weatherData.current.time).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div className="current-body">
                  <div className="current-main">
                    <span className="weather-icon-large">
                      {getWeatherInfo(weatherData.current.weather_code).icon}
                    </span>
                    <div>
                      <div className="temp-large">
                        {formatTemp(weatherData.current.temperature_2m)}
                      </div>
                      <div className="weather-desc">
                        {getWeatherInfo(weatherData.current.weather_code).desc}
                      </div>
                    </div>
                  </div>

                  <div className="current-extra">
                    <div className="extra-item">
                      <span>💧 Độ ẩm</span>
                      <strong>{weatherData.current.relative_humidity_2m}%</strong>
                    </div>
                    <div className="extra-item">
                      <span>💨 Tốc độ gió</span>
                      <strong>{weatherData.current.wind_speed_10m} km/h</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dự báo 7 ngày (YC3) */}
              <div className="forecast-section">
                <h3>Dự báo 7 ngày tới</h3>
                <div className="forecast-grid">
                  {weatherData.daily.time.map((dateStr, index) => {
                    const { dayName, formattedDate } = formatDayAndDate(dateStr);
                    const code = weatherData.daily.weather_code[index];
                    const maxTemp = weatherData.daily.temperature_2m_max[index];
                    const minTemp = weatherData.daily.temperature_2m_min[index];
                    const info = getWeatherInfo(code);

                    return (
                      <div key={dateStr} className="forecast-card">
                        <div className="forecast-day">{dayName}</div>
                        <div className="forecast-date">{formattedDate}</div>
                        <div className="forecast-icon" title={info.desc}>
                          {info.icon}
                        </div>
                        <div className="forecast-temps">
                          <span className="temp-max" title="Cao nhất">
                            ↑ {formatTemp(maxTemp)}
                          </span>
                          <span className="temp-min" title="Thấp nhất">
                            ↓ {formatTemp(minTemp)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}