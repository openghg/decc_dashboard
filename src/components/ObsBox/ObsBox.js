import PropTypes from "prop-types";
import React from "react";
import GraphContainer from "../GraphContainer/GraphContainer";
import MultiSiteLineChart from "../MultiSiteLineChart/MultiSiteLineChart";

import { isEmpty, getVisID } from "../../util/helpers";

import styles from "./ObsBox.module.css";
import SelectOptions from "../SelectOptions/SelectOptions";
import { Button } from "@mui/material";
import { get, set } from "lodash";

class ObsBox extends React.Component {
  createEmissionsGraphs() {
    const dataStore = this.props.dataStore;
    const metaStore = this.props.metaStore;
    const selectedSources = this.props.selectedSources;
    const selectedSpecies = this.props.selectedSpecies;

    const noSiteSelected = selectedSources.size === 0;

    if (noSiteSelected) {
      return <div className={styles.emptyMessage}>Please select a site</div>;
    }

    let dataToPlot = {};
    let multiUnits = [];

    if (selectedSources) {
      for (const key of selectedSources) {
        set(dataToPlot, key, get(dataStore, key));
        const units = get(metaStore, key);
        if (units) {
          multiUnits.push(units);
        } else {
          console.error(`Error reading units from ${key}.`);
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
              measurementData={dataToPlot}
              metaStore={this.props.metaStore}
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
      clearButton = (
        <Button variant="contained" size="medium" onClick={this.props.clearSources}>
          Clear
        </Button>
      );
    }

    const availableSpecies = Object.keys(this.props.dataStore);

    return (
      <div className={styles.container}>
        <div className={styles.plot}>{this.createEmissionsGraphs()}</div>
        <div className={styles.select}>
          <div className={styles.clearButton}>{clearButton}</div>
          <SelectOptions
            onChange={this.props.speciesSelector}
            options={availableSpecies}
            selected={this.props.selectedSpecies}
          />
        </div>
      </div>
    );
  }
}

ObsBox.propTypes = {
  clearSources: PropTypes.func.isRequired,
  dataStore: PropTypes.object.isRequired,
  selectedSources: PropTypes.object.isRequired,
  selectedSpecies: PropTypes.string.isRequired,
  speciesSelector: PropTypes.func.isRequired,
};

export default ObsBox;
