import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";

import { Toaster } from "sonner";

import "./index.css";

import App from "./App";

import { store } from "./redux/store";
import { injectStore } from "./services/api";

injectStore(store);

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <Provider store={store}>

      <Toaster
        richColors
        position="top-right"
      />

      <App />

    </Provider>
  </React.StrictMode>
);