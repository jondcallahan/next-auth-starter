import { GetServerSideProps } from "next";
import { useRouter } from "next/dist/client/router";
import { verifyUserEmail } from "../../../../utils/auth/verify";
import Link from "next/link";

export default function Verify({ isVerified }) {
  return (
    <>
      <h1>
        Hello
        <br />
        {isVerified
          ? "Thanks for verifying your email!"
          : "Error verifying your email"}
      </h1>
      <Link href="/">Home</Link>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const email = context.query.email.toString();
    const token = context.query.token.toString();

    if (!!email && !!token) {
      const isVerified = await verifyUserEmail(token, email);
      return {
        props: {
          isVerified,
        },
      };
    } else {
      throw new Error("Could not read email or token");
    }
  } catch (error) {
    console.error("error", error);
    return {
      props: {
        error: error.toString(),
      },
    };
  }
};
