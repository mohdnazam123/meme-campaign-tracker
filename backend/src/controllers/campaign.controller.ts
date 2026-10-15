
import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign, { Platform } from "../models/Campaign";
import Submission from "../models/Submission";

// Create 
export async function createCampaign(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (user.role !== "brand") {
      res.status(403).json({ message: "Only brands can create campaigns" });
      return;
    }

    const { name, platform, totalBudget, milestones } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof platform !== "string" ||
      typeof totalBudget !== "number"
    ) {
      res.status(400).json({
        message:
          "name and platform must be text and totalBudget must be a number",
      });
      return;
    }

    if (
      !Array.isArray(milestones) ||
      milestones.some(
        (m) =>
          typeof m !== "object" ||
          m === null ||
          typeof m.views !== "number" ||
          typeof m.payout !== "number"
      )
    ) {
      res.status(400).json({
        message: "milestones must be a list of { views, payout } numbers",
      });
      return;
    }

    const cleanMilestones = milestones.map((m) => ({
      views: m.views,
      payout: m.payout,
    }));

    const campaign = await Campaign.create({
      brand: new mongoose.Types.ObjectId(user.id),
      name,
      platform: platform as Platform,
      totalBudget,
      milestones: cleanMilestones,
    });

    res.status(201).json({
      message: "Campaign created",
      campaign: {
        id: campaign._id,
        brand: campaign.brand,
        name: campaign.name,
        platform: campaign.platform,
        totalBudget: campaign.totalBudget,
        milestones: campaign.milestones,
      },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const firstMessage = Object.values(error.errors)[0].message;
      res.status(400).json({ message: firstMessage });
      return;
    }

    console.error("Create campaign error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function getMyCampaigns(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (user.role !== "brand") {
      res.status(403).json({
        message: "Only brands can view their campaigns",
      });
      return;
    }

    const campaigns = await Campaign.find({
      brand: new mongoose.Types.ObjectId(user.id),
    }).sort({ _id: -1 });

    const payoutTotals = await Submission.aggregate([
      {
        $match: {
          campaign: { $in: campaigns.map((c) => c._id) },
        },
      },
      {
        $group: {
          _id: "$campaign",
          spent: { $sum: "$payout" },
        },
      },
    ]);

    const spentByCampaign = new Map<string, number>();

    for (const item of payoutTotals) {
      spentByCampaign.set(item._id.toString(), item.spent);
    }

    const result = campaigns.map((campaign) => {
      const spent = spentByCampaign.get(campaign._id.toString()) ?? 0;

      return {
        id: campaign._id,
        name: campaign.name,
        platform: campaign.platform,
        totalBudget: campaign.totalBudget,
        milestones: campaign.milestones,
        spent,
        remaining: campaign.totalBudget - spent,
      };
    });

    res.status(200).json({ campaigns: result });
  } catch (error) {
    console.error("Get my campaigns error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function getLiveCampaigns(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const campaigns = await Campaign.find().sort({ _id: -1 });

    const payoutTotals = await Submission.aggregate([
      { $group: { _id: "$campaign", spent: { $sum: "$payout" } } },
    ]);

    const spentByCampaign = new Map<string, number>();

    for (const item of payoutTotals) {
      spentByCampaign.set(item._id.toString(), item.spent);
    }

    const liveCampaigns = campaigns
      .map((campaign) => {
        const spent = spentByCampaign.get(campaign._id.toString()) ?? 0;

        return {
          id: campaign._id,
          brand: campaign.brand,
          name: campaign.name,
          platform: campaign.platform,
          totalBudget: campaign.totalBudget,
          milestones: campaign.milestones,
          spent,
          remaining: campaign.totalBudget - spent,
        };
      })
      .filter((campaign) => campaign.remaining > 0);

    res.status(200).json({ campaigns: liveCampaigns });
  } catch (error) {
    console.error("Get live campaigns error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}
