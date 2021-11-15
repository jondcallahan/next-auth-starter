import { NextApiRequest, NextApiResponse } from "next";
import { NextApiRequestCookies } from "next/dist/server/api-utils";
import { deletAuthCookiesFromResponse } from "../../../utils/auth/cookies";
import {
  deleteSession,
  getSessionsByUserId,
} from "../../../utils/auth/session";
import { verifyToken } from "../../../utils/auth/tokens";
import { getUserFromCookies } from "../../../utils/auth/user";

export async function getUserSessions(
  request: NextApiRequest,
  reply: NextApiResponse
) {
  try {
    const user = await getUserFromCookies(request, reply);

    if (user) {
      const sessions = await getSessionsByUserId(user.id);
      return reply.json(sessions);
    }

    reply.status(401).send("Unauthorized");
  } catch (error) {
    console.error("error", error);
    reply.status(400).send("Error");
  }
}

export async function removeUserSession(
  request: NextApiRequest & { cookies: NextApiRequestCookies },
  res: NextApiResponse
) {
  try {
    const user = await getUserFromCookies(request, res);

    if (user) {
      const sessionToDelete = request.body?.sessionToken;
      console.log("sessionToken", request.body);

      const deletedSession = await deleteSession(sessionToDelete);

      if (request?.cookies?.refreshToken) {
        const verifiedToken = await verifyToken(request.cookies.refreshToken);

        if (!verifiedToken["sessionToken"]) {
          throw new Error("Cannot read sessionToken from JWT");
        }

        if (verifiedToken["sessionToken"] === deletedSession.sessionToken) {
          deletAuthCookiesFromResponse(res);
        }
        return res.setHeader("x-redirect", "/").send("redirect");
      }

      return res.json({ deletedSession: deletedSession.sessionToken });
    }

    res.status(401).send("Unauthorized");
  } catch (error) {
    console.error("error", error);
    res.status(400).send("Error");
  }
}

export default async function handleSessionsRequest(
  request: NextApiRequest,
  reply: NextApiResponse
) {
  switch (request.method) {
    case "GET":
      return getUserSessions(request, reply);
      break;
    case "DELETE":
      return removeUserSession(request, reply);
      break;
    default:
      reply.status(405).setHeader("Allow", "GET, DELETE").send("");
      break;
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500kb",
    },
  },
};
