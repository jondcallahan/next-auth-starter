import { NextApiRequest, NextApiResponse } from "next";
import { parseIPAddress } from "../net";
import { createSession } from "./session";
import { refreshTokens } from "./tokens";

export async function logUserIn(
  userId,
  request: NextApiRequest,
  reply: NextApiResponse
) {
  const connectionInfo = {
    ipAddress: parseIPAddress(request),
    userAgent: request.headers["user-agent"],
  };
  // Create session
  try {
    console.log("creating session for request.headers:", request.headers);

    const sessionToken = await createSession(userId, connectionInfo);
    await refreshTokens(sessionToken, userId, reply);
  } catch (error) {
    console.error("error", error);
  }
}
