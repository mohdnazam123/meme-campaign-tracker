"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { useAuth, useRequireRole } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import styles from "./brand.module.css";

type Platform = "Instagram" | "YouTube";

interface Milestone {
  views: number;
  payout: number;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  totalBudget: number;
  milestones: Milestone[];
  spent: number;
  remaining: number;
}

interface CampaignListResponse {
  campaigns: Campaign[];
}

interface CreateCampaignResponse {
  message: string;
  campaign: Campaign;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export default function BrandDashboardPage() {
  const { user } = useRequireRole("brand");
  const { logout, authRequest } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [totalBudget, setTotalBudget] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { views: 1000, payout: 100 },
    { views: 5000, payout: 500 },
  ]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    setError("");

    try {
      const data = await authRequest<CampaignListResponse>(
        "/api/campaigns/mine"
      );
      setCampaigns(data.campaigns);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingCampaigns(false);
    }
  }, [authRequest]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchCampaigns() {
      try {
        const data = await authRequest<CampaignListResponse>(
          "/api/campaigns/mine"
        );

        if (!cancelled) {
          setCampaigns(data.campaigns);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoadingCampaigns(false);
        }
      }
    }

    void fetchCampaigns();

    return () => {
      cancelled = true;
    };
  }, [user, authRequest]);

  function updateMilestone(
    index: number,
    field: keyof Milestone,
    value: string
  ) {
    setMilestones((current) =>
      current.map((milestone, i) =>
        i === index
          ? { ...milestone, [field]: value === "" ? 0 : Number(value) }
          : milestone
      )
    );
  }

  function addMilestone() {
    setMilestones((current) => [...current, { views: 10000, payout: 1000 }]);
  }

  function removeMilestone(index: number) {
    setMilestones((current) => current.filter((_, i) => i !== index));
  }

  async function handleCreateCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const budget = Number(totalBudget);

    if (!name.trim()) {
      setError("Please enter a campaign name.");
      return;
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      setError("Budget must be greater than zero.");
      return;
    }

    if (
      milestones.length === 0 ||
      milestones.some(
        (m) =>
          !Number.isInteger(m.views) ||
          m.views <= 0 ||
          !Number.isFinite(m.payout) ||
          m.payout <= 0
      )
    ) {
      setError("Every milestone needs positive views and payout.");
      return;
    }

    const sortedMilestones = [...milestones].sort(
      (a, b) => a.views - b.views
    );

    if (
      sortedMilestones.some(
        (milestone, index) =>
          index > 0 &&
          milestone.views === sortedMilestones[index - 1].views
      )
    ) {
      setError("Each milestone must have a unique view threshold.");
      return;
    }

    if (sortedMilestones.some((m) => m.payout > budget)) {
      setError("A milestone payout cannot exceed the total budget.");
      return;
    }

    setCreating(true);

    try {
      await authRequest<CreateCampaignResponse>("/api/campaigns", {
        method: "POST",
        body: {
          name: name.trim(),
          platform,
          totalBudget: budget,
          milestones: sortedMilestones,
        },
      });

      setName("");
      setTotalBudget("");
      setMilestones([
        { views: 1000, payout: 100 },
        { views: 5000, payout: 500 },
      ]);
      setSuccess("Campaign created successfully.");
      await loadCampaigns();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  if (!user) return <Loading />;

  const money = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <main className="container">
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Brand dashboard</h1>
          <p className={styles.pageSubtitle}>
            Create view-based campaigns and track how much of each budget has
            been paid out.
          </p>
          <p className={styles.welcome}>Welcome, {user.name}!</p>
        </div>
        <button className="btn btn-secondary" onClick={logout}>
          Log out
        </button>
      </header>

      <section
        className={`card ${styles.section}`}
        aria-labelledby="create-campaign-heading"
      >
        <div className={styles.sectionHeader}>
          <h2 id="create-campaign-heading" className={styles.sectionTitle}>
            Create a campaign
          </h2>
          <p className={styles.sectionHint}>
            Add the campaign details and the payout ladder creators can earn.
          </p>
        </div>

        <form onSubmit={handleCreateCampaign}>
          <div className={styles.field}>
            <label htmlFor="campaign-name">Campaign name</label>
            <input
              id="campaign-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Meme Challenge"
              required
            />
          </div>

          <fieldset className={styles.platformGroup}>
            <legend className={styles.groupLabel}>Platform</legend>
            <div className={styles.platformOptions}>
              <label className={styles.platformOption}>
                <input
                  type="radio"
                  name="campaign-platform"
                  value="Instagram"
                  className={styles.platformInput}
                  checked={platform === "Instagram"}
                  onChange={() => setPlatform("Instagram")}
                />
                <span className={styles.platformCard}>
                  <span className={styles.platformCheck} aria-hidden="true" />
                  Instagram
                </span>
              </label>
              <label className={styles.platformOption}>
                <input
                  type="radio"
                  name="campaign-platform"
                  value="YouTube"
                  className={styles.platformInput}
                  checked={platform === "YouTube"}
                  onChange={() => setPlatform("YouTube")}
                />
                <span className={styles.platformCard}>
                  <span className={styles.platformCheck} aria-hidden="true" />
                  YouTube
                </span>
              </label>
            </div>
          </fieldset>

          <div className={styles.field}>
            <label htmlFor="campaign-budget">Total budget (INR)</label>
            <input
              id="campaign-budget"
              className={styles.input}
              type="number"
              min="1"
              step="0.01"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="e.g. 10000"
              required
            />
          </div>

          <h3 className={styles.subsectionTitle}>Milestone payouts</h3>
          <p className={styles.sectionHint}>
            Set the views needed and payout for each milestone. A creator earns
            the payout of the highest milestone reached (payouts do not add up).
          </p>

          <div className={styles.milestoneList}>
            {milestones.map((milestone, index) => (
              <div key={index} className={styles.milestoneCard}>
                <div className={styles.milestoneHeader}>
                  <p className={styles.milestoneTitle}>
                    <span className={styles.milestoneNumber} aria-hidden="true">
                      {index + 1}
                    </span>
                    Milestone {index + 1}
                  </p>
                  <button
                    className={styles.removeButton}
                    type="button"
                    disabled={milestones.length === 1}
                    onClick={() => removeMilestone(index)}
                    aria-label={`Remove milestone ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>

                <div className={styles.milestoneFields}>
                  <div className={styles.field}>
                    <label htmlFor={`views-${index}`}>Required views</label>
                    <input
                      id={`views-${index}`}
                      className={styles.input}
                      type="number"
                      min="1"
                      step="1"
                      value={milestone.views}
                      onChange={(e) =>
                        updateMilestone(index, "views", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={`payout-${index}`}>Payout (INR)</label>
                    <input
                      id={`payout-${index}`}
                      className={styles.input}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={milestone.payout}
                      onChange={(e) =>
                        updateMilestone(index, "payout", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className={styles.addMilestone}
            type="button"
            onClick={addMilestone}
          >
            + Add milestone
          </button>

          {error && (
            <div role="alert" className={`${styles.alert} ${styles.alertError}`}>
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className={`${styles.alert} ${styles.alertSuccess}`}
            >
              {success}
            </div>
          )}

          <div className={styles.formFooter}>
            <button
              className={styles.createButton}
              type="submit"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create campaign"}
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="your-campaigns-heading">
        <h2 id="your-campaigns-heading" className={styles.sectionTitle}>
          Your campaigns
        </h2>
        <p className={styles.sectionHint}>
          Budget spent and remaining for each campaign.
        </p>

        {loadingCampaigns ? (
          <Loading message="Loading campaigns..." />
        ) : campaigns.length === 0 ? (
          <div className={`card ${styles.emptyState}`}>
            <p className="muted">
              No campaigns yet. Create your first campaign above.
            </p>
          </div>
        ) : (
          <div className={styles.campaignGrid}>
            {campaigns.map((campaign) => {
              const spentPercent =
                campaign.totalBudget > 0
                  ? Math.min(100, (campaign.spent / campaign.totalBudget) * 100)
                  : 0;

              return (
                <article
                  className={`card ${styles.campaignCard}`}
                  key={campaign.id}
                >
                  <div className={styles.campaignHeader}>
                    <h3 className={styles.campaignName}>{campaign.name}</h3>
                    <span
                      className={`${styles.badge} ${
                        campaign.platform === "YouTube"
                          ? styles.badgeYoutube
                          : styles.badgeInstagram
                      }`}
                    >
                      {campaign.platform}
                    </span>
                  </div>

                  <dl className={styles.stats}>
                    <div className={styles.stat}>
                      <dt>Total budget</dt>
                      <dd>{money(campaign.totalBudget)}</dd>
                    </div>
                    <div className={styles.stat}>
                      <dt>Spent</dt>
                      <dd>{money(campaign.spent)}</dd>
                    </div>
                    <div className={`${styles.stat} ${styles.statRemaining}`}>
                      <dt>Remaining</dt>
                      <dd>{money(campaign.remaining)}</dd>
                    </div>
                  </dl>

                  <div>
                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-label="Budget spent"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(spentPercent)}
                    >
                      <div
                        className={styles.progressFill}
                        style={{ width: `${spentPercent}%` }}
                      />
                    </div>
                    <p className={styles.progressLabel}>
                      {Math.round(spentPercent)}% of budget spent
                    </p>
                  </div>

                  <div>
                    <h4 className={styles.milestonesTitle}>Milestones</h4>
                    <ul className={styles.campaignMilestones}>
                      {campaign.milestones.map((milestone, index) => (
                        <li key={`${milestone.views}-${index}`}>
                          <span>
                            {milestone.views.toLocaleString("en-IN")} views
                          </span>
                          <span>{money(milestone.payout)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}