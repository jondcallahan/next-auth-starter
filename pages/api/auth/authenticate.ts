import { compare } from "bcryptjs";
import { NextApiRequest, NextApiResponse } from "next";
import { logUserIn } from "../../../utils/auth/logUserIn";
import { prisma } from "../../../utils/db/getPrisma";

export default async function register(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, password } = req.body;

  console.time("findUser");
  const foundUser = await prisma.user.findUnique({
    where: {
      emailAddress: email,
    },
    select: {
      id: true,
      password: true,
    },
  });
  console.timeEnd("findUser");

  if (!foundUser) {
    return res.status(403).send("");
  }

  const savedPassword = foundUser.password;
  const isAuthenticated = await compare(password, savedPassword);

  if (isAuthenticated) {
    console.time("login");

    await logUserIn(foundUser.id, req, res);
    console.timeEnd("login");
  } else {
    return res.status(403).send("");
  }

  return res.json({ id: foundUser.id, authenticated: isAuthenticated });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500kb",
    },
  },
};
