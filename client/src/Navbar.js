import "./Navbar.css";
import React, { useState, useEffect } from "react";
import { Link, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Players from "./Players";
import Int from "./Int";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

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
          <li><Link to="/Int" onClick={() => setIsMenuOpen(false)}>Int Data</Link></li>
          <li>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="theme-toggle"
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="*" element={<Home />} />
        <Route path="/Players" element={<Players />} />
        <Route path="/Int" element={<Int />} />
      </Routes>
    </>
  );
};

export default Navbar;
