import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import Submission from "../models/Submission";
import { getTargetPayout, calculatePayoutChange } from "../utils/payout";

export async function createSubmission(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // 1. Creator 
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // 2. Body 
    const { campaignId, postLink } = req.body ?? {};

    if (typeof campaignId !== "string" || typeof postLink !== "string") {
      res
        .status(400)
        .json({ message: "campaignId and postLink are required" });
      return;
    }

    // 3. campaignId 
    if (!mongoose.isObjectIdOrHexString(campaignId)) {
      res.status(400).json({ message: "campaignId must be a valid id" });
      return;
    }

    // 4. Campaign 
    const campaignExists = await Campaign.exists({ _id: campaignId });
    if (!campaignExists) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    // 5. Submission banao 
    const submission = await Submission.create({
      campaign: new mongoose.Types.ObjectId(campaignId),
      creator: new mongoose.Types.ObjectId(user.id),
      postLink,
      views: 0,
      payout: 0,
    });

    res.status(201).json({
      message: "Submission created",
      submission: {
        id: submission._id,
        campaign: submission.campaign,
        creator: submission.creator,
        postLink: submission.postLink,
        views: submission.views,
        payout: submission.payout,
      },
    });
  } catch (error) {
    
    if (error instanceof mongoose.Error.ValidationError) {
      const firstMessage = Object.values(error.errors)[0].message;
      res.status(400).json({ message: firstMessage });
      return;
    }

    console.error("Create submission error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function updateSubmissionViews(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // 1. Creator 
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // 2. Submission 
    const id = req.params.id; 
    if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id)) {
      res.status(400).json({ message: "Invalid submission id" });
      return;
    }

    // 3. views 
    const { views } = req.body ?? {};
    if (typeof views !== "number") {
      res.status(400).json({ message: "views is required and must be a number" });
      return;
    }
    if (!Number.isSafeInteger(views) || views < 0) {
      res
        .status(400)
        .json({ message: "views must be a non-negative whole number" });
      return;
    }

    // 4. Submission 
    const submission = await Submission.findById(id);
    if (!submission) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    
    if (submission.creator.toString() !== user.id) {
      res
        .status(403)
        .json({ message: "You can only update your own submissions" });
      return;
    }

    if (views < submission.views) {
      res.status(400).json({ message: "Views cannot decrease" });
      return;
    }

    const campaign = await Campaign.findById(submission.campaign);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    
    const totals = await Submission.aggregate([
      { $match: { campaign: campaign._id } },
      { $group: { _id: null, spent: { $sum: "$payout" } } },
    ]);
    const spent: number = totals.length > 0 ? totals[0].spent : 0;
    const remaining = campaign.totalBudget - spent;

    const targetPayout = getTargetPayout(campaign.milestones, views);
    const change = calculatePayoutChange(
      submission.payout,
      targetPayout,
      remaining
    );

    
    submission.views = views;
    submission.payout = change.newPayout;
    await submission.save();

    res.status(200).json({
      message: change.budgetInsufficient
        ? "Views updated, but payout was not increased because the campaign budget is insufficient"
        : "Views updated",
      submission: {
        id: submission._id,
        campaign: submission.campaign,
        creator: submission.creator,
        postLink: submission.postLink,
        views: submission.views,
        payout: submission.payout,
      },
      additionalPayout: change.additionalPayout,
      budgetInsufficient: change.budgetInsufficient,
      campaignRemaining: remaining - change.additionalPayout,
    });
  } catch (error) {
    console.error("Update submission views error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}


export async function getMySubmissions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (user.role !== "creator") {
      res.status(403).json({
        message: "Only creators can view their submissions",
      });
      return;
    }

    // Logged-in 
    const submissions = await Submission.find({
      creator: new mongoose.Types.ObjectId(user.id),
    })
      .populate("campaign", "name platform")
      .sort({ _id: -1 });

    // Creator ]
    const totalEarnings = submissions.reduce(
      (total, submission) => total + submission.payout,
      0
    );

    res.status(200).json({
      submissions: submissions.map((submission) => {
        const campaign = submission.campaign as unknown as {
          _id: mongoose.Types.ObjectId;
          name: string;
          platform: string;
        } | null;

        return {
          id: submission._id,
          campaign: campaign
            ? {
                id: campaign._id,
                name: campaign.name,
                platform: campaign.platform,
              }
            : null,
          postLink: submission.postLink,
          views: submission.views,
          payout: submission.payout,
        };
      }),
      totalEarnings,
    }); 
  } catch (error) {
    console.error("Get my submissions error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}
