import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { getReservations, updateReservation } from '../../api/reservations/api';
import { searchUsers } from '../../api/users/api';
import { searchLocations } from '../../api/locations/api';
import './reservations.css';
import { SearchableSelect } from './components/SearchableSelect';
import debounce from 'lodash/debounce';
import { Link, useNavigate } from 'react-router-dom';

interface Reservation {
	_id: string;
	locationId: string;
	locationName?: string;
	userName?: string;
	roomId: number;
	userId: string;
	timeSlot: {
		start: string;
		end: string;
	};
	startDate: string;
	endDate: string;
	capacity: number;
	amount: number;
	payment: 'SUCCESS' | 'REFUNDED';
	stripeId: string;
}

interface SearchParams {
	locationId?: string;
	userId?: string;
	startDate?: string;
	endDate?: string;
	payment?: string;
	capacity?: string;
	amount?: string;
	page?: number;
	limit?: number;
}

interface User {
	_id: string;
	name: string;
	surname: string;
}

interface Location {
	_id: string;
	name: string;
}

const ReservationsPage: React.FC = () => {
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [totalReservations, setTotalReservations] = useState(0);
	const [loading, setLoading] = useState(false);
	const [changedReservations, setChangedReservations] = useState<Set<string>>(new Set<string>());
	const [paramsReservations, setParamsReservations] = useState<Reservation[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [locations, setLocations] = useState<Location[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const [loadingLocations, setLoadingLocations] = useState(false);
	const [, setUserSearch] = useState('');
	const [, setLocationSearch] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const navigate = useNavigate();
	
	const [params, setParams] = useState<SearchParams>({
		locationId: '',
		userId: '',
		startDate: '',
		endDate: '',
		payment: '',
		capacity: '',
		amount: '',
		page: 1,
		limit: 10
	});

	// Memoize the stable query params to prevent unnecessary re-renders
	const queryParams = useMemo(() => ({
		locationId: params.locationId,
		userId: params.userId,
		startDate: params.startDate,
		endDate: params.endDate,
		payment: params.payment,
		capacity: params.capacity,
		amount: params.amount,
		page: params.page,
		limit: params.limit
	}), [params.locationId, params.userId, params.startDate, params.endDate, params.payment, params.capacity, params.amount, params.page, params.limit]);

	const fetchReservations = useCallback(async () => {
		setLoading(true);
		try {
			const response = await getReservations(queryParams);
			setReservations(response.reservations || []);
			setTotalReservations(response.total || 0);
		} catch (error) {
			console.error("Error fetching reservations:", error);
			setReservations([]);
			setTotalReservations(0);
		} finally {
			setLoading(false);
		}
	}, [queryParams]);

	useEffect(() => {
		fetchReservations();
	}, [fetchReservations]);

	useEffect(() => {
		setParamsReservations([...reservations]);
	}, [reservations]);

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			for (const reservationId of changedReservations) {
				const reservation = paramsReservations.find(r => r._id === reservationId);
				if (reservation) {
					await updateReservation({
						reservationId,
						...reservation
					});
				}
			}
			setChangedReservations(new Set());
			fetchReservations();
			
			// Show success feedback
			const successToast = document.createElement('div');
			successToast.className = 'toast success';
			successToast.textContent = 'Modifiche salvate con successo!';
			document.body.appendChild(successToast);
			setTimeout(() => successToast.remove(), 3000);
		} catch (error) {
			console.error("Error saving changes:", error);
			alert('Errore nel salvare le modifiche. Riprova.');
		} finally {
			setIsSaving(false);
		}
	};

	const handlePageChange = (newPage: number) => {
		setParams(prev => ({ ...prev, page: newPage }));
	};

	const handleReservationChange = <K extends keyof Reservation>(
		reservationId: string, 
		key: K, 
		value: Reservation[K]
	) => {
		setParamsReservations(prev => 
			prev.map(reservation => 
				reservation._id === reservationId ? { ...reservation, [key]: value } : reservation
			)
		);
		setChangedReservations(prev => new Set(prev).add(reservationId));
	};

	const fetchUsers = useCallback(async (search: string) => {
		setLoadingUsers(true);
		try {
			const data = await searchUsers(search);
			setUsers(data.users);
		} catch (error) {
			console.error("Error fetching users:", error);
		} finally {
			setLoadingUsers(false);
		}
	}, []);

	const fetchLocations = useCallback(async (search: string) => {
		setLoadingLocations(true);
		try {
			const data = await searchLocations(search);
			setLocations(data.locations);
		} catch (error) {
			console.error("Error fetching locations:", error);
		} finally {
			setLoadingLocations(false);
		}
	}, []);

	// Create persistent debounced functions using useRef
	const debouncedFetchUsersRef = useRef(
		debounce((search: string) => {
			fetchUsers(search);
		}, 300)
	);

	const debouncedFetchLocationsRef = useRef(
		debounce((search: string) => {
			fetchLocations(search);
		}, 300)
	);

	// Update the debounced functions when fetchUsers/fetchLocations change
	useEffect(() => {
		debouncedFetchUsersRef.current = debounce((search: string) => {
			fetchUsers(search);
		}, 300);
	}, [fetchUsers]);

	useEffect(() => {
		debouncedFetchLocationsRef.current = debounce((search: string) => {
			fetchLocations(search);
		}, 300);
	}, [fetchLocations]);

	const debouncedFetchUsers = useCallback((search: string) => {
		debouncedFetchUsersRef.current(search);
	}, []);

	const debouncedFetchLocations = useCallback((search: string) => {
		debouncedFetchLocationsRef.current(search);
	}, []);

	const handleClearFilters = () => {
		setParams({
			locationId: '',
			userId: '',
			startDate: '',
			endDate: '',
			payment: '',
			capacity: '',
			amount: '',
			page: 1,
			limit: 10
		});
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
	};

	const totalPages = Math.ceil(totalReservations / (params.limit || 10));

	return (
		<div className="reservations-container">
			<div className="page-header">
				<div>
					<h1 className="page-title">Gestione Prenotazioni</h1>
					<p className="page-subtitle">Visualizza e gestisci le prenotazioni della piattaforma</p>
				</div>
			</div>
			
			<div className="filters-card">
				<div className="filters-header">
					<h2 className="filters-title">Filtri di ricerca</h2>
					<button 
						className="clear-filters-btn"
						onClick={handleClearFilters}
						aria-label="Pulisci filtri"
					>
						Pulisci filtri
					</button>
				</div>
				<div className="search-filters">
					<div className="filter-group filter-group-wide">
						<label className="filter-label">Utente</label>
						<SearchableSelect
							placeholder="Cerca utente..."
							value={params.userId || ''}
							onChange={(value) => setParams({ ...params, userId: value, page: 1 })}
							onSearch={(search) => {
								setUserSearch(search);
								debouncedFetchUsers(search);
							}}
							onClear={() => setParams({ ...params, userId: '', page: 1 })}
							isLoading={loadingUsers}
							options={users.map(user => ({
								value: user._id,
								label: `${user.name} ${user.surname}`
							}))}
						/>
					</div>
					
					<div className="filter-group filter-group-wide">
						<label className="filter-label">Location</label>
						<SearchableSelect
							placeholder="Cerca location..."
							value={params.locationId || ''}
							onChange={(value) => setParams({ ...params, locationId: value, page: 1 })}
							onSearch={(search) => {
								setLocationSearch(search);
								debouncedFetchLocations(search);
							}}
							onClear={() => setParams({ ...params, locationId: '', page: 1 })}
							isLoading={loadingLocations}
							options={locations.map(location => ({
								value: location._id,
								label: location.name
							}))}
						/>
					</div>

					<div className="filter-group">
						<label htmlFor="start-date" className="filter-label">Data inizio</label>
						<input
							id="start-date"
							type="date"
							value={params.startDate}
							onChange={(e) => setParams({ ...params, startDate: e.target.value, page: 1 })}
							className="filter-input"
						/>
					</div>

					<div className="filter-group">
						<label htmlFor="end-date" className="filter-label">Data fine</label>
						<input
							id="end-date"
							type="date"
							value={params.endDate}
							onChange={(e) => setParams({ ...params, endDate: e.target.value, page: 1 })}
							className="filter-input"
						/>
					</div>

					<div className="filter-group">
						<label htmlFor="payment-filter" className="filter-label">Stato pagamento</label>
						<select
							id="payment-filter"
							value={params.payment}
							onChange={(e) => setParams({ ...params, payment: e.target.value, page: 1 })}
							className="filter-select"
						>
							<option value="">Tutti</option>
							<option value="SUCCESS">Completato</option>
							<option value="REFUNDED">Rimborsato</option>
						</select>
					</div>

					<div className="filter-group">
						<label htmlFor="capacity-filter" className="filter-label">Capacità</label>
						<input
							id="capacity-filter"
							type="number"
							placeholder="Capacità..."
							value={params.capacity}
							onChange={(e) => setParams({ ...params, capacity: e.target.value, page: 1 })}
							className="filter-input"
							min="1"
						/>
					</div>
				</div>
			</div>

			{loading ? (
				<div className="loading-container">
					<div className="spinner"></div>
					<p className="loading-text">Caricamento prenotazioni...</p>
				</div>
			) : (
				<>
					<div className="table-card">
						<div className="table-header">
							<p className="results-count">
								{totalReservations} prenotazioni trovate
								{changedReservations.size > 0 && (
									<span className="changes-count"> • {changedReservations.size} modifiche non salvate</span>
								)}
							</p>
							<div className="table-actions">
								<select 
									className="limit-select"
									value={params.limit} 
									onChange={(e) => setParams({ ...params, limit: Number(e.target.value), page: 1 })}
									aria-label="Risultati per pagina"
								>
									<option value="10">10 per pagina</option>
									<option value="25">25 per pagina</option>
									<option value="50">50 per pagina</option>
								</select>
							</div>
						</div>
						
						{paramsReservations.length === 0 ? (
							<div className="empty-state">
								<svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"></path>
									<path d="M10 16l2 2 4-4"></path>
								</svg>
								<h3 className="empty-title">Nessuna prenotazione trovata</h3>
								<p className="empty-text">Prova a modificare i filtri di ricerca</p>
							</div>
						) : (
							<div className="table-container">
								<table className="reservations-table">
									<thead>
										<tr>
											<th>ID Prenotazione</th>
											<th>Location</th>
											<th>Utente</th>
											<th>Data</th>
											<th>Orario</th>
											<th>Capacità</th>
											<th>Importo</th>
											<th>Pagamento</th>
											<th>Stripe ID</th>
										</tr>
									</thead>
									<tbody>
										{paramsReservations.map((reservation) => (
											<tr key={reservation._id} className={changedReservations.has(reservation._id) ? 'row-modified' : ''}>
												<td>
													<Link to={`/reservations/${reservation._id}`} className="reservation-link">
														<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
															<path d="M1.146 1.146a.5.5 0 01.708 0L7 6.293l5.146-5.147a.5.5 0 01.708.708L7.707 7l5.147 5.146a.5.5 0 01-.708.708L7 7.707l-5.146 5.147a.5.5 0 01-.708-.708L6.293 7 1.146 1.854a.5.5 0 010-.708z"/>
														</svg>
														{reservation._id.slice(-8)}
													</Link>
												</td>
												<td className="clickable-cell location-name" onClick={() => navigate(`/locations/${reservation.locationId}`)}>
													<div className="location-info">
														<svg className="location-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
															<path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
														</svg>
														{reservation.locationName || reservation.locationId}
													</div>
												</td>
												<td className="clickable-cell user-name" onClick={() => navigate(`/users/${reservation.userId}`)}>
													<div className="user-info">
														<span className="user-avatar">
															{reservation.userName ? reservation.userName.charAt(0).toUpperCase() : 'U'}
														</span>
														{reservation.userName || reservation.userId}
													</div>
												</td>
												<td className="date-cell">
													<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="date-icon">
														<path d="M3.5 0a.5.5 0 01.5.5V1h6V.5a.5.5 0 011 0V1h1a2 2 0 012 2v10a2 2 0 01-2 2H2a2 2 0 01-2-2V3a2 2 0 012-2h1V.5a.5.5 0 01.5-.5zM1 4v9a1 1 0 001 1h10a1 1 0 001-1V4H1z"/>
													</svg>
													{formatDate(reservation.startDate)}
												</td>
												<td className="time-cell">
													<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="time-icon">
														<path d="M7 0a7 7 0 110 14A7 7 0 017 0zM7 1a6 6 0 100 12A6 6 0 007 1zm.5 2.5v4.293l2.646 2.647a.5.5 0 01-.707.707l-3-3A.5.5 0 016.5 8V3.5a.5.5 0 011 0z"/>
													</svg>
													{reservation.timeSlot.start} - {reservation.timeSlot.end}
												</td>
												<td className="capacity-cell">
													<span className="capacity-badge">{reservation.capacity} persone</span>
												</td>
												<td className="amount-cell">{formatCurrency(reservation.amount)}</td>
												<td>
													<select
														value={reservation.payment}
														onChange={(e) => handleReservationChange(reservation._id, 'payment', e.target.value as 'SUCCESS' | 'REFUNDED')}
														className={`payment-select ${reservation.payment === 'SUCCESS' ? 'success' : 'refunded'}`}
													>
														<option value="SUCCESS">Completato</option>
														<option value="REFUNDED">Rimborsato</option>
													</select>
												</td>
												<td className="stripe-id">{reservation.stripeId || '-'}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>

					{changedReservations.size > 0 && (
						<div className="changes-panel">
							<div className="changes-header">
								<h3 className="changes-title">Modifiche non salvate</h3>
								<button 
									className="close-button"
									onClick={() => {
										setChangedReservations(new Set());
										setParamsReservations([...reservations]);
									}}
									aria-label="Annulla modifiche"
								>
									×
								</button>
							</div>
							<div className="changed-reservations">
								{Array.from(changedReservations).map(reservationId => {
									const reservation = paramsReservations.find(r => r._id === reservationId);
									const original = reservations.find(r => r._id === reservationId);
									return (
										<div key={reservationId} className="changed-reservation-item">
											<span className="changed-reservation-id">
												Prenotazione #{reservationId.slice(-8)}
											</span>
											{original && reservation && original.payment !== reservation.payment && (
												<span className="change-badge">
													Pagamento: {reservation.payment === 'SUCCESS' ? 'Completato' : 'Rimborsato'}
												</span>
											)}
										</div>
									);
								})}
							</div>
							<div className="changes-actions">
								<button 
									className="button button-secondary"
									onClick={() => {
										setChangedReservations(new Set());
										setParamsReservations([...reservations]);
									}}
								>
									Annulla
								</button>
								<button 
									className="button button-primary"
									onClick={handleSaveChanges}
									disabled={isSaving}
								>
									{isSaving ? (
										<>
											<span className="button-spinner"></span>
											Salvataggio...
										</>
									) : (
										'Salva modifiche'
									)}
								</button>
							</div>
						</div>
					)}

					{totalPages > 1 && (
						<div className="pagination">
							<button
								className="pagination-button"
								disabled={params.page === 1}
								onClick={() => handlePageChange((params.page || 1) - 1)}
								aria-label="Pagina precedente"
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
									<path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
								</svg>
								Precedente
							</button>
							
							<div className="pagination-info">
								<span className="page-numbers">
									Pagina {params.page} di {totalPages}
								</span>
								<div className="page-dots">
									{[...Array(Math.min(totalPages, 5))].map((_, i) => {
										let pageNum;
										if (totalPages <= 5) {
											pageNum = i + 1;
										} else if (params.page! <= 3) {
											pageNum = i + 1;
										} else if (params.page! >= totalPages - 2) {
											pageNum = totalPages - 4 + i;
										} else {
											pageNum = params.page! - 2 + i;
										}
										
										return (
											<button
												key={i}
												className={`page-dot ${pageNum === params.page ? 'active' : ''}`}
												onClick={() => handlePageChange(pageNum)}
												aria-label={`Vai a pagina ${pageNum}`}
											>
												{pageNum}
											</button>
										);
									})}
								</div>
							</div>
							
							<button
								className="pagination-button"
								disabled={(params.page || 1) >= totalPages}
								onClick={() => handlePageChange((params.page || 1) + 1)}
								aria-label="Pagina successiva"
							>
								Successiva
								<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
									<path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
								</svg>
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default ReservationsPage;