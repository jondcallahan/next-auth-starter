import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { hashToken } from "../../../utils/auth/hash";
import { prisma } from "../../../utils/db/getPrisma";
import { getEmailTransporter, sendEmail } from "../../../utils/mail/mail";

const ONE_DAY = 24 * 60 * 60 * 1000;

function createResetPasswordToken() {
  const token = crypto.randomBytes(64).toString("hex");
  return token;
}

export default async function forgotPasswordHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const email = req.body.email;
    if (!email) {
      res.status(403).send("Email address required");
    }
    console.log("email", email);

    // Lookup userId by email
    const foundUser = await prisma.user.findUnique({
      where: {
        emailAddress: email,
      },
    });
    if (!foundUser) return;
    // Create a token
    const token = createResetPasswordToken();
    // Store hash of token in passwordresettokens

    // Since we will be looking up the token hash later we cannot have a random salt added
    const tokenHash = hashToken(token);
    // Create new Date instance
    const tokenExpiry = new Date();
    // Add a day
    tokenExpiry.setDate(tokenExpiry.getDate() + 1);

    await prisma.passwordResetTokens.create({
      data: {
        userId: foundUser.id,
        token: tokenHash,
        tokenExpiry: tokenExpiry,
      },
    });
    // Send user an email with a link containing token
    sendEmail(await getEmailTransporter(), {
      from: "noreply@example.com",
      to: email,
      subject: "Password reset link",
      html: `<a href="http://localhost:3000/auth/reset-password/?token=${token}">Reset password</a><br /><p>Note: this link will expire in 24 hours</p>`,
    });

    console.log("token", token);
    console.log("tokenHash", tokenHash);
    //
    res.status(200).send("OK");
  } catch (error) {
    console.error("error", error);
    // Always send back success for this endpoint
    res.status(200).send("OK");
  }
}
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500kb",
    },
  },
};

// export async function createResetPasswordEmailLink(email) {
//   try {
//     // Create timestamp
//     const expirationTimestamp = Date.now() + ONE_DAY;
//     // Create token
//     // Link email contains user email, a token and an expiration date
//     const token = await createResetPasswordToken();
//     const foundUser = await prisma.user.findUnique({
//       where: {
//         emailAddress: email,
//       },
//     });
//     // Encode url string
//     const URIEncodedEmail = encodeURIComponent(email);
//     // Return link for verification
//     return `https://${process.env.ROOT_DOMAIN}/reset/${URIEncodedEmail}/${expirationTimestamp}/${token}`;
//   } catch (error) {
//     console.error("error", error);
//   }
// }

// export async function createResetPasswordLink(email) {
//   //
//   try {
//     const { user } = await import("../user/user.js");
//     const foundUser = await user.findOne({
//       "email.address": email,
//     });
//     // If user exist
//     if (foundUser) {
//       // Create email link
//       const link = await createResetPasswordEmailLink(foundUser.email.address);
//       // The token will contain a server side secret, the email, and the expiration date datestamp
//       return link;
//     }
//     return "";
//   } catch (error) {
//     console.error("error", error);
//     return false;
//   }
// }
// /**
//  * TODO: I don't understand this function, replace it with something understandable
//  * @param {Date} expirationTimestamp
//  * @returns {Boolean}
//  */
// function validateExpTimestamp(expirationTimestamp) {
//   const dateDiff = Number(expirationTimestamp) - Date.now();
//   // TODO: Don't just copy paste this, understand it more
//   return dateDiff > 0 && dateDiff < ONE_DAY;
// }

// export async function validateResetEmail(token, email, expirationTimestamp) {
//   //
//   try {
//     console.log("token", token, "email", email);

//     // Recreate the hash based on the email received
//     const resetToken = await createResetPasswordToken(
//       email,
//       expirationTimestamp
//     );
//     console.log("resetToken", resetToken);

//     console.log("isValid token", resetToken === token);
//     console.log("isValid time", validateExpTimestamp(expirationTimestamp));

//     // Compare our new hash (token) with the one received
//     const isValid =
//       resetToken === token && validateExpTimestamp(expirationTimestamp);

//     return isValid;
//   } catch (error) {
//     console.error("error", error);
//     return false;
//   }
// }
