# Kushi Consultancy

Welcome to the Kushi Consultancy project! This is a Single Page Application (SPA) built using React and Vite. The application serves as a platform for showcasing the services offered by Kushi Consultancy, facilitating recruitment, and allowing users to upload their CVs.

## Project Structure

The project is organized as follows:

```
kushi-consultancy
├── public
│   └── logo.svg               # Company logo
├── src
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # Entry point of the application
│   ├── components             # Reusable components
│   │   ├── Header.jsx         # Header with company name and logo
│   │   ├── Navigation.jsx      # Navigation bar
│   │   ├── Banner.jsx         # Scrolling banner for advertisements
│   │   ├── Services.jsx       # Services offered by the company
│   │   ├── Recruitment.jsx    # Recruitment areas
│   │   ├── Footer.jsx         # Footer with contact information
│   │   └── Auth               # Authentication components
│   │       ├── Login.jsx      # User login functionality
│   │       └── Register.jsx   # User registration functionality
│   ├── pages                  # Different pages of the application
│   │   ├── Home.jsx           # Main page
│   │   ├── About.jsx          # About the company
│   │   ├── ServicesPage.jsx   # Detailed services information
│   │   ├── RecruitmentPage.jsx # Detailed recruitment information
│   │   └── UploadCV.jsx       # CV upload page
│   ├── styles                 # CSS styles
│   │   └── App.css            # Main styles for the application
│   └── utils                  # Utility functions and constants
│       └── constants.js       # Constants used throughout the application
├── index.html                 # Main HTML file
├── package.json               # NPM configuration
├── vite.config.js             # Vite configuration
└── README.md                  # Project documentation
```

## Features

- **Scrolling Banner**: Displays advertisements and announcements.
- **Header**: Shows the company name and logo.
- **Navigation Bar**: Links to Home, About Us, Services, Recruitment, Upload CV, and user login/register.
- **Services Section**: Details the services offered by Kushi Consultancy.
- **Recruitment Section**: Lists the recruitment areas available.
- **Footer**: Contains contact information and links to social media.

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd kushi-consultancy
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and go to `http://localhost:3000` to view the application.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.