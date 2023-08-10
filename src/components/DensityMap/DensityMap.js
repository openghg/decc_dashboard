// import PropTypes from "prop-types";
import React from "react";
import Plot from "react-plotly.js";
import { extend } from "lodash";

import styles from "./DensityMap.module.css";

import ch4MobileGlasgow from "../../data/ch4_mobile_glasgow.json";

class DensityMap extends React.Component {
  render() {
    const hovertemplate =
      "<b>Latitude</b>: %{lat:.5f}<br>" +
      "<b>Longitude</b>: %{lon:.5f}<br><br>" +
      "<b>Concentration: </b>: %{z:.2f} ppb <br>" +
      "(enhancement over background)" +
      "<extra></extra>";

    let plotObj = { type: "densitymapbox", coloraxis: "coloraxis", hovertemplate: hovertemplate, radius: 15 };
    // Now add in the extra lat, lon, z keys from the exported data
    const ch4Data = ch4MobileGlasgow["ch4"]["data"];
    plotObj = extend(plotObj, ch4Data);
    // Plotly expects an array of objects
    const plotData = [plotObj];

    const height = 400;
    const width = this.props.width;

    const uniOfBristol = require(`../../images/UniOfBristolLogo.png`);
    const metOffice = require(`../../images/Metoffice.png`);
    const ncas = require(`../../images/ncas.png`);
    
    const layout = {
      mapbox: { center: { lon: -4.212836, lat: 55.843658 }, style: "open-street-map", zoom: 10 },
      coloraxis: {
        colorscale: "Viridis",
        colorbar: { title: { side: "right", text: "Methane (ppb)", font: { size: 16 } } },
      },      
      margin: { t: 30, b: 30, l: 30, r: 30 },
      width: width,
      height: height,
      images: [
        {
          source: uniOfBristol,
          xref: 'paper',
          yref: 'paper',
          x: 0.1,
          y: 1,
          sizex: 0.15,
          sizey: 0.15,
          opacity: 1,
          xanchor: 'center',
          yanchor: 'middle',
        },
        {
          source: metOffice,
          xref: 'paper',
          yref: 'paper',
          x: 0.25,
          y: 1,
          sizex: 0.15,
          sizey: 0.15,
          opacity: 0.8,
          xanchor: 'center',
          yanchor: 'middle',
        },
        {
          source: ncas,
          xref: 'paper',
          yref: 'paper',
          x: 0.4,
          y: 1,
          sizex: 0.15,
          sizey: 0.15,
          opacity: 0.8,
          xanchor: 'center',
          yanchor: 'middle',
        },
      ],
    };

    return (
      <div className={styles.content}>
        <Plot data={plotData} layout={layout} />
      </div>
    );
  }
}

export default DensityMap;
