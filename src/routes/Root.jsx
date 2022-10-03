import { redirect } from "react-router-dom";

import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";

import { fetchWithCredentialsRetryOnce } from "../helpers/spotify-helpers";

import constants from "../constants";

export async function loader() {
  try {
    const userProfile = await fetchWithCredentialsRetryOnce(
      `${constants.spotifyApiURL}/me`
    );
    return redirect("/spotify-playlists");
  } catch (err) {
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
