const API_BASE = 'http://localhost:3000/api';

// Get parent dashboard data
async function getParentDashboard() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/parents/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Get dashboard error:', error);
        throw error;
    }
}

// Update parent profile
async function updateParentProfile(profileData) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/parents/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}

// Upload document
async function uploadDocument(file, type) {
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', type);

        const response = await fetch(`${API_BASE}/parents/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Upload document error:', error);
        throw error;
    }
}

// Request visit reschedule
async function requestReschedule(visitId, requestedDate, reason) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/visits/reschedule`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                visitId,
                requestedDate,
                reason
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Reschedule error:', error);
        throw error;
    }
}

// Get scheduled visits
async function getScheduledVisits() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/visits/parent`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Get visits error:', error);
        throw error;
    }
}