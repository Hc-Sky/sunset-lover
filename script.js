// Sunset Lover App - Main JavaScript File

class SunsetLoverApp {
    constructor() {
        this.spots = JSON.parse(localStorage.getItem('sunsetSpots')) || [];
        this.routes = JSON.parse(localStorage.getItem('panoramicRoutes')) || [];
        this.currentTab = 'spots';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderSpots();
        this.renderRoutes();
        this.showTab('spots');
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.dataset.tab;
                this.showTab(tab);
            });
        });

        // Spot form events
        document.getElementById('add-spot-btn').addEventListener('click', () => {
            this.showSpotForm();
        });
        
        document.getElementById('cancel-spot-btn').addEventListener('click', () => {
            this.hideSpotForm();
        });
        
        document.getElementById('spot-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSpot();
        });

        // Route form events
        document.getElementById('add-route-btn').addEventListener('click', () => {
            this.showRouteForm();
        });
        
        document.getElementById('cancel-route-btn').addEventListener('click', () => {
            this.hideRouteForm();
        });
        
        document.getElementById('route-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRoute();
        });
    }

    showTab(tabName) {
        // Update tab links
        document.querySelectorAll('.tab-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
    }

    // Spot Management
    showSpotForm() {
        document.getElementById('spot-form').classList.remove('hidden');
        document.getElementById('spot-name').focus();
    }

    hideSpotForm() {
        document.getElementById('spot-form').classList.add('hidden');
        document.getElementById('spot-form-element').reset();
    }

    addSpot() {
        const name = document.getElementById('spot-name').value;
        const type = document.getElementById('spot-type').value;
        const latitude = parseFloat(document.getElementById('spot-latitude').value);
        const longitude = parseFloat(document.getElementById('spot-longitude').value);
        const description = document.getElementById('spot-description').value;

        const spot = {
            id: Date.now(),
            name,
            type,
            latitude,
            longitude,
            description,
            createdAt: new Date().toISOString()
        };

        this.spots.push(spot);
        this.saveSpots();
        this.renderSpots();
        this.hideSpotForm();
        
        // Show success message
        this.showNotification('Spot ajouté avec succès!', 'success');
    }

    deleteSpot(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce spot?')) {
            this.spots = this.spots.filter(spot => spot.id !== id);
            this.saveSpots();
            this.renderSpots();
            this.showNotification('Spot supprimé avec succès!', 'success');
        }
    }

    renderSpots() {
        const container = document.getElementById('spots-list');
        
        if (this.spots.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sun"></i>
                    <h3>Aucun spot ajouté</h3>
                    <p>Commencez par ajouter votre premier spot de lever ou coucher de soleil!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.spots.map(spot => this.createSpotCard(spot)).join('');
    }

    createSpotCard(spot) {
        const typeLabels = {
            sunrise: 'Lever de soleil',
            sunset: 'Coucher de soleil',
            both: 'Lever & Coucher'
        };

        const typeIcons = {
            sunrise: 'fa-sunrise',
            sunset: 'fa-sunset',
            both: 'fa-sun'
        };

        const sunTimes = this.calculateSunTimes(spot.latitude, spot.longitude);

        return `
            <div class="item-card">
                <h3>
                    <i class="fas ${typeIcons[spot.type]}"></i>
                    ${spot.name}
                </h3>
                <div class="item-type">${typeLabels[spot.type]}</div>
                
                <div class="item-coordinates">
                    <i class="fas fa-map-marker-alt"></i>
                    ${spot.latitude.toFixed(6)}, ${spot.longitude.toFixed(6)}
                </div>
                
                ${spot.description ? `<div class="item-description">${spot.description}</div>` : ''}
                
                <div class="sun-times">
                    <h4><i class="fas fa-clock"></i> Horaires du soleil (aujourd'hui)</h4>
                    <div class="sun-time">
                        <span><i class="fas fa-sunrise"></i> Lever:</span>
                        <strong>${sunTimes.sunrise}</strong>
                    </div>
                    <div class="sun-time">
                        <span><i class="fas fa-sunset"></i> Coucher:</span>
                        <strong>${sunTimes.sunset}</strong>
                    </div>
                </div>
                
                <div class="item-meta">
                    <i class="fas fa-calendar"></i>
                    Ajouté le ${new Date(spot.createdAt).toLocaleDateString('fr-FR')}
                </div>
                
                <div class="item-actions">
                    <button class="btn btn-danger btn-small" onclick="app.deleteSpot(${spot.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;
    }

    // Route Management
    showRouteForm() {
        document.getElementById('route-form').classList.remove('hidden');
        document.getElementById('route-name').focus();
    }

    hideRouteForm() {
        document.getElementById('route-form').classList.add('hidden');
        document.getElementById('route-form-element').reset();
    }

    addRoute() {
        const name = document.getElementById('route-name').value;
        const type = document.getElementById('route-type').value;
        const startLat = parseFloat(document.getElementById('route-start-lat').value);
        const startLng = parseFloat(document.getElementById('route-start-lng').value);
        const endLat = parseFloat(document.getElementById('route-end-lat').value);
        const endLng = parseFloat(document.getElementById('route-end-lng').value);
        const difficulty = document.getElementById('route-difficulty').value;
        const length = parseFloat(document.getElementById('route-length').value) || 0;
        const description = document.getElementById('route-description').value;

        const route = {
            id: Date.now(),
            name,
            type,
            startCoordinates: { latitude: startLat, longitude: startLng },
            endCoordinates: { latitude: endLat, longitude: endLng },
            difficulty,
            length,
            description,
            createdAt: new Date().toISOString()
        };

        this.routes.push(route);
        this.saveRoutes();
        this.renderRoutes();
        this.hideRouteForm();
        
        this.showNotification('Route ajoutée avec succès!', 'success');
    }

    deleteRoute(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette route?')) {
            this.routes = this.routes.filter(route => route.id !== id);
            this.saveRoutes();
            this.renderRoutes();
            this.showNotification('Route supprimée avec succès!', 'success');
        }
    }

    renderRoutes() {
        const container = document.getElementById('routes-list');
        
        if (this.routes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-route"></i>
                    <h3>Aucune route ajoutée</h3>
                    <p>Ajoutez votre première route panoramique, col ou serpentine!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.routes.map(route => this.createRouteCard(route)).join('');
    }

    createRouteCard(route) {
        const typeLabels = {
            col: 'Col de montagne',
            serpentin: 'Route serpentine',
            scenic: 'Route panoramique'
        };

        const typeIcons = {
            col: 'fa-mountain',
            serpentin: 'fa-route',
            scenic: 'fa-road'
        };

        const difficultyLabels = {
            easy: 'Facile',
            medium: 'Modérée',
            hard: 'Difficile'
        };

        const difficultyColors = {
            easy: '#28a745',
            medium: '#ffc107',
            hard: '#dc3545'
        };

        const distance = this.calculateDistance(
            route.startCoordinates.latitude,
            route.startCoordinates.longitude,
            route.endCoordinates.latitude,
            route.endCoordinates.longitude
        );

        return `
            <div class="item-card">
                <h3>
                    <i class="fas ${typeIcons[route.type]}"></i>
                    ${route.name}
                </h3>
                <div class="item-type">${typeLabels[route.type]}</div>
                
                <div class="item-meta">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0;">
                        <span>Difficulté:</span>
                        <span style="background: ${difficultyColors[route.difficulty]}; color: white; padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.8rem;">
                            ${difficultyLabels[route.difficulty]}
                        </span>
                    </div>
                    ${route.length > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                            <span><i class="fas fa-ruler"></i> Distance:</span>
                            <strong>${route.length} km</strong>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                        <span><i class="fas fa-map-pin"></i> Distance directe:</span>
                        <strong>${distance.toFixed(1)} km</strong>
                    </div>
                </div>
                
                <div class="item-coordinates">
                    <div><strong>Départ:</strong> ${route.startCoordinates.latitude.toFixed(6)}, ${route.startCoordinates.longitude.toFixed(6)}</div>
                    <div><strong>Arrivée:</strong> ${route.endCoordinates.latitude.toFixed(6)}, ${route.endCoordinates.longitude.toFixed(6)}</div>
                </div>
                
                ${route.description ? `<div class="item-description">${route.description}</div>` : ''}
                
                <div class="item-meta">
                    <i class="fas fa-calendar"></i>
                    Ajouté le ${new Date(route.createdAt).toLocaleDateString('fr-FR')}
                </div>
                
                <div class="item-actions">
                    <button class="btn btn-danger btn-small" onclick="app.deleteRoute(${route.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;
    }

    // Utility Functions
    calculateSunTimes(latitude, longitude) {
        // Simplified sun time calculation (approximate)
        // In a real app, you'd use a proper solar calculation library
        const now = new Date();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        
        // Approximate equation of time and solar declination
        const P = Math.asin(.39795 * Math.cos(.98563 * (dayOfYear - 173) * Math.PI / 180));
        const argument = -Math.tan(latitude * Math.PI / 180) * Math.tan(P);
        
        let sunrise, sunset;
        
        if (argument < -1) {
            sunrise = "00:00";
            sunset = "23:59";
        } else if (argument > 1) {
            sunrise = "N/A";
            sunset = "N/A";
        } else {
            const hourAngle = 12 * Math.acos(argument) / Math.PI;
            const sunriseDecimal = 12 - hourAngle - longitude / 15;
            const sunsetDecimal = 12 + hourAngle - longitude / 15;
            
            sunrise = this.decimalToTime(sunriseDecimal);
            sunset = this.decimalToTime(sunsetDecimal);
        }
        
        return { sunrise, sunset };
    }

    decimalToTime(decimal) {
        if (decimal < 0 || decimal > 24) return "N/A";
        
        const hours = Math.floor(decimal);
        const minutes = Math.floor((decimal - hours) * 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula for calculating distance between two points
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Storage Functions
    saveSpots() {
        localStorage.setItem('sunsetSpots', JSON.stringify(this.spots));
    }

    saveRoutes() {
        localStorage.setItem('panoramicRoutes', JSON.stringify(this.routes));
    }

    // Notification System
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SunsetLoverApp();
});

// Add some sample data for demonstration
document.addEventListener('DOMContentLoaded', () => {
    // Add sample data if localStorage is empty
    setTimeout(() => {
        if (window.app && window.app.spots.length === 0 && window.app.routes.length === 0) {
            // Add sample spots
            window.app.spots = [
                {
                    id: 1,
                    name: "Mont Blanc - Aiguille du Midi",
                    type: "both",
                    latitude: 45.8797,
                    longitude: 6.8875,
                    description: "Vue exceptionnelle sur le massif du Mont Blanc. Accessible par téléphérique.",
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 2,
                    name: "Étretat - Falaises",
                    type: "sunset",
                    latitude: 49.7073,
                    longitude: 0.2049,
                    description: "Couchers de soleil spectaculaires sur les falaises normandes.",
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            
            // Add sample routes
            window.app.routes = [
                {
                    id: 1,
                    name: "Route des Grands Cols",
                    type: "col",
                    startCoordinates: { latitude: 45.0515, longitude: 6.0665 },
                    endCoordinates: { latitude: 45.2333, longitude: 6.8000 },
                    difficulty: "hard",
                    length: 87.5,
                    description: "Route mythique traversant plusieurs cols alpins avec des vues imprenables.",
                    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 2,
                    name: "Serpentines du Verdon",
                    type: "serpentin",
                    startCoordinates: { latitude: 43.7631, longitude: 6.3733 },
                    endCoordinates: { latitude: 43.7089, longitude: 6.2173 },
                    difficulty: "medium",
                    length: 23.2,
                    description: "Route serpentine offrant des vues sur les gorges du Verdon.",
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            
            window.app.saveSpots();
            window.app.saveRoutes();
            window.app.renderSpots();
            window.app.renderRoutes();
        }
    }, 1000);
});