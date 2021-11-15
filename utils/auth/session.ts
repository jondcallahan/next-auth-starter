import { User } from ".prisma/client";
import { prisma } from "../db/getPrisma";
import { nanoid } from "nanoid";
import { addDays } from "date-fns";

export async function createSession(
  userId: User["id"],
  connectionInfo: { ipAddress: string; userAgent: string }
) {
  try {
    // Generate a session token
    const sessionToken = nanoid();
    // TODO: Add a "remember me" option that toggles this value between a 1 and 30 day expiry
    const sessionExpiry = addDays(new Date(), 30);

    // Retrieve connection information (user agent, ip address, etc.)
    const { ipAddress, userAgent } = connectionInfo;
    // Database insert for session
    const newSession = await prisma.authSession.create({
      data: {
        sessionToken,
        userId,
        valid: true,
        userAgent,
        ipAddress,
        expiresAt: sessionExpiry,
      },
    });

    // Return session token
    return newSession.sessionToken;
  } catch (error) {
    throw new Error("Session creation failed" + error);
  }
}

export async function getSessionsByUserId(userId: User["id"]) {
  try {
    const sessions = await prisma.authSession.findMany({
      where: {
        userId: userId,
      },
    });
    return sessions;
  } catch (error) {
    throw new Error("Unable to get sessions for " + userId + error);
  }
}

export async function updateSession() {
  try {
  } catch (error) {
    console.error("error", error);
  }
}

export async function deleteSession(sessionToken: string) {
  return await prisma.authSession.delete({ where: { sessionToken } });
}
