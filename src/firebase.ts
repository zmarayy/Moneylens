import admin from "firebase-admin";
import { config } from "./config";
import { User, Payment } from "./types";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  });
}

const db = admin.firestore();

// User operations
export const userService = {
  async getOrCreateUser(telegramId: string, username?: string): Promise<User> {
    const userRef = db.collection("users").doc(telegramId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return userDoc.data() as User;
    }

    const now = admin.firestore.Timestamp.now();
    const newUser: any = {
      telegramId,
      isPremium: false,
      createdAt: now,
      updatedAt: now,
    };

    // Only include username if it exists (Firestore doesn't allow undefined)
    if (username) {
      newUser.username = username;
    }

    await userRef.set(newUser);
    return newUser;
  },

  async updateUser(telegramId: string, updates: Partial<User>): Promise<void> {
    const userRef = db.collection("users").doc(telegramId);
    // Remove undefined values to avoid Firestore errors
    const cleanUpdates: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }
    await userRef.update(cleanUpdates);
  },

  async getUser(telegramId: string): Promise<User | null> {
    const userDoc = await db.collection("users").doc(telegramId).get();
    if (!userDoc.exists) {
      return null;
    }
    return userDoc.data() as User;
  },

  async setPremium(
    telegramId: string,
    duration: number | null
  ): Promise<void> {
    const now = admin.firestore.Timestamp.now();
    const premiumUntil =
      duration === null
        ? null
        : admin.firestore.Timestamp.fromMillis(
            now.toMillis() + duration * 24 * 60 * 60 * 1000
          );

    await this.updateUser(telegramId, {
      isPremium: true,
      premiumSince: now,
      premiumUntil,
      updatedAt: now,
    });
  },

  async checkPremiumStatus(telegramId: string): Promise<boolean> {
    const user = await this.getUser(telegramId);
    if (!user || !user.isPremium) {
      return false;
    }

    // Check if premium has expired (for monthly plans)
    if (user.premiumUntil) {
      const now = admin.firestore.Timestamp.now();
      if (user.premiumUntil.toMillis() < now.toMillis()) {
        // Premium expired
        await this.updateUser(telegramId, {
          isPremium: false,
        });
        return false;
      }
    }

    return true;
  },
};

// Payment operations
export const paymentService = {
  async createPayment(payment: Omit<Payment, "createdAt">): Promise<string> {
    const paymentRef = db.collection("payments").doc();
    const paymentData: Payment = {
      ...payment,
      createdAt: admin.firestore.Timestamp.now(),
    };
    await paymentRef.set(paymentData);
    return paymentRef.id;
  },

  async updatePaymentStatus(
    paymentId: string,
    status: Payment["status"]
  ): Promise<void> {
    await db.collection("payments").doc(paymentId).update({ status });
  },
};

