'use client';
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { assignType } from "@/utils/types";

const Bar = ({fields = {}, id = "", requiredFields = [], routePath = ""}) => {
    const [localFields, setlocalFields] = useState(fields);
    const [isUpdating, setIsUpdating] = useState({});
    const router = useRouter();
    const pathname = usePathname();
    const Bools = {}
    const nonBools = {}
    
    const onClick = () => {
        router.push(`${pathname}/${id}`);
    };

    for (const i in requiredFields) {
        const key = requiredFields[i]
        
        ///console.log('key',fields[key])

        if (key in fields && key !== "Name" && key !== "Date") {
            const currField = {
                value: fields[key]['value'],
                type: fields[key]['type']
            }

            fields[key]['type'] === 'boolean' ? Bools[key] = currField : nonBools[key] = currField  
        }
    }

    const updateBooleanField = async (field, newValue) => {
        setIsUpdating(prev => ({ ...prev, [field]: true }));

        try {
            // Create a new fields object with the updated value for the boolean field
            const updatedFields = {
                ...fields,
                [field]: {
                    ...fields[field],
                    value: newValue
                }
            };

            const response = await fetch(`${routePath}?id=${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fields: updatedFields }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            // Optionally update local state if you keep a local copy of fields
            // setLocalProps(prev => ({ ...prev, fields: updatedFields }));
            setlocalFields(updatedFields);

        } catch (error) {
            console.error('Error updating field:', error);
            alert(`Failed to update ${field}: ${error.message}`);
        } finally {
            setIsUpdating(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleCheckboxChange = (e, field) => {
        e.stopPropagation(); // Prevent triggering the bar's onClick
        const newValue = e.target.checked;
        updateBooleanField(field, newValue);
    };

    const RenderNonBools = () => {
        return Object.keys(nonBools).map((field) => {
            const value = assignType(localFields[field].value, localFields[field].type);
            const capitalizedField = value.charAt(0).toUpperCase() + value.slice(1);
            return (
                <span key={field} style={{ color: 'var(--text)', marginRight: '2.5rem' }}>
                    {capitalizedField}
                </span>
            );
        });
    };

    const RenderBools = () => {
        return Object.keys(Bools).map((field, index) => {
            const isLast = index === Bools.length - 1;
            const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
            const fieldValue = localFields[field].value;
            const updating = isUpdating[field];

            return (
                <div key={field} style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    marginRight: isLast ? '0' : '2rem' 
                }}>
                    <input
                        type="checkbox"
                        checked={fieldValue}
                        onChange={(e) => handleCheckboxChange(e, field)}
                        disabled={updating}
                        style={{
                            marginRight: '0.5rem',
                            cursor: updating ? 'not-allowed' : 'pointer',
                            opacity: updating ? 0.5 : 1,
                            accentColor: 'var(--primary)'
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent triggering bar's onClick
                    />
                    <span style={{ 
                        color: fieldValue ? 'green' : 'red',
                        transition: 'color 0.2s, opacity 0.2s'
                    }}>
                        {capitalizedField}
                    </span>
                </div>
            );
        });
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };
        return date.toLocaleDateString('en-US', options);
    };

    const barStyle = {
        padding: '10px 24px',
        background: 'var(--button-bg)',
        color: 'var(--primary)',
        border: '2px solid var(--border)',
        width: '55%',
        borderRadius: '8px',
        fontSize: '1rem',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'background 0.2s',
    };

    const addDate = (timestamp) => { 
        if (!timestamp) return '';
        return (
            <span style={{ color: 'var(--text)', marginRight: '2.5rem' }}>{formatDate(timestamp)}</span>
        );
    };

    return (
        <button style={barStyle}
        onClick={onClick}
        onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg)';
            }}
        >
            <span style={{ fontWeight: 'bold', marginRight: '2.5rem'}}>{fields.Name.value}</span>
            {fields.Date && addDate(fields.Date.value)}
            {RenderNonBools()}
            {RenderBools()}

        </button>
    );
};

export default Bar;