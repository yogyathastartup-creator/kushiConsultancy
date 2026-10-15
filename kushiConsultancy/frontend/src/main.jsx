import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/App.css';

const rootElement = document.getElementById('root');
const app = (
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// Pages prerendered at build time already contain their markup, so hydrate them instead of replacing it.
if (rootElement.hasChildNodes()) {
    ReactDOM.hydrateRoot(rootElement, app);
} else {
    ReactDOM.createRoot(rootElement).render(app);
}
