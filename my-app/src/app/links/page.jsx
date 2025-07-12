'use client';
import DesktopBar from "../components/DesktopBar";
import List from "../components/Element/List";
import { useState, useEffect, useCallback } from "react";
import { useGetLinks } from "@/utils/api";
import DeleteSelectedButton from "../components/Navbar/DeleteSelectedButton";
import DeletePopUpCard from "../components/Navbar/Filter/DeletePopUpCard";
import Toast from "../components/toast";

export default function LinksPage() {
    const [links, setLinks] = useState([]);
    const [filteredLinks, setFilteredLinks] = useState([]);
    const [selected, setSelected] = useState([]);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [message, setMessage] = useState("");


    const { data: linksData, loading, error } = useGetLinks();

    // Sync API data to state
    useEffect(() => {
        if (linksData?.data) {
            setLinks(linksData.data);
            setFilteredLinks(linksData.data);
        }
    }, [linksData?.data]);

    // This will be called by the SearchBar (via DesktopBar)
    const handleSearchResults = useCallback((results) => {
        setFilteredLinks(results);
    }, []);

    const handleSelect = (id) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        try {
            await Promise.all(selected.map(async (id) => {
                await fetch(`/api/links/delete-link?id=${id}`, {
                    method: 'DELETE',
                });
            }));
            setLinks(prev => prev.filter(link => !selected.includes(link.id)));
            setFilteredLinks(prev => prev.filter(link => !selected.includes(link.id)));
            setSelected([]);
            setMessage("Selected links deleted");
            setShowToast(true);
        } catch (err) {
            setMessage('Failed to delete selected items.');
            setShowToast(true);
        }
    };

    const NewDeleteButton = () => {
        return (
            <DeleteSelectedButton selected={selected} setShowDeletePopup={setShowDeletePopup}/>
        );
    }

    return (
        <div>
            <DesktopBar Title="Links"
            Search={true}
            Add={true}
            AddText="+ Add Link"
            AddLink="/add"
            Input={links}
            update={handleSearchResults}
            Delete={true}
            DeleteButton={NewDeleteButton}
            />
            <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <DeletePopUpCard
                    trigger={showDeletePopup}
                    setTrigger={setShowDeletePopup}
                    onConfirm={handleDeleteSelected}
                />
                {showToast && (
                    <Toast 
                        Message={message} 
                        close={() => setShowToast(false)}
                        duration={2000} // Optional: custom duration
                    />
                )}
                <List list={filteredLinks}
                updatePath="/api/links/update-link"
                fetchPath="/api/links/get-links"
                reqList={[]}
                selected={selected}
                setSelected={setSelected}
                handleSelect={handleSelect} />
            </div>
        </div>
    );
};``