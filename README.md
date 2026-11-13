# NeuroMesh
### Distributed Real-Time BCI Processing & Motor Imagery Command Platform

NeuroMesh is a web-based platform designed to explore distributed real-time processing of Brain-Computer Interface (BCI) signals and motor imagery commands. It integrates a frontend dashboard, backend processing APIs, and cloud-hosted infrastructure to provide an interactive environment for BCI processing and benchmarking.

## Overview

NeuroMesh demonstrates how BCI signal-processing workflows can be integrated into a distributed application architecture. The platform provides a web interface for interacting with backend processing services and running benchmarks.

## Key Features

- **BCI Processing Workflow:** Supports a motor imagery processing workflow using sample EEG data.
- **Interactive Dashboard:** React-based frontend for interacting with the platform.
- **Backend API:** FastAPI-powered backend for processing requests.
- **Benchmarking:** Benchmark endpoint to evaluate the application's processing workflow.
- **Real-Time Communication:** WebSocket-based communication between frontend and backend.
- **Cloud Deployment:** Deployed frontend and backend services with a cloud-hosted PostgreSQL database.

## System Architecture

```text
                 User
                  |
                  v
       React + Vite Frontend
                  |
          Cloudflare Workers
                  |
          HTTPS / WebSocket
                  |
                  v
          FastAPI Backend
          (Render Hosting)
           /           \
          v             v
   BCI Processing    Benchmark API
          |
          v
    Sample EEG Data
                  |
                  v
       Neon PostgreSQL
```

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Database Hosting | Neon |
| Backend Hosting | Render |
| Frontend Hosting | Cloudflare Workers |
| Communication | REST API, WebSockets |
| Containerization | Docker, Docker Compose |

## Live Deployment

- **Frontend:** https://neuro-mesh.727824tuit152.workers.dev
- **Backend API:** https://neuromesh-backend.onrender.com
- **API Documentation:** https://neuromesh-backend.onrender.com/docs

## Project Structure

```text
NeuroMesh/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── docker-compose.yml
└── README.md
```

## Local Setup

### Prerequisites

- Python
- Node.js and npm
- Docker Desktop (optional, for containerized execution)
- PostgreSQL database

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Configure the required environment variables, including the database connection string.

Start the backend:

```bash
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open the local frontend URL displayed by Vite.

## Benchmarking

NeuroMesh includes a benchmark endpoint that can be accessed through the backend API.

API endpoint:

```text
GET /api/benchmark
```

The benchmark functionality can be accessed through the deployed application or API documentation.

## Deployment Architecture

- **Frontend:** Cloudflare Workers
- **Backend:** Render
- **Database:** Neon PostgreSQL

The frontend communicates with the deployed backend using HTTPS requests and secure WebSocket connections.

## Project Scope

This project currently demonstrates a BCI processing and motor imagery command workflow using sample EEG data. Further development can include testing with real EEG datasets, expanding signal-processing pipelines, and improving distributed processing capabilities.

## Future Enhancements

- Integration with real EEG datasets such as PhysioNet.
- Advanced motor imagery classification models.
- Improved real-time signal visualization.
- Distributed processing optimization.
- Expanded benchmarking and performance analysis.

## Author

Developed as a project exploring distributed real-time BCI processing and motor imagery command systems.
