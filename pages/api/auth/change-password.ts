import { NextApiRequest, NextApiResponse } from "next";
import { authenticateUser } from "../../../utils/auth/authenticateUser";
import { hashPassword } from "../../../utils/auth/hash";
import { logUserIn } from "../../../utils/auth/logUserIn";
import { getUserFromCookies } from "../../../utils/auth/user";
import { prisma } from "../../../utils/db/getPrisma";

export default async function register(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await getUserFromCookies(req, res);
    if (user) {
      const { isAuthenticated } = await authenticateUser(
        user.emailAddress,
        oldPassword
      );
      // User is logged in and has re-entered the correct current password
      if (isAuthenticated) {
        // Update the password
        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            password: hashedPassword,
          },
        });
      }
    }

    return res.status(200).json({ id: user.id });
  } catch (error) {
    console.error("error", error);
    res.status(401).send("Unauthorized");
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500kb",
    },
  },
};
