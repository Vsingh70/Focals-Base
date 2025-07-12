'use client';

import Sidebar from "./Sidebar/Side";
import Navbar from "./Navbar/Navbar";

const DesktopBar = ({ Title = "",
                    Add = false,
                    AddText = "", 
                    AddLink = "",
                    Filter = false,
                    Search = false,
                    Input = [],
                    update = null,
                    SubmitButton = null,
                    Submit = false,
                    DeleteButton = null,
                    Delete = false,
                MiddleText = null,
                    Middle = false }) => {
    return (
        <span>
            <Navbar 
                Title={Title} 
                Add={Add} 
                AddText={AddText} 
                AddLink={AddLink} 
                Filter={Filter} 
                Search={Search} 
                Input={Input} 
                update={update}
                SubmitButton={SubmitButton}
                Submit={Submit}
                DeleteButton={DeleteButton}
                Delete={Delete}
                MiddleText={MiddleText}
                Middle={Middle}
            />

            <Sidebar  />
        </span>
    );
};

export default DesktopBar;