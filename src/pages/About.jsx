import React, { useState, useEffect } from 'react';
import Clients from '../components/Clients';
import '../styles/About.css';

const defaultContent = {
    intro: {
        title: 'About Kushi Consultancy',
        tagline: '"Let\'s Grow Together"',
        description: 'At Kushi Consultancy, we specialize in recruitment services for EPC/EPCM companies across the Oil & Gas (Onshore & Offshore), Chemical, Infrastructure, FMCG, and Energy sectors. We deliver expert hiring solutions for both domestic and international markets, covering contract and permanent roles.'
    },
    domains: [
        'Oil & Gas (Onshore/Offshore)',
        'Water Treatment Plant',
        'FMCG',
        'Power',
        'Wind & Energy Sectors',
        'Metro/Railways',
        'Industrial Building & Factories'
    ],
    strengths: [
        'High Conversion Rate',
        'Efficient & Mass Sourcing in Short Time',
        'Smart Team with Engineering Graduates',
        'Conducting Multiple Placement Drives',
        'Seamless Support from Screening to Onboarding',
        'Curating Talent Profiles Tailored to Every Job Position',
        '19K+ Followers on LinkedIn',
        'Sourcing Top-Notch Quality Profiles from Renowned Companies',
        'Successfully Shared 500+ Candidate Profiles Across Various Engineering Disciplines'
    ],
    csr: {
        description: 'We firmly believe that those "who demonstrate responsibility in society carry that ethos into their work". Therefore, we actively engage in social service events like plantation drives and lake restoration initiatives on a regular basis. We also encourage our candidates to actively participate in these endeavors.',
        activities: [
            'Lake Restoration Events',
            'Plantation Drives in Giddalur & Tirusulam',
            'Green Energy Tours',
            'Environmental Awareness Programs'
        ]
    }
};

const About = () => {
    const [content, setContent] = useState(defaultContent);

    useEffect(() => {
        const saved = localStorage.getItem('aboutContent');
        if (saved) {
            setContent(JSON.parse(saved));
        }
    }, []);

    return (
        <div className="about-page">
            <h2>{content.intro.title}</h2>
            <p className="tagline">
                <strong>{content.intro.tagline}</strong>
            </p>
            <p>{content.intro.description}</p>

            <h3>Our Core Expertise & Domains</h3>
            <ul className="domains-list">
                {content.domains.map((domain, index) => (
                    <li key={index}>{domain}</li>
                ))}
            </ul>

            <h3>Our Competitive Edge</h3>
            <ul className="strengths-list">
                {content.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                ))}
            </ul>

            <Clients />

            <h3>Corporate Social Responsibilities</h3>
            <p>{content.csr.description}</p>
            <ul>
                {content.csr.activities.map((activity, index) => (
                    <li key={index}>{activity}</li>
                ))}
            </ul>
        </div>
    );
};

export default About;