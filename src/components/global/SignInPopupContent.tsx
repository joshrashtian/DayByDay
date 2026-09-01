import { usePopup } from "@/providers/PopupProvider";
import { SignInForm } from "./SignInForm";

export function SignInPopupContent() {
  const { close } = usePopup();
  return <SignInForm onSuccess={close} />;
}

/** Call the returned function from any click handler to open the sign-in popup. */
export function useSignInPopup() {
  const { open } = usePopup();
  return () => open(<SignInPopupContent />);
}
