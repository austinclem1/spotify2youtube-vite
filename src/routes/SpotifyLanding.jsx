import { redirect } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import {
  getSpotifyUserPlaylists,
  getSpotifyTokensFromCode,
} from "../helpers/spotify-helpers";

export async function loader() {
  const params = new URLSearchParams(window.location.search);

  const returnedState = params.get("spotifyState");
  if (returnedState) {
    const sentState = window.sessionStorage.getItem("state");
    if (returnedState !== sentState) {
      return redirect("/spotify-login");
    }
  }

  const code = params.get("code");
  if (code) {
    const redirectURI = `${window.location.origin}/spotify-landing`;
    const codeVerifier = window.localStorage.getItem("spotifyCodeVerifier");
    const [accessToken, refreshToken] = await getSpotifyTokensFromCode(
      code,
      redirectURI,
      codeVerifier
    );
    if (accessToken && refreshToken) {
      return redirect("/spotify-playlists");
    }
  }

  return redirect("/spotify-login");
}

export default function SpotifyLanding() {
  return <Spinner animation="border" />;
}
