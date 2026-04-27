import {
  Download,
  ExternalLink,
  FolderLock,
  GraduationCap,
  HardDrive,
  Mail,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { publicProfile } from "../data/publicProfile";

export function DashboardPage() {
  const { user, isAdmin, isGuest } = useAuth();

  return (
    <section>
      {isGuest && <GuestPortfolio />}

      {isAdmin && (
        <>
          <div className="page-header">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Owner/admin overview of your private personal server.</p>
            </div>
          </div>

          <div className="panel welcome-panel">
            <div>
              <h2>Welcome, {user?.displayName}</h2>
              <p>
                Current role: <strong>Administrator</strong>
              </p>
            </div>

            <span className="role-pill admin">ADMIN</span>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <FolderLock size={24} />
              <h2>Encrypted Files</h2>
              <p className="stat-number">0</p>
            </div>

            <div className="stat-card">
              <HardDrive size={24} />
              <h2>Storage Used</h2>
              <p className="stat-number">0 MB</p>
            </div>

            <div className="stat-card">
              <ShieldCheck size={24} />
              <h2>Security</h2>
              <p className="stat-number">TLS Local</p>
            </div>

            <div className="stat-card">
              <Upload size={24} />
              <h2>Uploads</h2>
              <p className="stat-number">0</p>
            </div>
          </div>

          <div className="panel">
            <h2>Admin build steps</h2>
            <ul>
              <li>Add public profile editing from the admin dashboard.</li>
              <li>Add file uploads for resume/project documents.</li>
              <li>Enforce RBAC on all backend routes.</li>
              <li>Add production storage for public and private records.</li>
              <li>Add HTTPS, secure cookies, rate limiting, and deployment secrets.</li>
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

function GuestPortfolio() {
  return (
    <>
      <div className="portfolio-hero panel">
        <div className="portfolio-avatar">
          <UserRound size={34} />
        </div>

        <div className="portfolio-hero-content">
          <p className="eyebrow">Public Portfolio</p>
          <h1>{publicProfile.name}</h1>
          <h2>{publicProfile.headline}</h2>
          <p>{publicProfile.bio}</p>

          <div className="portfolio-actions">
            <a className="action-button" href={publicProfile.resumeUrl} target="_blank" rel="noreferrer">
              <Download size={16} />
              View Resume
            </a>

            <a className="secondary-button" href={publicProfile.github} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              GitHub
            </a>

            <a className="secondary-button" href={`mailto:${publicProfile.email}`}>
              <Mail size={16} />
              Contact
            </a>
          </div>
        </div>
      </div>

      <div className="portfolio-grid">
        <div className="panel">
          <h2>Skills</h2>
          <div className="skill-list">
            {publicProfile.skills.map((skill) => (
              <span className="skill-pill" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Education</h2>
          <div className="education-list">
            {publicProfile.education.map((item) => (
              <div className="education-item" key={item.school}>
                <div className="education-icon">
                  <GraduationCap size={20} />
                </div>

                <div>
                  <h3>{item.school}</h3>
                  <p className="education-degree">{item.degree}</p>
                  <p>{item.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selected Work</p>
            <h2>Projects</h2>
          </div>
        </div>

        <div className="projects-grid">
          {publicProfile.projects.map((project) => (
            <article className="project-card" key={project.title}>
              <div>
                <span className="project-type">{project.type}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>

              <div className="project-tech-list">
                {project.technologies.map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </div>

              {project.links.length > 0 && (
                <div className="project-links">
                  {project.links.map((link) => (
                    <a href={link.url} target="_blank" rel="noreferrer" key={link.url}>
                      {link.label}
                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </>
  );
}