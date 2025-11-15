import React, { useState, useEffect } from 'react';
import '../styles/Banner.css';

const bannerContent = [
    // Image served from /public; ensure filename matches exactly
    { type: 'image', src: '/constructionimg.jpg', alt: 'Project Image' },
    { type: 'text', content: 'Kushi Civil and Structural Consultancy: Your Partner in Engineering Excellence.' },
    {type:'text',content:'We design, we build, we deliver.'},
    {type:'text',content:'Construction and Structural Engineering is our passion.'},
    {type:'text',content:'Consult with us for innovative solutions.'},
    { type: 'text', content: 'Now hiring for onshore and offshore projects!' },
    { type: 'text', content: 'Submit your CV today and join our dynamic team!' }
];  

const Banner = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerContent.length);
        }, 5000); // Change slide every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="banner">
            {bannerContent.map((item, index) => (
                <div
                    key={index}
                    className={`banner-slide ${index === currentIndex ? 'active' : ''}`}
                >
                    {item.type === 'image' ? (
                        <img src={item.src} alt={item.alt} />
                    ) : (
                        <h2>{item.content}</h2>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Banner;