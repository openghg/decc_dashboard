import React from "react";
import PropTypes from "prop-types";
import Plot from "react-plotly.js";
import { toTitleCase } from "../../util/helpers";
import styles from "./MultiSiteLineChart.module.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { Button } from "@mui/material";
import { createImage } from "../../util/helpers";

import colours from "../../data/colours.json";
import { get } from "lodash";

class MultiSiteLineChart extends React.Component {
  /*
    This method takes care of downloading the Plot 
    on the website in format of PNG
    It fetches the html tag for plot and converts to PNG
    */
  handleDownloadPNG = (species, sites) => {
    const chartContainer = document.getElementById("chart-container");
    let filenames = [species, ...sites].join("_");

    if (chartContainer) {
      html2canvas(chartContainer).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = imgData;
        link.download = `${filenames}.png`;
        link.click();
      });
    } else {
      console.error("Chart container not found.");
    }
  };

  /*
    This method takes care of downloading the Plot 
    on the website in format of PDF
    It fetches the html tag for plot and converts to PDF
    */
  handleDownloadPDF = (species, sites) => {
    // Here we fetch the html element of chart-container that needs to be downloaded by id.
    const chartContainer = document.getElementById("chart-container");
    let filenames = [species, ...sites].join("_");

    if (chartContainer) {
      html2canvas(chartContainer).then((canvas) => {
        const imgData = canvas.toDataURL("image/jpeg");

        const chartWidth = chartContainer.offsetWidth;
        const chartHeight = chartContainer.offsetHeight;

        const pdf = new jsPDF({
          orientation: chartWidth > chartHeight ? "landscape" : "portrait",
          unit: "mm",
          format: [chartWidth, chartHeight],
        });

        pdf.addImage(imgData, "JPEG", 0, 0, chartWidth, chartHeight);

        pdf.save(filenames);
      });
    } else {
      console.error("Chart container not found.");
    }
  };

  render() {
    let plotData = [];
    let maxY = 0;
    let minY = Infinity;

    let species = null;
    let units = null;
    let sites = [];

    for (const sourceKey of this.props.selectedSources) {
      const metadata = get(this.props.metaStore, sourceKey);

      const timeseriesData = get(this.props.dataStore, sourceKey, null);
      // // TODO - how to handle this error cleanly?
      if (timeseriesData === null) {
        console.log("No timeseries data available for this source.")
        continue;
      }

      const xValues = timeseriesData["x_values"];
      const yValues = timeseriesData["y_values"];

      const max = Math.max(...yValues);
      const min = Math.min(...yValues);

      if (max > maxY) maxY = max;
      if (min < minY) minY = min;

      // Set the name for the legend
      let name = null;
      try {
        const siteName = metadata["station_long_name"];
        const inlet = metadata["inlet"];
        // We'll save these in case we want to write to file
        sites.push(metadata["site"]);

        name = `${toTitleCase(siteName)} - ${inlet}`;
      } catch (error) {
        console.error(`Error reading name for legend - ${error}`);
      }

      const colour = colours["pastelColours"];
      units = metadata["units"];
      species = metadata["species"];

      if (units === undefined) {
        if (species === "ch4" || species === "co" || species === "n2o") {
          units = "ppb";
        } else if (species === "co2") {
          units = "ppm";
        }
      }

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

    const widthScaleFactor = 0.925;
    const uniOfBristol = require(`../../images/UniOfBristolLogo.png`);
    const metOffice = require(`../../images/Metoffice.png`);
    const ncas = require(`../../images/ncas.png`);
    const openghg = require(`../../images/OpenGHG_Logo_Landscape.png`);

    let yLabel = null;
    if (species !== null) {
      yLabel = `${species.toUpperCase()}  (${units})`;
    } else {
      console.error(`species is null`);
    }

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
          text: yLabel,
          standoff: 10,
          font: {
            size: 16,
          },
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
    };

    if (plotData.length === 0) {
      return <div>Retrieving data...</div>;
    } else {
      return (
        <div data-testid={"linePlot"} className={styles.container}>
          <div id="chart-container">
            <Plot data={plotData} layout={layout} />
          </div>
          <div className={`${styles.downloadContainer} ${styles.smallButtonPosition}`}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() => this.handleDownloadPDF(species, sites)}
              style={{ width: "10px", height: "20px" }}
            >
              PDF
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() => this.handleDownloadPNG(species, sites)}
              style={{ width: "20px", height: "20px" }}
            >
              PNG
            </Button>
          </div>
        </div>
      );
    }
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
