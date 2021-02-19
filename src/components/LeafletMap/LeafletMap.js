import React from "react";
import { MapContainer, TileLayer, Marker, Popup, ImageOverlay } from "react-leaflet";
import styles from "./LeafletMap.module.css";



class LeafletMap extends React.Component {
  processSites() {
    const sites = this.props.sites;
    
    if(!sites) {
        return null;
    }

    let markers = [];
    for (const [key, value] of Object.entries(sites)) {
      const latitude = value["latitude"];
      const longitude = value["longitude"];

      const locationStr = `${key}, ${latitude}, ${longitude}`;
      const location = [latitude, longitude];

      const marker = (
        <Marker key={locationStr} position={location}>
          <Popup>
            <div data-testid={locationStr} className={styles.marker}>
              <div className={styles.markerHeader}>{String(key).toUpperCase()}</div>
              <div className={styles.markerBody}>{value["long_name"]}</div>
              <div className={styles.markerLocation}>Location: {locationStr}</div>
            </div>
          </Popup>
        </Marker>
      );

      markers.push(marker);
    }

    return markers;
  }

  render() {
    const markers = this.processSites();

    const zoom = this.props.zoom ? this.props.zoom : 5;
    const width = this.props.width ? this.props.width : "60vw";
    const height = this.props.height ? this.props.height : "40vh";

    const style = { width: width, height: height };

    let imgOverlay = null;
    if (this.props.overlayImg && this.props.overlayBounds) {
      const imgPath = this.props.overlayImg;
      const bounds = this.props.overlayBounds;

      imgOverlay = <ImageOverlay url={imgPath} bounds={bounds} opacity={0.7} zIndex={10} />;
    }

    return (
      <div className={styles.container}>
        <MapContainer center={this.props.centre} zoom={zoom} scrollWheelZoom={true} style={style}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers}
          {imgOverlay}
        </MapContainer>
      </div>
    );
  }
}

export default LeafletMap;
