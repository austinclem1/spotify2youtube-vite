import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import {
  getSpotifyTokensFromCode,
  generateRandomStateString,
  generateCodeVerifierAndChallenge,
} from "../helpers/spotify-helpers";
import constants from "../constants";

export default function SpotifyLogin(props) {
  return (
    <Container className="text-center p-5">
      <Row className="justify-content-md-center">
        <h3>Log In to Spotify to Get Started</h3>
      </Row>
      <Row className="justify-content-md-center">
        <img src="../../public/Spotify_Logo_RGB_Green.png" width="300" />
      </Row>
      <Row className="justify-content-md-center">
        <Button onClick={async () => await userClickedLogin()}>Login</Button>
      </Row>
    </Container>
  );
}

async function userClickedLogin() {
  const state = generateRandomStateString();
  window.localStorage.setItem("spotifyState", state);
  const [codeVerifier, codeChallenge] =
    await generateCodeVerifierAndChallenge();
  window.localStorage.setItem("spotifyCodeVerifier", codeVerifier);
  // Request access token from Spotify for access to
  // user's private and followed playlists
  // On successful login we are redirected to spotify-playlists page
  const queryParams = new URLSearchParams({
    client_id: constants.spotifyClientId,
    response_type: "code",
    redirect_uri: `${window.location.origin}/spotify-landing`,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state,
    scope: "playlist-read-private",
  });
  window.location.replace(
    `https://accounts.spotify.com/authorize?${queryParams.toString()}`
  );
}
