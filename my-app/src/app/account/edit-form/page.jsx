'use client'
import DesktopBar from "@/app/components/DesktopBar"
import { useGetForm, useInsertForm, useUpdateForm, useGetProjects, useBulkUpdateFieldsVisibility } from "@/utils/api";
import RequiredFieldInput from "@/app/components/Element/Forms/RequiredFieldInput";
import FixedFieldInput from "@/app/components/Element/Forms/FixedFieldInput";
import MutableFieldInput from "@/app/components/Element/Forms/MutableFieldInput";
import { useEffect, useState } from "react";
import Toast from "@/app/components/toast";

export default function EditPage() {
    // Add a refresh state to trigger refetch
    const [refresh, setRefresh] = useState(0);

    // Pass refresh as a dependency to useGetForm
    const { data: form, loading, error } = useGetForm(refresh);
    const { data: projects} = useGetProjects();
    const { mutate: bulkUpdateFieldsVisibility, loading: bulkUpdateLoading, error: bulkUpdateError } = useBulkUpdateFieldsVisibility();
    const { mutate: insertForm, data: insertData, loading: insertLoading, error: insertError } = useInsertForm();
    const { mutate: updateForm, data: updateData, loading: updateLoading, error: updateError } = useUpdateForm();
    const [showToast, setShowToast] = useState(false);
    const [message, setMessage] = useState("");

    const [fields, setFields] = useState({});
    const [RecentFields, setRecentFields] = useState({});
    const [selectedDynamicFields, setSelectedDynamicFields] = useState([]);
    
    // Define immutable fields and fixed fields
    const immutableFields = ['Name', 'Date', 'Category'];
    const fixedFields = ['Pay', 'Expenses', 'Expenses Paid', 'Payment Received'];
    // Define hidden system fields that should not appear in the form editor
    const hiddenSystemFields = ['Payment Received Date', 'Expenses Paid Date'];
    
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const DeletePopUpCard = ({ trigger, setTrigger, onConfirm }) => {
        return trigger ? (
            <div className="popup-card" style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div className="popup-content" style={{
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    minWidth: '300px',
                    textAlign: 'center'
                }}>
                    <p>Are you sure you want to delete the selected fields?</p>
                    <button
                        style={{
                            marginTop: '1rem',
                            marginRight: '1rem',
                            padding: '0.5rem 1.5rem',
                            background: 'red',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            transition: 'background 0.2s',
                            cursor: 'pointer'
                        }}
                        onClick={() => {
                            onConfirm();
                            setTrigger(false);
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#e42800'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'red'}
                    >
                        Yes, Delete
                    </button>
                    <button
                        style={{
                            padding: '0.5rem 1.5rem',
                            background: 'var(--unselected)',
                            color: 'black',
                            border: 'none',
                            borderRadius: '6px',
                            transition: 'background 0.2s',
                            cursor: 'pointer'
                        }}
                        onClick={() => setTrigger(false)}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--unselected-hover)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--unselected)'}
                    >
                        No
                    </button>
                </div>
            </div>
        ) : null;
    };


    // Initialize fields state when form loads
    useEffect(() => {
        if (form && form.data.fields) {
            setFields(form.data.fields);
            setRecentFields(form.data.fields);
        }
    }, [form]);


    // Insert a form if none exists, then refetch
    const [insertAttempted, setInsertAttempted] = useState(false);

    useEffect(() => {
        // Only attempt insert after loading is done and no form is found
        if (!loading && form == null && !insertLoading && !insertData && !insertAttempted) {
            setInsertAttempted(true);
            insertForm().then(() => setRefresh(r => r + 1));
        }
    }, [loading, form, insertLoading, insertData, insertForm, insertAttempted]);

    // Get dynamic fields (fields that are not required or fixed)
    const getDynamicFields = () => {
        const allKnownFields = [...immutableFields, ...fixedFields, ...hiddenSystemFields];
        return Object.entries(fields).filter(([fieldName]) => 
            !allKnownFields.includes(fieldName)
        );
    };

    // Count visible fields
    const getVisibleFieldsCount = () => {
        return Object.values(fields).filter(field => field.visible).length;
    };

    const handleVisibilityChange = (fieldName, visible) => {
        const currentVisibleCount = getVisibleFieldsCount();
        
        // If trying to make visible and already at max capacity (6), prevent it
        if (visible && currentVisibleCount >= 6) {
            setMessage("6 fields are already visible")
            setShowToast(true);
            return;
        }

        setFields(prev => ({
            ...prev,
            [fieldName]: {
                ...prev[fieldName],
                visible
            }
        }));
    };

    const getChangedVisibilityFields = () => {
        const changed = [];
        const allKeys = new Set([...Object.keys(fields), ...Object.keys(RecentFields)]);
        for (const key of allKeys) {
            if (
                fields[key] &&
                RecentFields[key] &&
                typeof fields[key].visible === "boolean" &&
                typeof RecentFields[key].visible === "boolean" &&
                fields[key].visible !== RecentFields[key].visible
            ) {
                changed.push({ key, visible: fields[key].visible });
            }
        }
        return changed;
    };

    const handleFieldNameChange = (oldName, newName) => {
        if (newName.trim() === '' || newName === oldName) return;
        
        // Check if new name already exists
        if (fields[newName]) {
            setMessage("Field name already exists")
            setShowToast(true)
            return;
        }

        setFields(prev => {
            const newFields = { ...prev };
            // Create new field with new name
            newFields[newName] = { ...prev[oldName] };
            // Delete old field
            delete newFields[oldName];
            return newFields;
        });
    };

    const handleTypeChange = (fieldName, newType) => {
        setFields(prev => ({
            ...prev,
            [fieldName]: {
                ...prev[fieldName],
                type: newType
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (form && form.data.id) {
            updateForm({ id: form.data.id, fields });
            const changedFields = getChangedVisibilityFields();
            setRecentFields(fields);
            
            // Find which fields had their visible property changed
            if (changedFields.length > 0) {
                bulkUpdateFieldsVisibility(changedFields);
            }

            if (!updateLoading) {
                setMessage("Form saved!")
                setShowToast(true)
            }
        }
    };


    // only update if the current fields are 
    const CurrentFieldsSame = fields && RecentFields && JSON.stringify(fields) === JSON.stringify(RecentFields);
    const anyDynamicFieldNameEmpty = getDynamicFields().some(([fieldName]) => fieldName.trim() === '');
    const disabled = updateLoading || CurrentFieldsSame || anyDynamicFieldNameEmpty;

    const SubmitButton = () => {
        return (
            <form onSubmit={handleSubmit}>
                    <button 
                        type="submit" 
                        disabled={disabled}
                        style={{
                        padding: '10px 24px',
                        fontWeight: 'semi-bold',
                        fontSize: '1rem',
                        background: !(disabled) ? 'var(--button-bg)' : 'var(--unselected)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        borderRadius: '8px',
                        color: !(disabled) ? 'var(--primary)' : 'white',
                        border: !(disabled) ? '2px solid var(--border)' : 'none',
                        cursor: !(disabled) ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={e => {
                        if (!disabled) e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                    }}
                    onMouseOut={e => {
                        if (!disabled) e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                    }}
                    >
                        Save Form
                    </button>
            </form>
        );
    };

    const DeleteButton = () => {
        return (
            <button
                    onClick={() => setShowDeletePopup(true)}
                    disabled={selectedDynamicFields.length === 0}
                    style={{
                        padding: '10px 24px',
                        fontWeight: 'semi-bold',
                        fontSize: '1rem',
                        background: selectedDynamicFields.length ? 'var(--button-bg)' : 'var(--unselected)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        borderRadius: '8px',
                        color: selectedDynamicFields.length ? 'var(--primary)' : 'white',
                        border: selectedDynamicFields.length ? '2px solid var(--border)' : 'none',
                        cursor: selectedDynamicFields.length ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={e => {
                        if (selectedDynamicFields.length) e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                    }}
                    onMouseOut={e => {
                        if (selectedDynamicFields.length) e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                    }}
                >
                    Delete Selected Fields
                </button>
        );
    };

    const MiddleText  = () => {
        return (
            <p style={{color: getVisibleFieldsCount() != 6 ? 'var(--primary)' : 'red',
                            transition: '0.4s'
                }}>
                    Maximum 6 fields can be visible. Currently visible: {getVisibleFieldsCount()}/6
            </p>
        );
    }



    const NewFieldButton = () => {
        // Find a unique temporary key for the new field
        let newKey = "";
        let i = 1;
        while (fields[newKey] || fields[`${newKey} ${i}`]) {
            i++;
            newKey = `New Field ${i}`;
        }

        // Disable if there is already an empty-named dynamic field

        return (
            <button
                type="button"
                disabled={anyDynamicFieldNameEmpty}
                onClick={() => {
                    if (anyDynamicFieldNameEmpty) return;
                    setFields(prev => ({
                        ...prev,
                        [newKey]: {
                            type: 'text',
                            visible: false,
                            value: ''
                        }
                    }));
                }}
                style={{
                    marginBottom: '0.25rem',
                    padding: '0.5rem 1.5rem',
                    fontWeight: 'semi-bold',
                    fontSize: '1rem',
                    background: anyDynamicFieldNameEmpty ? 'var(--unselected)' : 'var(--button-bg)',
                    color: anyDynamicFieldNameEmpty ? 'white' : 'var(--text)',
                    border: anyDynamicFieldNameEmpty ? 'none' : '2px solid var(--border)',
                    borderRadius: '6px',
                    cursor: anyDynamicFieldNameEmpty ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                }}
                onMouseOver={e => {
                        if (!anyDynamicFieldNameEmpty) e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                    }}
                onMouseOut={e => {
                    if (!anyDynamicFieldNameEmpty) e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                }}
            >
                Add Custom Field
            </button>
        );
    };

    return (
        <div>
            <DesktopBar Title="Edit Form" SubmitButton={SubmitButton} Submit={true} DeleteButton={DeleteButton} Delete={true} MiddleText={MiddleText} Middle={true} />

            <div className="main-content">
                <div>
                <DeletePopUpCard
                    trigger={showDeletePopup}
                    setTrigger={setShowDeletePopup}
                    onConfirm={() => {
                        setFields(prev => {
                            const newFields = { ...prev };
                            selectedDynamicFields.forEach(field => {
                                delete newFields[field];
                            });
                            setMessage("Selected fields deleted");
                            setShowToast(true);
                            return newFields;
                        });
                        setSelectedDynamicFields([]);
                    }}
                />
                {showToast && (
                    <Toast 
                        Message={message} 
                        close={() => setShowToast(false)}
                        duration={2000} // Optional: custom duration
                    />
                )}

                {form != null || loading ? (
                    <div>
                        {/* Required Fields Section */}
                        <div style={{marginLeft: '1.5rem'}}>
                            <h3 style={{color: 'var(--text)', marginTop: '1rem', marginBottom: '0.75rem', fontSize: '1.25rem'}}>Required Fields (Always Visible)</h3>
                            <div className="space-y-4">
                                <RequiredFieldInput key={"Name"} fieldName="Name" fieldType="text" />
                                <RequiredFieldInput key={"Date"} fieldName="Date" fieldType="date" />
                                <RequiredFieldInput key={"Category"} fieldName="Category" fieldType="text" />
                            </div>
                        </div>

                        {/* Fixed Fields Section */}
                        <div style={{marginLeft: '1.5rem'}}>
                            <h3 style={{color: 'var(--text)', marginTop: '1rem', marginBottom: '0.75rem', fontSize: '1.25rem'}}>Fixed Fields (Toggle Visibility)</h3>
                            <div className="space-y-4">
                                {fields.Pay && (
                                    <FixedFieldInput 
                                        key={"Pay"}
                                        fieldName="Pay" 
                                        fieldType={fields.Pay.type}
                                        isVisible={fields.Pay.visible}
                                        onVisibilityChange={handleVisibilityChange}
                                    />
                                )}
                                {fields.Expenses && (
                                    <FixedFieldInput
                                        key={"Expenses"} 
                                        fieldName="Expenses" 
                                        fieldType={fields.Expenses.type}
                                        isVisible={fields.Expenses.visible}
                                        onVisibilityChange={handleVisibilityChange}
                                    />
                                )}
                                {fields['Expenses Paid'] && (
                                    <FixedFieldInput 
                                        key={"Expenses Paid"} 
                                        fieldName="Expenses Paid" 
                                        fieldType={fields['Expenses Paid'].type}
                                        isVisible={fields['Expenses Paid'].visible}
                                        onVisibilityChange={handleVisibilityChange}
                                    />
                                )}
                                {fields['Payment Received'] && (
                                    <FixedFieldInput 
                                        key={"Payment Received"} 
                                        fieldName="Payment Received" 
                                        fieldType={fields['Payment Received'].type}
                                        isVisible={fields['Payment Received'].visible}
                                        onVisibilityChange={handleVisibilityChange}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Dynamic Fields Section */}
                        {getDynamicFields().length > 0 && (
                            <div>
                                <h3 style={{color: 'var(--text)', marginTop: '1rem', marginBottom: '0.75rem', fontSize: '1.25rem', marginLeft: '1.5rem'}}>Custom Fields (Fully Configurable)</h3>
                                <div className="space-y-4">
                                    {getDynamicFields().map(([fieldName, fieldObj]) => (
                                        <div key={fieldName} style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedDynamicFields.includes(fieldName)}
                                                onChange={e => {
                                                    setSelectedDynamicFields(prev =>
                                                        e.target.checked
                                                            ? [...prev, fieldName]
                                                            : prev.filter(f => f !== fieldName)
                                                    );
                                                }}
                                                style={{ marginRight: '0.75rem', accentColor: 'var(--primary)' }}
                                            />
                                            <MutableFieldInput
                                                fieldName={fieldName}
                                                fieldType={fieldObj.type}
                                                isVisible={fieldObj.visible}
                                                onVisibilityChange={handleVisibilityChange}
                                                onFieldNameChange={handleFieldNameChange}
                                                onTypeChange={handleTypeChange}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No fields to display.
                    </div>
                )}
                    <div style={{display : 'flex', justifyContent : 'center', alignItems : 'center'}}>
                        {NewFieldButton()}
                    </div>
                </div>
            </div>
        </div>
    );
}