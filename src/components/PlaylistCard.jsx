import { useEffect, useRef, useState } from "react";

import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import Row from "react-bootstrap/Row";

import TracksTable from "./TracksTable";

export default function PlaylistCard({
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
                    tracksURL={tracksURL}
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
