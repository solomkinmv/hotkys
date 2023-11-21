import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShortcutsComponent } from "./components/app/app-shortcuts.component";
import { AppsListComponent } from "./components/app-list/apps-list.component";
import AppNotFound from './components/app-not-found/app-not-found';
import About from './components/about/about.component';
import RaycastExtension from "./components/raycast/raycast.component";

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement,
);
const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/",
                element: <AppsListComponent />,
            },
            {
                path: "/apps/:slug",
                element: <AppShortcutsComponent />,
            },
            {
                path: "/404/apps/:bundleId?",
                element: <AppNotFound />,
            },
            {
                path: "/about",
                element: <About />
            },
            {
                path: "/raycast-extension",
                element: <RaycastExtension />
            }
        ],
    },
]);
root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
