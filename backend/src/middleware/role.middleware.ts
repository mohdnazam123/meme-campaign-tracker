import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/User";

export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ message: "Access denied for your role" });
      return;
    }

    next();
  };
}