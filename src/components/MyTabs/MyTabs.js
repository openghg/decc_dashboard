import React, { useState } from "react";
import { Link } from "react-router-dom";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import { DescriptionOutlined, LaunchOutlined, LiveTvOutlined } from "@mui/icons-material";

function MyTabs() {
  const [selectedValue, setSelectedValue] = useState(0); // This takes care of the updated variable name

  const handleChange = (event, newValue) => {
    setSelectedValue(newValue);
  };

  return (
    <Tabs selected={selectedValue} onChange={handleChange} aria-label="icon label tabs example" orientation="vertical">
      <Tab
      style={{color:"white"}}
        icon={<LiveTvOutlined style={{color:"white"}} fontSize="large"/>}
        label="Live Data"
        component={Link}
        to="/"
      />
      <Tab
        style={{color:"white"}}
        icon={<QuizOutlinedIcon style={{color:"white"}} fontSize="large" />}
        label="FAQ"
        component={Link}
        to="/FAQ"
      />
      <Tab
      style={{color:"white"}}
        icon={<DescriptionOutlined style={{color:"white"}} fontSize="large" />}
        label="Synopsis"
        component={Link}
        to="/explainer"
      />
      <Tab 
      style={{color:"white"}}
      label="Visit DECC data"
      component={'a'}
      href="https://catalogue.ceda.ac.uk/uuid/f5b38d1654d84b03ba79060746541e4f"
      target="_blank"
      icon={<LaunchOutlined fontSize="large" />}/>
      
    </Tabs>
  );
}

export default MyTabs;
