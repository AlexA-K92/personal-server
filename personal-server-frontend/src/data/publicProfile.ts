export const publicProfile = {
  name: "Alex Araki-Kurdyla",
  headline: "Computer Science Student | Cloud, Cybersecurity, AI, and Full-Stack Development",
  location: "Bucknell University",
  bio: "I am a Computer Science student interested in building secure, practical software systems across cloud computing, cybersecurity, AI, and full-stack development. This personal server project is a public portfolio and private admin system built with React, Node, C sockets, TLS, and custom authentication.",
  resumeUrl: "/Resume (8).pdf",
  email: "arakikurdylaa@gmail.com",
  github: "https://github.com/AlexA-K92",
  linkedin: "https://www.linkedin.com/in/alex-araki-kurdyla/",

  skills: [
    "C",
    "React",
    "TypeScript",
    "Node.js",
    "OpenSSL",
    "TLS",
    "Berkeley Sockets",
    "AWS",
    "Cybersecurity",
    "Cloud Computing",
    "Python",
    "Git",
  ],

  education: [
    {
      school: "Bucknell University",
      degree: "B.S. in Computer Science",
      details: "Coursework and projects across systems programming, security, software engineering, cloud, and AI.",
    },
  ],

  projects: [
    {
      title: "PrivateVault Personal Server",
      type: "Security / Full-Stack",
      description:
        "A public personal website and private admin dashboard with a React frontend, Node bridge, C TLS server, salted password-derived credential storage, nonce-based challenge-response authentication, and guest/admin RBAC.",
      technologies: ["React", "TypeScript", "Node.js", "C", "OpenSSL", "TLS", "Sockets"],
      links: [
        {
          label: "GitHub",
          url: "https://github.com/AlexA-K92/personal-server",
        },
      ],
    },
    {
      title: "TLS Authentication Server",
      type: "Systems / Cybersecurity",
      description:
        "A C-based client-server authentication system using Berkeley sockets, OpenSSL TLS, persistent salted credential storage, nonce challenge-response login, and role-based access control.",
      technologies: ["C", "OpenSSL", "TLS", "PBKDF2", "HMAC", "RBAC"],
      links: [],
    },
    {
      title: "ArcGIS Senior Design Project",
      type: "Full-Stack / Mapping",
      description:
        "A React + TypeScript project built with Vite that integrates ArcGIS maps for an interactive senior design application.",
      technologies: ["React", "TypeScript", "Vite", "ArcGIS"],
      links: [],
    },
    {
      title: "AI Receptionist / Business Automation System",
      type: "AI / Automation",
      description:
        "A business automation concept focused on AI voice reception, lead capture, booking workflows, review automation, and conversion-focused websites for local service businesses.",
      technologies: ["AI Workflows", "Automation", "CRM", "Web Systems"],
      links: [],
    },
  ],
};