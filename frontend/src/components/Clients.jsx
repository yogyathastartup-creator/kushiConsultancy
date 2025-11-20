import React from 'react';
import '../styles/Clients.css';

const clientsData = {
    india: [
        { name: 'L&T Hydrocarbon', logo: '/client-logos/lt.png' },
        { name: 'L&T Technology Services', logo: '/client-logos/ltts.png' },
        { name: 'NPCC Engineering', logo: '/client-logos/npcc.png' },
        { name: 'WOOD PLC', logo: '/client-logos/wood.png' },
        { name: 'Technip Energies', logo: '/client-logos/technip.png' },
        { name: 'Worley', logo: '/client-logos/worley.png' },
        { name: 'Cyient', logo: '/client-logos/cyient.png' },
        { name: 'Petrofac', logo: '/client-logos/petrofac.png' }
    ],
    gulf: [
        { name: 'KENT PLC', logo: '/client-logos/kent.png' },
        { name: 'Galfar Engineering', logo: '/client-logos/galfar.png' },
        { name: 'Penspen', logo: '/client-logos/penspen.png' },
        { name: 'Altorath International', logo: '/client-logos/altorath.png' },
        { name: 'Lauren Middle East', logo: '/client-logos/lauren.png' },
        { name: 'Bridgers Consultants', logo: '/client-logos/bridgers.png' }
    ]
};

const Clients = () => {
    // Combine all clients for continuous scrolling
    const allClients = [...clientsData.india, ...clientsData.gulf];
    
    return (
        <div className="clients-component">
            <h2>Our Esteemed Clients</h2>
            
            <div className="logo-slider">
                <div className="logo-track">
                    {/* First set of logos */}
                    {allClients.map((client, index) => (
                        <div key={`first-${index}`} className="logo-slide">
                            <img 
                                src={client.logo} 
                                alt={client.name} 
                                title={client.name}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://via.placeholder.com/150x60/0073b1/FFFFFF?text=${encodeURIComponent(client.name)}`;
                                }} 
                            />
                        </div>
                    ))}
                    {/* Duplicate set for seamless loop */}
                    {allClients.map((client, index) => (
                        <div key={`second-${index}`} className="logo-slide">
                            <img 
                                src={client.logo} 
                                alt={client.name}
                                title={client.name}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://via.placeholder.com/150x60/0073b1/FFFFFF?text=${encodeURIComponent(client.name)}`;
                                }} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Clients;
