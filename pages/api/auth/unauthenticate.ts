import { NextApiRequest, NextApiResponse } from "next";
import { deletAuthCookiesFromResponse } from "../../../utils/auth/cookies";
import { deleteSession } from "../../../utils/auth/session";
import { verifyToken } from "../../../utils/auth/tokens";

export default async function logUserOut(
  request: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Remove cookies for everyone
    deletAuthCookiesFromResponse(res);
    // get refreshToken
    if (request?.cookies?.refreshToken) {
      // Decode sessiontoken from refreshtoken
      const verifiedToken = await verifyToken(request.cookies.refreshToken);

      if (verifiedToken["sessionToken"]) {
        // delete db record for session
        await deleteSession(verifiedToken["sessionToken"]);

        return res.send("OK");
      } else {
        throw new Error("Cannot read sessionToken from JWT");
      }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.error("error", error);
    res.status(400).send("Error");
  }
}
