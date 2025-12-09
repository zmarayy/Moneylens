import { Timestamp } from "firebase-admin/firestore";

export interface User {
  telegramId: string;
  username?: string;
  isPremium: boolean;
  premiumSince?: Timestamp;
  premiumUntil?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Payment {
  telegramId: string;
  amount: number;
  currency: string;
  provider: "stripe";
  status: "pending" | "successful" | "failed";
  createdAt: Timestamp;
  rawData?: any;
}

export interface PremiumPlan {
  id: string;
  title: string;
  description: string;
  amount: number;
  duration: number | null; // null for lifetime, days for monthly
}

