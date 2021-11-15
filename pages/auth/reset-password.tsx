import { useRouter } from "next/dist/client/router";

export default function ResetPassword() {
  const router = useRouter();
  return (
    <>
      <h2>Please enter your new password</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const password = new FormData(e.currentTarget).get("new-password");
          const res = await fetch("/api/auth/reset-password", {
            method: "post",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              token: router.query.token,
              password,
            }),
          });
          console.log("res", res);
          if (res.ok) {
            alert("Password reset");
          } else {
            alert("Error resetting password, please try again");
          }
          router.push("/");
        }}
      >
        <label htmlFor="new-password">
          New password
          <input
            type="password"
            name="new-password"
            id="new-password"
            autoComplete="new-password"
          />
        </label>
        <button type="submit">Save password</button>
      </form>
    </>
  );
}
