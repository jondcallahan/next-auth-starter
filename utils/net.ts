import { NextApiRequest } from "next";

export const parseIPAddress = (req: NextApiRequest) =>
  Array.isArray(req.headers["x-forwarded-for"])
    ? req.headers["x-forwarded-for"].shift()
    : req.headers["x-forwarded-for"]?.split?.(",").shift() ||
      req.socket?.remoteAddress;
