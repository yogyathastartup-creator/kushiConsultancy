import React from 'react';

const Services = () => {
    const servicesList = [
        "Structural Design & Analysis",
        "Global Recruitment & Staffing",
        "Project Management Consultancy"
    ];

    return (
        <div className="services">
            <h2>Our Services</h2>
            <ul>
                {servicesList.map((service, index) => (
                    <li key={index}>{service}</li>
                ))}
            </ul>
        </div>
    );
};

export default Services;