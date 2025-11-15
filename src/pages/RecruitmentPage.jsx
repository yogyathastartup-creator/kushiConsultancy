import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RecruitmentPage.css';

const defaultRecruitmentData = {
    'Civil Engineering': [
        'Structural Engineer',
        'Structural Draftsman',
        'Architectural Engineer',
        'Architectural Draftsman',
        'BIM Modeler',
        'Tekla Modeler',
        'Steel Modeler',
        'Formwork Design Engineer'
    ],
    'Electrical Engineering': [
        'Electrical Design Engineer',
        'Electrical Draftsman',
        'Lead Electrical Engineer',
        'Electrical Manager'
    ],
    'Instrumentation & Control': [
        'I&C Engineer',
        'I&C Lead Engineer',
        'I&C Designer',
        'Proposal Engineer'
    ],
    'Mechanical Engineering': [
        'Mechanical Design Engineer',
        'Piping Engineer',
        'Piping Stress Engineer',
        'Piping Draftsman',
        'Rotating Equipment Engineer',
        'Stationary Equipment Engineer',
        'HVAC Engineer',
        'Pipeline Engineer'
    ],
    'Chemical Engineering': [
        'Process Design Engineer',
        'Process Designer',
        'Process Lead Engineer',
        'Process Safety Engineer',
        'Pressure Protection Manager',
        'Material Specialist'
    ],
    'Site Requirements': [
        'Project Manager',
        'Planning Engineer',
        'Construction Manager',
        'Project Estimators',
        'Site Engineer',
        'QA/QC Engineer',
        'Surveyor',
        'Site Supervisor',
        'HSE Engineer'
    ],
    'Management & Coordination': [
        'Deputy HOD',
        'Project Manager',
        'Project Engineer',
        'Engineering Manager',
        'Project Quality Manager',
        'Procurement Managers',
        'Project Lead',
        'HSE Manager'
    ],
    'USA/Canada Positions': [
        'Onsite Coordinator',
        'Electrical & Automation Engineer',
        'Lead Engineer',
        'Precision Farming Agricultural Engineer',
        'Vehicle Integration Engineer',
        'Embedded Engineer',
        'ADAS Validation Engineer',
        'Hydraulics Design Engineer',
        'Software Engineer'
    ]
};

const RecruitmentPage = () => {
    const [recruitmentData, setRecruitmentData] = useState(defaultRecruitmentData);
    const [selectedCategory, setSelectedCategory] = useState('Civil Engineering');
    const [selectedJd, setSelectedJd] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Load recruitment data from localStorage (admin changes)
        const savedData = localStorage.getItem('recruitmentData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            setRecruitmentData(parsedData);
            // Set first category as default if current doesn't exist
            if (!parsedData[selectedCategory]) {
                setSelectedCategory(Object.keys(parsedData)[0] || 'Civil Engineering');
            }
        } else {
            // Initialize with default data
            localStorage.setItem('recruitmentData', JSON.stringify(defaultRecruitmentData));
        }
    }, []);

    const handlePositionClick = (position) => {
        const isString = typeof position === 'string';
        const title = isString ? position : position.title;
        const posJd = isString ? '' : position.jd;

        // If a JD exists, open the modal; otherwise navigate directly to Upload CV with prefilled position
        if (posJd) {
            setSelectedJd({ title, jd: posJd });
        } else if (title) {
            navigate(`/upload-cv?position=${encodeURIComponent(title)}`);
        }
    };

    return (
        <div className="recruitment-page">
            <h2>Current Openings</h2>
            <p className="recruitment-intro">
                We recruit top engineering talent across multiple disciplines for leading EPC/EPCM companies worldwide.
            </p>

            <div className="category-tabs">
                {Object.keys(recruitmentData).map((category) => (
                    <button
                        key={category}
                        className={`tab-button ${selectedCategory === category ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="positions-container">
                <h3>{selectedCategory}</h3>
                <ul className="positions-list">
                    {recruitmentData[selectedCategory].map((position, index) => {
                        const posTitle = typeof position === 'string' ? position : position.title;
                        const posJd = typeof position === 'string' ? '' : position.jd;
                        return (
                            <li 
                                key={index} 
                                className={`position-item ${posJd ? 'has-jd' : ''}`}
                                onClick={() => handlePositionClick(position)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handlePositionClick(position);
                                    }
                                }}
                            >
                                <span className="position-icon">👔</span>
                                <span className="position-name">{posTitle}</span>
                                {posJd && <span className="jd-badge">View JD</span>}
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div className="recruitment-cta">
                <h3>Interested in These Positions?</h3>
                <p>Upload your CV and we'll connect you with the right opportunities</p>
                <a href="/upload-cv" className="cta-button">Upload Your CV</a>
            </div>

            {selectedJd && (
                <div className="jd-modal" onClick={() => setSelectedJd(null)}>
                    <div className="jd-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="jd-close-btn" onClick={() => setSelectedJd(null)}>×</button>
                        <h3>{selectedJd.title}</h3>
                        <div className="jd-content">
                            {selectedJd.jd}
                        </div>
                        <a href={`/upload-cv?position=${encodeURIComponent(selectedJd.title)}`} className="jd-apply-btn">Apply Now</a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruitmentPage;