import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import Submission from "../models/Submission";

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