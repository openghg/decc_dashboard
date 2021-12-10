import PropTypes from "prop-types";
import React from "react";
import ExplanationBox from "../ExplanationBox/ExplanationBox";
import LeafletMap from "../LeafletMap/LeafletMap";

import styles from "../../Dashboard.module.css";
import ObsBox from "../ObsBox/ObsBox";
import ObsExplainer from "../ObsExplainer/ObsExplainer";
import GraphContainer from "../GraphContainer/GraphContainer";
import MobileExplainer from "../MobileExplainer/MobileExplainer";
import ScatterMap from "../ScatterMap/ScatterMap";

class LiveData extends React.Component {
  createMapExplainer() {
    const header = "Atmospheric Monitoring & Verification of the UK’s GHG Inventory";
    const explainer = `The UK DECC (Deriving Emissions linked to Climate Change) Network consists of four sites in the UK and Ireland measuring 
    greenhouse and ozone depleting gases from tall telecommunication towers.`;
    return <ExplanationBox header={header} explain={explainer} split={true} />;
  }

  createIntro() {
  
  }

  render() {
    // Map centre lat/long
    const mapCentre = [55.861, -4.248];

    return (
      <div className={styles.content}>
        <div className={styles.intro}>{this.createIntro()}</div>
        <div className={styles.timeseries} id="graphContent">
          <ObsBox
            dataSelector={this.props.dataSelector}
            clearSources={this.props.clearSources}
            speciesSelector={this.props.speciesSelector}
            selectedSources={this.props.selectedSources}
            processedData={this.props.processedData}
            selectedKeys={this.props.selectedKeys}
            selectedSpecies={this.props.selectedSpecies}
            defaultSpecies={this.props.defaultSpecies}
          />
        </div>
        <div className={styles.mapExplainer}>
          <ObsExplainer />
        </div>
        <div className={styles.siteMap}>
          <LeafletMap
            sourceSelector={this.props.sourceSelector}
            selectedSpecies={this.props.selectedSpecies}
            centre={mapCentre}
            zoom={9}
            processedData={this.props.processedData}
            siteInfoOverlay={this.props.setSiteOverlay}
          />
        </div>
      </div>
    );
  }
}

LiveData.propTypes = {
  clearSites: PropTypes.func,
  colours: PropTypes.object,
  dataSelector: PropTypes.func,
  defaultSpecies: PropTypes.string,
  processedData: PropTypes.object,
  selectedKeys: PropTypes.object,
  selectedSites: PropTypes.object,
  selectedSpecies: PropTypes.string,
  setSiteOverlay: PropTypes.func,
  siteData: PropTypes.object,
  siteSelector: PropTypes.func,
  sites: PropTypes.object,
  speciesSelector: PropTypes.func,
};

export default LiveData;
