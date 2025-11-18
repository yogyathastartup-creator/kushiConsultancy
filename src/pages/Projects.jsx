import React from "react";
import "../styles/Projects.css";

const projects = [
  {
    title: "Recruitment Portal",
    description: "A full-stack portal for job applications and candidate management.",
    link: "#"
  },
  {
    title: "Client Dashboard",
    description: "A dashboard for clients to track recruitment progress and analytics.",
    link: "#"
  },
  {
    title: "Email Automation",
    description: "Automated email system for candidate communication and notifications.",
    link: "#"
  }
];

function Projects() {
  return (
    <div className="projects-page">
      <h1>Our Projects</h1>
      <div className="projects-list">
        {projects.map((project, idx) => (
          <div className="project-card" key={idx}>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <a href={project.link} className="project-link">View Project</a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;
