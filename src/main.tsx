import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import ContextMenuProvider from "./providers/ContextMenuProvider";
import PopupProvider from "./providers/PopupProvider";
import { ProfileProvider } from "./providers/ProfileProvider";
import { StyleProvider } from "./providers/StyleProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <StyleProvider>
        <ContextMenuProvider>
          <PopupProvider>
            <ProfileProvider>
              <App />
            </ProfileProvider>
          </PopupProvider>
        </ContextMenuProvider>
      </StyleProvider>
    </HashRouter>
  </React.StrictMode>,
);
