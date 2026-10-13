import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body ?? {};

    // 1. Dono values text honi chahiye aur khali nahi
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.trim() === "" ||
      password === ""
    ) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    // 2. JWT_SECRET missing ho to safely 500 do (app crash nahi hoga)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set in the environment");
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    // 3. User dhundo (password hash explicitly mangao)
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // 4. Password compare karo
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // 5. Token banao (1 din ke liye valid)
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      jwtSecret,
      { expiresIn: "1d" }
    );

    // 6. Response me password nahi
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}