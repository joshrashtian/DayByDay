import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import ContextMenuProvider from "./providers/ContextMenuProvider";
import PopupProvider from "./providers/PopupProvider";
import { DayTransitionProvider } from "./providers/DayTransitionProvider";
import { ProfileProvider } from "./providers/ProfileProvider";
import { RightPanelProvider } from "./providers/RightPanelProvider";
import { StyleProvider } from "./providers/StyleProvider";
import { ThemeRegistryProvider } from "./themes/ThemeRegistryProvider";
import GuideProvider from "./providers/GlobalHelpProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <StyleProvider>
        <ThemeRegistryProvider>
        <GuideProvider>
          <ContextMenuProvider>
            <PopupProvider>
              <DayTransitionProvider>
                <ProfileProvider>
                  <RightPanelProvider>
                    <App />
                  </RightPanelProvider>
                </ProfileProvider>
              </DayTransitionProvider>
            </PopupProvider>
          </ContextMenuProvider>
        </GuideProvider>
        </ThemeRegistryProvider>
      </StyleProvider>
    </HashRouter>
  </React.StrictMode>,
);
