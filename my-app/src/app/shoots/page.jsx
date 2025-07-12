'use client';
import { useState, useEffect, useCallback } from "react";
import DesktopBar from "../components/DesktopBar";
import List from "../components/Element/List";

export default function ShootsPage() {
  const [shoots, setShoots] = useState([]);
  const [filteredShoots, setFilteredShoots] = useState([]);

  const update = useCallback((results) => {
    setFilteredShoots(results);
  }
, []);

  useEffect(() => {
    fetch('/api/shoots/get-shoots')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setShoots(json.data);
          setFilteredShoots(json.data);
        } else {
          console.error('API error:', json.error);
        }
      })
      .catch(error => console.error('Fetch error:', error));
  }, []);

  return (
    <div>
      <DesktopBar Title="Test" Search="true" Filter="true" Add="true" AddText="+ Add Shoot" AddLink="/add" Input={shoots} update={update} />
        <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center'}}>
        <List list={filteredShoots} updatePath="/api/shoots/update-shoots" deletePath="/api/shoots/delete-shoots" fetchPath="/api/shoots/get-shoots" />
      </div>
    </div>
  );
}