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

    useEffect(() => {
        const saved = localStorage.getItem('homeContent');
        if (saved) {
            setContent(JSON.parse(saved));
        }
    }, []);

    return (
        <div className="home-page">
            <section className="hero-section">
                <h1>{content.hero.title}</h1>
                <p className="tagline">{content.hero.tagline}</p>
                <p className="hero-description">{content.hero.description}</p>
            </section>

            <section className="stats-section">
                {content.stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <h3>{stat.value}</h3>
                        <p>{stat.label}</p>
                    </div>
                ))}
            </section>

            <section className="highlights-section">
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

            <section className="clients-section">
                <h2>Trusted by Leading Companies</h2>
                <Clients />
            </section>

            <section className="cta-section">
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