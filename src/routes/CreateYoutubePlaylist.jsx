import Button from "react-bootstrap/Button"
import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import Spinner from "react-bootstrap/Spinner"
import { Link } from "react-router-dom";
import { useEffect, useState } from "react"

import constants from "../constants";


export default function CreateYoutubePlaylist() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function recursiveAddVideosToPlaylist(videoIds, index, playlistId, accessToken) {
      const params = new URLSearchParams({
        part: "snippet",
        key: constants.youtubeApiKey,
      });
      const insertVideoURL = `https://youtube.googleapis.com/youtube/v3/playlistItems?${params.toString()}`;
      const insertVideoFetchOptions = {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "Bearer " + accessToken,
        },
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId: videoIds[index],
            }
          }
        })
      };
      if (index >= videoIds.length - 1) {
        return fetch(insertVideoURL, insertVideoFetchOptions);
      } else {
        return fetch(insertVideoURL, insertVideoFetchOptions).then(() => recursiveAddVideosToPlaylist(videoIds, index + 1, playlistId, accessToken));
      }
    }

    if (isLoading) {
      const hashQuery = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashQuery.get("access_token");
      const playlistName = window.sessionStorage.getItem("newPlaylistName");

      const fetchOptions = {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "Bearer " + accessToken,
        },
        body: JSON.stringify({
          snippet: {
            title: playlistName,
          },
        }),
      };
      const params = new URLSearchParams({
        part: "snippet",
        key: constants.youtubeApiKey,
      });
      const createPlaylistURL = `https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`;
      fetch(createPlaylistURL, fetchOptions)
        .then(res => res.json())
        .then(data => {
          const newPlaylistID = data.id;
          const videoIDs = JSON.parse(window.sessionStorage.getItem("newPlaylistVideoIDs"))
          recursiveAddVideosToPlaylist(videoIDs, 0, newPlaylistID, accessToken)
            .then(() => setIsLoading(false));
          // const insertVideoURL = `https://youtube.googleapis.com/youtube/v3/playlistItems?${params.toString()}`;
          // const insertVideoPromises = videoIDs.map((videoID, index) => {
          //   const insertVideoFetchOptions = {
          //     method: "POST",
          //     headers: {
          //       "Accept": "application/json",
          //       "Content-Type": "application/json",
          //       "Authorization": "Bearer " + accessToken,
          //     },
          //     body: JSON.stringify({
          //       snippet: {
          //         playlistId: newPlaylistID,
          //         resourceId: {
          //           kind: "youtube#video",
          //           videoId: videoID,
          //         }
          //       }
          //     })
          //   };
          //   // await fetch(insertVideoURL, insertVideoFetchOptions);
          //   return fetch(insertVideoURL, insertVideoFetchOptions);
          // });
          // Promise.all(insertVideoPromises)
          //   .then(() => setIsLoading(false));
          // setIsLoading(false);
        });
    }
  }, []);
  
        let header;
        if (isLoading) {
    header = (
        <>
          <h3>Creating new YouTube playlist</h3>
          <Spinner animation="border" />
        </>
    );
  } else {
    header = <h3>Your new YouTube playlist has been created!</h3>;
  }

  return(
    <Container className="text-center p-5">
      <Row className="align-items-center">
        <Col>
          {header}
          <Link to="/spotify-playlists">
            <Button>Return to Spotify playlist selection</Button>
          </Link>
        </Col>
      </Row>
    </Container>
  )
}
