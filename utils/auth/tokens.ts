import { User } from ".prisma/client";
import { NextApiResponse } from "next";

import jwt from "jsonwebtoken";
import { addDays, addMinutes, addSeconds } from "date-fns";
import { addAuthCookiesToResponse } from "./cookies";

const JWTSignature = process.env.JWT_SIGNATURE;

/**
 * Sets a new access token with 3 min expiration and upates the refresh token with 30 day expiration
 * @param sessionToken the session ID
 * @param userId the user's ID
 * @param res response
 */
export async function refreshTokens(
  sessionToken: string,
  userId: User["id"],
  res: NextApiResponse
) {
  try {
    // 30 days
    const refreshTokenExpiry = addDays(new Date(), 30);
    // 5 mins
    let accessTokenExpiry = addMinutes(new Date(), 3);

    if (process.env.NODE_ENV === "development") {
      // For development expire the tokens every 5 seconds
      accessTokenExpiry = addSeconds(new Date(), 5);
    }

    const { accessToken, refreshToken } = await createTokens(
      sessionToken,
      userId,
      accessTokenExpiry.getTime()
    );

    addAuthCookiesToResponse(
      res,
      accessToken,
      accessTokenExpiry,
      refreshToken,
      refreshTokenExpiry
    );
  } catch (error) {
    console.error("error", error);
  }
}

export async function createTokens(sessionToken, userId, accessTokenExpiry) {
  try {
    // Create a refresh token
    const refreshToken = jwt.sign(
      {
        sessionToken,
      },
      JWTSignature,
      {
        algorithm: "HS512",
      }
    );
    // Session ID
    // Create Access token
    // Session ID, User ID
    const accessToken = jwt.sign(
      {
        sessionToken,
        userId,
        exp: accessTokenExpiry,
      },
      JWTSignature,
      {
        algorithm: "HS512",
      }
    );
    // Return Refresh Token and Access Token
    console.log(JSON.stringify({ refreshToken, accessToken }));
    return { refreshToken, accessToken };
  } catch (error) {
    console.error("error", error);
  }
}

export async function verifyToken(token) {
  return jwt.verify(token, JWTSignature, {
    algorithms: ["HS512"],
  });
}
