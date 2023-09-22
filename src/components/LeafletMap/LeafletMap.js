import PropTypes from "prop-types";
import React from "react";
import { LayerGroup, MapContainer, ImageOverlay, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { get } from "lodash";
import TextButton from "../TextButton/TextButton";

import styles from "./LeafletMap.module.css";

class LeafletMap extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    // Extract what we want from the event returned by the button click
    this.props.sourceSelector(e.target.dataset.onclickparam);
  }

  createMarkers() {
    const dataStore = this.props.dataStore;
    const selectedSpecies = this.props.selectedSpecies;
    const metaStore = this.props.metaStore;
    // The only site structure we want here are sites that have provided data
    // for the species we're interested in
    const siteStructure = this.props.siteStructure[selectedSpecies];

    // We'll make a marker for each site
    let markers = [];

    // TODO - Are props always defined? Are we making the right comparison here?
    if (metaStore !== undefined && dataStore !== undefined) {
      // We want a marker for each site, with selection buttons within the popup
      for (const siteData of Object.values(siteStructure)) {
        for (const inletData of Object.values(siteData)) {
          let marker = null;
          let sourceButtons = [];
          // The site metadata we require will be the same for each inlet / instrument
          let siteSpecificMetadata = null;

          const buttonStyling = { fontSize: "0.8em", width: "0.8em" };

          for (const [inlet, instrumentData] of Object.entries(inletData)) {
            for (const sourceKey of Object.values(instrumentData)) {
              // TODO - do we want separate buttons for the different instruments?
              siteSpecificMetadata = get(metaStore, sourceKey);
              const button = (
                <TextButton
                  styling="dark"
                  extrastyling={buttonStyling}
                  onClickParam={sourceKey}
                  onClick={this.handleClick}
                >
                  {inlet}
                </TextButton>
              );

              sourceButtons.push(button);
            }
          }

          try {
            const station_latitude = siteSpecificMetadata["station_latitude"];
            const station_longitude = siteSpecificMetadata["station_longitude"];

            const locationStr = `${station_latitude}, ${station_longitude}`;
            const location = [station_latitude, station_longitude];
            const siteName = siteSpecificMetadata["station_long_name"];

            marker = (
              <CircleMarker key={locationStr} center={location} fill={true} fillOpacity={0.7} radius={8}>
                <Popup>
                  <div className={styles.marker}>
                    <div className={styles.markerBody}>
                      <div className={styles.markerTitle}>{siteName.toUpperCase()}</div>
                      <div className={styles.markerButtons}>
                        Select inlet:
                        {sourceButtons}
                      </div>
                      <br />
                      For more information please visit the&nbsp;
                      <a
                        href="https://www.bristol.ac.uk/chemistry/research/acrg/current/decc.html"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        the DECC network website.
                      </a>
                    </div>
                    <div className={styles.markerLocation}>Location: {locationStr}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );

            markers.push(marker);
          } catch (error) {
            console.log(error);
            continue;
          }
        }
      }
    }

    return markers;
  }

  render() {
    let imgOverlay = null;
    if (this.props.overlayImg && this.props.overlayBounds) {
      const imgPath = this.props.overlayImg;
      const bounds = this.props.overlayBounds;

      imgOverlay = <ImageOverlay url={imgPath} bounds={bounds} opacity={0.7} zIndex={10} />;
    }

    let url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    let attribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
    if (this.props.mapstyle && this.props.mapstyle === "proton") {
      url = "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png";
      const extraAttr = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
      const attrTiles = '&copy; <a href="http://osm.org/copyright">Map tiles by Carto, under CC BY 3.0.</a> ';
      attribution = extraAttr + attrTiles;
    }

    const markers = this.createMarkers();
    const zoom = this.props.zoom ? this.props.zoom : 5;

    const style = { width: "90%" };

    return (
      <div className={styles.container}>
        <MapContainer center={this.props.centre} zoom={zoom} scrollWheelZoom={true} style={style} tap={false}>
          <TileLayer attribution={attribution} url={url} />
          <LayerGroup>{markers}</LayerGroup>
          <LayerGroup>{imgOverlay}</LayerGroup>
        </MapContainer>
      </div>
    );
  }
}

LeafletMap.propTypes = {
  centre: PropTypes.arrayOf(PropTypes.number).isRequired,
  colours: PropTypes.object,
  height: PropTypes.string,
  mapstyle: PropTypes.string,
  overlayBounds: PropTypes.arrayOf(PropTypes.array),
  overlayImg: PropTypes.string,
  setOverlay: PropTypes.func,
  siteSelector: PropTypes.func,
  sites: PropTypes.object,
  width: PropTypes.string,
  zoom: PropTypes.number.isRequired,
};

export default LeafletMap;
