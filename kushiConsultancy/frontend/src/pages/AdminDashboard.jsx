import React, { useState, useEffect } from 'react';
import { getApiUrl, logApiResolution } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('recruitment');
    const [recruitmentData, setRecruitmentData] = useState({});
    const [homeContent, setHomeContent] = useState({});
    const [aboutContent, setAboutContent] = useState({});
    const [servicesContent, setServicesContent] = useState([]);
    const [contentTab, setContentTab] = useState('home');
    const [settings, setSettings] = useState({
        cvUploadEnabled: true
    });

    useEffect(() => {
        const loadAllContent = () => {
            // Load recruitment data
            const savedRecruitment = localStorage.getItem('recruitmentData');
            if (savedRecruitment) {
                const parsed = JSON.parse(savedRecruitment);
                const migrated = {};
                for (const category in parsed) {
                    migrated[category] = parsed[category].map(item => {
                        if (typeof item === 'string') {
                            return { title: item, jd: '' };
                        }
                        return item;
                    });
                }
                setRecruitmentData(migrated);
                localStorage.setItem('recruitmentData', JSON.stringify(migrated));
            } else {
                setRecruitmentData(getDefaultRecruitmentData());
            }

            // Load home content
            const savedHome = localStorage.getItem('homeContent');
            if (savedHome) {
                setHomeContent(JSON.parse(savedHome));
            } else {
                setHomeContent(getDefaultHomeContent());
            }

            // Load about content
            const savedAbout = localStorage.getItem('aboutContent');
            if (savedAbout) {
                setAboutContent(JSON.parse(savedAbout));
            } else {
                setAboutContent(getDefaultAboutContent());
            }

            // Load services content
            const savedServices = localStorage.getItem('servicesContent');
            if (savedServices) {
                setServicesContent(JSON.parse(savedServices));
            } else {
                setServicesContent(getDefaultServicesContent());
            }

            // Load settings
            const savedSettings = localStorage.getItem('siteSettings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        };

        const verifyAuth = async () => {
            try {
                const response = await fetch(`${getApiUrl()}/auth/verify`, {
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (!data.authenticated) {
                    navigate('/admin/login');
                    return;
                }
                
                loadAllContent();
            } catch (error) {
                const isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn');
                if (!isAdminLoggedIn) {
                    navigate('/admin/login');
                    return;
                }
                loadAllContent();
            }
        };

        logApiResolution('AdminDashboard');
        verifyAuth();
    }, [navigate]);

    const getDefaultRecruitmentData = () => {
        return {
            'Civil Engineering': ['Civil Engineer', 'Structural Engineer', 'Geotechnical Engineer'],
            'Electrical Engineering': ['Electrical Engineer', 'Power Systems Engineer'],
            'Mechanical Engineering': ['Mechanical Engineer', 'HVAC Engineer'],
            'Chemical Engineering': ['Process Engineer', 'Chemical Engineer'],
            'Instrumentation & Control': ['I&C Engineer', 'Automation Engineer'],
            'Site Requirements': ['Site Engineer', 'Safety Officer'],
            'Management': ['Project Manager', 'Engineering Manager'],
            'USA/Canada Openings': ['Senior Engineer', 'Project Lead']
        };
    };

    const getDefaultHomeContent = () => {
        return {
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
    };

    const getDefaultAboutContent = () => {
        return {
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
    };

    const getDefaultServicesContent = () => {
        return {
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
    };

    const handleLogout = async () => {
        try {
            await fetch(`${getApiUrl()}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            // logout silently
        }
        
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminUser');
        sessionStorage.removeItem('adminLoginTime');
        navigate('/admin/login');
    };

    const handleDeletePosition = (category, position) => {
        const updated = { ...recruitmentData };
        updated[category] = updated[category].filter(p => {
            const posTitle = typeof p === 'string' ? p : p.title;
            const searchTitle = typeof position === 'string' ? position : position.title;
            return posTitle !== searchTitle;
        });
        setRecruitmentData(updated);
        localStorage.setItem('recruitmentData', JSON.stringify(updated));
        const title = typeof position === 'string' ? position : position.title;
        alert(`Deleted: ${title} from ${category}`);
    };

    const handleDeleteCategory = (category) => {
        if (window.confirm(`Are you sure you want to delete the entire "${category}" category?`)) {
            const updated = { ...recruitmentData };
            delete updated[category];
            setRecruitmentData(updated);
            localStorage.setItem('recruitmentData', JSON.stringify(updated));
            alert(`Category "${category}" deleted successfully`);
        }
    };

    const handleAddPosition = (category) => {
        const newPosition = prompt(`Enter new position for ${category}:`);
        if (newPosition && newPosition.trim()) {
            const jd = prompt(`Enter job description for ${newPosition} (optional):`);
            const updated = { ...recruitmentData };
            if (!updated[category]) {
                updated[category] = [];
            }
            updated[category].push({
                title: newPosition.trim(),
                jd: jd ? jd.trim() : ''
            });
            setRecruitmentData(updated);
            localStorage.setItem('recruitmentData', JSON.stringify(updated));
            alert(`Added: ${newPosition} to ${category}`);
        }
    };

    const handleAddCategory = () => {
        const newCategory = prompt('Enter new category name:');
        if (newCategory && newCategory.trim()) {
            const updated = { ...recruitmentData };
            updated[newCategory.trim()] = [];
            setRecruitmentData(updated);
            localStorage.setItem('recruitmentData', JSON.stringify(updated));
            alert(`Category "${newCategory}" created successfully`);
        }
    };

    const renderRecruitmentTab = () => (
        <div className="admin-section">
            <div className="section-header">
                <h2>📋 Manage Recruitment Openings</h2>
                <button onClick={handleAddCategory} className="btn-add">+ Add Category</button>
            </div>

            <div className="recruitment-categories">
                {Object.keys(recruitmentData).map((category, idx) => (
                    <div key={idx} className="category-card">
                        <div className="category-header">
                            <h3>{category}</h3>
                            <div className="category-actions">
                                <button onClick={() => handleAddPosition(category)} className="btn-small btn-primary">+ Add Position</button>
                                <button onClick={() => handleDeleteCategory(category)} className="btn-small btn-danger">Delete Category</button>
                            </div>
                        </div>
                        <div className="positions-list">
                            {recruitmentData[category].length > 0 ? (
                                recruitmentData[category].map((position, pidx) => {
                                    const posTitle = typeof position === 'string' ? position : position.title;
                                    const posJd = typeof position === 'string' ? '' : position.jd;
                                    return (
                                        <div key={pidx} className="position-item">
                                            <div className="position-info">
                                                <span className="position-title">{posTitle}</span>
                                                {posJd && <span className="position-jd-indicator" title={posJd}>📄 JD Available</span>}
                                            </div>
                                            <button 
                                                onClick={() => handleDeletePosition(category, position)} 
                                                className="btn-delete"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="empty-message">No positions in this category</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderContentEditor = () => (
        <div className="admin-section">
            <h2>📝 Content Management</h2>
            
            <div className="content-tabs">
                <button 
                    className={contentTab === 'home' ? 'content-tab active' : 'content-tab'}
                    onClick={() => setContentTab('home')}
                >
                    🏠 Home Page
                </button>
                <button 
                    className={contentTab === 'about' ? 'content-tab active' : 'content-tab'}
                    onClick={() => setContentTab('about')}
                >
                    ℹ️ About Page
                </button>
                <button 
                    className={contentTab === 'services' ? 'content-tab active' : 'content-tab'}
                    onClick={() => setContentTab('services')}
                >
                    🛠️ Services Page
                </button>
            </div>

            {contentTab === 'home' && renderHomeEditor()}
            {contentTab === 'about' && renderAboutEditor()}
            {contentTab === 'services' && renderServicesEditor()}
        </div>
    );

    const renderHomeEditor = () => (
        <div className="content-editor">
            <h3>Edit Home Page Content</h3>
            
            {/* Hero Section */}
            <div className="editor-section">
                <h4>🎯 Hero Section</h4>
                <div className="form-group">
                    <label htmlFor="hero-title">Title:</label>
                    <input 
                        id="hero-title"
                        type="text" 
                        value={homeContent.hero?.title || ''} 
                        onChange={(e) => setHomeContent({
                            ...homeContent, 
                            hero: { ...homeContent.hero, title: e.target.value }
                        })}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="hero-tagline">Tagline:</label>
                    <input 
                        id="hero-tagline"
                        type="text" 
                        value={homeContent.hero?.tagline || ''} 
                        onChange={(e) => setHomeContent({
                            ...homeContent, 
                            hero: { ...homeContent.hero, tagline: e.target.value }
                        })}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="hero-description">Description:</label>
                    <textarea 
                        id="hero-description"
                        value={homeContent.hero?.description || ''} 
                        onChange={(e) => setHomeContent({
                            ...homeContent, 
                            hero: { ...homeContent.hero, description: e.target.value }
                        })}
                        className="form-textarea"
                        rows="3"
                    />
                </div>
            </div>

            {/* Stats Section */}
            <div className="editor-section">
                <h4>📊 Statistics Section</h4>
                {homeContent.stats?.map((stat, index) => (
                    <div key={index} className="stat-editor">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor={`stat-value-${index}`}>Value:</label>
                                <input 
                                    id={`stat-value-${index}`}
                                    type="text" 
                                    value={stat.value || ''} 
                                    onChange={(e) => {
                                        const updated = [...homeContent.stats];
                                        updated[index].value = e.target.value;
                                        setHomeContent({ ...homeContent, stats: updated });
                                    }}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor={`stat-label-${index}`}>Label:</label>
                                <input 
                                    id={`stat-label-${index}`}
                                    type="text" 
                                    value={stat.label || ''} 
                                    onChange={(e) => {
                                        const updated = [...homeContent.stats];
                                        updated[index].label = e.target.value;
                                        setHomeContent({ ...homeContent, stats: updated });
                                    }}
                                    className="form-input"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Highlights Section */}
            <div className="editor-section">
                <h4>⭐ Why Choose Us Highlights</h4>
                {homeContent.highlights?.map((highlight, index) => (
                    <div key={index} className="highlight-editor">
                        <div className="form-row">
                            <div className="form-group small">
                                <label htmlFor={`highlight-icon-${index}`}>Icon:</label>
                                <input 
                                    id={`highlight-icon-${index}`}
                                    type="text" 
                                    value={highlight.icon || ''} 
                                    onChange={(e) => {
                                        const updated = [...homeContent.highlights];
                                        updated[index].icon = e.target.value;
                                        setHomeContent({ ...homeContent, highlights: updated });
                                    }}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor={`highlight-title-${index}`}>Title:</label>
                                <input 
                                    id={`highlight-title-${index}`}
                                    type="text" 
                                    value={highlight.title || ''} 
                                    onChange={(e) => {
                                        const updated = [...homeContent.highlights];
                                        updated[index].title = e.target.value;
                                        setHomeContent({ ...homeContent, highlights: updated });
                                    }}
                                    className="form-input"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor={`highlight-description-${index}`}>Description:</label>
                            <textarea 
                                id={`highlight-description-${index}`}
                                value={highlight.description || ''} 
                                onChange={(e) => {
                                    const updated = [...homeContent.highlights];
                                    updated[index].description = e.target.value;
                                    setHomeContent({ ...homeContent, highlights: updated });
                                }}
                                className="form-textarea"
                                rows="2"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={() => {
                    localStorage.setItem('homeContent', JSON.stringify(homeContent));
                    alert('Home page content saved! Refresh the Home page to see changes.');
                }}
                className="btn-save"
            >
                💾 Save Home Content
            </button>
        </div>
    );

    const renderAboutEditor = () => (
        <div className="content-editor">
            <h3>Edit About Page Content</h3>
            
            {/* Introduction Section */}
            <div className="editor-section">
                <h4>ℹ️ Introduction Section</h4>
                <div className="form-group">
                    <label htmlFor="about-intro-title">Title:</label>
                    <input 
                        id="about-intro-title"
                        type="text" 
                        value={aboutContent.intro?.title || ''} 
                        onChange={(e) => setAboutContent({
                            ...aboutContent, 
                            intro: { ...aboutContent.intro, title: e.target.value }
                        })}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="about-intro-tagline">Tagline:</label>
                    <input 
                        id="about-intro-tagline"
                        type="text" 
                        value={aboutContent.intro?.tagline || ''} 
                        onChange={(e) => setAboutContent({
                            ...aboutContent, 
                            intro: { ...aboutContent.intro, tagline: e.target.value }
                        })}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="about-intro-description">Description:</label>
                    <textarea 
                        id="about-intro-description"
                        value={aboutContent.intro?.description || ''} 
                        onChange={(e) => setAboutContent({
                            ...aboutContent, 
                            intro: { ...aboutContent.intro, description: e.target.value }
                        })}
                        className="form-textarea"
                        rows="4"
                    />
                </div>
            </div>

            {/* Domains Section */}
            <div className="editor-section">
                <h4>🏭 Core Expertise & Domains</h4>
                {aboutContent.domains?.map((domain, index) => (
                    <div key={index} className="list-item-editor">
                        <input 
                            type="text" 
                            value={domain || ''} 
                            onChange={(e) => {
                                const updated = [...aboutContent.domains];
                                updated[index] = e.target.value;
                                setAboutContent({ ...aboutContent, domains: updated });
                            }}
                            className="form-input"
                        />
                        <button 
                            onClick={() => {
                                const updated = aboutContent.domains.filter((_, i) => i !== index);
                                setAboutContent({ ...aboutContent, domains: updated });
                            }}
                            className="btn-remove"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button 
                    onClick={() => {
                        const updated = [...(aboutContent.domains || []), 'New Domain'];
                        setAboutContent({ ...aboutContent, domains: updated });
                    }}
                    className="btn-add-item"
                >
                    + Add Domain
                </button>
            </div>

            {/* Competitive Edge Section */}
            <div className="editor-section">
                <h4>⭐ Competitive Edge / Strengths</h4>
                {aboutContent.strengths?.map((strength, index) => (
                    <div key={index} className="list-item-editor">
                        <input 
                            type="text" 
                            value={strength || ''} 
                            onChange={(e) => {
                                const updated = [...aboutContent.strengths];
                                updated[index] = e.target.value;
                                setAboutContent({ ...aboutContent, strengths: updated });
                            }}
                            className="form-input"
                        />
                        <button 
                            onClick={() => {
                                const updated = aboutContent.strengths.filter((_, i) => i !== index);
                                setAboutContent({ ...aboutContent, strengths: updated });
                            }}
                            className="btn-remove"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button 
                    onClick={() => {
                        const updated = [...(aboutContent.strengths || []), 'New Strength'];
                        setAboutContent({ ...aboutContent, strengths: updated });
                    }}
                    className="btn-add-item"
                >
                    + Add Strength
                </button>
            </div>

            {/* CSR Section */}
            <div className="editor-section">
                <h4>🌱 Corporate Social Responsibilities</h4>
                <div className="form-group">
                    <label htmlFor="csr-description">Description:</label>
                    <textarea 
                        id="csr-description"
                        value={aboutContent.csr?.description || ''} 
                        onChange={(e) => setAboutContent({
                            ...aboutContent, 
                            csr: { ...aboutContent.csr, description: e.target.value }
                        })}
                        className="form-textarea"
                        rows="4"
                    />
                </div>
                <label style={{ fontWeight: 600, color: '#333', marginTop: '1rem', display: 'block' }}>
                    CSR Activities:
                </label>
                {aboutContent.csr?.activities?.map((activity, index) => (
                    <div key={index} className="list-item-editor">
                        <input 
                            type="text" 
                            value={activity || ''} 
                            onChange={(e) => {
                                const updated = [...aboutContent.csr.activities];
                                updated[index] = e.target.value;
                                setAboutContent({ 
                                    ...aboutContent, 
                                    csr: { ...aboutContent.csr, activities: updated }
                                });
                            }}
                            className="form-input"
                        />
                        <button 
                            onClick={() => {
                                const updated = aboutContent.csr.activities.filter((_, i) => i !== index);
                                setAboutContent({ 
                                    ...aboutContent, 
                                    csr: { ...aboutContent.csr, activities: updated }
                                });
                            }}
                            className="btn-remove"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button 
                    onClick={() => {
                        const updated = [...(aboutContent.csr?.activities || []), 'New CSR Activity'];
                        setAboutContent({ 
                            ...aboutContent, 
                            csr: { ...aboutContent.csr, activities: updated }
                        });
                    }}
                    className="btn-add-item"
                >
                    + Add CSR Activity
                </button>
            </div>

            <button 
                onClick={() => {
                    localStorage.setItem('aboutContent', JSON.stringify(aboutContent));
                    alert('About page content saved! Refresh the About page to see changes.');
                }}
                className="btn-save"
            >
                💾 Save About Content
            </button>
        </div>
    );

    const renderServicesEditor = () => (
        <div className="content-editor">
            <h3>Edit Services Page Content</h3>
            
            {/* Introduction Section */}
            <div className="editor-section">
                <h4>📋 Page Introduction</h4>
                <div className="form-group">
                    <label htmlFor="services-page-title">Title:</label>
                    <input 
                        id="services-page-title"
                        type="text" 
                        value={servicesContent.intro?.title || ''} 
                        onChange={(e) => setServicesContent({
                            ...servicesContent, 
                            intro: { ...servicesContent.intro, title: e.target.value }
                        })}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="services-intro-description">Description:</label>
                    <textarea 
                        id="services-intro-description"
                        value={servicesContent.intro?.description || ''} 
                        onChange={(e) => setServicesContent({
                            ...servicesContent, 
                            intro: { ...servicesContent.intro, description: e.target.value }
                        })}
                        className="form-textarea"
                        rows="3"
                    />
                </div>
            </div>

            {/* Services List */}
            <div className="editor-section">
                <h4>🛠️ Services List</h4>
                {servicesContent.services?.map((service, index) => (
                    <div key={index} className="service-editor">
                        <div className="service-header-row">
                            <h5>Service {index + 1}</h5>
                            <button 
                                onClick={() => {
                                    const updated = servicesContent.services.filter((_, i) => i !== index);
                                    setServicesContent({ ...servicesContent, services: updated });
                                }}
                                className="btn-remove"
                            >
                                ✕ Remove Service
                            </button>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor={`service-item-title-${index}`}>Service Title:</label>
                            <input 
                                id={`service-item-title-${index}`}
                                type="text" 
                                value={service.title || ''} 
                                onChange={(e) => {
                                    const updated = [...servicesContent.services];
                                    updated[index].title = e.target.value;
                                    setServicesContent({ ...servicesContent, services: updated });
                                }}
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor={`service-item-desc-${index}`}>Service Description:</label>
                            <textarea 
                                id={`service-item-desc-${index}`}
                                value={service.description || ''} 
                                onChange={(e) => {
                                    const updated = [...servicesContent.services];
                                    updated[index].description = e.target.value;
                                    setServicesContent({ ...servicesContent, services: updated });
                                }}
                                className="form-textarea"
                                rows="3"
                            />
                        </div>
                        
                        <label style={{ fontWeight: 600, color: '#333', display: 'block', marginTop: '1rem' }}>
                            Highlights:
                        </label>
                        {service.highlights?.map((highlight, hIndex) => (
                            <div key={hIndex} className="list-item-editor">
                                <input 
                                    type="text" 
                                    value={highlight || ''} 
                                    onChange={(e) => {
                                        const updated = [...servicesContent.services];
                                        updated[index].highlights[hIndex] = e.target.value;
                                        setServicesContent({ ...servicesContent, services: updated });
                                    }}
                                    className="form-input"
                                />
                                <button 
                                    onClick={() => {
                                        const updated = [...servicesContent.services];
                                        updated[index].highlights = updated[index].highlights.filter((_, i) => i !== hIndex);
                                        setServicesContent({ ...servicesContent, services: updated });
                                    }}
                                    className="btn-remove"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button 
                            onClick={() => {
                                const updated = [...servicesContent.services];
                                updated[index].highlights = [...(updated[index].highlights || []), 'New Highlight'];
                                setServicesContent({ ...servicesContent, services: updated });
                            }}
                            className="btn-add-item"
                        >
                            + Add Highlight
                        </button>
                    </div>
                ))}
                
                <button 
                    onClick={() => {
                        const newService = {
                            title: 'New Service',
                            description: 'Service description',
                            highlights: ['Highlight 1', 'Highlight 2']
                        };
                        const updated = [...(servicesContent.services || []), newService];
                        setServicesContent({ ...servicesContent, services: updated });
                    }}
                    className="btn-add-service"
                >
                    + Add New Service
                </button>
            </div>

            {/* CTA Section */}
            <div className="editor-section">
                <h4>📢 Call-to-Action Section</h4>
                <div className="form-group">
                    <label htmlFor="services-cta-title">CTA Title:</label>
                    <input 
                        id="services-cta-title"
                        type="text" 
                        value={servicesContent.cta?.title || ''} 
                        onChange={(e) => setServicesContent({
                            ...servicesContent, 
                            cta: { ...servicesContent.cta, title: e.target.value }
                        })}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="services-cta-description">CTA Description:</label>
                    <input 
                        id="services-cta-description"
                        type="text" 
                        value={servicesContent.cta?.description || ''} 
                        onChange={(e) => setServicesContent({
                            ...servicesContent, 
                            cta: { ...servicesContent.cta, description: e.target.value }
                        })}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="services-contact-email">Contact Email:</label>
                    <input 
                        id="services-contact-email"
                        type="email" 
                        value={servicesContent.cta?.email || ''} 
                        onChange={(e) => setServicesContent({
                            ...servicesContent, 
                            cta: { ...servicesContent.cta, email: e.target.value }
                        })}
                        className="form-input"
                    />
                </div>
            </div>

            <button 
                onClick={() => {
                    localStorage.setItem('servicesContent', JSON.stringify(servicesContent));
                    alert('Services page content saved! Refresh the Services page to see changes.');
                }}
                className="btn-save"
            >
                💾 Save Services Content
            </button>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="admin-section">
            <h2>⚙️ Site Settings</h2>
            
            <div className="settings-section">
                <div className="setting-card">
                    <div className="setting-header">
                        <div>
                            <h3>📤 CV Upload Feature</h3>
                            <p>Enable or disable the CV upload functionality on the Upload CV page</p>
                        </div>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox" 
                                checked={settings.cvUploadEnabled}
                                onChange={(e) => {
                                    const newSettings = { ...settings, cvUploadEnabled: e.target.checked };
                                    setSettings(newSettings);
                                    localStorage.setItem('siteSettings', JSON.stringify(newSettings));
                                    alert(`CV Upload ${e.target.checked ? 'Enabled' : 'Disabled'}!`);
                                }}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    <div className="setting-status">
                        <span className={`status-badge ${settings.cvUploadEnabled ? 'status-active' : 'status-inactive'}`}>
                            {settings.cvUploadEnabled ? '✓ Active' : '✕ Disabled'}
                        </span>
                        <span className="status-description">
                            {settings.cvUploadEnabled 
                                ? 'Users can upload their CVs through the website' 
                                : 'CV upload form is hidden, only email option is available'}
                        </span>
                    </div>
                </div>

                <div className="setting-card">
                    <div className="setting-info">
                        <h4>💡 How it works:</h4>
                        <ul>
                            <li>When <strong>Enabled</strong>: The CV upload form is visible on the Upload CV page</li>
                            <li>When <strong>Disabled</strong>: Only the email option is shown to users</li>
                            <li>Changes take effect immediately without refreshing the page</li>
                            <li>The email notification system continues to work regardless of this setting</li>
                        </ul>
                    </div>
                </div>

                <div className="setting-card">
                    <div className="setting-info">
                        <h4>📊 Current Configuration:</h4>
                        <div className="config-grid">
                            <div className="config-item">
                                <span className="config-label">CV Upload Form:</span>
                                <span className={`config-value ${settings.cvUploadEnabled ? 'text-success' : 'text-danger'}`}>
                                    {settings.cvUploadEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="config-item">
                                <span className="config-label">Email Option:</span>
                                <span className="config-value text-success">Always Available</span>
                            </div>
                            <div className="config-item">
                                <span className="config-label">Email Notifications:</span>
                                <span className="config-value text-success">Active</span>
                            </div>
                            <div className="config-item">
                                <span className="config-label">Admin Access:</span>
                                <span className="config-value text-success">Full Control</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-logo">
                    <h1>🔧 Admin Dashboard</h1>
                    <p>Kushi Consultancy Management Panel</p>
                </div>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
            </header>

            <div className="admin-tabs">
                <button 
                    className={activeTab === 'recruitment' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('recruitment')}
                >
                    Recruitment Openings
                </button>
                <button 
                    className={activeTab === 'content' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('content')}
                >
                    Page Content
                </button>
                <button 
                    className={activeTab === 'settings' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'recruitment' && renderRecruitmentTab()}
                {activeTab === 'content' && renderContentEditor()}
                {activeTab === 'settings' && renderSettingsTab()}
            </div>
        </div>
    );
};

export default AdminDashboard;
