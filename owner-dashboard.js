// Owner Dashboard Logic

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3010/api' 
    : 'http://92.112.184.224:3010/api';

// Mock owner ID - in production, get from auth session
const OWNER_ID = 'owner1';

let myBillboards = [];
let myBookings = [];

// Load owner data
async function loadDashboard() {
    try {
        // Fetch all billboards
        const billboardsRes = await fetch(`${API_BASE}/billboards`);
        const allBillboards = await billboardsRes.json();
        
        // Filter by owner
        myBillboards = allBillboards.filter(b => b.ownerId === OWNER_ID);
        
        // Fetch bookings for my billboards
        const bookingsRes = await fetch(`${API_BASE}/bookings`);
        const allBookings = await bookingsRes.json();
        
        myBookings = allBookings.filter(b => {
            const billboard = myBillboards.find(bb => bb.id === b.billboardId);
            return billboard !== undefined;
        });
        
        updateStats();
        renderInventory();
        renderBookings();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Update stats cards
function updateStats() {
    // Calculate total revenue
    const confirmedBookings = myBookings.filter(b => b.status === 'confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, b) => {
        const ownerShare = b.pricing.subtotal; // 80% (owner keeps subtotal, platform takes fee)
        return sum + ownerShare;
    }, 0);
    
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(0)}`;
    document.getElementById('activeBookings').textContent = confirmedBookings.length;
    document.getElementById('totalBillboards').textContent = myBillboards.length;
    
    // Calculate utilization (simplified)
    const hoursBooked = myBookings.reduce((sum, b) => sum + b.duration, 0);
    const totalHoursAvailable = myBillboards.length * 24 * 30; // 30 days
    const utilization = totalHoursAvailable > 0 ? (hoursBooked / totalHoursAvailable * 100) : 0;
    
    document.getElementById('utilization').textContent = `${utilization.toFixed(1)}%`;
}

// Render inventory list
function renderInventory() {
    const container = document.getElementById('inventoryList');
    
    if (myBillboards.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-billboard text-4xl mb-4"></i>
                <p>No billboards yet. Add your first billboard to get started.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myBillboards.map(billboard => `
        <div class="border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition">
            <div class="flex items-center space-x-4">
                <img src="${billboard.image}" alt="${billboard.name}" class="w-24 h-24 object-cover rounded">
                <div>
                    <h3 class="font-bold text-lg">${billboard.name}</h3>
                    <p class="text-sm text-gray-600">${billboard.location}</p>
                    <p class="text-xs text-gray-500">${billboard.impressions}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-2xl font-bold text-gray-900">$${billboard.price}<span class="text-sm text-gray-500">/hr</span></p>
                <p class="text-sm text-green-600">
                    <i class="fas fa-circle text-xs"></i> Available
                </p>
                <div class="mt-2 space-x-2">
                    <button class="text-blue-600 hover:underline text-sm">Edit</button>
                    <button class="text-gray-600 hover:underline text-sm">Analytics</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Render bookings list
function renderBookings() {
    const container = document.getElementById('bookingsList');
    
    if (myBookings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-calendar-times text-4xl mb-4"></i>
                <p>No bookings yet.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billboard</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creative</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${myBookings.map(booking => `
                        <tr>
                            <td class="px-6 py-4">
                                <div class="font-medium text-gray-900">${booking.campaignName}</div>
                                <div class="text-sm text-gray-500">${booking.customerName}</div>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-900">
                                ${booking.billboardName}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${booking.startDate}<br>${booking.startTime} (${booking.duration}h)
                            </td>
                            <td class="px-6 py-4">
                                ${booking.creativeUrl ? `<img src="${booking.creativeUrl}" class="w-16 h-16 object-cover rounded cursor-pointer" onclick="viewCreative('${booking.creativeUrl}')">` : '<span class="text-gray-400 text-xs">No creative</span>'}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                ${getApprovalBadge(booking.approvalStatus)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="font-semibold text-green-600">$${booking.pricing.subtotal.toFixed(2)}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                ${booking.approvalStatus === 'pending_review' ? `
                                    <button onclick="reviewCreative(${booking.id})" class="text-blue-600 hover:underline">Review</button>
                                ` : booking.approvalStatus === 'approved' ? `
                                    <span class="text-green-600">✓ Approved</span>
                                ` : booking.approvalStatus === 'rejected' ? `
                                    <span class="text-red-600">✗ Rejected</span>
                                ` : '—'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getApprovalBadge(status) {
    const badges = {
        'pending': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Pending</span>',
        'pending_review': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Needs Review</span>',
        'approved': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>',
        'rejected': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>'
    };
    return badges[status] || status;
}

function viewCreative(url) {
    window.open(url, '_blank');
}

async function reviewCreative(bookingId) {
    const booking = myBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const modal = `
        <div id="reviewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-3xl w-full mx-4">
                <h2 class="text-2xl font-bold mb-4">Review Creative</h2>
                <div class="mb-4">
                    <p class="text-sm text-gray-600 mb-2"><strong>Campaign:</strong> ${booking.campaignName}</p>
                    <p class="text-sm text-gray-600 mb-2"><strong>Customer:</strong> ${booking.customerName}</p>
                    <p class="text-sm text-gray-600 mb-4"><strong>Billboard:</strong> ${booking.billboardName}</p>
                    <img src="${booking.creativeUrl}" class="w-full max-h-96 object-contain border rounded mb-4">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                    <textarea id="approvalNotes" class="w-full border border-gray-300 rounded-lg px-3 py-2" rows="3" placeholder="Add any feedback or notes..."></textarea>
                </div>
                <div class="flex space-x-4">
                    <button onclick="approveCreative(${bookingId}, true)" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                        ✓ Approve
                    </button>
                    <button onclick="approveCreative(${bookingId}, false)" class="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                        ✗ Reject
                    </button>
                    <button onclick="closeReviewModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

async function approveCreative(bookingId, approved) {
    const notes = document.getElementById('approvalNotes').value;
    
    try {
        const response = await fetch(`${API_BASE}/bookings/${bookingId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ approved, notes })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(approved ? '✅ Creative approved!' : '❌ Creative rejected');
            closeReviewModal();
            loadDashboard(); // Reload to show updated status
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update approval status');
    }
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) modal.remove();
}

function getStatusBadge(status) {
    const badges = {
        'pending_payment': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Payment</span>',
        'confirmed': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Confirmed</span>',
        'active': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Active</span>',
        'completed': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Completed</span>',
        'cancelled': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>'
    };
    return badges[status] || status;
}

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    ['inventory', 'bookings', 'analytics'].forEach(tab => {
        document.getElementById(`content-${tab}`).classList.add('hidden');
        document.getElementById(`tab-${tab}`).classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        document.getElementById(`tab-${tab}`).classList.add('text-gray-600');
    });
    
    // Show selected tab
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
    document.getElementById(`tab-${tabName}`).classList.remove('text-gray-600');
}

// Modal controls
function showAddBillboardModal() {
    document.getElementById('addBillboardModal').classList.remove('hidden');
}

function closeAddBillboardModal() {
    document.getElementById('addBillboardModal').classList.add('hidden');
}

function handleAddBillboard(event) {
    event.preventDefault();
    alert('Billboard creation coming soon! In production, this would:\n1. Upload billboard data to API\n2. Upload photos\n3. Set pricing & availability\n4. Go live on marketplace');
    closeAddBillboardModal();
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});
