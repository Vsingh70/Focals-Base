'use client'
import { useEffect, useState } from "react"
import { insert_shoots } from "./insertShoots.js"
import { createClient } from "@/utils/supabase/client.js"



export default function shoots(){
  const [shoots_data, setShoots] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShoots = async () => {
      const res = await fetch('/api/get-shoots');
      const { data, error } = await res.json();
      if (error) setError(error);
      else setShoots(data);
    };

    fetchShoots();
  }, []);
  return (<div><div>
      <header>
        <h1>Shoots</h1>
      </header>

      {shoots_data? 
        <div>
          
          <p>{JSON.stringify(shoots_data)}</p> 
          
        </div>
        : <p>no</p> }


      <div styles="display: flex; flex-direction: column;">
        <form action={insert_shoots}>
          <div className="placeholder">
            <label>Date</label>
            <input id="date" name="date" type="date"></input>
          </div>

          <div className="placeholder">
            <label>time</label>
            <input id="time" name="time" type="time"></input>
          </div>

          <div className="placeholder">
            <label>client</label>
            <input id="client" name="client" type="text"></input>
          </div>

          <div className="placeholder">
            <label>genre</label>
            <input id="genre" name="genre" type="text"></input>
          </div>

          <div className="placeholder">
            <label>editLink</label>
            <input id="editLink" name="editLink" type="url"></input>
          </div>

          <div className="placeholder">
            <label>clientMoodBoardLink</label>
            <input id="clientMoodBoardLink" name="clientMoodBoardLink" type="url"></input>
          </div>

          <div className="placeholder">
            <label>location</label>
            <input id="location" name="location" type="text"></input>
          </div>

          <div className="placeholder">
            <label>notes</label>
            <input id="notes" name="notes" type="text"></input>
          </div>


{/* This is supposed to be an array, so we need to add a button that adds
    more input boxes when ever pressed*/}
          <div className="placeholder">
            <label>contactinfo</label>
            <input id="contactinfo" name="contactinfo" type="text"></input>
          </div>

          <div className="placeholder">
            <label>finishedEditing</label>
            <input id="finishedEditing" name="finishedEditing" type="checkbox"></input>
          </div>

          <div className="placeholder">
            <label>pay</label>
            <input id="pay" name="pay" type="pay"></input>
          </div>

          <div className="placeholder">
            <label>paid</label>
            <input  id="paid" name="paid" type="checkbox"></input>
          </div>
          <button>Submit</button>
        </form>
      </div>
    </div>

  </div>)
}