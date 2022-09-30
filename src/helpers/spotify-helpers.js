import { useEffect, useState } from "react";

import constants from "../constants";

export async function getSpotifyTokensFromCode(
  code,
  redirectURI,
  codeVerifier
) {
  const query = new URLSearchParams({
    client_id: constants.spotifyClientId,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectURI,
    code_verifier: codeVerifier,
  });

  const headers = new Headers({
    "Content-Type": "application/x-www-form-urlencoded",
  });
  const fetchOptions = {
    headers,
    method: "POST",
    body: query.toString(),
  };

  const response = await fetch(constants.spotifyTokenURL, fetchOptions).then(
    (res) => {
      if (!res.ok) {
        const error = new Error();
        throw error;
      } else {
        return res.json();
      }
    }
  );

  let accessToken = response.access_token;
  let expiresIn = response.expires_in;
  let refreshToken = response.refresh_token;
  // If we succeeded in getting new tokens, store them in local storage
  if (accessToken) {
    window.localStorage.setItem("spotifyAccessToken", accessToken);
  } else {
    accessToken = null;
    window.localStorage.removeItem("spotifyAccessToken");
  }
  if (expiresIn) {
    // `expiresIn` represents seconds. Convert to milliseconds for expiration
    // time
    let accessTokenExpiration = Date.now() + expiresIn * 1000;
    window.localStorage.setItem(
      "spotifyAccessTokenExpiration",
      accessTokenExpiration.toString()
    );
  } else {
    window.localStorage.removeItem("spotifyAccessTokenExpiration");
  }
  if (refreshToken) {
    window.localStorage.setItem("spotifyRefreshToken", refreshToken);
  } else {
    refreshToken = null;
    window.localStorage.removeItem("spotifyRefreshToken");
  }

  return [accessToken, refreshToken];
}

export async function getSpotifyAccessToken() {
  let accessToken = window.localStorage.getItem("spotifyAccessToken");
  let accessTokenExpiration = parseInt(
    window.localStorage.getItem("spotifyAccessTokenExpiration")
  );
  let refreshToken = window.localStorage.getItem("spotifyRefreshToken");
  if (!(accessToken && accessTokenExpiration && refreshToken)) {
    return null;
  }
  // If we're within 3 minutes of an expired token, go ahead and treat it as
  // expired so we can get a new one
  // const tokenExpirationBufferMS = 180_000

  // TODO: This is temporary for debugging refresh method
  const tokenExpirationBufferMS = 3_550_000;
  const tokenTimeLeftMS = accessTokenExpiration - Date.now();
  if (tokenTimeLeftMS < tokenExpirationBufferMS) {
    [accessToken, refreshToken] = await refreshSpotifyTokens(refreshToken);
  }

  return accessToken;
}

// TODO: can we use then instead of async await here
async function refreshSpotifyTokens(refreshToken) {
  const query = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: constants.spotifyClientId,
  });

  const headers = new Headers({
    "Content-Type": "application/x-www-form-urlencoded",
  });
  const fetchOptions = {
    headers,
    method: "POST",
    body: query.toString(),
  };

  // TODO: Find better way to handle error here
  const response = await fetch(constants.spotifyTokenURL, fetchOptions).then(
    (res) => {
      if (!res.ok) {
        const error = new Error();
        throw error;
      } else {
        return res.json();
      }
    }
  );

  let accessToken = response.access_token;
  let expiresIn = response.expires_in;
  refreshToken = response.refresh_token;
  // If we succeeded in getting new tokens, store them in local storage
  if (accessToken && expiresIn && refreshToken) {
    let accessTokenExpiration = Date.now() + expiresIn * 1000;
    window.localStorage.setItem("spotifyAccessToken", accessToken);
    window.localStorage.setItem(
      "spotifyAccessTokenExpiration",
      accessTokenExpiration.toString()
    );
    window.localStorage.setItem("spotifyRefreshToken", refreshToken);
  } else {
    accessToken = null;
    refreshToken = null;
    window.localStorage.removeItem("spotifyAccessToken");
    window.localStorage.removeItem("spotifyAccessTokenExpiration");
    window.localStorage.removeItem("spotifyRefreshToken");
  }

  return [accessToken, refreshToken];
}

export function generateRandomStateString() {
  const length = 8;
  let typedNums = new Uint8Array(length);
  typedNums = window.crypto.getRandomValues(typedNums);
  const nums = Array.from(typedNums);
  return nums.map((num) => num.toString(16)).join("");
}

