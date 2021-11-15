import { AuthSession, User } from ".prisma/client";
import { GetServerSideProps, NextPageContext } from "next";
import { serialize } from "superjson";
import { getSessionsByUserId } from "../utils/auth/session";
import { getUserFromCookies } from "../utils/auth/user";
import { detect } from "detect-browser";
import { removeUserSession } from "./api/auth/sessions";
import { useRouter } from "next/dist/client/router";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
}).format;

export default function Test({
  user,
  sessions,
}: {
  user?: {
    id: string;
    emailAddress: string;
    emailAddressVerified: boolean;
  };
  sessions?: { json: AuthSession[] };
}) {
  const router = useRouter();
  return (
    <>
      {!!sessions.json.length && (
        <table>
          <thead>
            <tr>
              <th>Signed in</th>
              <th>Device</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {sessions.json.map((session) => (
              <tr key={session.sessionToken}>
                <td>{dateFormatter(new Date(session.createdAt))}</td>
                <td>
                  {detect(session.userAgent).os}{" "}
                  {detect(session.userAgent).name}{" "}
                  {detect(session.userAgent).version}
                </td>
                <td>{session.ipAddress}</td>
                <td>
                  <button
                    onClick={async () => {
                      const res = await fetch("/api/auth/sessions", {
                        method: "DELETE",
                        headers: {
                          "content-type": "application/json",
                        },
                        body: JSON.stringify({
                          sessionToken: session.sessionToken,
                        }),
                      });

                      if (res.status === 200) {
                        alert("Session removed");
                      }

                      if (res.headers.get("x-redirect")) {
                        router.replace(res.headers.get("x-redirect"));
                      }
                    }}
                  >
                    💣 Delete session
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const user = await getUserFromCookies(context.req, context.res);
    if (user) {
      const sessions = await getSessionsByUserId(user.id);
      return {
        props: {
          user,
          sessions: serialize(sessions),
        }, // will be passed to the page component as props
      };
    }
    throw new Error("No user found");
  } catch (error) {
    console.error("error", error);
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
};
