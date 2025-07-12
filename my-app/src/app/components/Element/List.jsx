'use client';
import Bar from "./Desktop/Bar";
import { useState, useEffect } from "react";

const List = ({ list = [], updatePath = "", fetchPath = "", reqList = [], selected, setSelected, handleSelect }) => {
//    const [selected, setSelected] = useState([]);
///    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [displayList, setDisplayList] = useState(list);

    // Keep displayList in sync with parent-provided list (for search/filter)
    useEffect(() => {
        setDisplayList(list);
    }, [list]);

    // Fetch from backend
    const fetchList = async () => {
        try {
            const res = await fetch(fetchPath);
            const data = await res.json();
            setDisplayList(data.data || data); // Adjust if your API returns {data: [...]}
        } catch (err) {
            alert("Failed to fetch list.");
        }
    };

    const CreateList = ({req = []}) => {
        let reqFields = [];

        if (list.length > 0 && req.length === 0) {
            const tempForm = list[0]?.fields;
            for (const [fieldName, fieldObj] of Object.entries(tempForm)) {
                if (fieldObj.visible) {
                    reqFields.push(fieldName);
                }
            }
        }

        if (req.length !== 0) {
            reqFields = req;
        }
    
        const url = list[0]?.fields?.Link != null

        return displayList.map((item, index) => (
            <div key={item.id || index} style={{
                marginBottom: '1.25rem',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <input 
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => handleSelect(item.id)}
                    style={{ marginRight: '0.75rem', accentColor: 'var(--primary)' }} 
                />
                <Bar key={item.id} id={item.id} fields={item.fields} requiredFields={reqFields} routePath={updatePath}/>

                {url && (
                     <button
                        onClick={() => window.open(item.fields.Link.value, '_blank')}
                        style={{
                            marginLeft: '1rem',
                            background: 'none',
                            border: 'none',
                            padding: '0.25rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--button-bg-hover)'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                        title="Open Link"
                    >
                        <img
                            src="/link.svg"
                            alt="Open Link"
                            style={{ width: 24, height: 24, filter: 'var(--icon-filter, none)' }}
                        />
                    </button>
                )}
            </div>
        ));
    };

    return (
        <div>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
            }}>
                {CreateList(reqList)}
            </div>
        </div>
    );
}

export default List;