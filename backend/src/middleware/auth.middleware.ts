import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { USER_ROLES, UserRole } from "../models/User";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 1. Header check: "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;
  const parts = authHeader ? authHeader.split(" ") : [];

  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    res
      .status(401)
      .json({ message: "Authorization token missing or malformed" });
    return;
  }

  const token = parts[1];

  // 2. Secret check (server configuration error, secret kabhi response me nahi jata)
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET is not set in the environment");
    res.status(500).json({ message: "Server configuration error" });
    return;
  }

  // 3. Token verify karo
  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  // 4. Payload safely validate karo
  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string" ||
    typeof decoded.role !== "string" ||
    !USER_ROLES.includes(decoded.role as UserRole)
  ) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  // 5. User request me attach karo
  req.user = {
    id: decoded.userId,
    role: decoded.role as UserRole,
  };

  // 6. Sab theek, aage badho
  next();
}