import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign, { Platform } from "../models/Campaign";

export async function createCampaign(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // 1. Brand ki pehchan middleware se aati hai, body se nahi
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // 2. Sirf brand campaign bana sakta hai
    if (user.role !== "brand") {
      res.status(403).json({ message: "Only brands can create campaigns" });
      return;
    }

    const { name, platform, totalBudget, milestones } = req.body ?? {};

    // 3. Basic type checks
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

    // 4. Sirf views aur payout rakho, extra fields hata do
    const cleanMilestones = milestones.map((m) => ({
      views: m.views,
      payout: m.payout,
    }));

    // 5. Save karo (baaki rules Campaign model check karega)
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