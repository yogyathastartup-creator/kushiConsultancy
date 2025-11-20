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
    const [expandedCategories, setExpandedCategories] = useState({});
    const [selectedJd, setSelectedJd] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Load recruitment data from localStorage (admin changes)
        const savedData = localStorage.getItem('recruitmentData');
        if (savedData) {
            setRecruitmentData(JSON.parse(savedData));
        } else {
            // Initialize with default data
            localStorage.setItem('recruitmentData', JSON.stringify(defaultRecruitmentData));
        }
    }, []);

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

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

            <div className="recruitment-grid">
                {Object.entries(recruitmentData).map(([category, positions]) => (
                    <div key={category} className="category-card">
                        <h3>{category}</h3>
                        <ul className="positions-list">
                            {positions.slice(0, expandedCategories[category] ? undefined : 5).map((position, index) => {
                                const posTitle = typeof position === 'string' ? position : position.title;
                                return (
                                    <li key={index} className="position-item">
                                        <span className="position-bullet">•</span>
                                        <span className="position-name">{posTitle}</span>
                                        <button 
                                            className="apply-now-btn"
                                            onClick={() => handlePositionClick(position)}
                                        >
                                            Apply Now
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        {positions.length > 5 && (
                            <button 
                                className="show-more-btn"
                                onClick={() => toggleCategory(category)}
                            >
                                {expandedCategories[category] ? 'Show Less' : `+${positions.length - 5} more...`}
                            </button>
                        )}
                    </div>
                ))}
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