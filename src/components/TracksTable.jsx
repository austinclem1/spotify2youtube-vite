import { useEffect, useReducer } from "react";

import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";

import { fetchWithCredentialsRetryOnce, getSomePlaylistTracks, useFetch } from "../helpers/spotify-helpers";

import constants from "../constants";

function reducer(state, action) {
  switch(action.type) {
    case 'add-tracks':
      return {
        status: 'loaded',
        tracks: state.tracks.concat(action.newTracks),
        nextURL: action.newNextURL,
        errorMessage: null,
      }
    case 'set-is-loading':
      return {
        ...state,
        status: 'loading',
      }
    case 'set-error':
      return {
        status: 'error',
        tracks: [],
        nextURL: null,
        errorMessage: action.errorMessage,
      };
  }
}

export default function TracksTable({ tracksURL, playlistLength, isSelected }) {
  const reducedTrackCount = 3;
  const [state, dispatch] = useReducer(reducer, {
    status: 'loading',
    tracks: [],
    nextURL: null,
    errorMessage: null,
  });

  useEffect(() => {
    const params = new URLSearchParams({
      market: "from_token",
      fields: "items(track(name,artists(name))),next",
    });
    if (state.status === 'loading') {
      fetchWithCredentialsRetryOnce(`${tracksURL}?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          const newTracks = data.items.map(item => ({
            name: item.track.name,
            artists: item.track.artists.map(artist => artist.name).join(", "),
          }));
          const newNextURL = data.next;
          dispatch({
            type: "add-tracks",
            newTracks,
            newNextURL,
          });
        })
        .catch(err => dispatch({type: 'set-error', errorMessage: err.message}));
    }
  }, []);

  // const arrayOfTrackArrays = data ? data.map((res) => res.tracks) : [];
  // const tracksToShowCount = isSelected ? arrayOfTrackArrays.length : reducedTrackCount;
  // const tracks = arrayOfTrackArrays.slice(0, tracksToShowCount);
  let tableRows;
  // if (trackFetchResults.isLoading) {
  //   tableRows = [<Spinner animation="border" />];
  // } else if (trackFetchResults.error) {
  //   tableRows = [<div>Failed to fetch songs, error: {trackFetchResults.error.message}</div>];
  // } else {
  //   console.log(trackFetchResults.data);
  //   tableRows = trackFetchResults.data.items.map(item => (
  //     <tr key={`${item.track.name},${item.track.artists}`}>
  //       <td>{item.track.name}</td>
  //       <td>{item.track.artists}</td>
  //     </tr>
  //   ));
  //   console.log(tableRows);
  // }
  switch (state.status) {
    case 'loading':
      tableRows = [<Spinner animation="border" />];
      break;
    case 'error':
      tableRows = [<div>{`Failed to fetch tracks, error: ${state.errorMessage}`}</div>];
      break;
    case 'loaded':
      tableRows = state.tracks.map(track => (
        <tr key={`${track.name},${track.artists}`}>
          <td>{track.name}</td>
          <td>{track.artists}</td>
        </tr>
      ));
      break;
  }

  async function loadMoreTracks() {
    dispatch({type: 'set-is-loading'});
    fetchWithCredentialsRetryOnce(state.nextURL)
      .then(res => res.json())
      .then(data => {
        const newTracks = data.items.map(item => ({
          name: item.track.name,
          artists: item.track.artists.map(artist => artist.name).join(", "),
        }));
        const newNextURL = data.next;
        dispatch({
          type: "add-tracks",
          newTracks,
          newNextURL,
        });
      })
      .catch(err => dispatch({type: 'set-error', errorMessage: err.message}));
  }

  return (
    <Table striped bordered hover className="font-weight-bold">
      <thead>
        <tr>
          <th>Title</th>
          <th>Artist(s)</th>
        </tr>
      </thead>
      <tbody>
        {tableRows}
        {!isSelected && tracksNotShown > 0 && (
          <tr>
            <td colSpan={2}>{`${tracksNotShown} more...`}</td>
          </tr>
        )}
        {state.status === 'loaded' && state.tracks.length < playlistLength && state.nextURL !== null (
          <Button variant="light" onClick={loadMoreTracks}>Load More</Button>
        )}
      </tbody>
    </Table>
  );
}
