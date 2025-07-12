'use client'

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const List = ({
  title,
  getEndpoint,
  deleteEndpoint,
  columns,
  filterConfig,
  addPath,
  backPath = "/",
  rowPath,
}) => {
  const router = useRouter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [hoveredDelete, setHoveredDelete] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState(
    filterConfig.reduce((acc, filter) => ({
      ...acc,
      [filter.key]: filter.defaultValue
    }), {})
  )
  const filterRef = useRef()

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(getEndpoint)
        const { data: responseData, error: responseError } = await res.json()
        
        if (responseError) {
          setError(responseError)
        } else {
          setData(responseData || [])
        }
      } catch (err) {
        setError('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [getEndpoint])

  // Handle outside clicks for filter dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false)
      }
    }

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showFilters])

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return

    try {
      const res = await fetch(`${deleteEndpoint}?id=${id}`, {
        method: "DELETE"
      })
      const { error } = await res.json()

      if (error) {
        alert(`Failed to delete: ${error}`)
      } else {
        setData(prevData => prevData.filter(item => item.id !== id))
      }
    } catch (err) {
      alert("Failed to delete item")
    }
  }

  // Filter data
  const filteredData = data.filter(item => {
    // Apply filters
    const passesFilters = filterConfig.every(filter => {
      return filter.apply(item[filter.key], filters[filter.key])
    })

    // Apply search
    const matchesSearch = searchQuery === "" || columns.some(column => {
      const value = item[column.key]
      return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    })

    return passesFilters && matchesSearch
  })

  return (
    <div className="list-container">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push(backPath)}
        className={`action-button back-button ${hovered === "back" ? 'hovered' : ''}`}
        onMouseOver={() => setHovered("back")}
        onMouseOut={() => setHovered(null)}
      >
        ← Back to Home
      </button>

      {/* Action Buttons Container */}
      <div className="action-buttons-container" ref={filterRef}>
        <button
          type="button"
          onClick={() => router.push(addPath)}
          className={`action-button ${hovered === "add" ? 'hovered' : ''}`}
          onMouseOver={() => setHovered("add")}
          onMouseOut={() => setHovered(null)}
        >
          + Add {title}
        </button>
        
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`action-button ${hovered === "filter" ? 'hovered' : ''}`}
          onMouseOver={() => setHovered("filter")}
          onMouseOut={() => setHovered(null)}
        >
          Filters &#x25BC;
        </button>

        {showFilters && (
          <div className="filter-dropdown">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {filterConfig.map(filter => (
              <filter.component
                key={filter.key}
                value={filters[filter.key]}
                onChange={(value) => setFilters(prev => ({
                  ...prev,
                  [filter.key]: value
                }))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Centered Header */}
      <header className="page-header">
        <h1>{title}</h1>
      </header>

      {/* Data Grid */}
      <div className="data-grid">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredData.length > 0 ? (
          filteredData.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`data-row ${hovered === idx ? 'hovered' : ''}`}
              onMouseOver={() => setHovered(idx)}
              onMouseOut={() => setHovered(null)}
            >
              <Link href={`${rowPath}/${item.id}`} className="row-content">
                {columns.map(column => (
                  <span
                    key={column.key}
                    className={`cell ${column.className || ''}`}
                    style={column.style?.(item[column.key])}
                  >
                    {column.format?.(item[column.key]) || item[column.key]}
                  </span>
                ))}
              </Link>

              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete(item.id)
                }}
                className={`delete-button ${hoveredDelete === idx ? 'hovered' : ''}`}
                onMouseOver={() => setHoveredDelete(idx)}
                onMouseOut={() => setHoveredDelete(null)}
                aria-label={`Delete ${title}`}
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="no-data">No {title.toLowerCase()} found</div>
        )}
      </div>
    </div>
  )
}

export default List