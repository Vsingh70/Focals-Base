'use client';
import { useState, useEffect, useCallback } from "react";
import DesktopBar from "../components/DesktopBar";
import List from "../components/Element/List";
import { useGetForm } from "@/utils/api";

export default function TestPage() {
  const [shoots, setShoots] = useState([]);
  const [filteredShoots, setFilteredShoots] = useState([]);

  const { data: forms, loading, error } = useGetForm();

  // Sync API data to state
  useEffect(() => {
    if (forms?.data) {
      setShoots(forms.data);
      setFilteredShoots(forms.data);
    }
  }, [forms?.data]);

  // This will be called by the SearchBar (via DesktopBar)
  const handleSearchResults = useCallback((results) => {
    setFilteredShoots(results);
  }, []);

  //console.log('Forms:', forms?.data);

  //console.log('Filtered Shoots:', filteredShoots);
  //<List list={forms?.data} updatePath="/api/shoots/update-shoots" deletePath="/api/shoots/delete-shoots" fetchPath="/api/shoots/get-shoots" /> 

  return (
    <div>
      <DesktopBar Title="Test" Search={true} Filter={true} Add="true" AddText="Edit Form" AddLink="/edit-form" Input={shoots} update={handleSearchResults} />
        <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center'}}>
          <List list={filteredShoots} updatePath="/api/forms/update-form" deletePath="/api/forms/delete-forms" fetchPath="/api/forms/get-form" />
      </div>
    </div>
  );
}