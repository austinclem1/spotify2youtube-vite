import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import FormControl from "react-bootstrap/FormControl";
import Image from "react-bootstrap/Image";
import InputGroup from "react-bootstrap/InputGroup";
import Navbar from "react-bootstrap/Navbar";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import {
  fetchWithCredentialsRetryOnce,
  getSomePlaylistTracks,
} from "../helpers/spotify-helpers";
import { getYoutubeSearchResults } from "../helpers/youtube-helpers";
import { useEffect, useState } from "react";

import constants from "../constants";

export default function YoutubeResults() {
  const query = new URLSearchParams(window.location.search);
  const playlistID = query.get("playlistID");

  const [isLoading, setIsLoading] = useState(true);
  const [videoResults, setVideoResults] = useState([]);

  const [playlistName, setPlaylistName] = useState();

  useEffect(() => {
    async function fetchNextPageRecursive(url) {
      const data = await fetchWithCredentialsRetryOnce(url).then((res) =>
        res.json()
      );
      const tracks = data.items.map((item) => ({
        name: item.track.name,
        artists: item.track.artists.map((artist) => artist.name),
      }));
      if (data.next) {
        const nextPageTracks = await fetchNextPageRecursive(data.next);
        return tracks.concat(nextPageTracks);
      } else {
        return tracks;
      }
    }

    if (isLoading) {
      const trackParams = new URLSearchParams({
        limit: 50,
        fields: "items(track(name,artists))",
      });
      const tracksURL = `${
        constants.spotifyApiURL
      }/playlists/${playlistID}/tracks?${trackParams.toString()}`;
      fetchNextPageRecursive(tracksURL).then((tracks) => {
        const videoPromises = tracks.map((track) => {
          const query = `${track.name} ${track.artists.join(" ")}`;
          const youtubeSearchParams = new URLSearchParams({
            key: constants.youtubeApiKey,
            part: "snippet",
            maxResults: 1,
            q: query,
            type: "video",
          });
          const youtubeSearchURL = `https://www.googleapis.com/youtube/v3/search?${youtubeSearchParams.toString()}`;
          const fetchOptions = {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          };
          return fetch(youtubeSearchURL, fetchOptions)
            .then((res) => res.json())
            .then((data) => {
              console.log(data);
              return {
                ...data,
                trackName: track.name,
                trackArtists: track.artists,
              };
            });
        });

        Promise.all(videoPromises).then((searchResults) => {
          const videos = searchResults.map((result) => ({
            id: result.items[0]?.id.videoId,
            title: result.items[0]?.snippet.title,
            imageURL: result.items[0]?.snippet.thumbnails.medium.url,
            trackName: result.trackName,
            trackArtists: result.trackArtists.join(", "),
          }));
          setVideoResults(videos);
          setIsLoading(false);
        });
      });
    }
  }, []);

  let tableBody;
  if (!isLoading) {
    tableBody = videoResults.map((video) => (
      <tr key={video.id}>
        <td className="align-middle p-3">{video.trackName}</td>
        <td className="align-middle p-3">{video.trackArtists}</td>
        <td>
          <Row className="align-items-center">
            <Col xs={12} lg={6}>
              <Image src={video.imageURL} thumbnail />
            </Col>
            <Col xs={12} lg={6} className="p-3">
              {video.title}
            </Col>
          </Row>
        </td>
      </tr>
    ));
  }

  const onChangePlaylistName = (e) => {
    setPlaylistName(e.target.value);
  };

  const onClickCreatePlaylist = () => {
    const videoIDs = videoResults.map((result) => result.id);
    window.sessionStorage.setItem(
      "newPlaylistVideoIDs",
      JSON.stringify(videoIDs)
    );
    window.sessionStorage.setItem("newPlaylistName", playlistName);
    const params = new URLSearchParams({
      client_id: constants.youtubeClientId,
      redirect_uri: `${window.location.origin}/create-youtube-playlist`,
      response_type: "token",
      scope: "https://www.googleapis.com/auth/youtube",
      // state: playlistName,
    });
    const authorizationURL = new URL(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
    window.location.assign(authorizationURL);
  };

  return (
    <Container className="text-center p-5">
      <h1>YouTube Search Results</h1>
      {isLoading && (
        <div>
          <Row className="justify-content-center">
            <h5>Loading Playlist Tracks</h5>
          </Row>
          <Row className="justify-content-center">
            <Spinner animation="border" />
          </Row>
        </div>
      )}
      <Table striped bordered hover className="font-weight-bold">
        <thead>
          <tr>
            <th>Song Title</th>
            <th>Artist(s)</th>
            <th>Video</th>
          </tr>
        </thead>
        <tbody>{tableBody}</tbody>
      </Table>
      <Navbar bg="dark" fixed="bottom" className="w-100 justify-content-center">
        <InputGroup size="lg" className="w-25">
          <FormControl
            placeholder="Playlist Name"
            onChange={onChangePlaylistName}
          />
        </InputGroup>
        <Button
          disabled={isLoading}
          onClick={onClickCreatePlaylist}
          className="m-1"
        >
          Create YouTube Playlist
        </Button>
      </Navbar>
    </Container>
  );
}
