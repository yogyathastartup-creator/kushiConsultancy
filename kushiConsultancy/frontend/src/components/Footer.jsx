import { useState, useEffect } from 'react';
import '../styles/Footer.css';

const Footer = () => {
    const [contactInfo, setContactInfo] = useState({
        email: import.meta.env.VITE_CONTACT_EMAIL || 'madhu@kushiconsultancy.com',
        mobile: '+91 96770 54461'
    });

    useEffect(() => {
        const savedContactInfo = localStorage.getItem('contactInfo');
        if (savedContactInfo) {
            setContactInfo(JSON.parse(savedContactInfo));
        }
    }, []);

    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>Contact Us</h3>
                    <p>📧 Email: {contactInfo.email}</p>
                    <p>📱 Mobile: {contactInfo.mobile}</p>
                </div>
                <div className="footer-section">
                    <h3>Address</h3>
                    <p>129, 100 Feet Bypass Road</p>
                    <p>2nd Floor, Velachery</p>
                    <p>Chennai - 600042, Tamil Nadu</p>
                </div>
                <div className="footer-section">
                    <h3>Follow Us</h3>
                    <div className="social-media">
                        <a href="https://www.linkedin.com/in/madhusudhana-gupta?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BFgZuxv4rStuovw17J7Yi7A%3D%3D" target="_blank" rel="noopener noreferrer">
                            🔗 LinkedIn (19K+ Followers)
                        </a>
                    </div>
                    <div className="footer-tagline">
                        <p><strong>"Let's Grow Together"</strong></p>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Kushi Civil Structural Consultancy Private Limited. All Rights Reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;