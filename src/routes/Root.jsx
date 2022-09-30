import { redirect } from "react-router-dom";

import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";

import { getSpotifyAccessToken } from "../helpers/spotify-helpers";

export async function loader() {
  const accessToken = await getSpotifyAccessToken();
  if (accessToken) {
    return redirect("/spotify-playlists");
  } else {
    return redirect("/spotify-login");
  }
}

export default function Root() {
  return (
    <Container className="text-center p-5">
      <h1>Spotify2YouTube Playlist Converter</h1>
      <h5>Checking Login Status</h5>
      <Spinner animation="border" />
    </Container>
  );
}
