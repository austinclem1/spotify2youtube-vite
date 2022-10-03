import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {
  getSpotifyTokensFromCode,
  generateRandomStateString,
  generateCodeVerifierAndChallenge,
} from "../helpers/spotify-helpers";
import constants from "../constants";

import spotifyLogo from "../Spotify_Logo_RGB_Green.png";

export default function SpotifyLogin(props) {
  return (
    <Container
      className="text-center p-5 align-content-center"
      style={{ maxWidth: "65vw" }}
    >
      <Row>
        <Col xs={{ span: 6, offset: 3 }}>
          <h3>Log In to Spotify to Get Started</h3>
        </Col>
      </Row>
      <Row>
        <Col xs={{ span: 6, offset: 3 }}>
          <img src={spotifyLogo} style={{ maxWidth: "100%" }} />
        </Col>
      </Row>
      <Row>
        <Col xs={{ span: 6, offset: 3 }}>
          <Button onClick={async () => await userClickedLogin()}>Login</Button>
        </Col>
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