export async function generateCodeVerifierAndChallenge() {
  let typedNums = new Uint8Array(64);
  typedNums = window.crypto.getRandomValues(typedNums);
  const nums = Array.from(typedNums);
  const verifier = nums.map((num) => num.toString(16)).join("");
  const encoder = new TextEncoder();
  const verifierArray = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest(
    "SHA-256",
    verifierArray.buffer
  );
  const hashArray = Array.from(new Uint8Array(hash));
  const hashString = String.fromCharCode(...hashArray);
  const challenge = stringToBase64URL(hashString);

  return [verifier, challenge];
}

function stringToBase64URL(input) {
  const result = window
    .btoa(input)
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");
  return result;
}

export async function getSpotifyUserPlaylists() {
  let accessToken = await getSpotifyAccessToken();

  let spotifyFetchOptions = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
  };

  let playlistResponse = await fetch(
    constants.spotifyPlaylistsURL,
    spotifyFetchOptions
  ).then((res) => {
    if (!res.ok) {
      const error = new Error();
      throw error;
    } else {
      return res.json();
    }
  });
  let playlists = playlistResponse.items
    .filter((item) => item.tracks.total > 0)
    .map((item) => {
      return {
        id: item.id,
        name: item.name,
        image: item.images[0] ? item.images[0].url : null,
        totalTracks: item.tracks.total,
        tracksURL: item.tracks.href,
      };
    });

  const playlistTrackPromises = playlists.map((playlist) => {
    return getSpotifyPlaylistTracks({
      id: playlist.id,
      // limit: process.env.spotifyReducedTrackCount,
      limit: 10,
      offset: 0,
    });
  });
  await Promise.allSettled(playlistTrackPromises).then((results) =>
    results.map((trackResult, index) => {
      if (trackResult.status === "fulfilled") {
        const { tracks } = trackResult.value;
        const thisPlaylist = playlists[index];
        thisPlaylist["tracks"] = tracks;
        thisPlaylist["doneLoadingTracks"] =
          tracks.length === thisPlaylist.totalTracks;
      }
    })
  );

  return playlists;
}

export async function getSpotifyPlaylistTracks({ id, limit, offset }) {
  const accessToken = await getSpotifyAccessToken();
  const market = "from_token";
  const fields = "items(track(name,artists(name))),next";
  const spotifyPlaylistsURL = new URL(
    `https://api.spotify.com/v1/playlists/${id}/tracks`
  );
  spotifyPlaylistsURL.searchParams.set("fields", fields);
  spotifyPlaylistsURL.searchParams.set("market", market);
  if (limit) {
    spotifyPlaylistsURL.searchParams.set("limit", limit);
  }
  if (offset) {
    spotifyPlaylistsURL.searchParams.set("offset", offset);
  }

  let spotifyFetchOptions = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
  };
  let trackResponse = await fetch(
    spotifyPlaylistsURL.href,
    spotifyFetchOptions
  ).then((res) => {
    if (!res.ok) {
      const error = new Error();
      throw error;
    } else {
      return res.json();
    }
  });

  const tracks = trackResponse.items.map((item) => {
    return {
      name: item.track.name,
      artists: item.track.artists.map((artist) => artist.name).join(", "),
    };
  });
  const moreTracksURL = trackResponse.next;

  return { tracks, moreTracksURL };
}

export async function fetchAllPlaylistTracks(playlist) {
  if (playlist.tracks.length === playlist.totalTracks) {
    return true;
  }
  const id = playlist.id;
  const offset = playlist.tracks.length;
  const limit = 100;
  let { tracks, moreTracksURL } = await getSpotifyPlaylistTracks({
    id,
    offset,
    limit,
  });
  playlist.tracks.push(...tracks);
  playlist.doneLoadingTracks = tracks.length === playlist.totalTracks;
  while (moreTracksURL) {
    const accessToken = await getSpotifyAccessToken();
    let spotifyFetchOptions = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };
    let trackResponse = await fetch(moreTracksURL, spotifyFetchOptions).then(
      (res) => {
        if (!res.ok) {
          const error = new Error();
          throw error;
        } else {
          return res.json();
        }
      }
    );
    moreTracksURL = trackResponse.next;
    const newTracks = trackResponse.items.map((item) => {
      return {
        name: item.track.name,
        artists: item.track.artists.map((artist) => artist.name).join(", "),
      };
    });
    playlist.tracks.push(...newTracks);
    playlist.doneLoadingTracks = tracks.length === playlist.totalTracks;
  }

  return true;
}

