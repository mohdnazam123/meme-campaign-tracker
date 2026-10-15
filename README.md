# Meme'd Campaign Payout Tracker

A full-stack application that helps brands create meme marketing campaigns and allows creators to submit social media post links and track their earnings based on view milestones.

## Features

- User authentication using JWT.
- Role-based access for brands and creators.
- Brands can create campaigns with budgets and view-based payout milestones.
- Creators can view active campaigns and submit post links.
- Creators can update submission views.
- Payouts are calculated according to the highest reached milestone.
- Additional payouts account for amounts already paid.
- Campaign budgets are checked before increasing payouts.
- Automated tests for payout calculation logic.

## Tech Stack

- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT and bcryptjs
- **Testing:** Jest and SWC

## Prerequisites

- Node.js and npm
- MongoDB connection string

## Backend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/mohdnazam123/meme-campaign-tracker.git
   ```

2. Open the backend directory:

   ```bash
   cd meme-campaign-tracker/backend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file inside the `backend` directory using `.env.example` as a reference.

5. Configure your environment variables:

   - `PORT`
   - `MONGODB_URI`
   - `CLIENT_URL`
   - `JWT_SECRET`

   Use your own database connection string and a strong JWT secret. Never commit the actual `.env` file.

## Run the Backend

Start the development server:

```bash
npm run dev
```

Build the TypeScript code:

```bash
npm run build
```

Run the compiled server:

```bash
npm start
```

## Run Tests

```bash
npm test
```

## Payout Logic

- Payouts are based on the highest milestone reached.
- When a creator reaches a higher milestone, only the additional amount is charged to the campaign budget.
- If the remaining budget is insufficient, the new views are saved but the payout is not increased.
- Decreasing views is rejected.
- Repeating the same view count does not create an additional payout for the same milestone.

## Current Scope

The backend is under development. Frontend setup and deployment documentation will be added when those steps are completed.