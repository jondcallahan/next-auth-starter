import type { IncomingMessage } from "http";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";
import { User } from ".prisma/client";
import { prisma } from "../db/getPrisma";
import { refreshTokens, verifyToken } from "./tokens";
import { NextApiResponse } from "next";
import { deleteSession } from "./session";
import { deletAuthCookiesFromResponse } from "./cookies";

export async function getUserFromCookies(
  req: IncomingMessage & { cookies: NextApiRequestCookies },
  res: NextApiResponse
): Promise<{
  id: string;
  emailAddress: string;
  emailAddressVerified: boolean;
} | null> {
  try {
    // Get the access and refresh tokens
    // If there is an access token
    if (req?.cookies?.accessToken) {
      console.time("access-token-flow");
      const { accessToken } = req.cookies;
      // Decode access token JWTs
      const decodedAccessToken = await verifyToken(accessToken);

      if (!decodedAccessToken) {
        console.timeEnd("access-token-flow");
        throw new Error("Unable to verify JWT");
      }

      console.log("decodedAccessToken", decodedAccessToken);
      const foundUser = await prisma.user.findUnique({
        where: {
          id: decodedAccessToken["userId"],
        },
        // Only return necessary data
        select: {
          id: true,
          emailAddress: true,
          emailAddressVerified: true,
        },
      });

      console.log("foundUser", foundUser);

      console.timeEnd("access-token-flow");
      // Return user from record
      return foundUser;
    } else if (req?.cookies?.refreshToken) {
      console.time("refresh-token-flow");
      // If no access token, decode refresh token to get a session token
      const verifiedToken = await verifyToken(req.cookies.refreshToken);
      if (!verifiedToken) {
        console.timeEnd("refresh-token-flow");
        throw new Error("Unable to verify JWT");
      }

      const sessionToken: string = verifiedToken["sessionToken"];

      // Check if session exists and isn't expired
      const currentSession = await prisma.authSession.findUnique({
        where: {
          sessionToken,
        },
        include: {
          user: {
            // Only return necessary data
            select: {
              id: true,
              emailAddress: true,
              emailAddressVerified: true,
            },
          },
        },
      });
      if (currentSession) {
        // Current session exists
        console.log(
          "Refreshing access token based on currentSession:",
          currentSession
        );

        // Check if session is expired
        if (new Date() > currentSession.expiresAt) {
          // Session is expired
          console.warn("CURRENT SESSION EXPIRED!!!");
          // Clean up session and remove cookies
          await deleteSession(currentSession.sessionToken);
          deletAuthCookiesFromResponse(res);
          return null;
        }

        // Pull the user off the session
        const currentUser = currentSession.user;

        // If it exists, refresh the tokens with the user id
        await refreshTokens(sessionToken, currentUser.id, res);
        // Return the current user
        console.timeEnd("refresh-token-flow");
        return currentUser;
      } else {
        // Current session does not exist, remove the refresh token from cookie
        deletAuthCookiesFromResponse(res);
      }
    }

    return null;
  } catch (error) {
    console.error("error", error);
    return null;
  }
}
