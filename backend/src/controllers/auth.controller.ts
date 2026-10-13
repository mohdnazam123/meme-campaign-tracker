import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User, { USER_ROLES, UserRole } from "../models/User";

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role } = req.body ?? {};

   
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      res
        .status(400)
        .json({ message: "name, email, password and role are required" });
      return;
    }

    //  Password 
    if (password.length < 6) {
      res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
      return;
    }
 //  Role check
    if (!USER_ROLES.includes(role as UserRole)) {
      res.status(400).json({ message: "Role must be either brand or creator" });
      return;
    }
//  Duplicate email check
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }
//  Password hash 
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role as UserRole,
    });

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    
    if (error instanceof mongoose.Error.ValidationError) {
      const firstMessage = Object.values(error.errors)[0].message;
      res.status(400).json({ message: firstMessage });
      return;
    }

    
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    console.error("Signup error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}