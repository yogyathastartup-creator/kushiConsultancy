import { useState, useEffect } from 'react';

const useContactInfo = () => {
    const [contactInfo, setContactInfo] = useState({
        emails: [import.meta.env.VITE_CONTACT_EMAIL || 'madhu@kushiconsultancy.com'],
        mobiles: ['+91 96770 54461']
    });

    useEffect(() => {
        const savedContactInfo = localStorage.getItem('contactInfo');
        if (savedContactInfo) {
            const parsed = JSON.parse(savedContactInfo);
            if (parsed.emails || parsed.mobiles) {
                setContactInfo(parsed);
            }
        }
    }, []);

    return contactInfo;
};

export default useContactInfo;
