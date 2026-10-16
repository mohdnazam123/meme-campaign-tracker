# Meme'd Campaign Payout Tracker

A full-stack web application where brands create meme marketing campaigns and creators earn payouts based on the views their posts reach.

**Live Demo:** https://meme-campaign-tracker-frontend.vercel.app

**GitHub Repository:** https://github.com/mohdnazam123/meme-campaign-tracker

**Backend Health Check:** https://meme-campaign-tracker.onrender.com/api/health

## What Does This Project Do?

Brands can create campaigns with a fixed budget and view-based payout milestones. Creators can browse campaigns, submit their post links, update simulated views, and track their earnings.

The application calculates payouts automatically and prevents payouts from exceeding the available campaign budget.

## Main Features

- User signup and login using JWT authentication.
- Separate roles for brands and creators.
- Create campaigns for Instagram and YouTube.
- Set campaign budgets and payout milestones.
- Browse campaigns and submit post links as a creator.
- Update simulated post views.
- Calculate earnings based on the highest milestone reached.
- Prevent duplicate payouts for repeated view counts.
- Prevent payout increases when the remaining campaign budget is insufficient.
- Track campaign spending and remaining budget.
- Automated tests for authentication and payout logic.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcryptjs
- **Testing:** Jest, SWC

## How Payouts Work

Example:

A campaign has these milestones:

| Views reached | Total payout |
|---:|---:|
| 500 | ₹100 |
| 1,000 | ₹200 |
| 5,000 | ₹500 |

If a creator reaches 1,000 views, the total payout becomes ₹200, not ₹300. The payout is based on the highest milestone reached, not the sum of all milestones.

The application also checks the remaining campaign budget before increasing a payout.

## Business Rules and Assumptions

- Views are simulated for testing; they are not fetched directly from Instagram or YouTube.
- Only the highest reached milestone determines the total payout.
- When a higher milestone is reached, only the difference from the previously paid amount is charged to the campaign budget.
- Repeating the same view count must not create an additional payout.
- Decreasing a submission's view count is rejected.
- If the remaining budget cannot cover the additional payout, the payout remains unchanged.
- Campaign budgets and payouts are in Indian Rupees (INR).
- Duplicate post links are not restricted.

## Getting Started Locally

### Prerequisites

- Node.js and npm
- MongoDB connection string
- Git

### 1. Clone the repository

```bash
git clone https://github.com/mohdnazam123/meme-campaign-tracker.git
cd meme-campaign-tracker
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file using `backend/.env.example` as a reference.

Configure these variables with your own values:

- `PORT` — backend port, usually `5000`.
- `MONGODB_URI` — your MongoDB connection string.
- `CLIENT_URL` — frontend URL, usually `http://localhost:3000`.
- `JWT_SECRET` — a long, random secret used to sign JWT tokens.

Start the backend:

```bash
npm run dev
```

To build and run the production version:

```bash
npm run build
npm start
```

### 3. Set up the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 4. Run the tests

From the backend directory:

```bash
npm test
```

Build the backend:

```bash
npm run build
```

From the frontend directory, run the production build:

```bash
npm run build
```

## Security Notes

- Never commit `.env` or `.env.local` files.
- Do not share passwords, database credentials, or JWT secrets.
- Use environment variables configured on the deployment platform for production.

## Deployment

The frontend is deployed on Vercel and the backend is deployed on Render.

- **Frontend:** https://meme-campaign-tracker-frontend.vercel.app
- **Backend:** https://meme-campaign-tracker.onrender.com
- **Health check:** https://meme-campaign-tracker.onrender.com/api/health

Note: The free backend service may take some time to respond after being inactive.

## Author

**Mohd Nazam**

GitHub: https://github.com/mohdnazam123