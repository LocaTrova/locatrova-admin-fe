import './home.css';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface ActivityItem {
  id: number;
  type: string;
  message: string;
  time: string;
}

const HomePage: React.FC = () => {
  const [stats, setStats] = useState({
    users: 0,
    locations: 0,
    reservations: 0,
    revenue: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Simulated data - replace with actual API calls
    setStats({
      users: 1234,
      locations: 89,
      reservations: 456,
      revenue: 125430
    });

    setRecentActivity([
      { id: 1, type: 'reservation', message: 'Nuova prenotazione per Villa Paradiso', time: '5 minuti fa' },
      { id: 2, type: 'user', message: 'Nuovo utente registrato: Mario Rossi', time: '15 minuti fa' },
      { id: 3, type: 'location', message: 'Location aggiornata: Casa del Mare', time: '1 ora fa' },
      { id: 4, type: 'payment', message: 'Pagamento ricevuto: €450', time: '2 ore fa' },
    ]);
  }, []);

  const quickActions = [
    { title: 'Aggiungi Location', link: '/location/create', icon: '➕', color: 'primary' },
    { title: 'Nuova Prenotazione', link: '/reservations', icon: '📅', color: 'success' },
    { title: 'Gestisci Utenti', link: '/users', icon: '👥', color: 'info' },
    { title: 'Importa Dati', link: '/scraping', icon: '🔄', color: 'warning' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Benvenuto nel pannello di amministrazione LocaTrova</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users-icon">👥</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.users.toLocaleString('it-IT')}</h3>
            <p className="stat-label">Utenti Totali</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon locations-icon">📍</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.locations}</h3>
            <p className="stat-label">Location Attive</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon reservations-icon">📅</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.reservations}</h3>
            <p className="stat-label">Prenotazioni</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon revenue-icon">💰</div>
          <div className="stat-content">
            <h3 className="stat-value">{formatCurrency(stats.revenue)}</h3>
            <p className="stat-label">Entrate Totali</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <h2 className="section-title">Azioni Rapide</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className={`quick-action-card ${action.color}`}
            >
              <span className="quick-action-icon" aria-hidden="true">{action.icon}</span>
              <span className="quick-action-title">{action.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="dashboard-section">
        <h2 className="section-title">Attività Recente</h2>
        <div className="activity-list">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className={`activity-icon ${activity.type}`}>
                {activity.type === 'reservation' && '📅'}
                {activity.type === 'user' && '👤'}
                {activity.type === 'location' && '📍'}
                {activity.type === 'payment' && '💳'}
              </div>
              <div className="activity-content">
                <p className="activity-message">{activity.message}</p>
                <p className="activity-time">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* System Status */}
      <section className="dashboard-section">
        <h2 className="section-title">Stato del Sistema</h2>
        <div className="system-status">
          <div className="status-item">
            <span className="status-indicator success"></span>
            <span className="status-label">Database: Operativo</span>
          </div>
          <div className="status-item">
            <span className="status-indicator success"></span>
            <span className="status-label">API: Operativo</span>
          </div>
          <div className="status-item">
            <span className="status-indicator warning"></span>
            <span className="status-label">Backup: Ultimo backup 2 ore fa</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;