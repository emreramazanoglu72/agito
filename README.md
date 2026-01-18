# Agito Case - B2B Insurance Portal

Agito Case is a modern B2B insurance platform designed to streamline policy management, employee tracking, and corporate insurance applications. It is built as a monorepo using **TurboRepo**, featuring a **Next.js** frontend and a **NestJS** backend.

## 🚀 Tech Stack

### Monorepo & Build Tool
- **TurboRepo**: High-performance build system for JavaScript/TypeScript monorepos.
- **Yarn Workspaces**: Dependency management for multiple packages.

### Frontend (`apps/web`)
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Radix UI (Primitives), Lucide React (Icons)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Charts**: Chart.js, React Chartjs 2

### Backend (`apps/api`)
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: Passport.js (JWT)
- **Search**: Elasticsearch
- **Caching & Queues**: Redis
- **Documentation**: Swagger (OpenAPI)
- **Validation**: Class Validator, Zod

### Infrastructure
- **Docker & Docker Compose**: Orchestration for PostgreSQL, Redis, Elasticsearch, and Kibana.

## 🛠️ Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v20 or higher
- **Yarn**: v1.22+
- **Docker**: For running database and infrastructure services.

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd agito-case
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    ```

3.  **Environment Setup:**
    -   Configure `.env` in `apps/api/` (copy from example if available).
    -   Configure `.env.local` in `apps/web/`.

## 🏃‍♂️ Running the Project

### Option 1: Full Docker Setup (Recommended for Prod/Staging)
You can run the entire stack (database, services, apps) using Docker Compose:
```bash
docker-compose up -d --build
```

### Option 2: Local Development
1.  **Start Infrastructure** (Postgres, Redis, Elastic):
    ```bash
    docker-compose up postgres redis elasticsearch kibana -d
    ```

2.  **Database Migration**:
    ```bash
    yarn workspace api prisma migrate dev
    ```

3.  **Start Applications** (Web + API):
    ```bash
    yarn dev
    ```
    -   **Web App**: [http://agito.emreramazanoglu.com.tr](http://agito.emreramazanoglu.com.tr)
    -   **API**: [https://api-agito.emreramazanoglu.com.tr](pi-agito.emreramazanoglu.com.tr)
    -   **API Swagger**: [http://localhost:3000/api/docs](http://pi-agito.emreramazanoglu.com.tr/api/docs)

## 📡 Ports

| Service | Port | Description |
| :--- | :--- | :--- |
| **Web App** | 3001 | Next.js Frontend |
| **API Server** | 3000 | NestJS Backend |
| **PostgreSQL** | 5432 | Primary Database |
| **Redis** | 6379 | Cache & Message Broker |
| **Elasticsearch** | 9200 | Search Engine |
| **Kibana** | 5601 | Data Visualization |

## 🧪 Commands

-   `yarn build`: Build all applications.
-   `yarn lint`: Lint all applications.
-   `yarn workspace web ...`: Run command specifically for frontend.
-   `yarn workspace api ...`: Run command specifically for backend.

## 📄 License
UNLICENSED
