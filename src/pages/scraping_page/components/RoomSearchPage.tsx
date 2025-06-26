import React, { useState } from 'react';
import { Room, SearchParams, ModalType, Service, EventType, VenueType } from './types';
import SearchFilters from './SearchFilters';
import RoomResults from './RoomResults';
import Modal from './Modal';
import '../style.css';
import { searchRooms } from '../../../api/scraping/api';

const RoomSearchPage: React.FC = () => {
  // Search filters state
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [requiresParking, setRequiresParking] = useState<boolean>(false);
  const [serviceSearch, setServiceSearch] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [selectedVenueType, setSelectedVenueType] = useState<VenueType | null>(null);
  
  // Results state
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  // Search parameters state
  const [searchParams, setSearchParams] = useState<SearchParams>({
    city: "",
    capacity: "",
    requiresParking: false,
    serviceIds: [],
    eventType: "",
    venueType: ""
  });

  // Handle adding a service
  const handleAddService = (service: Service) => {
    // Ensure the service object has the correct structure
    const validService: Service = {
      _id: service._id,
      name: service.name
    };
    
    // Check if a service with the same ID already exists
    if (!selectedServices.some(existing => existing._id === validService._id)) {
      setSelectedServices([...selectedServices, validService]);
    }
    setServiceSearch("");
  };

  // Handle removing a service
  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(service => service._id !== serviceId));
  };

  // Handle search submission
  const handleSearch = () => {

    // Extract service IDs from the selected services
    const serviceIds = selectedServices.map(service => service._id).filter(id => id);
    
    const newParams = {
      city: selectedCity,
      capacity: capacity === "" ? "" : capacity.toString(),
      requiresParking,
      serviceIds: serviceIds,
      eventType: selectedEventType ? selectedEventType._id : "",
      venueType: selectedVenueType ? selectedVenueType._id : ""
    };
    
    setSearchParams(newParams);
    setCurrentPage(1); // Reset to page 1 when performing a new search
    fetchRooms(newParams, 1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchRooms(searchParams, page);
  };

  const handleShowLocation = (roomId: string) => {
    setModalType("location");
    setSelectedRoomId(roomId);
    setIsModalOpen(true);
  };

  const handleShowContacts = (roomId: string) => {
    setModalType("contacts");
    setSelectedRoomId(roomId);
    setIsModalOpen(true);
  };

  // Close modal handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoomId(null);
  };

  // Fetch rooms from API based on search parameters
  const fetchRooms = async (params: SearchParams, page: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await searchRooms(params, page);

      setFilteredRooms(result.rooms);
      setCurrentPage(result.pagination.currentPage);
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.totalCount);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      setError('Failed to fetch rooms');
      setFilteredRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate pagination components
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    const displayPageCount = 5; // Number of page buttons to show
    
    let startPage = Math.max(1, currentPage - Math.floor(displayPageCount / 2));
    const endPage = Math.min(totalPages, startPage + displayPageCount - 1);
    
    if (endPage - startPage + 1 < displayPageCount) {
      startPage = Math.max(1, endPage - displayPageCount + 1);
    }
    
    // Previous button
    pageNumbers.push(
      <button
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="pagination-button"
      >
        &laquo;
      </button>
    );
    
    // First page button if not starting from page 1
    if (startPage > 1) {
      pageNumbers.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="pagination-button"
        >
          1
        </button>
      );
      
      // Ellipsis if there's a gap
      if (startPage > 2) {
        pageNumbers.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
      }
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }
    
    // Ellipsis and last page button if not ending at last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      }
      
      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="pagination-button"
        >
          {totalPages}
        </button>
      );
    }
    
    // Next button
    pageNumbers.push(
      <button
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="pagination-button"
      >
        &raquo;
      </button>
    );
    
    return (
      <div className="pagination-container">
        {pageNumbers}
        <div className="pagination-info">
          Showing {filteredRooms.length} of {totalCount} results
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="room-search-container fade-in">
      <h1 className="page-title">Room Search</h1>
      
      {/* Search Filters */}
      <SearchFilters 
        selectedCity={selectedCity}
        capacity={capacity}
        requiresParking={requiresParking}
        serviceSearch={serviceSearch}
        selectedServices={selectedServices}
        selectedEventType={selectedEventType ? selectedEventType._id : ""}
        selectedVenueType={selectedVenueType ? selectedVenueType._id : ""}
        onCityChange={setSelectedCity}
        onCapacityChange={setCapacity}
        onParkingChange={setRequiresParking}
        onServiceSearchChange={setServiceSearch}
        onAddService={handleAddService}
        onRemoveService={handleRemoveService}
        onEventTypeChange={setSelectedEventType}
        onVenueTypeChange={setSelectedVenueType}
        onSearch={handleSearch}
      />
      
      {/* Room Results */}
      {loading ? (
        <div className="loading-container">Loading rooms...</div>
      ) : error ? (
        <div className="error-container">{error}</div>
      ) : (
        <>
          <RoomResults 
            rooms={filteredRooms}
            onShowLocation={handleShowLocation}
            onShowContacts={handleShowContacts}
          />
          {renderPagination()}
        </>
      )}
    </div>

    <div>
      <Modal 
        isOpen={isModalOpen}
        modalType={modalType}
        roomId={selectedRoomId}
        onClose={handleCloseModal}
      />
    </div>
    </>
  );
};

export default RoomSearchPage; 