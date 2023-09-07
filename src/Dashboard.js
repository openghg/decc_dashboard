import React from "react";
import { Routes, Route, Link, HashRouter } from "react-router-dom";
import { cloneDeep, has, set, get } from "lodash";
import { Button, MenuItem } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";

import ControlPanel from "./components/ControlPanel/ControlPanel";
import FAQ from "./components/FAQ/FAQ";
import LiveData from "./components/LiveData/LiveData";
import Explainer from "./components/Explainer/Explainer";
import { createSourceKey } from "./util/helpers";
import styles from "./Dashboard.module.css";

import siteDefaults from "./data/defaults.json";

async function retrieveJSON(url) {
  return await (await fetch(url)).json();
}

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    let defaultSite = null;
    let defaultSpecies = null;
    let defaultInlet = null;
    let defaultInstrument = null;
    let defaultNetwork = null;
    let defaultSourceKey = null;

    try {
      defaultSite = siteDefaults["site"];
      defaultSpecies = siteDefaults["species"];
      defaultInlet = siteDefaults["inlet"];
      defaultInstrument = siteDefaults["instrument"];
      defaultNetwork = siteDefaults["network"];
      defaultSourceKey = createSourceKey(defaultSpecies, defaultNetwork, defaultSite, defaultInlet, defaultInstrument);
    } catch (error) {
      console.error("Unable to set defaults.");
    }

    this.state = {
      error: null,
      isLoaded: false,
      showSidebar: false,
      selectedKeys: {},
      emptySelection: true,
      overlayOpen: false,
      overlay: null,
      layoutMode: "dashboard",
      colours: {},
      dataStore: {},
      defaultSite: defaultSite,
      defaultSpecies: defaultSpecies,
      defaultInlet: defaultInlet,
      defaultInstrument: defaultInstrument,
      defaultNetwork: defaultNetwork,
      defaultSourceKey: defaultSourceKey,
    };

    this.dataRepoURL = "https://raw.githubusercontent.com/openghg/temp_data_dashboard/main/";

    this.sourceSelector = this.sourceSelector.bind(this);
    this.toggleOverlay = this.toggleOverlay.bind(this);
    this.setOverlay = this.setOverlay.bind(this);
    this.speciesSelector = this.speciesSelector.bind(this);
    this.clearSources = this.clearSources.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
  }

  // These handle the initial setup of the app

  /**
   * Converts data to the format required by Plotly
   *
   * @param {object} data - Data object
   *
   */
  toPlotly(data) {
    console.log("Processing datas for plotly");
    const x_timestamps = Object.keys(data);
    const x_values = x_timestamps.map((d) => new Date(parseInt(d)));
    const y_values = Object.values(data);

    return {
      x_values: x_values,
      y_values: y_values,
    };
  }

  /**
   * Adds data to the data store, converting it to the structure required by Plotly
   *
   * @param {string} species - Species
   * @param {string} sourceKey - Source key
   * @param {string} data - Data that's been passed through the to_plotly function
   *
   */
  addDataToStore(sourceKey, data) {
    const forPlotly = this.toPlotly(data);
    // Now update the current dataStore with the new data
    this.setState((prevState) => {
      set(prevState.dataStore, sourceKey, forPlotly);
      return prevState;
    });
  }

  /**
   * Retrieves data from the given URL and processes it into a format
   * plotly can read
   *
   * @param {string} sourceKey - Source key
   *
   */
  retrieveData(sourceKey) {
    const filename = get(this.state.filenameLookup, sourceKey, null);
    if (filename === null) {
      console.error(`No filename available for ${sourceKey}`);
      return;
    }

    const currentVal = get(this.state.dataStore, sourceKey);
    if (currentVal !== null) {
      console.log(`We already have data for ${sourceKey}`);
      return;
    }

    const url = new URL(filename, this.dataRepoURL).href;

    console.log(`Retrieving data from ${url}`);
    retrieveJSON(url).then((result) => {
      this.addDataToStore(sourceKey, result);
    });
  }

  /**
   * Create the data structure used to create the plots Plotly can read
   * We create the dataStore object which has the following structure
   *
   *  dataStore = {
   *   "species": {
   *     "network_site_inlet_instrument": {"x_values": [1,2,3], "y_values": [1,2,3]}
   *   }
   * }
   * Only the default source's data will be retrieved, all others will be assigned a null
   */
  populateAndRetrieve(metadata) {
    let defaultSpecies = null;
    let defaultSite = null;
    let defaultInlet = null;
    // Not sure if we need default instrument but
    let defaultNetwork = null;
    // Don't change this, it's handled in the constructor by reading defaults.json
    // otherwise a default is selected from the first
    let defaultSourceKey = this.state.defaultSourceKey;

    // Store the data itself
    let dataStore = {};
    // Store the metadata for each source
    let metaStore = {};
    // Store the structure to allow easy building of the interface dynamically
    let siteStructure = {};
    // Filename lookup for dynamic retrieval
    let filenameLookup = {};

    try {
      for (const [species, networkData] of Object.entries(metadata)) {
        if (defaultSpecies === null) defaultSpecies = species;
        for (const [network, siteData] of Object.entries(networkData)) {
          if (defaultNetwork === null) defaultNetwork = network;
          for (const [site, inletData] of Object.entries(siteData)) {
            if (defaultSite === null) defaultSite = site;
            for (const [inlet, instrumentData] of Object.entries(inletData)) {
              if (defaultInlet === null) defaultInlet = inlet;
              for (const [instrument, fileMetadata] of Object.entries(instrumentData)) {
                // The complete source key should always have the species at the start
                // Then we use the lodash set, get etc commands to easily access the objects
                const completeSourceKey = createSourceKey(species, network, site, inlet, instrument);
                // We'll use this to create a lightweight structure for the creation of the interface
                const nestedSourceKey = `${species}.${network}.${site}.${inlet}.${instrument}`;
                const filepath = fileMetadata["filepath"];
                const sourceMetadata = fileMetadata["metadata"];

                // We don't setState here as we need to use defaultSourceKey below
                // and setState runs asynchronously so may not update the state value by the time
                // we get to where we need it
                if (defaultSourceKey === null) {
                  defaultSourceKey = completeSourceKey;
                }

                set(dataStore, completeSourceKey, null);
                set(metaStore, completeSourceKey, sourceMetadata);
                set(siteStructure, nestedSourceKey, completeSourceKey);
                // Save the filepath in the data repository for each lookup using the source key
                set(filenameLookup, completeSourceKey, filepath);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing raw data - ${error}`);
    }

    // Here we add the data directly as this is on first load
    // We retrieve the data for the default source
    const filepath = get(filenameLookup, defaultSourceKey);
    const url = new URL(filepath, this.dataRepoURL).href;
    console.log("Retrieving default source data from ", url);
    retrieveJSON(url)
      .then((result) => {
        const forPlotly = this.toPlotly(result);
        set(dataStore, defaultSourceKey, forPlotly);
      })
      .then(() => {
        this.setState({ isLoaded: true });
      });

    this.setState({
      dataStore: dataStore,
      metaStore: metaStore,
      siteStructure: siteStructure,
      filenameLookup: filenameLookup,
      defaultSpecies: defaultSpecies,
      selectedSources: new Set([defaultSourceKey]),
      selectedSpecies: defaultSpecies,
      defaultSourceKey: defaultSourceKey,
    });
  }

  componentDidMount() {
    // Retrieve the metadata
    const metadata_filename = "metadata_complete.json";
    const metadataURL = new URL(metadata_filename, this.dataRepoURL);

    retrieveJSON(metadataURL).then(
      (metadata) => {
        this.populateAndRetrieve(metadata);
      },
      (error) => {
        this.setState({
          isLoaded: true,
          error,
        });
      }
    );
  }

  // These handle app control by the components

  /**
   * Selects a data source using a selected sourceKey
   *
   * @param {string} selection - Key for a data source
   */
  sourceSelector(selection) {
    console.log(selection);
    let selectedSourcesSet = new Set();

    if (selection instanceof Set) {
      selectedSourcesSet = selection;
    } else {
      selectedSourcesSet.add(selection);
    }

    // Here we change all the sites and select all species / sectors at that site
    let selectedSources = cloneDeep(this.state.selectedSources);

    for (const sourceKey of selectedSourcesSet) {
      if (selectedSources.has(sourceKey)) {
        selectedSources.delete(sourceKey);
      } else {
        selectedSources.add(sourceKey);
      }
    }

    // Now let's make sure we have all the data for these new selections
    // the source will be the key in the
    for (const sourceKey of selectedSources) {
      this.retrieveData(sourceKey);
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

  /**
   * Selects a species
   *
   * @param {string} species - Species name
   * @param {Set<string>} oldSelectedSources - Set of previously selected sources
   */
  sourceSpeciesChange(species, oldSelectedSources) {
    const speciesData = this.state.dataStore[species];

    let newSources = new Set();

    for (const sourceKey of oldSelectedSources) {
      if (has(speciesData, sourceKey)) {
        newSources.add(sourceKey);
      }
    }

    // Here we want the default key of another species
    if (newSources.size === 0) {
      const defaultSource = Object.keys(speciesData)[0];
      // This just gives us a partial key, we need to add in the species to get
      // a complete sourceKey
      const sourceKey = `${species}.${defaultSource}`;
      newSources.add(sourceKey);
    }

    this.sourceSelector(newSources);
  }

  toggleOverlay() {
    this.setState({ overlayOpen: !this.state.overlayOpen });
  }

  setOverlay(overlay) {
    this.setState({ overlayOpen: true, overlay: overlay });
  }

  /** Toggles the sidebar */
  toggleSidebar() {
    this.setState({ showSidebar: !this.state.showSidebar });
  }

  render() {
    let { error, isLoaded } = this.state;

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
          metaStore={this.state.metaStore}
          siteStructure={this.state.siteStructure}
          selectedSources={this.state.selectedSources}
          selectedKeys={this.state.selectedKeys}
          selectedSpecies={this.state.selectedSpecies}
          defaultSpecies={this.state.defaultSpecies}
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
                <MenuItem styling="light" extrastyling={{ fontSize: "1.6em" }} onClick={this.toggleSidebar}>
                  &#9776;
                </MenuItem>
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
                <Link to="/explainer" className={styles.navLink}>
                  Background
                </Link>
              </ControlPanel>
            </aside>
            <Routes>
              <Route path="/FAQ" element={<FAQ />} />
              <Route path="/" element={liveData} />
              <Route path="/explainer" element={<Explainer />} />
            </Routes>
          </div>
        </HashRouter>
      );
    }
  }
}

export default Dashboard;
