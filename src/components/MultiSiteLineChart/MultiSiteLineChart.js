import PropTypes from "prop-types";
import React from "react";
import Plot from "react-plotly.js";
import { toTitleCase } from "../../util/helpers";
import styles from "./MultiSiteLineChart.module.css";

/**
 * Creates an image object for the layout.
 *
 * @param {string} source - The image source URL.
 * @param {number} x - The horizontal position of the image.
 * @param {number} [opacity=0.6] - The opacity of the image.
 * @returns {Object} The image object for the layout.
 */
function createImage(source, x, opacity = 0.6) {
  return {
    source: source,
    xref: 'paper',
    yref: 'paper',
    x: x,
    y: 0.89,
    sizex: 0.12,
    sizey: 0.12,
    opacity: opacity,
    xanchor: 'center',
    yanchor: 'middle',
  }};

class MultiSiteLineChart extends React.Component {
  render() {
    let plotData = [];
    let maxY = 0;
    let minY = Infinity;

    const data = this.props.data;

    for (const sourceData of Object.values(data)) {
      const metadata = sourceData["metadata"];
      const measurementData = sourceData["data"];

      const xValues = measurementData["x_values"];
      const yValues = measurementData["y_values"];

      const max = Math.max(...yValues);
      const min = Math.min(...yValues);

      if (max > maxY) {
        maxY = max;
      }

      if (min < minY) {
        minY = min;
      }

      // Set the name for the legend
      let name = null;
      try {
        const siteName = metadata["long_name"];
        const inlet = metadata["inlet"];

        name = `${toTitleCase(siteName)} - ${inlet}`;
      } catch (error) {
        console.error(`Error reading name for legend - ${error}`);
      }

      const colour = sourceData["colour"];
      const units = metadata["units"];

      const trace = {
        x: xValues,
        y: yValues,
        units: units,
        mode: "lines",
        line: {
          width: 1,
          color: colour,
        },
        name: `<b>${name}</b>`,
        hovertemplate: `<b>Date</b>: %{x} <br><b>Concentration: </b>: %{y:.2f} ${units}<br>`,
      };

      plotData.push(trace);
    }

    let dateMarkObject = null;
    const selectedDate = this.props.selectedDate;

    if (selectedDate) {
      const date = new Date(parseInt(selectedDate));

      dateMarkObject = {
        type: "line",
        x0: date,
        y0: minY,
        x1: date,
        y1: maxY,
        line: {
          color: "black",
          width: 1,
        },
      };
    }

    const widthScaleFactor = 0.925;
    const uniOfBristol = require(`../../images/UniOfBristolLogo.png`);
    const metOffice = require(`../../images/Metoffice.png`);
    const ncas = require(`../../images/ncas.png`);
    const openghg = require(`../../images/OpenGHG_Logo_Landscape.png`);

    const layout = {
      title: {
        text: this.props.title ? this.props.title : null,
        font: {
          size: 16,
        },
        xanchor: "center",
        y: 0.97,
        yanchor: "top",
      },
      images: [
        createImage(openghg, 0.1),
        createImage(uniOfBristol, 0.22),
        createImage(metOffice, 0.31),
        createImage(ncas, 0.41),
      ],
      xaxis: {
        range: this.props.xRange ? this.props.xRange : null,
        showgrid: false,
        linecolor: "black",
        autotick: true,
        ticks: "outside",
      },
      yaxis: {
        automargin: true,
        title: {
          text: this.props.yLabel,
          standoff: 1,
        },
        range: this.props.yRange ? this.props.yRange : null,
        showgrid: false,
        linecolor: "black",
        autotick: true,
        ticks: "outside",
        zeroline: false,
      },
      showlegend: true,
      legend: {
        x: 1,
        xanchor: "right",
        y: 1,
      },
      width: widthScaleFactor * this.props.width,
      height: this.props.height,
      margin: {
        l: 60,
        r: 40,
        b: 30,
        t: 20,
        pad: 5,
      },
      shapes: [dateMarkObject],
    };

    return (
      <div data-testid={"linePlot"} className={styles.container}>
        <Plot data={plotData} layout={layout} />
      </div>

    );
  }
}

MultiSiteLineChart.propTypes = {
  data: PropTypes.object.isRequired,
  selectedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
  xRange: PropTypes.string,
  yLabel: PropTypes.string,
  yRange: PropTypes.string,
};

export default MultiSiteLineChart;
