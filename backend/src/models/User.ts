import { Schema, model } from "mongoose";

export type UserRole = "brand" | "creator";
export const USER_ROLES: UserRole[] = ["brand", "creator"];

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name must be at most 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false,
  },
  role: {
    type: String,
    enum: {
      values: USER_ROLES,
      message: "Role must be either brand or creator",
    },
    required: [true, "Role is required"],
  },
});

const User = model<IUser>("User", userSchema);

export default User;