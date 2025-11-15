import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
    return (
        <header className="header">
            <div className="logo">
                <Link to="/">
                    <img src="/khushinobg.svg" alt="Kushi Consultancy Logo" />
                    <h1>Kushi Civil and Structural Consultancy</h1>
                </Link>
            </div>
        </header>
    );
};

export default Header;