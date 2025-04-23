import "./Navbar.css";
import React, { useState, useEffect } from "react";
import { Link, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Players from "./Players";
import { setMute } from './PlaySound';  // ✅ Import the mute controller

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [muted, setMutedState] = useState(false);  // ✅ Mute state

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

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
          <li>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="theme-toggle"
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </li>
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
