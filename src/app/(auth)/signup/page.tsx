import { AuthForm } from "../auth-form";
import { signup } from "../actions";

export const metadata = { title: "Sign up · Purrple Prose" };

export default function SignupPage() {
  return <AuthForm mode="signup" action={signup} />;
}
