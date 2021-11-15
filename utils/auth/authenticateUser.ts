import bcrypt from "bcryptjs";
const { compare } = bcrypt;
import { prisma } from "../db/getPrisma";

export async function authenticateUser(email, password) {
  // Look up the user
  const foundUser = await prisma.user.findUnique({
    where: {
      emailAddress: email,
    },
    select: {
      id: true,
      password: true,
    },
  });

  console.log("foundUser", foundUser);

  // Get user password
  const savedPassword = foundUser.password;
  // Compare password with the one in the db
  const isAuthenticated = await compare(password, savedPassword);
  // Return boolean of if password is correct
  return { isAuthenticated, userId: foundUser.id };
}
