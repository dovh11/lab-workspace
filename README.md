# Lab Workspace & Research Progress Management System

A comprehensive, production-ready full-stack application designed specifically for AI research teams. It centralizes project management, experiment tracking, document versioning, and journal club scheduling into a single, beautiful, and secure platform.

## 🌐 Live Deployment
- **Frontend (Vercel)**: [https://lab-workspace.vercel.app](https://lab-workspace.vercel.app) *(Update with your exact Vercel URL)*
- **Backend (Render)**: [https://lab-workspace-backend.onrender.com/docs](https://lab-workspace-backend.onrender.com/docs) *(Update with your exact Render URL)*

## 🚀 Features

### 📁 Project Management
- Create and manage research projects with active/archived statuses.
- Invite members to your projects with granular Role-Based Access Control (Lead, Contributor, Reviewer).
- Keep all related experiments and documents organized within project boundaries.

### 🧪 Experiment Tracking
- Log AI experiment runs across any framework (PyTorch, TensorFlow, JAX).
- Dynamically log hyperparameters and metrics on a per-epoch basis.
- Visualize training curves (Loss, Validation Loss, Accuracy) with interactive interactive charts right in the browser.

### 📄 Document Version Control
- Git-style versioning for your research papers (LaTeX, Word), datasets, and scripts.
- Drag-and-drop support for uploading new versions of documents.
- Keep track of authorship and download any previous commit easily.

### 📚 Journal Club Scheduler
- Schedule upcoming paper discussion sessions with full abstract and PDF linking.
- RSVP system for attendees (Attending, Maybe, Declined) to track participation.

### 🔐 Advanced Role-Based Access Control & User Management
- **System Roles**: Manager, Researcher, and Intern.
- **Project Roles**: Lead, Contributor, Reviewer.
- Fully secure backend routing that guarantees users can only modify resources they have access to.
- **Self-Service Settings**: Users can freely update their profiles or permanently delete their accounts.
- **Admin Panel**: Managers have full control to view, edit, and delete any system user or change their roles.

## 🛠 Tech Stack

**Frontend:**
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** (with custom glassmorphism and modern UI tokens)
- **Recharts** (for data visualization)
- **Lucide React** (for iconography)

**Backend:**
- **FastAPI** (Python 3.10+)
- **PostgreSQL**
- **SQLAlchemy** (ORM with eager loading optimizations)
- **Pydantic V2** (for rigorous schema validation)
- **PyJWT** & **Passlib** (for secure, stateless Authentication)

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL Server

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your `.env` file (or use the defaults in `config.py`):
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/lab_workspace
   SECRET_KEY=your_super_secret_key
   ```
5. Run the server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:3000`.

## 🔒 Security
- Passwords are securely hashed using bcrypt.
- Session state is managed purely via JWTs.
- SQLAlchemy cascades and SET NULL constraints handle referential integrity when users or projects are deleted.

## 🎨 Design Philosophy
The UI was built from scratch without relying on heavy component libraries. It emphasizes a premium aesthetic with subtle micro-animations, glassmorphism, dynamic layouts, and full light/dark mode support to create an inspiring workspace for researchers.

## 🚀 Deployment Guide

This project is built to be easily deployed using modern PaaS providers.

### 1. Database (Neon / Supabase)
Set up a free serverless PostgreSQL database and obtain your connection string (e.g., `postgresql://user:password@endpoint/dbname?sslmode=require`).

### 2. Backend (Render)
A `render.yaml` blueprint is included in the root directory for automated Infrastructure-as-Code deployment.
1. Connect your repository to Render via **Blueprint**.
2. Input your `DATABASE_URL` environment variable.
3. Deploy the service and obtain your backend URL.

### 3. Frontend (Vercel)
1. Import the repository into Vercel.
2. **Crucial Step**: Set the **Root Directory** to `frontend` before deploying.
3. Add the `NEXT_PUBLIC_API_URL` environment variable pointing to your Render backend URL (e.g., `https://your-backend.onrender.com/api/v1`).
4. Add your newly generated Vercel domain to the `FRONTEND_URL` environment variable in Render to properly configure CORS.
