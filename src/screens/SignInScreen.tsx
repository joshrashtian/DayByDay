import { getCurrentWindow } from "@tauri-apps/api/window";
import { SignInForm } from "@/components/global/SignInForm";
import { isTauri } from "@/lib/tauriEnv";

export default function SignInScreen() {
  const onSuccess = () => {
    if (isTauri()) void getCurrentWindow().close();
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-sunken">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface">
        <SignInForm onSuccess={onSuccess} />
      </div>
    </div>
  );
}
