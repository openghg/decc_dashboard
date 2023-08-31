import React from "react";
import { Routes, Route, Link, HashRouter } from "react-router-dom";
import { cloneDeep, has, set, get } from "lodash";

import ControlPanel from "./components/ControlPanel/ControlPanel";
import OverlayContainer from "./components/OverlayContainer/OverlayContainer";

import TextButton from "./components/TextButton/TextButton";
import Overlay from "./components/Overlay/Overlay";
import FAQ from "./components/FAQ/FAQ";
import LiveData from "./components/LiveData/LiveData";

import { importSiteImages } from "./util/helpers";
import styles from "./Dashboard.module.css";

// Site description information
import siteInfoJSON from "./data/siteInfo.json";
import completeMetadata from "./deccoutput/metadata_complete.json";
import { Button } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      isLoaded: false,
      showSidebar: false,
      dataKeys: {},
      selectedKeys: {},
      emptySelection: true,
      overlayOpen: false,
      overlay: null,
      layoutMode: "dashboard",
      colours: {},
      dataStore: {},
    };

    this.dataRepoURL = "https://github.com/openghg/decc_dashboard_data/main/raw/";

    // Build the site info for the overlays
    this.buildSiteInfo();

    // Select the data
    this.dataSelector = this.dataSelector.bind(this);
    // Selects the dates
    this.sourceSelector = this.sourceSelector.bind(this);
    this.toggleOverlay = this.toggleOverlay.bind(this);
    this.setOverlay = this.setOverlay.bind(this);
    this.speciesSelector = this.speciesSelector.bind(this);
    this.clearSources = this.clearSources.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.setSiteOverlay = this.setSiteOverlay.bind(this);
  }

  buildSiteInfo() {
    const siteImages = importSiteImages();

    let siteData = {};
    for (const site of Object.keys(siteInfoJSON)) {
      try {
        siteData[site] = {};
        siteData[site]["image"] = siteImages[site];
        siteData[site]["description"] = siteInfoJSON[site]["description"];
      } catch (error) {
        console.error(error);
      }
    }

    // Disabled the no direct mutation rule here as this only gets called from the constructor
    /* eslint-disable react/no-direct-mutation-state */
    this.state.siteInfo = siteData;
    /* eslint-enable react/no-direct-mutation-state */
  }

  /**
   * Selects a data source - a specific species at a site at an inlet
   *
   * @param {string} selection - Key for a data source
   */
  sourceSelector(selection) {
    let selectedSourcesSet = new Set();

    if (selection instanceof Set) {
      selectedSourcesSet = selection;
    } else {
      selectedSourcesSet.add(selection);
    }

    // Here we change all the sites and select all species / sectors at that site
    let selectedSources = cloneDeep(this.state.selectedSources);

    for (const source of selectedSourcesSet) {
      if (selectedSources.has(source)) {
        selectedSources.delete(source);
      } else {
        selectedSources.add(source);
      }
    }

    this.setState({ selectedSources: selectedSources });
  }

  /**
   * Clear the currently selected data sources
   */
  clearSources() {
    this.setState({ selectedSources: new Set() });
  }

  /**
   * Selects a species
   *
   * @param {string} species - Species name
   */
  speciesSelector(species) {
    const speciesLower = species.toLowerCase();

    const selectedSourcesClone = cloneDeep(this.state.selectedSources);

    this.setState({ selectedSources: new Set() }, () => {
      this.sourceSpeciesChange(species, selectedSourcesClone);
    });

    this.setState({ selectedSpecies: speciesLower });
  }

  sourceSpeciesChange(species, oldSelectedSources) {
    const dataStore = this.state.dataStore;
    const speciesData = dataStore[species];

    let newSources = new Set();

    for (const sourceKey of oldSelectedSources) {
      if (has(speciesData, sourceKey)) {
        newSources.add(sourceKey);
      }
    }

    if (newSources.size === 0) {
      const defaultSource = Object.keys(speciesData)[0];
      newSources.add(defaultSource);
    }

    this.sourceSelector(newSources);
  }

  toggleOverlay() {
    this.setState({ overlayOpen: !this.state.overlayOpen });
  }

  setOverlay(overlay) {
    this.setState({ overlayOpen: true, overlay: overlay });
  }

  toggleSidebar() {
    this.setState({ showSidebar: !this.state.showSidebar });
  }

  /**
   * Retrieves data from the given URL and processes it into a format
   * plotly can read
   *
   * @param {string} filename - Name of file to be retrieved from data store
   * @param {string} species - Species
   * @param {string} sourceKey - Source key
   * @param {boolean} compressed - is the file compressed
   *
   */
  retrieveData(filename, species, sourceKey, compressed = false) {
    const key = `${species}.${sourceKey}`;
    const currentVal = get(this.state.dataStore, key);
    if (currentVal !== null) {
      console.log(`We already have data for ${species}.${sourceKey}`);
      return;
    }
    // TODO - add quick check to see if we have the correct filename?
    // Base URLs:
    const url = new URL(filename, this.dataRepoURL).href;

    async function retrieveData(url) {
      const res = await fetch(url);
      return await res.json();
    }

    const data = retrieveData(url);

    const x_timestamps = Object.keys(data);
    const x_values = x_timestamps.map((d) => new Date(parseInt(d)));
    const y_values = Object.values(data);

    const graphData = {
      x_values: x_values,
      y_values: y_values,
    };

    // Add the data to the dataStore object
    set(this.state.dataStore, key, graphData);
  }

  /**
   * Create the data structure used to create the plots Plotly can read
   */
  createDataStructure() {
    // Loop over the metadata dictionary
    // Create the
    // This should aleady be in the right shape
    this.state.completeMetadata = completeMetadata;
    let defaultSpecies = null;
    let defaultSite = null;
    let defaultInlet = null;
    // Not sure if we need default instrument but
    let defaultInstrument = null;
    let defaultNetwork = null;
    let defaultSourceKey = null;
    // We just need to pull out the initial data

    // This will hold the data itself
    // It's structure is
    // dataStore = {
    //   "species": {
    //     "network_site_inlet_instrument": {"x_values": [1,2,3], "y_values": [1,2,3]}
    //   }
    // }
    // We retrieve only the first dataset and then populate the other data values with nulls
    // When this data is selected the app will retrieve the data

    let dataStore = {};

    try {
      for (const [species, networkData] of Object.entries(completeMetadata)) {
        if (defaultSpecies === null) defaultSpecies = species;
        for (const [network, siteData] of Object.entries(networkData)) {
          if (defaultNetwork === null) defaultNetwork = network;
          for (const [site, inletData] of Object.entries(siteData)) {
            if (defaultSite === null) defaultSite = site;
            for (const [inlet, instrumentData] of Object.entries(inletData)) {
              if (defaultInlet === null) defaultInlet = inlet;
              for (const [instrument, fileMetadata] of Object.entries(instrumentData)) {
                const sourceKey = `${species}.${network}_${site}_${inlet}_${instrument}`;

                if (defaultSourceKey === null) defaultSourceKey = sourceKey;

                let measurementData = null;

                if (!defaultInstrument) {
                  defaultInstrument = instrument;

                  const filename = fileMetadata["filename"];
                  this.retrieveData(filename, species, sourceKey);
                }

                set(dataStore, sourceKey, measurementData);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing raw data - ${error}`);
    }

    // Should we use setState here? Does that work properly now?
    // Disabled the no direct mutation rule here as this only gets called from the constructor
    /* eslint-disable react/no-direct-mutation-state */
    // Give each site a colour
    this.state.dataStore = dataStore;
    this.state.defaultSpecies = defaultSpecies;
    this.state.defaultSourceKey = defaultSourceKey;
    this.state.selectedSources = new Set([defaultSourceKey]);
    this.state.selectedSpecies = defaultSpecies;
    this.state.selectedKeys = dataKeys;
    this.state.isLoaded = true;
    /* eslint-enable react/no-direct-mutation-state */
  }

  dataSelector(dataKeys) {
    this.setState({ selectedKeys: dataKeys });
  }

  componentDidMount() {
    // Retrieve the metadata
    const metadataURL = this.

    // Retrieve the default data - we can just save the key for the default data so we don't have to loop
    // through the whole structure to find it
    this.setState({ isLoaded: true });
    // const apiURL = "https://raw.githubusercontent.com/openghg/dashboard_data/main/combined_data.json";
    // fetch(apiURL)
    //   .then((res) => res.json())
    //   .then(
    //     (result) => {
    //       this.processRawData(result);
    //       this.setState({
    //         isLoaded: true,
    //       });
    //     },
    //     (error) => {
    //       this.setState({
    //         isLoaded: true,
    //         error,
    //       });
    //     }
    //   );
  }

  anySelected() {
    for (const subdict of Object.values(this.state.selectedKeys)) {
      for (const value of Object.values(subdict)) {
        if (value === true) {
          return true;
        }
      }
    }

    return false;
  }

  setSiteOverlay(e) {
    const siteCode = String(e.target.dataset.onclickparam).toUpperCase();
    const siteInfo = this.state.siteInfo[siteCode];

    const siteText = siteInfo["description"];
    const image = siteInfo["image"];
    const alt = `Image of ${siteCode}`;

    const overlay = (
      <Overlay header={siteCode} text={siteText} alt={alt} image={image} toggleOverlay={this.toggleOverlay} />
    );

    this.toggleOverlay();
    this.setOverlay(overlay);
  }

  render() {
    let { error, isLoaded } = this.state;

    let overlay = null;
    if (this.state.overlayOpen) {
      overlay = <OverlayContainer toggleOverlay={this.toggleOverlay}>{this.state.overlay}</OverlayContainer>;
    }

    let extraSidebarStyle = {};
    if (this.state.showSidebar) {
      extraSidebarStyle = { transform: "translateX(0px)" };
    }

    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return (
        <div className={styles.loaderContent}>
          <div className={styles.loaderRing}></div>
        </div>
      );
    } else {
      const liveData = (
        <LiveData
          clearSources={this.clearSources}
          speciesSelector={this.speciesSelector}
          sourceSelector={this.sourceSelector}
          dataStore={this.state.dataStore}
          selectedSources={this.state.selectedSources}
          selectedKeys={this.state.selectedKeys}
          selectedSpecies={this.state.selectedSpecies}
          defaultSpecies={this.state.defaultSpecies}
          setSiteOverlay={this.state.setSiteOverlay}
          siteStructure={this.state.siteStructure}
        />
      );

      return (
        <HashRouter>
          <div className={styles.gridContainer}>
            <div className={styles.header}>
              <Button
                variant="text"
                href="https://catalogue.ceda.ac.uk/uuid/f5b38d1654d84b03ba79060746541e4f"
                target="_blank"
                startIcon={<LaunchIcon />}
                style={{ color: "#97FEED" }}
              >
                Visit DECC Public Data
              </Button>
              <div className={styles.menuIcon}>
                <TextButton styling="light" extraStyling={{ fontSize: "1.6em" }} onClick={this.toggleSidebar}>
                  &#9776;
                </TextButton>
              </div>
            </div>
            <aside className={styles.sidebar} style={extraSidebarStyle}>
              <ControlPanel
                layoutMode={this.state.layoutMode}
                setOverlay={this.setOverlay}
                toggleOverlay={this.toggleOverlay}
                closePanel={this.toggleSidebar}
              >
                <Link to="/" className={styles.navLink}>
                  Live Data
                </Link>
                <Link to="/FAQ" className={styles.navLink}>
                  FAQ
                </Link>
              </ControlPanel>
            </aside>
            <Routes>
              <Route path="/FAQ" element={<FAQ />} />
              <Route path="/" element={liveData} />
            </Routes>
            {overlay}
          </div>
        </HashRouter>
      );
    }
  }
}

export default Dashboard;
