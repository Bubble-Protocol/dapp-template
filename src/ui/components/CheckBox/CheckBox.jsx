import PropTypes from "prop-types";
import React from "react";
import "./style.css";

export const CheckBox = ({ className, setSelected, selected=false, disabled=false }) => {
  return (
    <>
      <div className={'checkbox ' + (selected ? 'selected ' : '') + (className || '')} onClick={() => !disabled && setSelected(!selected)}>{selected ? '✓' : ''}</div>
    </>
  );
};

CheckBox.propTypes = {
  selected: PropTypes.bool,
  setSelected: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};
