import { Schema, model, Types } from "mongoose";

export type Platform = "Instagram" | "YouTube";
export const PLATFORMS: Platform[] = ["Instagram", "YouTube"];

export interface IMilestone {
  views: number;
  payout: number;
}

export interface ICampaign {
  brand: Types.ObjectId;
  name: string;
  platform: Platform;
  totalBudget: number;
  milestones: IMilestone[];
}

const milestoneSchema = new Schema<IMilestone>(
  {
    views: {
      type: Number,
      required: [true, "Milestone views are required"],
      validate: {
        validator: (value: number) => Number.isInteger(value) && value > 0,
        message: "Milestone views must be a positive whole number",
      },
    },
    payout: {
      type: Number,
      required: [true, "Milestone payout is required"],
      validate: {
        validator: (value: number) => Number.isFinite(value) && value > 0,
        message: "Milestone payout must be greater than 0",
      },
    },
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>({
  brand: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Brand is required"],
  },
  name: {
    type: String,
    required: [true, "Campaign name is required"],
    trim: true,
    minlength: [2, "Campaign name must be at least 2 characters"],
    maxlength: [100, "Campaign name must be at most 100 characters"],
  },
  platform: {
    type: String,
    enum: {
      values: PLATFORMS,
      message: "Platform must be either Instagram or YouTube",
    },
    required: [true, "Platform is required"],
  },
  totalBudget: {
    type: Number,
    required: [true, "Total budget is required"],
    validate: {
      validator: (value: number) => Number.isFinite(value) && value > 0,
      message: "Total budget must be greater than 0",
    },
  },
  milestones: {
    type: [milestoneSchema],
    validate: [
      {
        validator: (value: IMilestone[]) => value.length > 0,
        message: "At least one milestone is required",
      },
      {
        validator: (value: IMilestone[]) =>
          new Set(value.map((m) => m.views)).size === value.length,
        message: "Milestone view thresholds must be unique",
      },
    ],
  },
});

const Campaign = model<ICampaign>("Campaign", campaignSchema);

export default Campaign;