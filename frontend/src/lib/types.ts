export type Role = "brand" | "creator";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface SignupResponse {
  message: string;
  user: User;
}