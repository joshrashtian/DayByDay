import { HevyLogo } from "@/components/foundations/logos/HevyLogo";
import { IoKeyOutline } from "react-icons/io5";
import Container from "@/ui/settings/Container";
import SettingsHeader from "@/ui/settings/Header";

const HAS_HEVY_API_KEY = Boolean(import.meta.env.VITE_HEVY_API);

export function HevySection() {
  return (
    <div className="space-y-5">
      <SettingsHeader>
        <div className="flex items-start gap-3">
          <HevyLogo className="mt-1 size-6 shrink-0 text-ink" />
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Hevy
            </h2>
            <SettingsHeader.Subtitle>
              Connect your Hevy Account to sync your workouts onto your calendar (Hevy Pro Required)
            </SettingsHeader.Subtitle>
          </div>
        </div>
      </SettingsHeader>

      <Container>
        <Container.Header icon={<IoKeyOutline />} heading="API key" />
        <Container.Body className="space-y-1 px-4 py-4">
          <p className="text-sm font-medium text-ink">
            {HAS_HEVY_API_KEY ? "Connected" : "Not connected"}
          </p>
          <p className="text-sm text-muted">
            {HAS_HEVY_API_KEY ? (
              "Using the API key from the build."
            ) : (
              <>
                Hevy reads an API key at build time. Generate one in Hevy
                (Settings → Developer, requires Hevy Pro) and set{" "}
                <code className="font-mono">VITE_HEVY_API</code> in{" "}
                <code className="font-mono">.env</code>.
              </>
            )}
          </p>
        </Container.Body>
      </Container>
    </div>
  );
}
