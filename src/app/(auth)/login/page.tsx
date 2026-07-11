import { AuthForm } from "../auth-form";
import { login } from "../actions";

export const metadata = { title: "Log in · Purrple Prose" };

export default function LoginPage() {
  return <AuthForm mode="login" action={login} />;
}
