'use client';
import DesktopBar from "@/app/components/DesktopBar";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useGetFinance, useUpdateFinance, useGetFinances, useGetProjects } from "@/utils/api";
import { createInput, placeHolder, assignType } from "@/utils/types";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import Toast from "@/app/components/toast";

const defaultFields = {
    "Name": {
        "type": "text",
        "visible": true,
        "value": ""
    },
    "Date": {
        "type": "date",
        "visible": true,
        "value": ""
    },
    "Category": {
        "type": "text",
        "visible": true,
        "value": ""
    },
    "Amount": {
        "type": "number",
        "visible": true,
        "value": 0
    },
    "Amount Paid": {
        "type": "boolean",
        "visible": true,
        "value": false
    },
    "Projects": {
        "type": "list",
        "visible": false,
        "value": []
    }
};

export default function EditFinancePage() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const router = useRouter();
    const { id } = useParams();
    const { data: finance, loading: financeLoading } = useGetFinance(id);
    const { mutate: updateFinance, loading: updateLoading } = useUpdateFinance();
    const { data: financesData } = useGetFinances();
    const { data: projectsData } = useGetProjects();
    
    const [fields, setFields] = useState(defaultFields);
    const [type, setType] = useState('income');
    const [showToast, setShowToast] = useState(false);
    const [message, setMessage] = useState("");
    const [existingNames, setExistingNames] = useState([]);
    const [existingCategories, setExistingCategories] = useState([]);

    // Initialize fields when finance data loads
    useEffect(() => {
        if (finance?.data) {
            setFields(finance.data.fields || defaultFields);
            setType(finance.data.type || 'income');
        }
    }, [finance]);

    // Get existing names for validation (excluding current finance)
    useEffect(() => {
        if (financesData?.data && finance?.data) {
            const currentName = finance.data.fields?.Name?.value;
            setExistingNames(
                financesData.data
                    .map(f => f.fields?.Name?.value)
                    .filter(name => name && name !== currentName)
            );
        }
    }, [financesData, finance]);

    // Get existing categories from both finances and projects
    useEffect(() => {
        // Collect categories from financesData
        const financeCategories = Array.isArray(financesData?.data)
            ? financesData.data
                .map(finance => finance.fields?.Category?.value)
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
        const allCategories = Array.from(new Set([...financeCategories, ...projectCategories]));

        setExistingCategories(allCategories);
    }, [financesData, projectsData]);

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

    const handleChange = (field, value) => {
        setFields(prev => ({
            ...prev,
            [field]: { ...prev[field], value }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const name = fields.Name.value.trim();
        const category = fields.Category.value.trim();
        const date = fields.Date.value;
        const amount = parseFloat(fields.Amount.value || 0);

        if (!name || !category || !date) {
            setMessage("Please fill in all required fields (Name, Category, Date).");
            setShowToast(true);
            return;
        }

        if (amount <= 0) {
            setMessage("Amount must be greater than 0.");
            setShowToast(true);
            return;
        }

        if (existingNames.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
            setMessage("Name must be unique.");
            setShowToast(true);
            return;
        }

        try {
            const result = await updateFinance({ id, fields, type });
            
            if (result?.data) {
                setMessage(`${type === 'income' ? 'Income' : 'Expense'} updated successfully!`);
                setShowToast(true);
                
                // Redirect after success
                setTimeout(() => {
                    router.push('/finances');
                }, 1500);
            } else {
                throw new Error('Failed to update finance entry');
            }
        } catch (err) {
            setMessage(err.message || 'Failed to update finance entry');
            setShowToast(true);
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
        const isFormValid = fields.Name.value.trim() && 
                           fields.Category.value.trim() && 
                           fields.Date.value &&
                           parseFloat(fields.Amount.value || 0) > 0;
        
        return (
            <form onSubmit={handleSubmit}>
                <button 
                    type="submit" 
                    disabled={!isFormValid || updateLoading}
                    style={{
                        padding: '10px 24px',
                        fontSize: '1rem',
                        background: isFormValid && !updateLoading ? 'var(--button-bg)' : 'var(--unselected)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        borderRadius: '8px',
                        color: isFormValid && !updateLoading ? 'var(--primary)' : 'white',
                        border: isFormValid && !updateLoading ? '2px solid var(--border)' : 'none',
                        cursor: isFormValid && !updateLoading ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={e => {
                        if (isFormValid && !updateLoading) {
                            e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                        }
                    }}
                    onMouseOut={e => {
                        if (isFormValid && !updateLoading) {
                            e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                        }
                    }}
                >
                    {updateLoading ? 'Updating...' : `Update ${type === 'income' ? 'Income' : 'Expense'}`}
                </button>
            </form>
        );
    };

    if (financeLoading) {
        return (
            <div>
                <DesktopBar Title="Edit Finance" />
                <div className="main-content">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        Loading finance...
                    </div>
                </div>
            </div>
        );
    }

    if (!finance?.data) {
        return (
            <div>
                <DesktopBar Title="Edit Finance" />
                <div className="main-content">
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                        Finance not found
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <DesktopBar
                Title={`Edit ${type === 'income' ? 'Income' : 'Expense'}`}
                Submit={true}
                SubmitButton={SubmitButton}
            />
            <div className="main-content">
                {showToast && (
                    <Toast
                        Message={message}
                        close={() => setShowToast(false)}
                        duration={3000}
                    />
                )}

                <form onSubmit={handleSubmit} style={{ margin: "2rem auto" }}>
                    {/* Type Toggle */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        marginBottom: '2rem',
                        gap: '1rem'
                    }}>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                border: '2px solid var(--border)',
                                borderRadius: '8px',
                                background: type === 'income' ? 'var(--primary)' : 'var(--button-bg)',
                                color: type === 'income' ? 'white' : 'var(--text)',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'semi-bold',
                                transition: 'all 0.2s'
                            }}
                        >
                            Income
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                border: '2px solid var(--border)',
                                borderRadius: '8px',
                                background: type === 'expense' ? 'var(--primary)' : 'var(--button-bg)',
                                color: type === 'expense' ? 'white' : 'var(--text)',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'semi-bold',
                                transition: 'all 0.2s'
                            }}
                        >
                            Expense
                        </button>
                    </div>

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
                                placeholder="Enter name"
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
                    
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginTop: '1rem' }}>
                        {/* Date */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <label style={{
                                color: 'var(--text)',
                                marginBottom: '0.5rem',
                                fontSize: '1.1rem'
                            }}>
                                Date<span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="date"
                                value={fields.Date.value}
                                onChange={(e) => handleChange("Date", e.target.value)}
                                style={smallInput}
                                onMouseOver={e => {
                                    e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                                }}
                            />
                        </div>

                        {/* Amount */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <label style={{
                                color: 'var(--text)',
                                marginBottom: '0.5rem',
                                fontSize: '1.1rem'
                            }}>
                                Amount<span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Enter amount"
                                value={fields.Amount.value}
                                onChange={(e) => handleChange("Amount", e.target.value)}
                                style={smallInput}
                                onMouseOver={e => {
                                    e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                                }}
                            />
                        </div>
                    </div>

                    {/* Amount Paid Checkbox */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '1rem',
                        marginBottom: '1.25rem',
                        justifyContent: 'center'
                    }}>
                        <input
                            type="checkbox"
                            checked={fields["Amount Paid"].value}
                            onChange={(e) => handleChange("Amount Paid", e.target.checked)}
                            style={{ marginRight: '0.5rem', accentColor: 'var(--primary)' }}
                        />
                        <label style={{ color: 'var(--text)', fontSize: '1.1rem' }}>
                            Amount Paid
                        </label>
                    </div>

                    {/* Projects Multi-Select */}
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