'use client';
import React from "react";

const FilterCard = ({ booleanFields = [], filters, setFilters }) => {
  const containerStyle = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    background: 'var(--button-bg)',
    border: '2px solid var(--border)',
    borderRadius: '8px',
    padding: '16px',
    zIndex: 100,
    minWidth: '280px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  };

  const fieldRowStyle = {
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle = {
    fontWeight: "bold",
    marginBottom: '8px'
  };

  // Change container to vertical stack
  const optionsContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
  };

  const optionStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px'
  };

  const radioLabelStyle = {
    marginLeft: '4px',
    whiteSpace: 'nowrap'
  };

  const handleRadioChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={containerStyle}>
      {booleanFields.map(field => (
        <div key={field} style={fieldRowStyle}>
          <div style={labelStyle}>{field.replace(/_/g, " ")}</div>
          <div style={optionsContainerStyle}>
            <div style={optionStyle}>
              <input
                type="radio"
                name={field}
                value="both"
                checked={filters[field] === "both"}
                onChange={() => handleRadioChange(field, "both")}
              />
              <span style={radioLabelStyle}>Both</span>
            </div>
            <div style={optionStyle}>
              <input
                type="radio"
                name={field}
                value="true"
                checked={filters[field] === "true"}
                onChange={() => handleRadioChange(field, "true")}
              />
              <span style={radioLabelStyle}>Only {field}</span>
            </div>
            <div style={optionStyle}>
              <input
                type="radio"
                name={field}
                value="false"
                checked={filters[field] === "false"}
                onChange={() => handleRadioChange(field, "false")}
              />
              <span style={radioLabelStyle}>Only not {field}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilterCard;