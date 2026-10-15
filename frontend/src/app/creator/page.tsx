"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { ApiError } from "@/lib/api";
import { useAuth, useRequireRole } from "@/context/AuthContext";

interface Milestone {
  views: number;
  payout: number;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  milestones: Milestone[];
}

interface Submission {
  id: string;
  campaign: {
    id: string;
    name: string;
    platform: string;
  } | null;
  postLink: string;
  views: number;
  payout: number;
}

interface CampaignResponse {
  campaigns: Campaign[];
}

interface SubmissionResponse {
  submissions: Submission[];
  totalEarnings: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function formatMoney(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export default function CreatorDashboardPage() {
const { user, loading: authLoading } = useAuth();
useRequireRole("creator");  const { logout, authRequest } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [postLink, setPostLink] = useState("");
  const [viewsInput, setViewsInput] = useState<Record<string, string>>({});

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const [campaignData, submissionData] = await Promise.all([
        authRequest<CampaignResponse>("/api/campaigns"),
        authRequest<SubmissionResponse>("/api/submissions/mine"),
      ]);

      setCampaigns(campaignData.campaigns);
      setSubmissions(submissionData.submissions);
      setTotalEarnings(submissionData.totalEarnings);

      setViewsInput((previous) => {
        const next = { ...previous };

        for (const submission of submissionData.submissions) {
          if (!(submission.id in next)) {
            next[submission.id] = String(submission.views);
          }
        }

        return next;
      });

      setSelectedCampaign((current) => {
        if (campaignData.campaigns.some((c) => c.id === current)) {
          return current;
        }

        return campaignData.campaigns[0]?.id ?? "";
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingData(false);
    }
  }, [authRequest]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchDashboard() {
      try {
        const [campaignData, submissionData] = await Promise.all([
          authRequest<CampaignResponse>("/api/campaigns"),
          authRequest<SubmissionResponse>("/api/submissions/mine"),
        ]);

        if (cancelled) return;

        setCampaigns(campaignData.campaigns);
        setSubmissions(submissionData.submissions);
        setTotalEarnings(submissionData.totalEarnings);

        setViewsInput((previous) => {
          const next = { ...previous };

          for (const submission of submissionData.submissions) {
            if (!(submission.id in next)) {
              next[submission.id] = String(submission.views);
            }
          }

          return next;
        });

        setSelectedCampaign((current) => {
          if (campaignData.campaigns.some((c) => c.id === current)) {
            return current;
          }

          return campaignData.campaigns[0]?.id ?? "";
        });
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    void fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [user, authRequest]);

  async function handleSubmitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedCampaign) {
      setError("Please select a campaign.");
      return;
    }

    if (!postLink.trim()) {
      setError("Please enter your post link.");
      return;
    }

    try {
      new URL(postLink.trim());
    } catch {
      setError("Please enter a valid URL, including https://.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await authRequest<{ message: string }>(
        "/api/submissions",
        {
        method: "POST",
         body: {
         campaignId: selectedCampaign,
        postLink: postLink.trim(),
       },  
        }
      );

      setSuccess(result.message || "Post submitted successfully.");
      setPostLink("");
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateViews(submission: Submission) {
    setError("");
    setSuccess("");

    const rawViews = viewsInput[submission.id] ?? "";

    if (rawViews.trim() === "") {
      setError("Please enter the number of views.");
      return;
    }

    const views = Number(rawViews);

    if (!Number.isSafeInteger(views) || views < submission.views) {
      setError(
        `Views must be a whole number and cannot be less than ${submission.views}.`
      );
      return;
    }

    setUpdatingId(submission.id);

    try {
      const result = await authRequest<{
        message: string;
        budgetInsufficient: boolean;
        additionalPayout: number;
      }>(`/api/submissions/${submission.id}/views`, {
        method: "PATCH",
        body: { views },
      });

      setSuccess(
        result.budgetInsufficient
          ? `${result.message}. Your payout remains unchanged.`
          : `${result.message}. Additional payout: ${formatMoney(
              result.additionalPayout
            )}.`
      );

      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  if (authLoading || !user) return <Loading />;

  return (
    <main className="container">
      <header className="dashboard-header">
        <div>
          <h1>Creator Dashboard</h1>
          <p>Welcome, {user.name}!</p>
        </div>

        <button className="btn btn-secondary" onClick={logout}>
          Log out
        </button>
      </header>

      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="alert alert-success" role="status">
          {success}
        </p>
      )}

      <section className="dashboard-stats">
        <article className="card">
          <h2>Total Earnings</h2>
          <p className="stat-value">{formatMoney(totalEarnings)}</p>
        </article>

        <article className="card">
          <h2>Live Campaigns</h2>
          <p className="stat-value">{campaigns.length}</p>
        </article>

        <article className="card">
          <h2>My Submissions</h2>
          <p className="stat-value">{submissions.length}</p>
        </article>
      </section>

      <section className="card dashboard-section">
        <h2>Available Campaigns</h2>
        <p>Select a campaign and submit your post URL.</p>

        {loadingData ? (
          <Loading />
        ) : campaigns.length === 0 ? (
          <p>No live campaigns are available right now.</p>
        ) : (
          <div className="campaign-grid">
            {campaigns.map((campaign) => (
              <article className="card campaign-card" key={campaign.id}>
                <h3>{campaign.name}</h3>
                <p>Platform: {campaign.platform}</p>
                <p>Campaign budget: {formatMoney(campaign.totalBudget)}</p>
                <p>Budget spent: {formatMoney(campaign.spent)}</p>
                <p>Budget remaining: {formatMoney(campaign.remaining)}</p>

                <h4>Milestones</h4>
                <ul>
                  {campaign.milestones.map((milestone, index) => (
                    <li key={`${campaign.id}-${index}`}>
                      {milestone.views.toLocaleString("en-IN")} views —{" "}
                      {formatMoney(milestone.payout)}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card dashboard-section">
        <h2>Submit a Post</h2>

        <form onSubmit={handleSubmitPost} className="dashboard-form">
          <label htmlFor="campaign">Select campaign</label>
          <select
            id="campaign"
            value={selectedCampaign}
            onChange={(event) => setSelectedCampaign(event.target.value)}
            required
            disabled={campaigns.length === 0 || submitting}
          >
            {campaigns.length === 0 && (
              <option value="">No campaigns available</option>
            )}

            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} ({campaign.platform})
              </option>
            ))}
          </select>

          <label htmlFor="postLink">Instagram / YouTube post URL</label>
          <input
            id="postLink"
            type="url"
            placeholder="https://..."
            value={postLink}
            onChange={(event) => setPostLink(event.target.value)}
            required
            disabled={submitting}
          />

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || campaigns.length === 0}
          >
            {submitting ? "Submitting..." : "Submit Post"}
          </button>
        </form>
      </section>

      <section className="card dashboard-section">
        <h2>My Submissions & Earnings</h2>

        {loadingData ? (
          <Loading />
        ) : submissions.length === 0 ? (
          <p>You have not submitted any posts yet.</p>
        ) : (
          <div className="submission-list">
            {submissions.map((submission) => (
              <article className="card submission-card" key={submission.id}>
                <h3>{submission.campaign?.name ?? "Campaign unavailable"}</h3>
                <p>Platform: {submission.campaign?.platform ?? "N/A"}</p>

                <p>
                  Post:{" "}
                  <a
                    href={submission.postLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open submitted post
                  </a>
                </p>

                <p>Current views: {submission.views.toLocaleString("en-IN")}</p>
                <p>Earned payout: {formatMoney(submission.payout)}</p>

                <form
                  className="dashboard-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleUpdateViews(submission);
                  }}
                >
                  <label htmlFor={`views-${submission.id}`}>
                    Update simulated views
                  </label>

                  <input
                    id={`views-${submission.id}`}
                    type="number"
                    min={submission.views}
                    step={1}
                    value={viewsInput[submission.id] ?? String(submission.views)}
                    onChange={(event) =>
                      setViewsInput((previous) => ({
                        ...previous,
                        [submission.id]: event.target.value,
                      }))
                    }
                    required
                    disabled={updatingId === submission.id}
                  />

                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={updatingId === submission.id}
                  >
                    {updatingId === submission.id
                      ? "Updating..."
                      : "Update Views"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}