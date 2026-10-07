import React, { useState, useEffect } from 'react';
import Clients from '../components/Clients';
import '../styles/Home.css';

const defaultContent = {
    hero: {
        title: 'Welcome to Kushi Consultancy',
        tagline: '"Let\'s Grow Together"',
        description: 'Your trusted partner for engineering recruitment solutions across Oil & Gas, Energy, Infrastructure, and FMCG sectors.'
    },
    stats: [
        { value: '19K+', label: 'LinkedIn Followers' },
        { value: '500+', label: 'Candidate Profiles Shared' },
        { value: '200+', label: 'Walk-In Drive Attendees' },
        { value: '15+', label: 'Major Clients' }
    ],
    highlights: [
        {
            icon: '🎯',
            title: 'High Conversion Rate',
            description: 'Proven track record of successful placements across engineering disciplines'
        },
        {
            icon: '⚡',
            title: 'Fast Sourcing',
            description: 'Efficient mass sourcing in short time with our smart recruitment team'
        },
        {
            icon: '🎓',
            title: 'Expert Team',
            description: 'Team of engineering graduates who understand technical requirements'
        },
        {
            icon: '🤝',
            title: 'End-to-End Support',
            description: 'Seamless support from screening to onboarding and beyond'
        }
    ]
};

const Home = () => {
    const [content, setContent] = useState(defaultContent);
    const [recruitmentData, setRecruitmentData] = useState({});

    useEffect(() => {
        const saved = localStorage.getItem('homeContent');
        if (saved) {
            setContent(JSON.parse(saved));
        }
        
        const recruitmentSaved = localStorage.getItem('recruitmentData');
        if (recruitmentSaved) {
            setRecruitmentData(JSON.parse(recruitmentSaved));
        }

        // Scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        const sections = document.querySelectorAll('.scroll-reveal');
        sections.forEach(section => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="home-page">
            <section className="hero-banner" aria-label="Kushi Civil Structural Consultancy Banner">
                <div className="hero-image" role="img" aria-label="Structural design showcase" />
            </section>

            <section className="hero-content-section scroll-reveal">
                <div className="hero-content">
                    <h1>{content.hero.title}</h1>
                    <p className="tagline">{content.hero.tagline}</p>
                    <p className="hero-description">{content.hero.description}</p>
                    <div className="hero-cta">
                        <a href="/upload-cv" className="secondary-button">Upload CV</a>
                    </div>
                </div>
            </section>

            <section className="current-openings-section scroll-reveal">
                <h2>🎯 Current Openings</h2>
                <div className="openings-grid">
                    {Object.keys(recruitmentData).length > 0 ? (
                        Object.keys(recruitmentData).slice(0, 6).map((category, index) => (
                            <div key={index} className="opening-category-card">
                                <h3>{category}</h3>
                                <ul className="positions-list">
                                    {recruitmentData[category].slice(0, 5).map((position, pidx) => {
                                        const posTitle = typeof position === 'string' ? position : position.title;
                                        return (
                                            <li key={pidx}>
                                                <span className="position-title-text">{posTitle}</span>
                                                <a href={`/upload-cv?position=${encodeURIComponent(posTitle)}`} className="apply-now-btn">Apply Now</a>
                                            </li>
                                        );
                                    })}
                                    {recruitmentData[category].length > 5 && (
                                        <li className="more-positions">+{recruitmentData[category].length - 5} more...</li>
                                    )}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p className="no-openings">No current openings available. Check back soon!</p>
                    )}
                </div>
                <div className="openings-cta">
                    <a href="/recruitment" className="view-all-button">View All Openings →</a>
                </div>
            </section>

            <section className="stats-section scroll-reveal">
                {content.stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <h3>{stat.value}</h3>
                        <p>{stat.label}</p>
                    </div>
                ))}
            </section>

            <section className="highlights-section scroll-reveal">
                <h2>Why Choose Kushi Consultancy?</h2>
                <div className="highlights-grid">
                    {content.highlights.map((highlight, index) => (
                        <div key={index} className="highlight-card">
                            <span className="icon">{highlight.icon}</span>
                            <h3>{highlight.title}</h3>
                            <p>{highlight.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="clients-section scroll-reveal">
                <h2>Trusted by Leading Companies</h2>
                <Clients />
            </section>

            <section className="cta-section scroll-reveal">
                <h2>Ready to Find Your Next Opportunity?</h2>
                <p>Explore our current openings and upload your CV today</p>
                <div className="cta-buttons">
                    <a href="/recruitment" className="primary-button">View Openings</a>
                    <a href="/upload-cv" className="secondary-button">Upload CV</a>
                </div>
            </section>
        </div>
    );
};

export default Home;