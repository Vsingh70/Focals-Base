'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AddRow = ({ 
  title,
  apiEndpoint,
  fields,
  onSuccess,
  defaultValues = {},
  backUrl
}) => {
  const router = useRouter()
  const [formData, setFormData] = useState(defaultValues)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [backHover, setBackHover] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let finalValue = value

    if (type === 'checkbox') {
      finalValue = checked
    } else if (type === 'number') {
      finalValue = value === '' ? '' : Number(value)
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const { data, error } = await res.json()
      
      if (error) {
        setError(error)
      } else {
        if (onSuccess) {
          onSuccess(data)
        }
        router.push(backUrl)
      }
    } catch (err) {
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="add-row-container">
      <div className="add-row-content">
        <button
          type="button"
          onClick={() => router.push(backUrl)}
          className="back-button"
          onMouseOver={() => setBackHover(true)}
          onMouseOut={() => setBackHover(false)}
          style={{
            background: backHover ? 'var(--primary-dark)' : 'var(--primary)'
          }}
        >
          ← Back to {title}
        </button>

        <form onSubmit={handleSubmit} className="add-row-form">
          {error && <div className="error-message">{error}</div>}

          <div className="fields-grid">
            {fields.map((field) => (
              <div key={field.name} className="field-container">
                <label>
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>
                
                {field.type === 'checkbox' ? (
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={!!formData[field.name]}
                      onChange={handleChange}
                    />
                    <span>{formData[field.name] ? 'Yes' : 'No'}</span>
                  </div>
                ) : (
                  <input
                    type={field.type || 'text'}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="submit-button"
          >
            {saving ? 'Saving...' : `Add ${title}`}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddRow