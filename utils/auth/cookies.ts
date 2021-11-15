import { NextApiResponse } from "next";
import { destroyCookie, setCookie } from "nookies";

export function deletAuthCookiesFromResponse(res: NextApiResponse) {
  destroyCookie({ res }, "accessToken", {
    domain: process.env.ROOT_DOMAIN,
    path: "/",
  });
  destroyCookie({ res }, "refreshToken", {
    domain: process.env.ROOT_DOMAIN,
    path: "/",
  });
  return res;
}

export function addAuthCookiesToResponse(
  res,
  accessToken,
  accessTokenExpiry,
  refreshToken,
  refreshTokenExpiry
) {
  setCookie({ res }, "refreshToken", refreshToken, {
    path: "/",
    domain: process.env.ROOT_DOMAIN,
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    expires: refreshTokenExpiry,
  });
  setCookie({ res }, "accessToken", accessToken, {
    path: "/",
    domain: process.env.ROOT_DOMAIN,
    // domain: "jons-mac-mini.local",
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    expires: accessTokenExpiry,
  });
  return res;
}
