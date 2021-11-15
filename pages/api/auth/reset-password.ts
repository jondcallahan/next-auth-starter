import { NextApiRequest, NextApiResponse } from "next";
import { hashPassword, hashToken } from "../../../utils/auth/hash";
import { prisma } from "../../../utils/db/getPrisma";

// Based on https://supertokens.io/blog/implementing-a-forgot-password-flow

export default async function resetPassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { token, password }: { token: string; password: string } = req.body;
    if (!token || !password) {
      throw new Error(
        `Missing ${!token && "token"} ${!password && "password"}`
      );
    }
    // Hash the user provided token and compare it with tokens stored in DB
    const hashedToken = hashToken(token);
    const storedResetToken = await prisma.passwordResetTokens.findUnique({
      where: {
        token: hashedToken,
      },
    });
    if (!storedResetToken) {
      throw new Error("Reset token not found");
    }
    if (storedResetToken.tokenExpiry < new Date()) {
      throw new Error("Token has expired. Please try again");
    }

    // Next get all tokens for the user associated with the provided token
    const allTokensForUser = await prisma.passwordResetTokens.findMany({
      where: {
        userId: storedResetToken.userId,
      },
    });
    /* We search for the row that matches the input token’s hash,
    so that we know that another transaction has not redeemed it already. */
    let matchedToken;

    allTokensForUser.forEach(({ token }) => {
      if (token === hashedToken) matchedToken = token;
    });

    if (!matchedToken) {
      throw new Error("Reset token already used");
    }

    // Now we will delete all the tokens belonging to this user to prevent duplicate use
    await prisma.passwordResetTokens.deleteMany({
      where: {
        userId: storedResetToken.userId,
      },
    });

    // Now all checks have passed and we can reset the password
    // Note: Since we are not using a true transaction there is still a small chance of a race condition
    // TODO: Add proper transaction support when prisma graduates prisma.$transaction to stable
    // See: https://www.prisma.io/docs/concepts/components/prisma-client/transactions#interactive-transactions-in-preview
    const newPassword = await hashPassword(password);

    await prisma.user.update({
      where: {
        id: storedResetToken.userId,
      },
      data: {
        password: newPassword,
      },
    });

    res.send("OK");
  } catch (error) {
    console.error("error", error);
    res.status(403).send("");
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500kb",
    },
  },
};
