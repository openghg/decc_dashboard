import PropTypes from "prop-types";
import React from "react";
import GraphContainer from "../GraphContainer/GraphContainer";
import MultiSiteLineChart from "../MultiSiteLineChart/MultiSiteLineChart";

import { isEmpty, getVisID } from "../../util/helpers";

import styles from "./ObsBox.module.css";
import RadioButtons from "../RadioButtons/RadioButtons";
import NiceButton from "../NiceButton/NiceButton";

class ObsBox extends React.Component {
  createEmissionsGraphs() {
    const processedData = this.props.processedData;
    const selectedSources = this.props.selectedSources;
    const selectedSpecies = this.props.selectedSpecies;

    const noSiteSelected = selectedSources.size === 0;

    if (noSiteSelected) {
      return <div className={styles.emptyMessage}>Please select a site</div>;
    }

    let dataToPlot = {};
    let multiUnits = [];

    if (selectedSources) {
      const speciesData = processedData[selectedSpecies];

      for (const key of selectedSources) {
        dataToPlot[key] = speciesData[key];

        try {
          const units = speciesData[key]["metadata"]["units"];
          multiUnits.push(units);
        } catch (error) {
          console.error(`Error reading units - ${error}`);
        }
      }

      if (!isEmpty(dataToPlot)) {
        // Do a quick check to make sure all the units are the same
        let units = "";
        if (new Set(multiUnits).size === 1) {
          units = ` (${multiUnits[0]})`;
        } else {
          console.error(`Multiple units for same species - ${multiUnits}`);
        }

        const key = Object.keys(dataToPlot).join("-");

        const widthScale = 0.9;
        const heightScale = 0.9;

        // We only set the title of the graph if there's one site selected
        let title = null;
        const xLabel = "Date";
        const yLabel = `Concentration${units}`;

        const vis = (
          <GraphContainer heightScale={heightScale} widthScale={widthScale} key={key} divName="graphContent">
            <MultiSiteLineChart
              title={title}
              divID={getVisID()}
              data={dataToPlot}
              xLabel={xLabel}
              yLabel={yLabel}
              key={key}
              units={units}
              selectedSpecies={this.props.selectedSpecies}
            />
          </GraphContainer>
        );

        return vis;
      } else {
        console.error("No data to plot.");
        return null;
      }
    }
  }

  render() {
    const siteSelected = this.props.selectedSources.size > 0;

    let clearButton = null;
    if (siteSelected) {
      clearButton = <NiceButton onClick={this.props.clearSources}>Clear</NiceButton>;
    }

    const availableSpecies = Object.keys(this.props.processedData);

    return (
      <div className={styles.container}>
        <div className={styles.select}>
          <RadioButtons
            onChange={this.props.speciesSelector}
            options={availableSpecies}
            selected={this.props.selectedSpecies}
          />
          <div className={styles.clearButton}>{clearButton}</div>
        </div>
        <div className={styles.plot}>{this.createEmissionsGraphs()}</div>
      </div>
    );
  }
}

ObsBox.propTypes = {
  clearSources: PropTypes.func.isRequired,
  processedData: PropTypes.object.isRequired,
  selectedSources: PropTypes.object.isRequired,
  selectedSpecies: PropTypes.string.isRequired,
  speciesSelector: PropTypes.func.isRequired,
};

export default ObsBox;
