import { GetServerSideProps, NextPageContext } from "next";
import { getUserFromCookies } from "../utils/auth/user";

export default function Test({ user }) {
  return <pre>{JSON.stringify(user, null, 2)}</pre>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      user: await getUserFromCookies(context.req, context.res),
    }, // will be passed to the page component as props
  };
};
