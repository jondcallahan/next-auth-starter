import { prisma } from "../db/getPrisma";
import crypto from "crypto";

export async function createVerifyEmailToken(email: string) {
  try {
    // Auth string, JWT signature, email
    const authString = `${process.env.JWT_SIGNATURE}:${email}`;
    return crypto.createHash("sha512").update(authString).digest("hex");
  } catch (error) {
    console.error("error", error);
  }
}

export async function createVerifyEmailLink(email) {
  try {
    // Create token
    const emailToken = await createVerifyEmailToken(email);
    // Encode url string
    const URIEncodedEmail = encodeURIComponent(email);
    // Return link for verification
    return `https://${process.env.ROOT_DOMAIN}/auth/verify/${URIEncodedEmail}/${emailToken}`;
  } catch (error) {
    console.error("error", error);
  }
}

export async function verifyUserEmail(token: string, email: string) {
  //
  try {
    // Recreate the hash based on the email received
    const emailToken = await createVerifyEmailToken(email);
    // Compare our new hash (token) with the one received
    const isValid = emailToken === token;
    // If the two are equal then it is a valid verification token
    if (isValid) {
      // Update user, make them verified
      await prisma.user.update({
        where: {
          emailAddress: email,
        },
        data: {
          emailAddressVerified: true,
        },
      });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("error", error);
    return false;
  }
}
