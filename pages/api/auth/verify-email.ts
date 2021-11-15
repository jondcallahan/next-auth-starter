import { NextApiRequest, NextApiResponse } from "next";
import { getUserFromCookies } from "../../../utils/auth/user";
import { createVerifyEmailLink } from "../../../utils/auth/verify";
import { getEmailTransporter, sendEmail } from "../../../utils/mail/mail";

export default async function verifyEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { method } = req;
    switch (method) {
      case "POST":
        const foundUser = await getUserFromCookies(req, res);
        if (!foundUser) {
          return res.status(401).send("Unauthorized");
        }
        const verifyLink = await createVerifyEmailLink(foundUser.emailAddress);
        await sendEmail(await getEmailTransporter(), {
          to: foundUser.emailAddress,
          subject: "Verify your email",
          html: `<a href="${verifyLink}">Verify</a>`,
        });
        res.send("OK");
        break;

      default:
        res.status(405).setHeader("Allow", "POST").send("");
        break;
    }
  } catch (error) {
    console.error("error", error);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500kb",
    },
  },
};
