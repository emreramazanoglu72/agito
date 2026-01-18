# ADR 001: Architecture & Tech Stack Selection

**Date:** 2026-01-17
**Status:** Accepted
**Context:** Agito / Senior Frontend Case Study

## 1. Context & Problem Statement
We are tasked with building a "Corporate Bulk Operations Portal" for B2B insurance customers.
The key challenges are:
1.  **High Data Density:** Corporate clients handle thousands of employees.
2.  **Complex Operations:** Bulk uploads, endorsements, and dynamic queries.
3.  **UI Consistency:** Providing a premium, "Enterprise" look and feel.
4.  **Performance:** Searching through large datasets without latency.

## 2. Technical Decisions

### A. Monorepo Structure (Turborepo)
*   **Decision:** We will use a Monorepo hosting both `apps/web` and `apps/api`.
*   **Reasoning:** allows for type sharing (DTOs) between Backend and Frontend. It simulates a real-world enterprise environment where code sharing reduces bugs.

### B. Backend: Event-Driven Microservice Architecture
*   **Core:** NestJS + PostgreSQL (Transactional Data).
*   **Search Engine:** Elasticsearch (Complex Filtering & Full-text search).
*   **Caching & State (Redis):**
    *   *Decision:* Use Redis for Job Status Tracking.
    *   *Why?* The Frontend polls Redis to show a progress bar ("Processing 450/500..."). Also acts as a cache for static definitions (Cities, Policy Types).

### C. Frontend: Next.js + PrimeReact v11 (Alpha/Beta)
*   **Next.js (App Router):** Future-proof Routing and Server Components.
*   **PrimeReact v11 + Tailwind:**
    *   *Strategic Choice:* We need the *capabilities* of an enterprise grid (Pivot, Filters, Virtual Scroll) which PrimeReact excels at.
    *   *The "Modern" Twist:* Using v11's Tailwind integration removes the "clunky legacy UI" feel, giving us total styling control while keeping the logic.
    *   *Risk Mitigation:* We acknowledge v11 is fresh, but the architectural gain of "Unstyled Mode" outweighs the version risk for a case study.

### D. Atomic Design Methodology
*   **Structure:** `items`, `molecules`, `organisms`, `templates`, `pages`.
*   **Why:** Prevents the "Component Soup" problem. It shows intent and organized thinking.

## 3. Consequences
*   **Positive:** Highly scalable, typesafe, and performant search.
*   **Negative:** Higher initial setup time (Boilerplate). Complexity of managing an Elastic container.

## 4. Compliance
*   All code will strictly follow linting rules.
*   Responsive design is mandatory (Mobile First utilities).
