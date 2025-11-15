import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Recruitment.css';

const Recruitment = () => {
    const navigate = useNavigate();
    const recruitmentAreas = [
        "Structural Engineering",
        "Civil Engineering (Onshore)",
        "Civil Engineering (Offshore)",
        "Pipeline Engineering",
        "Firefighting Pipeline Engineering",
        "Oil & Natural Gas Engineering"
    ];

    return (
        <div className="recruitment">
            <h2>Recruitment Areas</h2>
            <ul>
                {recruitmentAreas.map((area, index) => (
                    <li 
                        key={index}
                        onClick={() => navigate(`/upload-cv?position=${encodeURIComponent(area)}`)}
                        title={`Apply for ${area}`}
                        aria-label={`Apply for ${area}`}
                        role="link"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                navigate(`/upload-cv?position=${encodeURIComponent(area)}`);
                            }
                        }}
                    >
                        {area}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Recruitment;