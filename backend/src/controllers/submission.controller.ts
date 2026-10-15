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
    // 1. Creator ki pehchan token se, body se nahi
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // 2. Body se sirf campaignId aur postLink padho
    const { campaignId, postLink } = req.body ?? {};

    if (typeof campaignId !== "string" || typeof postLink !== "string") {
      res
        .status(400)
        .json({ message: "campaignId and postLink are required" });
      return;
    }

    // 3. campaignId sahi ObjectId format me ho
    if (!mongoose.isObjectIdOrHexString(campaignId)) {
      res.status(400).json({ message: "campaignId must be a valid id" });
      return;
    }

    // 4. Campaign database me hona chahiye
    const campaignExists = await Campaign.exists({ _id: campaignId });
    if (!campaignExists) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    // 5. Submission banao (views aur payout 0 se shuru)
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
    // postLink galat ho to Submission model ka message milta hai
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
    // 1. Creator ki pehchan token se
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // 2. Submission id validate karo
    const id = req.params.id;
    if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id)) {
      res.status(400).json({ message: "Invalid submission id" });
      return;
    }

    // 3. views validate karo (body se sirf views padhte hain)
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

    // 4. Submission dhundo
    const submission = await Submission.findById(id);
    if (!submission) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    // 5. Sirf apni submission update kar sakte ho
    if (submission.creator.toString() !== user.id) {
      res
        .status(403)
        .json({ message: "You can only update your own submissions" });
      return;
    }

    // 6. Views kam nahi ho sakte (same views allowed)
    if (views < submission.views) {
      res.status(400).json({ message: "Views cannot decrease" });
      return;
    }

    // 7. Campaign laao
    const campaign = await Campaign.findById(submission.campaign);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    // 8. Campaign ka spent = us campaign ki saari submissions ke payout ka sum
    const totals = await Submission.aggregate([
      { $match: { campaign: campaign._id } },
      { $group: { _id: null, spent: { $sum: "$payout" } } },
    ]);
    const spent: number = totals.length > 0 ? totals[0].spent : 0;
    const remaining = campaign.totalBudget - spent;

    // 9. Target payout aur budget check
    const targetPayout = getTargetPayout(campaign.milestones, views);
    const change = calculatePayoutChange(
      submission.payout,
      targetPayout,
      remaining
    );

    // 10. Views hamesha save, payout sirf agar change me allowed ho
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