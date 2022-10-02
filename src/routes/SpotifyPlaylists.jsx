import React, { useEffect, useRef, useState } from "react";

import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";

import { Link } from "react-router-dom";

import PlaylistCard from "../components/PlaylistCard";
import TracksTable from "../components/TracksTable";

import constants from "../constants";

import {
  getSpotifyUserPlaylists,
  getSomePlaylistTracks,
  useFetch,
} from "../helpers/spotify-helpers";


export default function SpotifyPlaylists() {
  const playlistFetchParams = new URLSearchParams({
    fields: "items(id,name,images,tracks(total,href))",
    limit: 4,
  });
  const playlistFetchResults = useFetch(`${constants.spotifyApiURL}/me/playlists?${playlistFetchParams.toString()}`);
  // const playlistFetchResults = useFetch(constants.spotifyPlaylistsURL);
  // const playlistFetchResults = useFetch("aoeu");

  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  let playlistCards;
  if (playlistFetchResults.isLoading) {
    playlistCards = [<Spinner animation="border" />];
  } else if (playlistFetchResults.error) {
    playlistCards = [<div>Failed to fetch playlists, error: {playlistFetchResults.error.message}</div>];
  } else {
    playlistCards = playlistFetchResults.data.items.map(playlist => (
      <PlaylistCard
        key={playlist.id}
        name={playlist.name}
        imageURL={playlist.images[0]?.url}
        totalTracks={playlist.tracks.total}
        tracksURL={playlist.tracks.href}
        isSelected={selectedPlaylistId === playlist.id}
        setSelected={() => setSelectedPlaylistId(playlist.id)}
      />
    ));
  }


  return (
    <Container className="text-center p-5">
      <h1>Choose a Playlist to Convert</h1>
      <Row className="m-xs-1 m-sm-2 m-md-3 m-lg-4 m-xl-5">
        {playlistCards}
      </Row>
      <Navbar bg="dark" fixed="bottom" className="w-100 justify-content-center">
        <Link to={`/youtube-results?playlistID=${selectedPlaylistId}`}>
          <Button disabled={selectedPlaylistId === null}>Convert</Button>
        </Link>
      </Navbar>
    </Container>
  );
}
