import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Image from "react-bootstrap/Image"
import Navbar from "react-bootstrap/Navbar"
import Row from "react-bootstrap/Row"
import Spinner from "react-bootstrap/Spinner"
import Table from "react-bootstrap/Table"
import React, { useEffect, useRef, useState } from "react"
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { Link } from "react-router-dom";

import { spotifyReducedTrackCount } from "../constants";

import { getSpotifyUserPlaylists, getSomePlaylistTracks } from "../helpers/spotify-helpers"

export async function loader() {}

function TracksTable(props) {
	const { playlistID, playlistLength, isSelected } = props

	const reducedTrackCount = parseInt(spotifyReducedTrackCount)

	const getKey = (pageIndex, previousPageData) => {
		if (previousPageData && !previousPageData.tracks) return null;

		if (pageIndex === 0) return `?playlist-tracks&id=${playlistID}&limit=${reducedTrackCount}`

		return `?playlist-tracks&id=${playlistID}&limit=10&offset=${previousPageData.nextPageOffset}`
	}

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
	)

	const arrayOfTrackArrays = data ? data.map(res => res.tracks) : []
	const tracks = [].concat(...arrayOfTrackArrays)
	const tableData = isSelected ? tracks.map(track => 
		<tr>
			<td>{track.name}</td>
			<td>{track.artists}</td>
		</tr>
	) : tracks.slice(0, reducedTrackCount).map(track =>
		<tr>
			<td>{track.name}</td>
			<td>{track.artists}</td>
		</tr>
	)

	const isLoadingInitialData = !data && !error
	const isLoadingMore =
		isLoadingInitialData ||
		(size > 1 && data && typeof data[size - 1] === "undefined")
	const allTracksLoaded = tracks.length === playlistLength

	const tracksNotShown = playlistLength - reducedTrackCount
	
	return(
		<Table striped bordered hover className="font-weight-bold">
			<thead>
				<tr>
					<th>Title</th>
					<th>Artist(s)</th>
				</tr>
			</thead>
			<tbody>
				{tableData}
				{!isSelected && tracksNotShown > 0 &&
					<tr>
						<td colSpan={2}>{`${tracksNotShown} more...`}</td>
					</tr>
				}
				{isSelected && !allTracksLoaded &&
					<tr>
						<td colSpan={2}>
							{!isLoadingMore &&
								<Button variant="light" onClick={() => setSize(size + 1)}>{"Load More"}</Button>
							}
							{isLoadingMore &&
								<Spinner animation="border" />
							}
						</td>
					</tr>
				}
			</tbody>
		</Table>
	)
}

function PlaylistCard(props) {
	const cardRef = useRef(null)
	const { playlist, index, isSelected, setSelectedPlaylistIndex } = props

	const [justSelected, setJustSelected] = useState(false)

	useEffect(() => {
		if (justSelected) {
			const position = cardRef.current.getBoundingClientRect()
			window.scrollTo({
				top: position.top + window.scrollY - 20,
				left: 0,
				behavior: "smooth"
			})
			setJustSelected(false)
		}
	})

	const selectPlaylist = () => {
		if (!isSelected) {
			setSelectedPlaylistIndex(parseInt(index))
			setJustSelected(true)
		}
	}

	const color = isSelected ? "info" : "light"
	return(
		<Col xs={{span: 12}} lg={{span: isSelected ? 12 : 6}} className="my-3 mx-0">
			<Card ref={cardRef} bg={color} className="h-100" onClick={() => selectPlaylist()} key={playlist.id}>
				<Card.Header className="text-center" as="h4">
					{playlist.name}
				</Card.Header>
				<Card.Body>
					<Row className="align-middle">
						<Col xs={isSelected ? {offset: 4, span: 4} : {offset: 3, span: 7}} className="px-3 py-1"><Image src={playlist.image} thumbnail /></Col>
						<Col xs={12} className="align-self-center">
							<Card.Text>
								<p>{`${playlist.totalTracks} tracks`}</p>
								<div style={{maxHeight: "500px", overflowY: "auto"}}>
									{isSelected &&
										<TracksTable 
											playlistID={playlist.id}
											playlistLength={playlist.totalTracks}
											isSelected={true}
										/>
									}
								</div>
							</Card.Text>
						</Col>
					</Row>
					{ !isSelected &&
						<a className="stretched-link" role="button" />
					}
				</Card.Body>
		</Card>
	</Col>
	)
}

function SpotifyPlaylists() {
	const [selectedPlaylistIndex, _setSelectedPlaylistIndex] = useState(null)
	const setSelectedPlaylistIndex = (index) => {
		// if (id === selectedPlaylist) {
		// 	_setSelectedPlaylist(null)
		// } else {
		// 	_setSelectedPlaylist(id)
		// }
		_setSelectedPlaylistIndex(index)
	}
	const { data: playlists } = useSWR(
		"spotifyUserPlaylists",
		getSpotifyUserPlaylists,
		{
				revalidateOnFocus: false,
				revalidateOnReconnect: false,
				refreshInterval: 0,
				errorRetryCount: 3,
			}
	)
	return(
		<Container className="text-center p-5">
                        <h1>Choose a Playlist to Convert</h1>
			<Row className="m-xs-1 m-sm-2 m-md-3 m-lg-4 m-xl-5">
				{
					playlists && playlists
						.map((playlist, index) =>
							<PlaylistCard
								playlist={playlist}
								index={index}
								order={index + 1}
								isSelected={index === selectedPlaylistIndex}
								setSelectedPlaylistIndex={setSelectedPlaylistIndex}
							/>
						)
				}
			</Row>
			<Navbar bg="dark" fixed="bottom" className="w-100 justify-content-center">
				<Link href={`/youtube-results/${playlists?.[selectedPlaylistIndex]?.id}?totalTracks=${playlists?.[selectedPlaylistIndex]?.totalTracks}`}>
					<Button disabled={selectedPlaylistIndex === null}>Convert</Button>
				</Link>
			</Navbar>
		</Container>
	)
}

export default SpotifyPlaylists

