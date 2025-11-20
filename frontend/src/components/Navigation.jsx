import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Navigation.css';

const Navigation = () => {
    return (
        <nav className="navigation">
            <ul>
                <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink></li>
                <li><NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>About Us</NavLink></li>
                <li><NavLink to="/services" className={({ isActive }) => isActive ? 'active' : ''}>Services</NavLink></li>
                <li><NavLink to="/recruitment" className={({ isActive }) => isActive ? 'active' : ''}>Recruitment</NavLink></li>
                <li><NavLink to="/upload-cv" className={({ isActive }) => isActive ? 'active' : ''}>Upload CV</NavLink></li>
                <li><NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''}>Projects</NavLink></li>
            </ul>
        </nav>
    );
};

export default Navigation;