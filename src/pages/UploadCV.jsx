import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { validateFile, validateEmail, validatePhone, validateTextInput, sanitizeInput } from '../utils/validation';
import '../styles/UploadCV.css';

const UploadCV = () => {
    const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'yogyatha.startup@gmail.com';
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: '',
        experience: '',
        location: ''
    });
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [uploadMethod, setUploadMethod] = useState('form'); // 'form' or 'email'
    const [cvUploadEnabled, setCvUploadEnabled] = useState(true);

    // Check if CV upload is enabled
    React.useEffect(() => {
        const settings = localStorage.getItem('siteSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            setCvUploadEnabled(parsed.cvUploadEnabled !== false);
            // If CV upload is disabled, automatically switch to email tab
            if (parsed.cvUploadEnabled === false) {
                setUploadMethod('email');
            }
        }
    }, []);

    // Prefill position if provided via query string (e.g., /upload-cv?position=Civil%20Engineer)
    const location = useLocation();
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const positionParam = params.get('position');
        if (positionParam) {
            // Always update position from URL parameter
            setFormData(prev => ({ ...prev, position: positionParam }));
            // If upload is disabled (email-only), keep method as email; otherwise switch to form for convenience
            if (cvUploadEnabled) {
                setUploadMethod('form');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, cvUploadEnabled]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Don't sanitize during typing - only remove dangerous patterns
        // Full sanitization happens on submit
        let cleanValue = value;
        // Only remove script tags and dangerous patterns in real-time
        cleanValue = cleanValue.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        cleanValue = cleanValue.replace(/javascript:/gi, '');
        
        setFormData(prev => ({
            ...prev,
            [name]: cleanValue
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validation = validateFile(selectedFile);
            if (!validation.valid) {
                setErrors(prev => ({ ...prev, file: validation.message }));
                setFile(null);
                e.target.value = ''; // Clear file input
            } else {
                setFile(selectedFile);
                setErrors(prev => ({ ...prev, file: '' }));
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate name
        const nameValidation = validateTextInput(formData.name, 2, 100);
        if (!nameValidation.valid) newErrors.name = nameValidation.message;
        else if (!/^[a-zA-Z\s'-]+$/.test(formData.name)) {
            newErrors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
        }

        // Validate email
        if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Validate phone
        if (!validatePhone(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        // Validate position
        const positionValidation = validateTextInput(formData.position, 2, 100);
        if (!positionValidation.valid) newErrors.position = positionValidation.message;

        // Validate experience
        const experienceValidation = validateTextInput(formData.experience, 1, 50);
        if (!experienceValidation.valid) newErrors.experience = experienceValidation.message;

        // Validate location
        const locationValidation = validateTextInput(formData.location, 2, 100);
        if (!locationValidation.valid) newErrors.location = locationValidation.message;

        // Validate file
        if (!file) {
            newErrors.file = 'Please select a CV/Resume file';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Sanitize all form data before validation
        const sanitizedFormData = {
            name: sanitizeInput(formData.name),
            email: sanitizeInput(formData.email),
            phone: sanitizeInput(formData.phone),
            position: sanitizeInput(formData.position),
            experience: sanitizeInput(formData.experience),
            location: sanitizeInput(formData.location)
        };
        
        // Update form data with sanitized values
        setFormData(sanitizedFormData);
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setSuccess(false);

        try {
            // Create FormData for multipart upload to Express server
            const uploadData = new FormData();
            uploadData.append('cv', file);
            uploadData.append('name', sanitizedFormData.name);
            uploadData.append('email', sanitizedFormData.email);
            uploadData.append('phone', sanitizedFormData.phone);
            uploadData.append('position', sanitizedFormData.position);
            uploadData.append('experience', sanitizedFormData.experience);
            uploadData.append('location', sanitizedFormData.location);

            // Upload to Express server endpoint
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiUrl}/upload/cv`, {
                method: 'POST',
                body: uploadData,
                // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSuccess(true);
                setFormData({ name: '', email: '', phone: '', position: '', experience: '', location: '' });
                setFile(null);
                const fileInput = document.getElementById('cv-file-input');
                if (fileInput) fileInput.value = '';
            } else {
                setErrors({ submit: result.message || result.error || 'Upload failed. Please try again.' });
            }
        } catch (error) {
            console.error('Upload error:', error);
            setErrors({ submit: 'Network error. Please ensure the server is running or use the email method below.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-cv-page">
            <h2>Submit Your Application</h2>
            <p className="instructions">
                We're looking for talented professionals to join our network. Choose how to submit your resume:
            </p>

            <div className="upload-method-toggle">
                {cvUploadEnabled && (
                    <button 
                        className={uploadMethod === 'form' ? 'active' : ''}
                        onClick={() => setUploadMethod('form')}
                    >
                        📤 Secure Upload Form
                    </button>
                )}
                <button 
                    className={uploadMethod === 'email' ? 'active' : ''}
                    onClick={() => setUploadMethod('email')}
                >
                    📧 Email Submission
                </button>
            </div>

            {uploadMethod === 'form' && cvUploadEnabled && (
                <div className="upload-form-container">
                    <div className="security-notice">
                        <p>🔒 Your data is transmitted securely and stored with enterprise-grade protection.</p>
                    </div>

                    {success && (
                        <div className="success-message">
                            ✅ Your application has been submitted successfully! We'll review it and contact you within 3-5 business days.
                        </div>
                    )}

                    {errors.submit && (
                        <div className="error-message">
                            ❌ {errors.submit}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="cv-upload-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter your full name"
                                    required
                                    maxLength="100"
                                    disabled={loading}
                                />
                                {errors.name && <span className="error-text">{errors.name}</span>}
                            </div>

                            <div className="form-group">
                                <label>Email Address <span className="required">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="your.email@example.com"
                                    required
                                    maxLength="100"
                                    disabled={loading}
                                />
                                {errors.email && <span className="error-text">{errors.email}</span>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Contact Number <span className="required">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+91 98765 43210"
                                    required
                                    maxLength="20"
                                    disabled={loading}
                                />
                                {errors.phone && <span className="error-text">{errors.phone}</span>}
                            </div>

                            <div className="form-group">
                                <label>Position Applied For <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Civil Engineer"
                                    required
                                    maxLength="100"
                                    disabled={loading}
                                />
                                {errors.position && <span className="error-text">{errors.position}</span>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Years of Experience <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 5 years"
                                    required
                                    maxLength="50"
                                    disabled={loading}
                                />
                                {errors.experience && <span className="error-text">{errors.experience}</span>}
                            </div>

                            <div className="form-group">
                                <label>Current Location <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Chennai, India"
                                    required
                                    maxLength="100"
                                    disabled={loading}
                                />
                                {errors.location && <span className="error-text">{errors.location}</span>}
                            </div>
                        </div>

                        <div className="form-group file-upload-group">
                            <label>Upload Resume/CV <span className="required">*</span></label>
                            <input
                                type="file"
                                id="cv-file-input"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileChange}
                                required
                                disabled={loading}
                            />
                            <p className="file-hint">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
                            {file && <p className="file-selected">✓ Selected: {file.name}</p>}
                            {errors.file && <span className="error-text">{errors.file}</span>}
                        </div>

                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Uploading...' : '📤 Submit Application'}
                        </button>
                    </form>
                </div>
            )}

            {uploadMethod === 'email' && (
                <div className="submission-card">
                    <h3>📧 Email Submission Method</h3>
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
            )}

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
