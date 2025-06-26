import React, { useState, useRef, useEffect } from 'react';
import './SearchableSelect.css';

interface Option {
  value: string;
  label: string;
}

interface Props {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (search: string) => void;
  options: Option[];
  isLoading: boolean;
  onClear: () => void;
}

export const SearchableSelect: React.FC<Props> = ({
  placeholder,
  value,
  onChange,
  onSearch,
  options,
  isLoading,
  onClear
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    onSearch(newSearch);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <div 
        className="select-header" 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        {value && selectedOption ? (
          <div className="selected-value-container">
            <span className="selected-value">{selectedOption.label}</span>
            <button 
              className="clear-button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                setIsOpen(false);
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <span className="placeholder">{placeholder}</span>
        )}
        <span className="arrow">▼</span>
      </div>

      {isOpen && (
        <div className="select-dropdown">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={handleSearchChange}
            className="search-input"
            placeholder="Type to search..."
            onClick={e => e.stopPropagation()}
          />
          <div className="options-list">
            {isLoading ? (
              <div className="loading">Loading...</div>
            ) : options.length > 0 ? (
              options.map(option => (
                <div
                  key={option.value}
                  className={`option ${value === option.value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="no-results">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 