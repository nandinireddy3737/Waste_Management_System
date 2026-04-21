# Citizen Complaints (MongoDB)

- **Database:** `waste_management` (MongoDB)
- **Collection:** `complaints`
- **MySQL:** Unchanged — bins, schedules, workers stay on MySQL.

## Setup

1. Install and start **MongoDB** locally, or use **MongoDB Atlas**.
2. Optional env var: `MONGODB_URI` (default: `mongodb://127.0.0.1:27017`)
3. Run backend: `npm start`

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/complaint` | Create complaint (JSON body) |
| GET | `/complaints` | List all complaints |
| PUT | `/complaint/:id` | Update `status`, append to `updates` |

## React

Citizen Dashboard → **MongoDB Complaints (Smart)** opens the new module.
