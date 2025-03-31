// Navbar.jsx
import "./Navbar.css"
import React from "react";
import { Link, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Companies from "./Companies";
import Users from "./Users";
import Players from "./Players";
import Int from "./Int";
const Navbar = () => {
    return (
        <>
            <div>
                <nav className="navbar">
                    <ul className="nav-links">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/Companies">Companies</Link></li>
                        <li><Link to="/Users">Users</Link></li>
                        <li><Link to="/Players">Leaderboard</Link></li>
                        <li><Link to="/Int">Int Data</Link></li>
                    </ul>
                </nav>
                <Routes>
                    <Route path="*" element={<Home />} />
                    <Route path="/Companies" element={<Companies />} />
                    <Route path="/Users" element={<Users />} /> 
                    <Route path="/Players" element={<Players />} /> 
                    <Route path="/Int" element={<Int />} /> 
                </Routes>
            </div>

        </>
    );
};

export default Navbar;