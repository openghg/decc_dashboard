import React from "react";
import { Switch, Route, Link, HashRouter } from "react-router-dom";
// import { schemeTableau10, schemeSet3, schemeDark2, schemeAccent } from "d3-scale-chromatic";
import { cloneDeep, has, set, uniqueId } from "lodash";

import ControlPanel from "./components/ControlPanel/ControlPanel";
import OverlayContainer from "./components/OverlayContainer/OverlayContainer";

import TextButton from "./components/TextButton/TextButton";
import Overlay from "./components/Overlay/Overlay";
import FAQ from "./components/FAQ/FAQ";
import LiveData from "./components/LiveData/LiveData";
import Explainer from "./components/Explainer/Explainer";

import chroma from "chroma-js";

import { importSiteImages } from "./util/helpers";
import styles from "./Dashboard.module.css";

// Site description information
import siteInfoJSON from "./data/siteInfo.json";
import bsdInlets from "./data/bsd_inlets.json";

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      isLoaded: false,
      showSidebar: false,
      selectedDate: 0,
      processedData: {},
      dataKeys: {},
      selectedKeys: {},
      footprintView: true,
      emptySelection: true,
      overlayOpen: false,
      overlay: null,
      plotType: "footprint",
      layoutMode: "dashboard",
      colours: {},
    };

    // Build the site info for the overlays
    this.buildSiteInfo();

    // Select the data
    this.dataSelector = this.dataSelector.bind(this);
    // Selects the dates
    this.siteSelector = this.siteSelector.bind(this);
    this.toggleOverlay = this.toggleOverlay.bind(this);
    this.setOverlay = this.setOverlay.bind(this);
    this.speciesSelector = this.speciesSelector.bind(this);
    this.clearSites = this.clearSites.bind(this);
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

  siteSelector(selectedSite) {
    // This controls the selection of the data sources
    let selectedSiteSet = new Set();

    if (selectedSite instanceof Set) {
      selectedSiteSet = selectedSite;
    } else {
      selectedSiteSet.add(selectedSite);
    }

    // // Here we change all the sites and select all species / sectors at that site
    let selectedSites = cloneDeep(this.state.selectedSites);

    for (const site of selectedSiteSet) {
      if (selectedSites.has(site)) {
        selectedSites.delete(site);
      } else {
        selectedSites.add(site);
      }
    }

    // Now update the selectedKeys so each selected site has all its
    // keys set to true
    let selectedKeys = cloneDeep(this.state.selectedKeys);

    for (const [species, speciesData] of Object.entries(selectedKeys)) {
      for (const [network, networkData] of Object.entries(speciesData)) {
        for (const [site, sectorData] of Object.entries(networkData)) {
          const value = selectedSites.has(site);
          for (const dataVar of Object.keys(sectorData)) {
            selectedKeys[species][network][site][dataVar] = value;
          }
        }
      }
    }

    this.setState({ selectedKeys: selectedKeys, selectedSites: selectedSites });
  }

  clearSites() {
    this.setState({ selectedSites: new Set() });
  }

  speciesSelector(species) {
    const speciesLower = species.toLowerCase();
    const selectedSitesClone = cloneDeep(this.state.selectedSites);

    this.setState({ selectedSites: new Set() }, () => {
      this.siteSpeciesChange(species, selectedSitesClone);
    });

    this.setState({ selectedSpecies: speciesLower });
  }

  siteSpeciesChange(species, oldSelectedSites) {
    // We want to select a site that has data for this species and show that
    const processedData = this.state.processedData;
    const speciesData = this.state.processedData[species];

    let newSites = new Set();
    for (const networkData of Object.values(speciesData)) {
      for (const site of oldSelectedSites) {
        if (has(networkData, site)) {
          newSites.add(site);
        }
      }
    }

    if (newSites.size === 0) {
      const network = Object.keys(processedData[species]).sort()[0];
      const site = Object.keys(processedData[species][network]).sort()[0];
      newSites.add(site);
    }

    this.siteSelector(newSites);
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

  processData(rawData) {
    // Process the data and create the correct Javascript time objects
    // expected by plotly
    let dataKeys = {};
    let processedData = {};
    let metadata = {};

    let defaultNetwork = Object.keys(rawData).sort()[0];
    let defaultSpecies = Object.keys(rawData[defaultNetwork]).sort()[0];
    let defaultSite = Object.keys(rawData[defaultNetwork][defaultSpecies]).sort()[0];

    // site, inlet, instrument
    let colourMapping = {};
    let nColoursNeeded = 0;

    try {
      for (const [network, networkData] of Object.entries(rawData)) {
        for (const [species, speciesData] of Object.entries(networkData)) {
          for (const [site, siteData] of Object.entries(speciesData)) {
            set(uniqueId, `${network}.${site}`, null);
            const defaultValue = site === defaultSite;

            for (const [instrument, instrumentData] of Object.entries(siteData)) {
              for (const [inlet, gasData] of Object.entries(instrumentData)) {
                // Build the colourMapping object so we can create colours for each data source

                set(colourMapping, `${site}.${inlet}.${instrument}`, null);
                nColoursNeeded++;

                for (const [dataVar, data] of Object.entries(gasData)) {
                  if (dataVar === "data") {
                    const speciesLower = species.toLowerCase();

                    // Use lodash set to create the nested structure
                    set(dataKeys, `${species}.${network}.${site}.${inlet}.${instrument}.${speciesLower}`, defaultValue);

                    // We need to use speciesLower here as we've exported the variables
                    // from a pandas Dataframe and may want errors etc in the future
                    const timeseriesData = data[speciesLower];
                    const x_timestamps = Object.keys(timeseriesData);
                    const x_values = x_timestamps.map((d) => new Date(parseInt(d)));
                    // Measurement values
                    const y_values = Object.values(timeseriesData);

                    const graphData = {
                      x_values: x_values,
                      y_values: y_values,
                    };

                    set(
                      processedData,
                      `${species}.${network}.${site}.${inlet}.${instrument}.${speciesLower}`,
                      graphData
                    );
                  } else if (dataVar === "metadata") {
                    set(metadata, `${species}.${network}.${site}`, data);
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error reading data: ", error);
    }

    // Only expecting three networks so use these for now
    // const colourMaps = [schemeTableau10, schemeSet3, schemeDark2];
    // const cool_greens = chroma.scale(["#fafa6e", "#2A4858"]).mode("lch").colors(12);
    // const blue_purple = chroma.scale(["#ffbb44", "#902ac7"]).mode("lch").colors(12);

    // Colour tuples for use with Chroma
    const colour_start_end = [
      ["#f94144", "#577590"],
      ["#d9ed92", "#184e77"],
      ["#fafa6e", "#2A4858"],
      ["#264653", "#e76f51"],
    ];

    // https://coolors.co/264653-2a9d8f-e9c46a-f4a261-e76f51
    // https://coolors.co/f94144-f3722c-f8961e-f9c74f-90be6d-43aa8b-577590
    // https://coolors.co/f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1
    // ["d9ed92","b5e48c","99d98c","76c893","52b69a","34a0a4","168aad","1a759f","1e6091","184e77"]

    // Assign some colours for the sites
    let siteIndex = 0;
    let networkIndex = 0;
    let siteColours = {};

    for (const [site, siteData] of Object.entries(colourMapping)) {
      for (const [inlet, inletData] of Object.entries(siteData)) {
        for (const [instrument, val] of Object.entries(inletData)) {
          // Let's say we get 8 good colours from a single range
          siteColours[site][inlet][instrument] = "#fff";
        }
      }
    }

    // // Set colours for each of the inlets/instrument/site
    // for (const [network, localSiteData] of Object.entries(processedData)) {
    //   const nSites = Object.keys(localSiteData).length;
    //   const start_end = colour_start_end[networkIndex];
    //   const colorMap = chroma.scale(start_end).mode("lch").colors(nSites);
    //   for (const site of Object.keys(localSiteData)) {
    //     const colourCode = colorMap[siteIndex];
    //     set(siteColours, `${network}.${site}`, colourCode);
    //     siteIndex++;
    //   }
    //   networkIndex++;
    //   siteIndex = 0;
    // }

    // Disabled the no direct mutation rule here as this only gets called from the constructor
    /* eslint-disable react/no-direct-mutation-state */
    // Give each site a colour
    this.state.defaultSpecies = defaultSpecies;
    this.state.defaultSite = defaultSite;
    this.state.selectedSites = new Set([defaultSite]);
    this.state.selectedSpecies = defaultSpecies;
    this.state.colours = siteColours;
    this.state.processedData = processedData;
    this.state.selectedKeys = dataKeys;
    this.state.metadata = metadata;
    this.state.isLoaded = true;
    /* eslint-enable react/no-direct-mutation-state */
  }

  dataSelector(dataKeys) {
    this.setState({ selectedKeys: dataKeys });
  }

  componentDidMount() {
    this.processData(bsdInlets);
    this.setState({ isLoaded: true });
    // const apiURL = "https://raw.githubusercontent.com/openghg/dashboard_data/main/combined_data.json";
    // fetch(apiURL)
    //   .then((res) => res.json())
    //   .then(
    //     (result) => {
    //       this.processData(result);
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

  updateSites(selectedSpecies) {
    // Update the sites shown on the map so only sites with data for the selected species are shown.
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
      return (
        <HashRouter>
          <div className={styles.gridContainer}>
            <div className={styles.header}>
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
                <Link to="/explainer" className={styles.navLink}>
                  Explainer
                </Link>
                <Link to="/FAQ" className={styles.navLink}>
                  FAQ
                </Link>
              </ControlPanel>
            </aside>
            <Switch>
              <Route path="/explainer">
                <Explainer speciesSelector={this.speciesSelector} />
              </Route>
              <Route path="/FAQ">
                <FAQ />
              </Route>
              <Route path="/">
                <LiveData
                  dataSelector={this.dataSelector}
                  clearSites={this.clearSites}
                  speciesSelector={this.speciesSelector}
                  siteSelector={this.siteSelector}
                  selectedKeys={this.state.selectedKeys}
                  processedData={this.state.processedData}
                  selectedSites={this.state.selectedSites}
                  selectedSpecies={this.state.selectedSpecies}
                  defaultSpecies={this.state.defaultSpecies}
                  colours={this.state.colours}
                  setSiteOverlay={this.state.setSiteOverlay}
                  metadata={this.state.metadata}
                />
              </Route>
            </Switch>
            {overlay}
          </div>
        </HashRouter>
      );
    }
  }
}

export default Dashboard;
