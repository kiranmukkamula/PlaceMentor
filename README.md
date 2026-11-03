# PlaceMentor — Full-Stack Student Placement Portal

PlaceMentor is a full-stack student placement management platform designed to streamline campus recruitment. It allows students to explore placement opportunities, apply for jobs, analyze resumes against job descriptions, and access interview experiences. Administrators can manage companies, job postings, applications, and student eligibility.

## Live Deployment

**PlaceMentor is deployed on AWS and can be accessed directly using the link below.**

**Live Application:** [http://3.110.122.215](http://3.110.122.215)

Users can access the application directly without installing or configuring the project locally.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Tailwind CSS v4, React Router DOM, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Raw SQL using `pg`) |
| Authentication | JWT (JSON Web Tokens) |
| Real-Time Communication | Socket.IO |
| Resume Analysis | NLP techniques, semantic embeddings, similarity scoring |
| Deployment | AWS |
| Containerization | Docker, Docker Compose |

## Key Features

- **Student Dashboard:** Explore placement opportunities, track applications, and manage profiles.
- **Admin Dashboard:** Manage companies, job postings, and student applications.
- **Eligibility Engine:** Check student eligibility based on CGPA, branch, and company requirements.
- **Resume–JD Matching:** Analyze resumes against job descriptions and identify missing skills.
- **Student Ranking:** Evaluate and rank students based on matching criteria.
- **Interview Experiences:** Access and share recruitment experiences.
- **Real-Time Interview Management:** Support interview workflows using Socket.IO.
- **Secure Authentication:** JWT-based authentication and protected API endpoints.

## Project Architecture

```text
PlaceMentor
│
├── client/                  # React Frontend
│
├── server/                  # Node.js + Express Backend
│   └── src/
│       ├── routes/          # API Endpoints
│       ├── controllers/     # Business Logic
│       ├── middleware/      # Authentication & Middleware
│       └── index.js         # Backend Entry Point
│
└── docker-compose.yml       # Local Docker Configuration
```

## Local Development

### Prerequisites

- Node.js v18 or higher
- PostgreSQL
- npm

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Configure Environment Variables

Navigate to the `server` directory and create a `.env` file using `.env.example`.

Configure the required variables:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

Additional environment variables may be required depending on the enabled features.

### 3. Start the Backend

```bash
cd server
npm install
npm run dev
```

The backend runs on:

`http://localhost:5000`

### 4. Start the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend typically runs on:

`http://localhost:5173`

## Deployment

The application is deployed on **Amazon Web Services (AWS)** and is accessible through its public IP address.

**Production URL:** [http://3.110.122.215](http://3.110.122.215)

The deployed application can be used directly through a web browser without performing the local setup steps.

## Docker Support

The project includes a `docker-compose.yml` file for provisioning a local PostgreSQL database.

To start the configured Docker services:

```bash
docker compose up -d
```

To stop them:

```bash
docker compose down
```

## Security Note

The current deployment URL uses HTTP. HTTPS should be configured for secure production communication, particularly for authentication and sensitive user data.
