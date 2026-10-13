import { Schema, model, Types } from "mongoose";

export interface ISubmission {
  campaign: Types.ObjectId;
  creator: Types.ObjectId;
  postLink: string;
  views: number;
  payout: number;
}

const submissionSchema = new Schema<ISubmission>({
  campaign: {
    type: Schema.Types.ObjectId,
    ref: "Campaign",
    required: [true, "Campaign is required"],
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Creator is required"],
  },
  postLink: {
    type: String,
    required: [true, "Post link is required"],
    trim: true,
    validate: {
      validator: (value: string) => {
        try {
          const url = new URL(value);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      message: "Post link must be a valid http or https URL",
    },
  },
  views: {
    type: Number,
    default: 0,
    validate: {
      validator: (value: number) => Number.isInteger(value) && value >= 0,
      message: "Views must be a non-negative whole number",
    },
  },
  payout: {
    type: Number,
    default: 0,
    validate: {
      validator: (value: number) => Number.isFinite(value) && value >= 0,
      message: "Payout must be a non-negative number",
    },
  },
});

const Submission = model<ISubmission>("Submission", submissionSchema);

export default Submission;