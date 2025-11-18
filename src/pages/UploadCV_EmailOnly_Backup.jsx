import React from 'react';
import '../styles/UploadCV.css';

const UploadCV = () => {
    const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'yogyatha.startup@gmail.com';
    return (
        <div className="upload-cv-page">
            <h2>Submit Your Application</h2>
            <p className="instructions">
                We're looking for talented professionals to join our network. Send us your updated resume to get started!
            </p>

            <div className="submission-card">
                <h3>📧 How to Apply</h3>
                <p className="steps-intro">Follow these simple steps to submit your application:</p>
                
                <div className="steps-list">
                    <div className="step">
                        <span className="step-number">1</span>
                        <div className="step-content">
                            <h4>Prepare Your Resume</h4>
                            <p>Update your CV/Resume with your latest experience and skills (PDF or DOC format preferred)</p>
                        </div>
                    </div>

                    <div className="step">
                        <span className="step-number">2</span>
                        <div className="step-content">
                            <h4>Compose Your Email</h4>
                            <p>Send your resume to: <strong>{contactEmail}</strong></p>
                        </div>
                    </div>

                    <div className="step">
                        <span className="step-number">3</span>
                        <div className="step-content">
                            <h4>Include Details</h4>
                            <p>Please mention in your email:</p>
                            <ul>
                                <li>Your full name</li>
                                <li>Contact number</li>
                                <li>Position you're applying for</li>
                                <li>Years of experience</li>
                                <li>Current location</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="email-button-section">
                    <a 
                        href={`mailto:${contactEmail}?subject=Job Application - Resume Submission&body=Dear Kushi Consultancy Team,%0D%0A%0D%0AI am writing to express my interest in exploring opportunities with your organization.%0D%0A%0D%0APlease find my details below:%0D%0A%0D%0AName: %0D%0AContact Number: %0D%0APosition Applied For: %0D%0AYears of Experience: %0D%0ACurrent Location: %0D%0A%0D%0AI have attached my updated resume for your review.%0D%0A%0D%0AThank you for your consideration.%0D%0A%0D%0ABest regards,`}
                        className="email-button"
                    >
                        ✉️ Send Resume via Email
                    </a>
                    <p className="button-hint">Click above to open your email client with pre-filled template</p>
                </div>
            </div>

            <div className="contact-info">
                <h3>Other Ways to Reach Us</h3>
                <div className="contact-methods">
                    <div className="contact-method">
                        <span className="icon">📧</span>
                        <div>
                            <strong>Email</strong>
                            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                        </div>
                    </div>

                    <div className="contact-method">
                        <span className="icon">📱</span>
                        <div>
                            <strong>WhatsApp</strong>
                            <a href="https://wa.me/919361970260" target="_blank" rel="noopener noreferrer">+91 93619 70260</a>
                        </div>
                    </div>

                    <div className="contact-method">
                        <span className="icon">📞</span>
                        <div>
                            <strong>Phone</strong>
                            <a href="tel:+919361970260">+91 93619 70260</a> / <a href="tel:+919677054461">+91 96770 54461</a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="info-note">
                <p>💼 <strong>Note:</strong> We review all applications carefully. If your profile matches our current requirements, our team will contact you within 3-5 business days.</p>
            </div>
        </div>
    );
};

export default UploadCV;