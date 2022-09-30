import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import Navbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { Link, useLoaderData } from "react-router-dom";

import constants from "../constants";

import {
  getSpotifyUserPlaylists,
  getSomePlaylistTracks,
  useFetch,
} from "../helpers/spotify-helpers";

function TracksTable(props) {
  const { playlistID, playlistLength, isSelected } = props;

  const reducedTrackCount = constants.spotifyReducedTrackCount;

  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.tracks) return null;

    if (pageIndex === 0)
      return `?playlist-tracks&id=${playlistID}&limit=${reducedTrackCount}`;

    return `?playlist-tracks&id=${playlistID}&limit=10&offset=${previousPageData.nextPageOffset}`;
  };

  const { data, error, size, setSize } = useSWRInfinite(
    getKey,
    getSomePlaylistTracks,
    {
      initialSize: 1,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateWhenOffline: false,
      revalidateWhenHidden: false,
      revalidateAll: false,
      refreshInterval: 0,
      errorRetryCount: 3,
    }
  );

  const arrayOfTrackArrays = data ? data.map((res) => res.tracks) : [];
  const tracksToShowCount = isSelected ? arrayOfTrackArrays.length : reducedTrackCount;
  const tracks = arrayOfTrackArrays.slice(0, tracksToShowCount);
  const tableData = tracks.map((track) => (
    <tr key={`${track.name},${track.artists}`}>
      <td>{track.name}</td>
      <td>{track.artists}</td>
    </tr>
  ));

  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 1 && data && typeof data[size - 1] === "undefined");
  const allTracksLoaded = tracks.length === playlistLength;

  const tracksNotShown = playlistLength - reducedTrackCount;

  return (
    <Table striped bordered hover className="font-weight-bold">
      <thead>
        <tr>
          <th>Title</th>
          <th>Artist(s)</th>
        </tr>
      </thead>
      <tbody>
        {tableData}
        {!isSelected && tracksNotShown > 0 && (
          <tr>
            <td colSpan={2}>{`${tracksNotShown} more...`}</td>
          </tr>
        )}
        {isSelected && !allTracksLoaded && (
          <tr>
            <td colSpan={2}>
              {!isLoadingMore && (
                <Button variant="light" onClick={() => setSize(size + 1)}>
                  {"Load More"}
                </Button>
              )}
              {isLoadingMore && <Spinner animation="border" />}
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

function PlaylistCard({
  id,
  name,
  imageURL,
  totalTracks,
  tracksURL,
  isSelected,
  setSelected,
}) {
  const cardRef = useRef(null);

  const [justSelected, setJustSelected] = useState(false);

  useEffect(() => {
    if (justSelected) {
      const position = cardRef.current.getBoundingClientRect();
      window.scrollTo({
        top: position.top + window.scrollY - 20,
        left: 0,
        behavior: "smooth",
      });
      setJustSelected(false);
    }
  });

  const selectPlaylist = () => {
    if (!isSelected) {
      setSelected();
      setJustSelected(true);
    }
  };

  const color = isSelected ? "info" : "light";
  return (
    <Col
      xs={{ span: 12 }}
      lg={{ span: isSelected ? 12 : 6 }}
      className="my-3 mx-0"
    >
      <Card
        ref={cardRef}
        bg={color}
        className="h-100"
        onClick={() => selectPlaylist()}
      >
        <Card.Header className="text-center" as="h4">
          {name}
        </Card.Header>
        <Card.Body>
          <Row className="align-middle">
            <Col
              xs={isSelected ? { offset: 4, span: 4 } : { offset: 3, span: 7 }}
              className="px-3 py-1"
            >
              <Image src={imageURL} thumbnail />
            </Col>
            <Col xs={12} className="align-self-center">
              <Card.Text>
                {`${totalTracks} tracks`}
              </Card.Text>
              <Card.Text style={{ maxHeight: "500px", overflowY: "auto" }}>
                {isSelected && (
                  <TracksTable
                    playlistID={id}
                    playlistLength={totalTracks}
                    isSelected={true}
                  />
                )}
              </Card.Text>
            </Col>
          </Row>
          {!isSelected && <a className="stretched-link" role="button" />}
        </Card.Body>
      </Card>
    </Col>
  );
}

export async function loader() {
  return getSpotifyUserPlaylists(constants.spotifyPlaylistsURL)
    .then(data => ({
      playlists: data.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        image: playlist.images[0] ? playlist.images[0].url : null,
        totalTracks: playlist.tracks.total,
        tracksURL: playlist.tracks.href,
      })),
    }))
    .catch(err => ({
      error: err,
    }));
}

export default function SpotifyPlaylists() {
  const [selectedPlaylistIndex, _setSelectedPlaylistIndex] = useState(null);
  const playlistFetchResults = useFetch(constants.spotifyPlaylistsURL);

  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  // const setSelectedPlaylistIndex = (index) => {
    // if (id === selectedPlaylist) {
    // 	_setSelectedPlaylist(null)
    // } else {
    // 	_setSelectedPlaylist(id)
    // }
    // _setSelectedPlaylistIndex(index);
  // };
  // const { data: playlists } = useSWR(
  //   "spotifyUserPlaylists",
  //   getSpotifyUserPlaylists,
  //   {
  //     revalidateOnFocus: false,
  //     revalidateOnReconnect: false,
  //     refreshInterval: 0,
  //     errorRetryCount: 3,
  //   }
  // );

  let playlistCards;
  if (playlistFetchResults.isLoading) {
    playlistCards = [<Spinner animation="border" />];
  } else if (playlistFetchResults.error) {
    playlistCards = [<div>Failed to fetch playlists, error: {playlistFetchResults.error.message}</div>];
  } else {
    playlistCards = playlistFetchResults.data.items.map(playlist => (
      <PlaylistCard
        key={playlist.id}
        id={playlist.id}
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
        <Link
          href={`/youtube-results/${selectedPlaylistId}`}
        >
          <Button disabled={selectedPlaylistId === null}>Convert</Button>
        </Link>
      </Navbar>
    </Container>
  );
}