export async function getSomePlaylistTracks(query) {
  const queryParams = new URLSearchParams(query);
  const accessToken = await getSpotifyAccessToken();
  const id = queryParams.get("id");
  const limit = queryParams.has("limit")
    ? parseInt(queryParams.get("limit"))
    : 100;
  const offset = queryParams.has("offset")
    ? parseInt(queryParams.get("offset"))
    : 0;
  const market = "from_token";
  const fields = "items(track(name,artists(name))),next";

  const fetchParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    market,
    fields,
  });
  const tracksURL = new URL(
    `https://api.spotify.com/v1/playlists/${id}/tracks`
  );
  tracksURL.search = fetchParams.toString();
  let fetchOptions = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
  };
  let trackResponse = await fetch(tracksURL.href, fetchOptions).then((res) => {
    if (!res.ok) {
      const error = new Error();
      throw error;
    } else {
      return res.json();
    }
  });

  const tracks = trackResponse.items.map((item) => {
    return {
      name: item.track.name,
      artists: item.track.artists.map((artist) => artist.name).join(", "),
    };
  });

  const nextPageOffset = offset + limit;

  return { tracks, nextPageOffset };
}

export async function checkSpotifyLoginStatus() {
  const refreshToken = window.localStorage.getItem("spotifyRefreshToken");
  if (refreshToken) {
    const tokenExpiration = window.localStorage.getItem(
      "spotifyAccessTokenExpiration"
    );
  }

  return false;
}

class InvalidCredentialsError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'InvalidCredentialsError';
  }
}

export async function fetchWithCredentialsRetryOnce(fetchURL) {
  const accessToken = window.localStorage.getItem("spotifyAccessToken");
  const refreshToken = window.localStorage.getItem("spotifyRefreshToken");
  if (accessToken === null || refreshToken === null) {
    throw new Error("Couldn't find Spotify credentials");
  }

  try {
    const spotifyFetchOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    };

    const result = await fetch(fetchURL, spotifyFetchOptions)
      .then(res => {
        if (res.ok) {
          return res;
        } else if (res.status === 401) {
          throw new InvalidCredentialsError(`Credentials rejected when attempting to fetch ${fetchURL}`);
        } else {
          throw new Error(`Failed to fetch ${fetchURL}`);
        }
      })
    if (result) {
      return result;
    }
  } catch (err) {
    if (!(err instanceof InvalidCredentialsError)) {
      throw error;
    }
  }

  // If we make it here, we specifically got an invalid credentials response so we will
  // try getting new tokens with the existing refresh token, then try the fetch one
  // more time.
  const [newAccessToken, newRefreshToken] = await getNewSpotifyTokensWithRefreshToken(refreshToken);
  window.localStorage.setItem('spotifyAccessToken', newAccessToken);
  window.localStorage.setItem('spotifyRefreshToken', newRefreshToken);

  try {
    const spotifyFetchOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${newAccessToken}`,
      },
    };

    const result = await fetch(fetchURL, spotifyFetchOptions)
      .then(res => {
        if (res.ok) {
          return res;
        } else if (res.status === 401) {
          throw new InvalidCredentialsError(`Credentials rejected when attempting to fetch ${fetchURL}`);
        } else {
          throw new Error(`Failed to fetch ${fetchURL}`);
        }
      })
    if (result) {
      return result;
    }
  } catch (err) {
    throw error;
  }
}

class FailedToRefreshTokensError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'FailedToRefreshTokensError';
  }
}

async function getNewSpotifyTokensWithRefreshToken(refreshToken) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: constants.spotifyClientId,
  });

  const fetchOptions = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    body: params.toString(),
  };

  try {
    const data = await fetch(constants.spotifyTokenURL, fetchOptions)
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new FailedToRefreshTokensError();
        }
      });

    const accessToken = data.access_token;
    // const expiresIn = data.expires_in;
    const newRefreshToken = data.refresh_token;

    return [accessToken, newRefreshToken];
  } catch (err) {
    throw err;
  }
}

export function useFetch(url) {
  const [data, setData] = useState();
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      fetchWithCredentialsRetryOnce(url)
        .then(res => res.json())
        .then(setData)
        .catch(setError)
        .finally(() => setIsLoading(false));
    }
  }, [url]);

  return {
    data,
    error,
    isLoading,
  };
}
