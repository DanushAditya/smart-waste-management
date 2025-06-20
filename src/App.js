import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import axios from "axios";

const TELEGRAM_BOT_TOKEN = "8121553662:AAFJ0sh-wew2jK13BtlqgTZre3zwZ7nRUkM";
const TELEGRAM_CHAT_ID = "1652552014";

const containerStyle = { width: "100%", height: "400px", borderRadius: "10px" };

const App = () => {
  const webcamRef = useRef(null);

  // Login and Points State
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [userInput, setUserInput] = useState("");
  const [points, setPoints] = useState(Number(localStorage.getItem("points")) || 0);

  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState(null);
  const [wasteLevel, setWasteLevel] = useState(null);

  useEffect(() => {
    localStorage.setItem("username", username);
    localStorage.setItem("points", points);
  }, [username, points]);

  const handleCategorySelection = (selectedCategory) => {
    setCategory(selectedCategory);
  };

  const generateWasteLevel = () => Math.floor(Math.random() * 3) + 1;

  const addPoints = (value) => {
    const newPoints = points + value;
    setPoints(newPoints);
    localStorage.setItem("points", newPoints);
  };

  const capture = () => {
    setLoading(true);
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      const generatedLevel = generateWasteLevel();
      setWasteLevel(generatedLevel);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });
            sendToTelegram(imageSrc, latitude, longitude, generatedLevel);
            addPoints(10); // 👈 Add 10 points for reporting
          },
          (error) => {
            console.error("Location Error:", error);
            setLoading(false);
          }
        );
      }
    }
  };

  const sendToTelegram = async (image, lat, lng, level) => {
    try {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: `🚨 ${category} Issue Detected!\n📍 Location: [Google Maps](https://www.google.com/maps?q=${lat},${lng})\n⚠ Waste Level: ${level}`,
        parse_mode: "Markdown",
      });

      const blob = await fetch(image).then((res) => res.blob());
      const formData = new FormData();
      formData.append("chat_id", TELEGRAM_CHAT_ID);
      formData.append("photo", blob, "image.jpg");

      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("📤 Sent to Telegram!");
    } catch (error) {
      console.error("Telegram Error:", error.response ? error.response.data : error.message);
      alert("❌ Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (userInput.trim()) {
      setUsername(userInput.trim());
      setPoints(0);
      localStorage.setItem("points", 0);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUsername("");
    setPoints(0);
    setUserInput("");
    setCategory(null);
  };

  // 👇 UI Starts Here
  if (!username) {
    return (
      <div style={{ textAlign: "center", paddingTop: "50px" }}>
        <h2>Login to Waste Management</h2>
        <input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter username"
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <button onClick={handleLogin} style={{ marginLeft: "10px", padding: "10px" }}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ textAlign: "center", padding: "20px", fontFamily: "Arial, sans-serif", backgroundColor: "#f4f4f4" }}>
      <div style={{ padding: "10px", backgroundColor: "#dbeafe", borderRadius: "10px", marginBottom: "20px" }}>
        <span>👋 Welcome, <strong>{username}</strong></span>
        <span style={{ marginLeft: "20px" }}>🏆 Points: <strong>{points}</strong></span>
        <button onClick={handleLogout} style={{ float: "right", backgroundColor: "#ef4444", color: "white", padding: "5px 10px", borderRadius: "5px", border: "none" }}>
          Logout
        </button>
      </div>

      {!category ? (
        <div style={{ textAlign: "center" }}>
          <h2>Select the Issue Type:</h2>
          <button onClick={() => handleCategorySelection("waste")} className="category-btn">Waste</button>
          <button onClick={() => handleCategorySelection("Leakages")} className="category-btn">Leakages</button>
          <button onClick={() => handleCategorySelection("Potholes")} className="category-btn">Potholes</button>
        </div>
      ) : (
        <>
          <h1 style={{ color: "#333", marginBottom: "20px" }}>Waste Management System</h1>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}>
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg" width={320} height={240} style={{ borderRadius: "10px" }} />
              <br />
              <button onClick={capture} className="capture-btn" disabled={loading}>
                {loading ? "Processing..." : "Capture & Send"}
              </button>
            </div>
            {capturedImage && (
              <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}>
                <h3 style={{ marginBottom: "10px" }}>Captured Image:</h3>
                <img src={capturedImage} alt="Captured" style={{ width: "100%", borderRadius: "10px" }} />
                {wasteLevel && <h3>Waste Level: {wasteLevel}</h3>}
              </div>
            )}
          </div>
          <div style={{ marginTop: "20px", background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}>
            <LoadScript googleMapsApiKey="AIzaSyDKqS60wpCLJ6LkU1HnZrsdybfk-43x4pE">
              <GoogleMap mapContainerStyle={containerStyle} center={location || { lat: 0, lng: 0 }} zoom={10}>
                {location && <Marker position={location} />}
              </GoogleMap>
            </LoadScript>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
