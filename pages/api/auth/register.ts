import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { hashPassword } from "../../../utils/auth/hash";
import { logUserIn } from "../../../utils/auth/logUserIn";
import { createVerifyEmailLink } from "../../../utils/auth/verify";
import { prisma } from "../../../utils/db/getPrisma";
import { getEmailTransporter, sendEmail } from "../../../utils/mail/mail";

export default async function register(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { email, password } = req.body;
    // generate salt
    const hashedPassword = await hashPassword(password);

    // 1. Create the user
    const user = await prisma.user.create({
      data: {
        emailAddress: email,
        password: hashedPassword,
      },
    });

    // 2. Send an email verification link

    const verifyLink = await createVerifyEmailLink(email);
    await sendEmail(await getEmailTransporter(), {
      to: email,
      subject: "Verify your email",
      html: `<a href="${verifyLink}">Verify</a>`,
    });

    // 3. Optimistically sign the user in
    await logUserIn(user.id, req, res);

    // TODO: Handle user signed in without verifying email
    return res.status(200).json({ id: user.id });
  } catch (error) {
    console.error("error", error);
    return res.status(500).send("Error");
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500kb",
    },
  },
};
