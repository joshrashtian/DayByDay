import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

/** Opens the sign-in flow as its own OS-level Tauri window (label "sign-in"). */
export function openSignInWindow() {
  return new WebviewWindow("sign-in", {
    url: "index.html#/auth/sign-in",
    title: "Sign In",
    width: 420,
    height: 480,
    resizable: false,
  });
}
