// const he = require("he")

export async function getYoutubeSearchResults(query) {
	const queryParams = new URLSearchParams(query)
	const maxResults = queryParams.has("maxResults") ? parseInt(queryParams.get("maxResults")) : 5
	const trackName = queryParams.get("trackName")
	const trackArtists = queryParams.get("trackArtists")
	let q
	if (queryParams.get("q")) {
		q = queryParams.get("q")
	} else {
		q = trackName + " " + trackArtists
	}
	if (!q) {
		throw new Error("No search terms provided")
	}
	const type = "video"

	const fetchParams = new URLSearchParams({
		key: process.env.youtubeApiKey,
		part: "snippet",
		maxResults: maxResults.toString(),
		q: q.toString(),
		type,
	})
	const youtubeSearchURL = new URL("https://www.googleapis.com/youtube/v3/search")
	youtubeSearchURL.search = fetchParams.toString()
	let fetchOptions = {
		method: "GET",
		headers: {
			"Accept": "application/json",
		}
	}
	let response = await fetch(youtubeSearchURL.href, fetchOptions)
		.then((res) => {if (!res.ok) {
			const error = new Error()
			throw error
		} else {
			return res.json()
		}})

	const videos = response.items.map((item) => {
		return {
			id: item.id.videoId,
			title: he.decode(item.snippet.title),
			imageURL: item.snippet.thumbnails.medium.url,
			trackName,
			trackArtists
		}
	})

	return { videos }
}

