# Lab Workspace & Research Progress Management System

A comprehensive, production-ready full-stack application designed specifically for AI research teams. It centralizes project management, experiment tracking, document versioning, and journal club scheduling into a single, beautiful, and secure platform.

## 🌐 Live Deployment
- **Frontend (Vercel)**: [https://lab-workspace.vercel.app](https://lab-workspace.vercel.app)
- **Backend (Render)**: [https://lab-workspace-backend.onrender.com/docs](https://lab-workspace-backend.onrender.com/docs)

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

## 📦 Getting Started (Local Development)

### Prerequisites
- **Docker Desktop** (Must be installed and running before starting!)
- **Node.js 18+** (For the frontend)
- **Git**

### 📥 Step 1: Clone the Repository
Download the code to your local machine and open it in your preferred IDE (e.g., VS Code, Cursor):
```bash
git clone https://github.com/dovh11/lab-workspace.git
cd lab-workspace
```

### 🛑 Step 2: Start Docker Desktop
Before running any commands, ensure that **Docker Desktop** is open and running in the background on your machine. You should see the Docker icon in your system tray indicating that the Docker Engine is active.

### ⚙️ Step 3: Run the Backend & Database (via Docker)
We use Docker Compose to instantly spin up both the PostgreSQL database and the Python FastAPI backend server without needing to install Python locally.

1. Open your terminal in the root directory of this project.
2. Run the following command to build and start the database and backend in the background:
   ```bash
   docker compose up -d --build
   ```
3. The backend API is now running at `http://localhost:8000`. You can view the API documentation by visiting [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

*(Note: To stop the backend and database, simply run `docker compose down`)*

### 🎨 Step 4: Run the Frontend
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the necessary Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser to [http://localhost:3000](http://localhost:3000) to use the application!

## 🔒 Security
- Passwords are securely hashed using bcrypt.
- Session state is managed purely via JWTs.
- SQLAlchemy cascades and SET NULL constraints handle referential integrity when users or projects are deleted.

## 🎨 Design Philosophy
The UI was built from scratch without relying on heavy component libraries. It emphasizes a premium aesthetic with subtle micro-animations, glassmorphism, dynamic layouts, and full light/dark mode support to create an inspiring workspace for researchers.


