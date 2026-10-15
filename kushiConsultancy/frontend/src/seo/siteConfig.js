// Shared SEO configuration.
// Plain data only (no import.meta, no DOM access) so the build-time prerender script in Node can import it too.

export const DEFAULT_SITE_URL = 'https://kushiconsultancy.com';

export const SITE_NAME = 'Kushi Civil and Structural Consultancy';
export const BRAND_NAME = 'Kushi Consultancy';
export const DEFAULT_DESCRIPTION =
    'Kushi Consultancy hires structural engineers and engineering talent for EPC/EPCM projects, onshore and offshore, in India and abroad. Browse openings and upload your CV.';

export const ORGANIZATION = {
    legalName: 'Kushi Civil Structural Consultancy Private Limited',
    telephone: '+91-96770-54461',
    email: 'madhu@kushiconsultancy.com',
    logoPath: '/khushinobg.svg',
    sameAs: [
        'https://www.linkedin.com/in/madhusudhana-gupta',
    ],
    address: {
        streetAddress: '129, 100 Feet Bypass Road, 2nd Floor, Velachery',
        addressLocality: 'Chennai',
        addressRegion: 'Tamil Nadu',
        postalCode: '600042',
        addressCountry: 'IN',
    },
};

// Used by the admin panel as the starting point; the backend store overrides these at build time.
export const DEFAULT_SEO_SETTINGS = {
    indexingEnabled: true,
    siteName: SITE_NAME,
    defaultDescription: DEFAULT_DESCRIPTION,
    ogImagePath: '/constructionimg.jpg',
    googleSiteVerification: '',
    bingSiteVerification: '',
    contactEmail: ORGANIZATION.email,
    contactPhone: ORGANIZATION.telephone,
    // Per-page overrides keyed by path, e.g. { '/about': { title, description, keywords, noindex } }
    pages: {},
};

// Public pages. `prerender: false` pages still get head tags but are rendered in the browser only.
export const PUBLIC_PAGES = [
    {
        path: '/',
        title: 'Structural Engineer Hiring – Onshore & Offshore | Kushi Consultancy',
        description: 'Structural engineer hiring for onshore and offshore EPC/EPCM projects. Kushi Consultancy, Chennai, sources civil, piping, I&C and process engineers. Upload your CV today.',
        keywords: ['structural engineer hiring', 'onshore engineering jobs', 'offshore engineering jobs', 'EPC recruitment India', 'engineering recruitment Chennai'],
        prerender: true,
        priority: 1.0,
        changefreq: 'weekly',
    },
    {
        path: '/about',
        title: 'About Kushi Consultancy | Engineering Recruitment, Chennai',
        description: 'About Kushi Civil and Structural Consultancy, Chennai: EPC/EPCM recruitment for oil & gas (onshore and offshore), energy, infrastructure and FMCG clients.',
        keywords: ['Kushi Consultancy', 'structural consultancy Chennai', 'EPC EPCM recruitment partner', 'oil and gas recruitment onshore offshore'],
        prerender: true,
        priority: 0.8,
        changefreq: 'monthly',
    },
    {
        path: '/services',
        title: 'Engineering Recruitment & Structural Design Services | Kushi',
        description: 'Recruitment and staffing for EPC/EPCM companies: structural engineers, piping stress, process, I&C, BIM and Tekla modelers, and project managers.',
        keywords: ['engineering recruitment services', 'structural engineer staffing', 'EPC staffing India', 'project management consultancy', 'Tekla BIM modeler jobs'],
        prerender: true,
        priority: 0.9,
        changefreq: 'monthly',
    },
    {
        path: '/recruitment',
        title: 'Current Engineering Jobs: Structural, Civil & Offshore Openings',
        description: 'Current engineering openings: structural engineer, civil, piping, process and site roles for onshore and offshore EPC projects. Apply online with your CV.',
        keywords: ['structural engineer jobs', 'structural engineer hiring', 'onshore engineering jobs', 'offshore engineering jobs', 'piping engineer jobs', 'site engineer jobs'],
        prerender: true,
        priority: 0.9,
        changefreq: 'daily',
    },
    {
        path: '/projects',
        title: 'Projects | Kushi Consultancy',
        description: 'Projects from Kushi Consultancy: recruitment portal, client dashboard and email automation.',
        keywords: ['Kushi Consultancy projects'],
        prerender: true,
        priority: 0.3,
        changefreq: 'monthly',
    },
    {
        path: '/upload-cv',
        title: 'Upload Your CV – Structural & Engineering Jobs | Kushi',
        description: 'Upload your CV for structural engineer, civil, piping and offshore roles with Kushi Consultancy. Quick and secure submission.',
        keywords: ['upload CV engineering jobs', 'submit CV structural engineer', 'offshore job application India'],
        prerender: false,
        priority: 0.6,
        changefreq: 'monthly',
    },
];

export const normalizePath = (pathname = '/') => {
    const withoutQuery = String(pathname).split(/[?#]/)[0] || '/';
    const trimmed = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, '') : withoutQuery;
    return trimmed || '/';
};

export const findPublicPage = (pathname) => PUBLIC_PAGES.find((page) => page.path === normalizePath(pathname));
