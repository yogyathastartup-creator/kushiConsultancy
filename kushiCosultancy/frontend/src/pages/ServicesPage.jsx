import React, { useState, useEffect } from 'react';
import '../styles/ServicesPage.css';

const defaultContent = {
    intro: {
        title: 'Our Services',
        description: 'Kushi Consultancy delivers comprehensive recruitment and staffing solutions for the engineering and construction industries.'
    },
    services: [
        {
            title: 'HR Recruitment Services',
            description: 'We specialize in recruitment services for EPC/EPCM companies across the Oil & Gas (Onshore & Offshore), Chemical, Infrastructure, FMCG, and Energy sectors. We deliver expert hiring solutions for both domestic and international markets, covering contract and permanent roles.',
            highlights: [
                'High Conversion Rate',
                'Efficient & Mass Sourcing in Short Time',
                'Smart Team with Engineering Graduates',
                'Conducting Multiple Placement Drives',
                '19K+ LinkedIn Followers',
                '500+ Candidate Profiles Shared'
            ]
        },
        {
            title: 'Engineering & Technical Recruitment',
            description: 'Our expertise spans across all engineering disciplines including Civil, Structural, Mechanical, Electrical, I&C, Process, and Pipeline Engineering. We recruit for design, lead, and managerial positions.',
            highlights: [
                'Civil & Structural Engineering',
                'Mechanical & Piping Engineering',
                'Electrical & I&C Engineering',
                'Process & Chemical Engineering',
                'Site & Construction Management',
                'HSE & Quality Assurance'
            ]
        },
        {
            title: 'Specialized Positions',
            description: 'We recruit for specialized and leadership roles including Project Managers, Engineering Managers, Procurement Managers, and Technical Safety Leads across various sectors.',
            highlights: [
                'Project Directors & Managers',
                'Engineering Managers',
                'Procurement & Category Buyers',
                'Planning Engineers',
                'HSE Managers',
                'Construction Managers'
            ]
        },
        {
            title: 'Design & Drafting Services',
            description: 'Comprehensive recruitment for design and drafting professionals proficient in industry-standard tools like E3D, SP3D, Tekla, Plant 3D, AutoCAD, and BIM.',
            highlights: [
                'Structural Designers (2D/3D/E3D/SP3D)',
                'Piping Designers & Stress Engineers',
                'Electrical & I&C Designers',
                'Process Designers',
                'BIM & Tekla Modelers',
                'HVAC & Plumbing Designers'
            ]
        }
    ],
    cta: {
        title: 'Ready to Find Your Next Hire?',
        description: 'Contact us today to discuss your recruitment needs',
        email: 'madhu@kushiconsultancy.com'
    }
};

const ServicesPage = () => {
    const [content, setContent] = useState(defaultContent);

    useEffect(() => {
        const saved = localStorage.getItem('servicesContent');
        if (saved) {
            setContent(JSON.parse(saved));
        }
    }, []);

    return (
        <div className="services-page">
            <h2>{content.intro.title}</h2>
            <p className="services-intro">{content.intro.description}</p>
            
            <div className="services-list">
                {content.services.map((service, index) => (
                    <div key={index} className="service-item">
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>
                        {service.highlights && service.highlights.length > 0 && (
                            <ul className="highlights">
                                {service.highlights.map((highlight, idx) => (
                                    <li key={idx}>{highlight}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>

            <div className="cta-section">
                <h3>{content.cta.title}</h3>
                <p>{content.cta.description}</p>
                <a href={`mailto:${content.cta.email}`} className="cta-button">Get in Touch</a>
            </div>
        </div>
    );
};

export default ServicesPage;