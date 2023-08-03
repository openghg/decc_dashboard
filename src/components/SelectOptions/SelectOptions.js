import React from "react";
import { Select as MuiSelect, MenuItem, FormControl, InputLabel } from "@mui/material";

class Select extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      speciesLabels: {},
    };
    this.onChangeValue = this.onChangeValue.bind(this);
  }

  componentDidMount() {
    // Fetch the speciesLabels.json file and store the data in state
    fetch("/speciesLabels.json")
      .then((response) => response.json())
      .then((data) => this.setState({ speciesLabels: data }))
      .catch((error) => console.error("Error fetching speciesLabels:", error));
  }

  onChangeValue(event) {
    this.props.onChange(event.target.value);
  }

  getLabelForOption(option) {
    const optionUpper = option.toUpperCase();
    const { speciesLabels } = this.state;
    return speciesLabels[optionUpper] || optionUpper;
  }

  render() {
    return (
      <FormControl variant="standard">
        <InputLabel>Select an option</InputLabel>
        <MuiSelect
          value={this.props.selected}
          onChange={this.onChangeValue}
          label="Species"
        >
          {this.props.options.map((option) => {
            const label = this.getLabelForOption(option);
            return (
              <MenuItem key={option} value={option}>
                {label}
              </MenuItem>
            );
          })}
        </MuiSelect>
      </FormControl>
    );
  }
}

export default Select;
