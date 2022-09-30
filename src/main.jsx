import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Route } from "react-router-dom";

import Root, { loader as rootLoader } from "./routes/Root";
import SpotifyLanding, {
  loader as spotifyLandingLoader,
} from "./routes/SpotifyLanding";
import SpotifyLogin from "./routes/SpotifyLogin";
import SpotifyPlaylists, {
  loader as spotifyPlaylistsLoader,
} from "./routes/SpotifyPlaylists";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    loader: rootLoader,
  },
  {
    path: "/spotify-landing",
    element: <SpotifyLanding />,
    loader: spotifyLandingLoader,
  },
  {
    path: "/spotify-login",
    element: <SpotifyLogin />,
  },
  {
    path: "/spotify-playlists",
    element: <SpotifyPlaylists />,
    loader: spotifyPlaylistsLoader,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
