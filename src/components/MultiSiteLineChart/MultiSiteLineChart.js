import React from "react";
import PropTypes from "prop-types";
import Plot from "react-plotly.js";
import { toTitleCase } from "../../util/helpers";
import styles from "./MultiSiteLineChart.module.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Button } from "@mui/material";

class MultiSiteLineChart extends React.Component {

  // used to create pdf object and download the image of the chart as pdf
  handleDownloadPDF = () => {
    // Here we fetch the html element of chart-container that needs to be downloaded by id.
    const chartContainer = document.getElementById("chart-container");

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
  
        pdf.save("concentrationTime_OpenghgPlot.pdf");
      });
    } else {
      console.error("Chart container not found.");
    }
  };
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


    // This specifies various plot elements that needs to be supplied as argument to <Plot>
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
          standoff: 10,
          font: {
            size:16,
          }
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
        <div id="chart-container">
          <Plot data={plotData} layout={layout} />
        </div>
        <div className={`${styles.downloadContainer} ${styles.smallButtonPosition}`}>
        <Button
        size="small"
        variant="contained"
        color="success"
        startIcon={<FileDownloadOutlinedIcon />}
        onClick={this.handleDownloadPDF}>
          PDF
          </Button>
        </div>
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
