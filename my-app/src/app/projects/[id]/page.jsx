'use client';
import DesktopBar from "@/app/components/DesktopBar";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useGetProject, useGetForm, useGetLinks, useUpdateProject, useGetProjects, useUpdateLink } from "@/utils/api";
import { createInput, placeHolder } from "@/utils/types";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import makeAnimated from 'react-select/animated';
import Toast from "@/app/components/toast";

const defaultFields = {
    "Pay": {
        "type": "currency",
        "visible": true,
        "value": ""
    },
    "Date": {
        "type": "date",
        "visible": true,
        "value": ""
    },
    "Name": {
        "type": "text",
        "visible": true,
        "value": ""
    },
    "Category": {
        "type": "text",
        "visible": true,
        "value": ""
    },
    "Expenses": {
        "type": "currency",
        "visible": false,
        "value": ""
    },
    "Expenses Paid": {
        "type": "boolean",
        "visible": false,
        "value": false
    },
    "Payment Received": {
        "type": "boolean",
        "visible": true,
        "value": false
    }
};

export default function Page() {
    const [isClient, setIsClient] = useState(false);
        useEffect(() => {
            setIsClient(true);
        }, []);
    
    const { id } = useParams();

    const { data: project, isLoading: isProjectLoading } = useGetProject(id);
    const { data: form } = useGetForm();
    const { data: links } = useGetLinks();
    const { data: projects } = useGetProjects();
    const { mutate: updateProject } = useUpdateProject();
    const { mutate: updateLink } = useUpdateLink();

    const [existingNames, setExistingNames] = useState([]);
    const [selectedLinks, setSelectedLinks] = useState([]);
    const [fields, setFields] = useState(defaultFields);
    const [formFields, setFormFields] = useState([]);
    const [boolFields, setBoolFields] = useState([]);
    const [existingCategories, setExistingCategories] = useState([]);
    const [showToast, setShowToast] = useState(false);
    const [message, setMessage] = useState("");
    
    const animatedComponents = makeAnimated();

    useEffect(() => {
        if (project?.data?.fields) {
            setFields(project.data.fields);
        } 
    }, [project]);

    // Set default selected links based on which links contain this project's ID
    useEffect(() => {
        if (links?.data && id) {
            const connectedLinkIds = links.data
                .filter(link => 
                    Array.isArray(link?.fields?.Projects?.value) &&
                    link.fields.Projects.value.includes(id)
                )
                .map(link => link.id);
            setSelectedLinks(connectedLinkIds);
        }
    }, [links, id]);

    // Gather all form fields that are not in defaultFields
    useEffect(() => {
        if (form?.data && project?.data?.fields) {
            const defaultKeys = Object.keys(defaultFields);
            const extraFields = Object.entries(form.data.fields)
                .filter(([key]) => !defaultKeys.includes(key))
                .map(([key, value]) => {
                    // Use the value from the project if it exists, otherwise use the form template
                    const projectField = project.data.fields[key];
                    return {
                        key,
                        ...value,
                        value: projectField?.value ?? value.value,
                        visible: projectField?.visible ?? value.visible,
                    };
                });

            const bools = extraFields.filter(field => field.type === "boolean");
            const others = extraFields.filter(field => field.type !== "boolean");

            setBoolFields(bools);
            setFormFields(others);
        }
    }, [form, project]);
    
    // Gather existing project names
    useEffect(() => {
        if (projects?.data && project?.data?.fields?.Name?.value) {
            const currentName = project.data.fields.Name.value;
            setExistingNames(
                projects.data
                    .map(p => p.fields.Name?.value)
                    .filter(name => name && name !== currentName)
            );
        }
    }, [projects, project]);

    // Collect categories from existing projects
        useEffect(() => {
            if (projects?.data) {
                setExistingCategories(Array.from(new Set(
                    projects.data
                        .map(project => project.fields.Category?.value)
                        .filter(cat => cat && cat.trim() !== "")
                        .map(cat => cat.toLowerCase())
                )));
            }
    }, [projects]);

    const linkOptions = Array.isArray(links?.data)
            ? links.data.map(link => ({
                value: link.id,
                label: `${link.fields?.Name.value || 'Unnamed'} (${link.fields?.Category.value || ''})`
            }))
    : [];
    
    const categoryOptions = existingCategories.map(cat => ({
        value: cat,
        label: cat
    }));

    const handleChange = (field, value) => {
        setFields(prev => ({
            ...prev,
            [field]: { ...prev[field], value }
        }));
    };

    const handleLinksChange = (selectedOptions) => {
        setSelectedLinks(selectedOptions ? selectedOptions.map(opt => opt.value) : []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = fields.Name.value.trim();
        const category = fields.Category.value.trim();
        const date = fields.Date.value;

        if (!name || !category || !date) {
            setMessage("Please fill in all required fields.");
            setShowToast(true);
            return;
        }

        if (existingNames.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
            setMessage("Name must be unique");
            setShowToast(true);
            return;
        }
        // Insert the new project

        // Merge formFields and boolFields into fields
        let mergedFields = { ...fields };

        formFields.forEach(field => {
            mergedFields[field.key] = {
                type: field.type,
                visible: field.visible !== undefined ? field.visible : true,
                value: field.value
            };
        });

        boolFields.forEach(field => {
            mergedFields[field.key] = {
                type: field.type,
                visible: field.visible !== undefined ? field.visible : true,
                value: field.value
            };
        });

        const result = await updateProject({id: id, fields: mergedFields});
        if (result != null) {
            
            // Update link associations for this project
            if (id != null && links?.data) {
                // Find all links that currently reference this project
                const currentlyConnectedLinks = links.data.filter(link => 
                    Array.isArray(link?.fields?.Projects?.value) &&
                    link.fields.Projects.value.includes(id)
                );

                // Add project to newly selected links
                for (const linkId of selectedLinks) {
                    const link = links.data.find(l => l.id === linkId);
                    if (link) {
                        const currentProjects = Array.isArray(link?.fields?.Projects?.value)
                            ? link.fields.Projects.value
                            : [];
                        if (!currentProjects.includes(id)) {
                            const updatedProjects = [...currentProjects, id];
                            updateLink({ id: linkId, fields: {...link.fields, Projects: { ...link.fields.Projects, value: updatedProjects } } });
                        }
                    }
                }

                // Remove project from links that are no longer selected
                for (const link of currentlyConnectedLinks) {
                    if (!selectedLinks.includes(link.id)) {
                        const currentProjects = link.fields.Projects.value;
                        const updatedProjects = currentProjects.filter(projectId => projectId !== id);
                        updateLink({ id: link.id, fields: {...link.fields, Projects: { ...link.fields.Projects, value: updatedProjects } } });
                    }
                }
            }
        }
        setMessage("Project saved!");
        setShowToast(true);
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

    const RenderFormFields = () => {
        return formFields.map((field) => (
            <div key={field.key} style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                <label style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                    {field.key}
                </label>
                <input
                    type={createInput(field.type)}
                    value={field.value || ""}
                    placeholder={placeHolder(field.type)}
                    onChange={e =>
                        setFormFields(prev =>
                            prev.map(f =>
                                f.key === field.key ? { ...f, value: e.target.value } : f
                            )
                        )
                    }
                    style={smallInput}
                    onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                    }}
                />
            </div>    
        ));
    };

    const RenderBoolFields = () => {
        return boolFields.map((field) => (
            <div key={field.key} style={{ flex: '1 1 22%', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>         
                <input
                    type="checkbox"
                    checked={field.value || false}
                    onChange={e =>
                        setBoolFields(prev =>
                            prev.map(f =>
                                f.key === field.key ? { ...f, value: e.target.checked } : f
                            )
                        )
                    }
                    style={{ marginRight: '0.5rem', accentColor: 'var(--primary)' }}
                />

                <label style={{ color: 'var(--text)', fontSize: '1.1rem' }}>
                    {field.key}
                </label>
            </div>
        ));
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
                        Update Project
                    </button>
            </form>
        );
    };

    return (
        <div>
            <DesktopBar
                Title="Add Project"
                Submit={true}
                SubmitButton={SubmitButton}
            />
            <div className="main-content">
                {showToast && (
                    <Toast
                        Message={message}
                        close={() => setShowToast(false)}
                        duration={2000}
                    />
                )}
                <form onSubmit={handleSubmit} style={{ margin: "2rem auto" }}>
                    {/* Non-checkbox fields in 2 columns */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '2rem',
                        marginBottom: '2rem'
                    }}>
                        {/* Name */}
                        <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                            <label style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                                Name<span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={fields.Name.value}
                                placeholder="Enter project name"
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
                        {/* Category */}
                        <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                            <label style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                                Category<span style={{ color: "red" }}>*</span>
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
                                }}
                            />}
                        </div>
                        {/* Date */}
                        <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                            <label style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                                Date<span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="date"
                                value={fields.Date.value}
                                onChange={e => handleChange("Date", e.target.value)}
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
                        {/* Pay */}
                        <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                            <label style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                                Pay
                            </label>
                            <input
                                type="number"
                                placeholder={placeHolder("currency")}
                                value={fields.Pay.value}
                                onChange={e => handleChange("Pay", e.target.value)}
                                style={smallInput}
                                onMouseOver={e => {
                                    e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                                }}
                            />
                        </div>
                        {/* Expenses */}
                        <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                            <label style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                                Expenses
                            </label>
                            <input
                                type="number"
                                placeholder={placeHolder("currency")}
                                value={fields.Expenses.value}
                                onChange={e => handleChange("Expenses", e.target.value)}
                                style={smallInput}
                                onMouseOver={e => {
                                    e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                                }}
                            />
                        </div>
                        
                        {/* Render dynamic non-checkbox fields */}
                        {formFields.length > 0 && RenderFormFields()}

                    </div>

                    {/* Checkbox fields in 4 columns */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        {/* Default boolean fields */}
                        <div style={{ flex: '1 1 22%', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <input
                                type="checkbox"
                                checked={fields["Expenses Paid"].value}
                                onChange={e => handleChange("Expenses Paid", e.target.checked)}
                                style={{ marginRight: '0.5rem', accentColor: 'var(--primary)' }}
                            />
                            <label style={{ color: 'var(--text)', fontSize: '1.1rem' }}>
                                Expenses Paid
                            </label>
                        </div>
                        <div style={{ flex: '1 1 22%', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <input
                                type="checkbox"
                                checked={fields["Payment Received"].value}
                                onChange={e => handleChange("Payment Received", e.target.checked)}
                                style={{ marginRight: '0.5rem', accentColor: 'var(--primary)' }}
                            />
                            <label style={{ color: 'var(--text)', fontSize: '1.1rem' }}>
                                Payment Received
                            </label>
                        </div>
                        
                        {/* Render dynamic boolean fields */}
                        {boolFields.length > 0 && RenderBoolFields()}

                    </div>

                    {/* Links Multi-Select (full width) */}
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
                        <label style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                            Links (associate with this project)
                        </label>
                        {isClient && <Select
                            isMulti
                            components={animatedComponents}
                            options={linkOptions}
                            value={linkOptions.filter(opt => selectedLinks.includes(opt.value))}
                            onChange={handleLinksChange}
                            placeholder="Select links"
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
                        />}
                    </div>
                </form>
            </div>
        </div>
    );
}