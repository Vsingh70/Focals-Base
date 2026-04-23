'use client';
import DesktopBar from "@/app/components/DesktopBar";
import { useState, useEffect } from "react";
import { useGetLinks, useInsertLink, useGetProjects } from "@/utils/api";
import { assignType } from "@/utils/types";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import Toast from "@/app/components/toast";

export default function AddPage() {    
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const defaultFields = {
        Link: { type: "url", value: "", visible: false },
        Name: { type: "text", value: "", visible: true },
        Category: { type: "text", value: "", visible: false },
        Projects: { type: "list", value: [], visible: false }
    };
    const { mutate: insertLink, loading, err, data } = useInsertLink();
    const { data: linksData } = useGetLinks();
    const { data: projectsData } = useGetProjects();
    const [existingNames, setExistingNames] = useState([]);
    const [existingCategories, setExistingCategories] = useState([]);
    useEffect(() => {
        if (linksData?.data) {
            setExistingNames(linksData.data.map(link => link.fields.Name?.value));
        }
    }, [linksData]);
    
    useEffect(() => {
        // Collect categories from linksData
        const linkCategories = Array.isArray(linksData?.data)
            ? linksData.data
                .map(link => link.fields?.Category?.value)
                .filter(cat => cat && cat.trim() !== "")
                .map(cat => cat.toLowerCase())
            : [];

        // Collect categories from projectsData
        const projectCategories = Array.isArray(projectsData?.data)
            ? projectsData.data
                .map(project => project.fields?.Category?.value)
                .filter(cat => cat && cat.trim() !== "")
                .map(cat => cat.toLowerCase())
            : [];

        // Combine and deduplicate
        const allCategories = Array.from(new Set([...linkCategories, ...projectCategories]));

        setExistingCategories(allCategories);
    }, [linksData, projectsData]);

    const projectOptions = Array.isArray(projectsData?.data)
    ? projectsData.data.map(project => ({
        value: project.id, // store uuid
        label: `${project.fields?.Name.value || 'Unnamed'} (${project.fields?.Category.value || 'No Category'}) - ${assignType(project.fields?.Date.value, "date") || 'No Date'}`
        }))
    : [];
    
    const categoryOptions = existingCategories.map(cat => ({
        value: cat,
        label: cat
    }));
    const [fields, setFields] = useState(defaultFields);
    const [error, setError] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [message, setMessage] = useState("");
    
    const handleChange = (field, value) => {
        setFields(prev => ({
            ...prev,
            [field]: { ...prev[field], value }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        const name = fields.Name.value.trim();
        const link = fields.Link.value.trim();

        if (!name || !link) {
            setMessage("Name and Link are required.");
            setShowToast(true);
            return;
        }
        if (existingNames.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
            setMessage("Name must be unique.");
            setShowToast(true);
            return;
        }
        // Insert the link into the table
        insertLink(fields);
        if (!loading) {
            setExistingNames([...existingNames, name]);
            setMessage("Link added!");
            setShowToast(true);
            setFields(defaultFields);
        }
    };
    
    const smallInput = {
        padding: '0.5rem',
        height: '3.36rem',
        background: 'var(--button-bg)',
        color: 'var(--text)',
        border: '2px solid var(--border)',
        borderRadius: '8px',
        fontWeight: 'semi-bold',
        fontSize: '1rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'background 0.2s',
    };

    const SubmitButton = () => {
        return (
            <form onSubmit={handleSubmit}>
                    <button 
                        type="submit" 
                        style={{
                        padding: '10px 24px',
                        fontSize: '1rem',
                        background: 'var(--button-bg)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        borderRadius: '8px',
                        color: 'var(--primary)',
                        border: '2px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                    }}
                    >
                        Add Link
                    </button>
            </form>
        );
    };

    return (
        <div>
            <DesktopBar 
                Title="Add New Link"
                update={null}
                Submit={true}
                SubmitButton={SubmitButton}
                DeleteButton={null}
                Delete={false}
            />
            <div className="main-content">
                {showToast && (
                    <Toast 
                        Message={message} 
                        close={() => setShowToast(false)}
                        duration={2000} // Optional: custom duration
                    />
                )}
                <form onSubmit={handleSubmit} style={{margin: "2rem auto" }}>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                    {/* Name Field */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <label style={{
                            color: 'var(--text)',
                            marginBottom: '0.5rem',
                            fontSize: '1.1rem'
                        }}>
                            Name<span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={fields.Name.value}
                            placeholder="Type your link's name"
                            onChange={e => handleChange("Name", e.target.value)}
                            required
                            style={smallInput}
                            onMouseOver={e => {
                                e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                            }}
                        />
                    </div>
                    {/* Category Field */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <label style={{
                            color: 'var(--text)',
                            marginBottom: '0.5rem',
                            fontSize: '1.1rem'
                        }}>
                            Category
                        </label>
                        {isClient && <CreatableSelect
                            options={categoryOptions}
                            value={fields.Category.value ? { value: fields.Category.value, label: fields.Category.value } : null}
                            onChange={option => handleChange("Category", option ? option.value : "")}
                            isClearable
                            isSearchable
                            placeholder="Select or type a category"
                            styles={{
                                container: base => ({ ...base, width: '100%' }),
                                control: (base) => ({
                                    ...base,
                                    background: 'var(--button-bg)',
                                    color: smallInput.color,
                                    border: smallInput.border,
                                    borderRadius: smallInput.borderRadius,
                                    fontWeight: smallInput.fontWeight,
                                    fontSize: smallInput.fontSize,
                                    boxShadow: smallInput.boxShadow,
                                    transition: smallInput.transition,
                                    minHeight: 'unset',
                                    padding: smallInput.padding,
                                    borderColor: smallInput.border,
                                        ':hover': {
                                        transition: 'background 0.2s',
                                        backgroundColor: 'var(--button-bg-hover)',
                                        color: 'var(--primary)',
                                        border: '2px solid var(--border)',
                                        borderRadius: '8px',
                                    },
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: 'var(--text)', // or any color you want
                                }),
                                menu: base => ({
                                    ...base,
                                    zIndex: 9999,
                                    background: 'var(--button-bg)',
                                    border: '2px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                }),
                                option: (base) => ({
                                    ...base,
                                    background: 'var(--button-bg)',
                                    color: 'var(--text)',
                                    cursor: 'pointer',
                                    fontWeight: 'normal',
                                    ':hover': {
                                        backgroundColor: 'var(--button-bg-hover)',
                                        transition: 'background 0.2s',
                                    },
                                }),
                                menu: base => ({
                                    ...base,
                                    zIndex: 9999,
                                    background: 'var(--button-bg)',
                                    border: '2px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    background: state.isFocused
                                        ? 'var(--button-bg-hover)'
                                        : 'var(--button-bg)',
                                    color: 'var(--text)',
                                    cursor: 'pointer',
                                    fontWeight: state.isSelected ? 'bold' : 'normal',
                                }),
                            }}
                        /> }
                    </div>
                </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: "1.25rem" }}>
                        <label style={{
                            color: 'var(--text)',
                            marginTop: '1rem',
                            marginBottom: '0.5rem',
                            fontSize: '1.1rem'
                        }}>
                            Link<span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                            type="url"
                            placeholder="Type or paste a link"
                            value={fields.Link.value}
                            onChange={e => handleChange("Link", e.target.value)}
                            required
                            style={{...smallInput, width: '100%'}}
                            onMouseOver={e => {
                                e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: "1.25rem" }}>
                        <label style={{
                            color: 'var(--text)',
                            marginBottom: '0.5rem',
                            fontSize: '1.1rem'
                        }}>
                            Projects (select one or more)
                        </label>
                        { isClient && <Select
                            isMulti
                            options={projectOptions}
                            value={projectOptions.filter(opt => fields.Projects.value.includes(opt.value))}
                            onChange={selectedOptions =>
                            handleChange("Projects", selectedOptions ? selectedOptions.map(opt => opt.value) : [])
                            }
                            placeholder="Select projects"
                            styles={{
                            container: base => ({ ...base, width: '100%' }),
                            control: (base) => ({
                                ...base,
                                background: smallInput.background,
                                color: smallInput.color,
                                border: smallInput.border,
                                borderRadius: smallInput.borderRadius,
                                fontWeight: smallInput.fontWeight,
                                fontSize: smallInput.fontSize,
                                boxShadow: smallInput.boxShadow,
                                transition: smallInput.transition,
                                minHeight: 'unset',
                                padding: smallInput.padding,
                                borderColor: smallInput.border,
                                ':hover': {
                                    transition: 'background 0.2s',
                                    backgroundColor: 'var(--button-bg-hover)',
                                    color: 'var(--primary)',
                                    border: '2px solid var(--border)',
                                    borderRadius: '8px',
                                },
                            }),
                            menu: base => ({
                                ...base,
                                zIndex: 9999,
                                background: 'var(--button-bg)',
                                border: '2px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--text)',
                                fontSize: '1rem',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            }),
                            option: (base) => ({
                                ...base,
                                background: 'var(--button-bg)',
                                color: 'var(--text)',
                                cursor: 'pointer',
                                fontWeight: 'normal',
                                ':hover': {
                                    backgroundColor: 'var(--button-bg-hover)',
                                    transition: 'background 0.2s',
                                },
                            }),
                            multiValue: base => ({
                                ...base,
                                backgroundColor: 'var(--button-bg-hover)',
                                borderRadius: '4px',
                                border: '2px solid var(--border)',
                            }),
                            multiValueLabel: base => ({
                                ...base,
                                color: 'var(--text)',
                            }),
                            multiValueRemove: base => ({
                                ...base,
                                color: 'var(--text)',
                                ':hover': {
                                    backgroundColor: 'var(--button-bg-hover)',
                                    color: 'var(--primary)',
                                },
                            }),
                            }}
                        /> }
                        </div>
                </form>
            </div>
        </div>
    );
}