
import "./Navbar.css";
import React, { useState, useEffect } from "react";
import { Link, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Players from "./Players";
import { setMute } from './PlaySound';  // ✅ Import mute controller

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("default"); // ✅ Add background color state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (backgroundColor === "default") {
      document.body.className = darkMode ? "dark-mode" : "light-mode";
      document.body.style.backgroundColor = "";  // 🛠️ Reset custom color
    } else {
      document.body.className = "";
      document.body.style.backgroundColor = backgroundColor;
    }
  }, [darkMode, backgroundColor]);
  

  const toggleMute = () => {
    const newMuteState = !muted;
    setMutedState(newMuteState);
    setMute(newMuteState);
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">TicTacToe</div>

        {/* Toggle button for small screens */}
        <button
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>

        <ul className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
          <li><Link to="/Players" onClick={() => setIsMenuOpen(false)}>Leaderboard</Link></li>

          {/* Background Color Dropdown replaces Dark Mode toggle */}
          <li>
  <select
    className="mode-button"
    value={backgroundColor}
    onChange={(e) => {
      const value = e.target.value;
      setBackgroundColor(value);
      if (value === "default") {
        // keep darkMode toggle active if default
      } else {
        setDarkMode(false); // disable dark mode if choosing color
      }
    }}
    style={{
      minWidth: "160px",
      color: "black",             // <-- force text black
      backgroundColor: "white"    // <-- background white
    }}
  >
    <option value="default">Default (Light/Dark)</option>
    <option value="#d0ebff">Light Blue</option>
    <option value="#ffd6d6">Soft Pink</option>
    <option value="#f8f0fc">Lavender</option>
    <option value="#d3f9d8">Light Green</option>
    <option value="#fff3bf">Light Yellow</option>
  </select>
</li>


          {/* Dark Mode toggle only if no background color is selected */}
          {backgroundColor === "default" && (
            <li>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="theme-toggle"
              >
                {darkMode ? "Light Mode" : "Dark Mode"}
              </button>
            </li>
          )}

          {/* Mute Button */}
          <li>
            <button onClick={toggleMute} className="mute-button">
              {muted ? 'Unmute 🔊' : 'Mute 🔇'}
            </button>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="*" element={<Home />} />
        <Route path="/Players" element={<Players />} />
      </Routes>
    </>
  );
};

export default Navbar;