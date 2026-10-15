# Meme'd Campaign Payout Tracker

A full-stack application where brands create meme marketing campaigns and creators submit social media post links and track earnings based on view milestones.

## Features

- JWT-based user authentication.
- Role-based access for brands and creators.
- Create campaigns with Instagram or YouTube platforms, budgets, and payout milestones.
- Browse available campaigns as a creator.
- Submit post links to campaigns.
- Update simulated post views.
- Calculate payouts based on the highest milestone reached.
- Prevent duplicate payouts when the same view count is submitted again.
- Check campaign budgets before increasing payouts.
- Automated Jest tests for authentication and payout logic.

## Tech Stack

**Frontend:** Next.js, React, TypeScript  
**Backend:** Node.js, Express.js, TypeScript  
**Database:** MongoDB, Mongoose  
**Authentication:** JWT, bcryptjs  
**Testing:** Jest, SWC

## Prerequisites

- Node.js and npm
- MongoDB connection string
- Git

## Project Structure

```text
meme-campaign-tracker/
├── backend/
├── frontend/
├── .gitignore
└── README.md
```

## Backend Setup

```bash
git clone https://github.com/mohdnazam123/meme-campaign-tracker.git
cd meme-campaign-tracker/backend
npm install
```

Create `backend/.env` using `backend/.env.example` as a reference.

Configure these variables:

- `PORT` — backend server port.
- `MONGODB_URI` — MongoDB connection string.
- `CLIENT_URL` — frontend URL allowed by the backend.
- `JWT_SECRET` — a strong, private JWT signing secret.

Run the development server:

```bash
npm run dev
```

Build the backend:

```bash
npm run build
```

Run the compiled server:

```bash
npm start
```

## Frontend Setup

Open another terminal:

```bash
cd meme-campaign-tracker/frontend
npm install
```

Create `frontend/.env.local` and configure:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

For a production build:

```bash
npm run build
```

## Testing

Run the backend automated tests:

```bash
cd backend
npm test
```

The test suite covers authentication and payout calculation scenarios, including insufficient budget and repeated view updates.

## Payout and Budget Rules

- A creator earns the payout for the highest milestone reached, not the sum of all milestone payouts.
- When a submission reaches a higher payout milestone, only the difference between the new target payout and the previously paid amount is considered.
- A payout increase is rejected if the required additional amount exceeds the campaign's remaining budget.
- Repeating the same view count must not produce another payout.
- Decreasing a submission's view count is rejected.
- If the budget is insufficient, the payout remains unchanged.

## Assumptions

- View counts are simulated through the application's API; views are not fetched directly from Instagram or YouTube.
- Campaign budgets and milestone payouts are expressed in INR.
- The payout is based on the highest reached milestone.
- The application uses MongoDB to persist users, campaigns, and submissions.

## Environment Variables and Security

- Never commit `.env` or `.env.local` files.
- Use `.env.example` files to document the required variables without real secrets.
- Configure production environment variables through the deployment platform.
- Use a strong JWT secret in production.

## Deployment

**Live application:** Pending deployment.

The frontend and backend must both be deployed and configured to communicate with each other before a working live link can be provided.

## Repository

GitHub: https://github.com/mohdnazam123/meme-campaign-tracker
