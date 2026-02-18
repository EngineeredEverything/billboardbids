// API Configuration
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3010/api' 
    : 'http://92.112.184.224:3010/api';

let billboards = [];

// Fetch billboards from API
async function loadBillboards() {
    try {
        const response = await fetch(`${API_BASE}/billboards`);
        billboards = await response.json();
        return billboards;
    } catch (error) {
        console.error('Error loading billboards:', error);
        // Fallback to local data if API unavailable
        return getFallbackBillboards();
    }
}

function getFallbackBillboards() {
    return [
        {
            id: 1,
            name: "I-10 East Commuter",
            location: "Los Angeles, CA",
            address: "I-10 Eastbound, Mile 23",
            traffic: "Commuter Traffic",
            impressions: "85K daily impressions",
            price: 75,
            image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop",
            available: true,
            specs: "14' x 48' Digital LED",
            rotation: "15 second rotation (4x per minute)"
        },
        {
            id: 2,
            name: "Downtown Austin Prime",
            location: "Austin, TX",
            address: "6th Street & Congress Ave",
            traffic: "Downtown",
            impressions: "120K daily impressions",
            price: 150,
            image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
            available: true,
            specs: "20' x 60' Digital LED",
            rotation: "10 second rotation (6x per minute)"
        },
        {
            id: 3,
            name: "Highway 95 Southbound",
            location: "Miami, FL",
            address: "I-95 Southbound, Exit 12",
            traffic: "Highway",
            impressions: "95K daily impressions",
            price: 65,
            image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop",
            available: true,
            specs: "12' x 40' Digital LED",
            rotation: "20 second rotation (3x per minute)"
        },
        {
            id: 4,
            name: "Denver Tech Center",
            location: "Denver, CO",
            address: "I-25 & Belleview Ave",
            traffic: "Commuter Traffic",
            impressions: "70K daily impressions",
            price: 55,
            image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop",
            available: true,
            specs: "14' x 48' Digital LED",
            rotation: "15 second rotation (4x per minute)"
        },
        {
            id: 5,
            name: "Sunset Blvd Premium",
            location: "Los Angeles, CA",
            address: "Sunset Blvd & Vine St",
            traffic: "Downtown",
            impressions: "200K daily impressions",
            price: 250,
            image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop",
            available: true,
            specs: "30' x 80' Digital LED",
            rotation: "8 second rotation (7x per minute)"
        },
        {
            id: 6,
            name: "Highway 183 North",
            location: "Austin, TX",
            address: "US-183 Northbound, Exit 45",
            traffic: "Highway",
            impressions: "60K daily impressions",
            price: 45,
            image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=300&fit=crop",
            available: true,
            specs: "12' x 36' Digital LED",
            rotation: "20 second rotation (3x per minute)"
        }
    ];
}

async function showBillboards() {
    document.getElementById('filterBar').style.display = 'block';
    document.getElementById('billboardGrid').style.display = 'block';
    
    if (billboards.length === 0) {
        billboards = await loadBillboards();
    }
    
    renderBillboards(billboards);
    document.getElementById('billboardGrid').scrollIntoView({ behavior: 'smooth' });
}

function renderBillboards(data) {
    const container = document.getElementById('billboards');
    container.innerHTML = data.map(billboard => `
        <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer active:scale-[0.98] transform" onclick="openBookingModal(${billboard.id})">
            <div class="relative">
                <img src="${billboard.image}" alt="${billboard.name}" class="w-full h-48 sm:h-56 object-cover">
                <div class="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                    Available
                </div>
            </div>
            <div class="p-4 sm:p-5">
                <h3 class="font-bold text-lg sm:text-xl text-gray-900 mb-2">${billboard.name}</h3>
                <p class="text-sm sm:text-base text-gray-600 mb-1.5"><i class="fas fa-map-marker-alt mr-2"></i>${billboard.location}</p>
                <p class="text-xs sm:text-sm text-gray-500 mb-3">${billboard.address}</p>
                <div class="flex items-center justify-between mb-3 sm:mb-4">
                    <span class="text-xs sm:text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-medium">${billboard.traffic}</span>
                    <span class="text-xs sm:text-sm text-gray-600"><i class="fas fa-eye mr-1.5"></i>${billboard.impressions}</span>
                </div>
                <div class="border-t-2 pt-3 sm:pt-4 flex items-center justify-between">
                    <div>
                        <span class="text-2xl sm:text-3xl font-bold text-gray-900">$${billboard.price}</span>
                        <span class="text-sm sm:text-base text-gray-500">/hour</span>
                    </div>
                    <button class="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 font-bold text-sm sm:text-base transition-colors">
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openBookingModal(billboardId) {
    const billboard = billboards.find(b => b.id === billboardId);
    if (!billboard) return;
    
    const modal = document.getElementById('bookingModal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <div class="mb-5 sm:mb-6">
            <img src="${billboard.image}" alt="${billboard.name}" class="w-full h-48 sm:h-56 object-cover rounded-lg mb-4">
            <h3 class="text-xl sm:text-2xl font-bold mb-3">${billboard.name}</h3>
            <p class="text-base text-gray-600 mb-2"><i class="fas fa-map-marker-alt mr-2"></i>${billboard.address}</p>
            <p class="text-base text-gray-600 mb-2"><i class="fas fa-eye mr-2"></i>${billboard.impressions}</p>
            <p class="text-sm sm:text-base text-gray-600 mb-4"><i class="fas fa-tv mr-2"></i>${billboard.specs} • ${billboard.rotation}</p>
        </div>
        
        <form id="bookingForm" onsubmit="handleBooking(event, ${billboardId})">
            <div class="mb-4 sm:mb-5">
                <label class="block text-sm sm:text-base font-medium text-gray-700 mb-2">Campaign Name</label>
                <input type="text" id="campaignName" required class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="e.g., Grand Opening Sale">
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-5">
                <div>
                    <label class="block text-sm sm:text-base font-medium text-gray-700 mb-2">Start Date</label>
                    <input type="date" id="startDate" required class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" onchange="updatePriceAI(${billboard.id}, ${billboard.price})">
                </div>
                <div>
                    <label class="block text-sm sm:text-base font-medium text-gray-700 mb-2">Start Time</label>
                    <input type="time" id="startTime" required class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" onchange="updatePriceAI(${billboard.id}, ${billboard.price})">
                </div>
            </div>
            
            <div class="mb-4 sm:mb-5">
                <label class="block text-sm sm:text-base font-medium text-gray-700 mb-2">Duration (hours)</label>
                <select id="duration" onchange="updatePriceAI(${billboard.id}, ${billboard.price})" class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition">
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="4">4 hours</option>
                    <option value="8">8 hours (full day)</option>
                    <option value="24">24 hours</option>
                </select>
            </div>
            
            <div class="mb-4 sm:mb-5">
                <label class="block text-sm sm:text-base font-medium text-gray-700 mb-2">Your Email</label>
                <input type="email" id="customerEmail" required class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="you@example.com">
            </div>
            
            <div class="mb-4 sm:mb-5">
                <label class="block text-sm sm:text-base font-medium text-gray-700 mb-2">Your Name</label>
                <input type="text" id="customerName" required class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="John Doe">
            </div>
            
            <div class="mb-4 sm:mb-5">
                <label class="block text-sm sm:text-base font-medium text-gray-700 mb-2">Upload Creative (JPG/PNG) *</label>
                <input type="file" id="creativeFile" accept="image/*" required class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onchange="previewCreative(event)">
                <p class="text-sm text-gray-500 mt-2">Recommended: ${billboard.specs.split(' ')[0]} ${billboard.specs.split(' ')[2]} aspect ratio (Max 10MB)</p>
                <div id="creativePreview" class="mt-3 hidden">
                    <img id="previewImage" class="w-full max-h-48 sm:max-h-64 object-contain border-2 rounded-lg">
                </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4 sm:p-5 mb-5 sm:mb-6">
                <div class="flex justify-between mb-3">
                    <span class="text-sm sm:text-base text-gray-600">Base Rate</span>
                    <span class="text-base sm:text-lg font-semibold">$${billboard.price}/hour</span>
                </div>
                <div id="aiPricingInfo" class="mb-3" style="display: none;">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-sm sm:text-base text-gray-600">🤖 AI Smart Rate</span>
                        <span class="text-base sm:text-lg font-semibold text-blue-600" id="aiRate">-</span>
                    </div>
                    <div class="text-xs sm:text-sm text-gray-500 italic leading-snug" id="aiReason">-</div>
                </div>
                <div class="flex justify-between mb-3">
                    <span class="text-sm sm:text-base text-gray-600">Duration</span>
                    <span class="text-base sm:text-lg font-semibold" id="durationDisplay">1 hour</span>
                </div>
                <div class="flex justify-between mb-3">
                    <span class="text-sm sm:text-base text-gray-600">Subtotal</span>
                    <span class="text-base sm:text-lg font-semibold" id="subtotal">$${billboard.price}</span>
                </div>
                <div class="flex justify-between mb-3">
                    <span class="text-sm sm:text-base text-gray-600">Platform Fee (20%)</span>
                    <span class="text-base sm:text-lg font-semibold" id="fee">$${(billboard.price * 0.2).toFixed(2)}</span>
                </div>
                <div class="border-t-2 pt-3 mt-1">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-lg sm:text-xl">Total</span>
                        <span class="font-bold text-xl sm:text-2xl text-blue-600" id="total">$${(billboard.price * 1.2).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="mb-5 sm:mb-6">
                <label class="flex items-start cursor-pointer">
                    <input type="checkbox" required class="mt-1 mr-3 w-5 h-5 flex-shrink-0 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                    <span class="text-sm sm:text-base text-gray-600 leading-relaxed">I agree to the <a href="#" class="text-blue-600 hover:underline font-medium">Terms of Service</a> and understand that my creative will be reviewed for approval within 4 hours.</span>
                </label>
            </div>
            
            <div class="sticky bottom-0 sm:static bg-white sm:bg-transparent py-4 sm:py-0 -mx-4 sm:mx-0 px-4 sm:px-0 border-t sm:border-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:shadow-none">
                <button type="submit" class="w-full bg-blue-600 text-white py-4 sm:py-3 rounded-lg font-bold hover:bg-blue-700 active:bg-blue-800 text-lg sm:text-xl transition-colors">
                    Create Booking
                </button>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    document.getElementById('startDate').value = dateStr;
    
    // Set default time to 9 AM
    document.getElementById('startTime').value = '09:00';
    
    // Trigger AI pricing with defaults
    setTimeout(() => updatePriceAI(billboard.id, billboard.price), 100);
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.add('hidden');
}

function updatePrice(basePrice) {
    const duration = parseInt(document.getElementById('duration').value);
    const subtotal = basePrice * duration;
    const fee = subtotal * 0.2;
    const total = subtotal + fee;
    
    const hours = duration === 1 ? '1 hour' : `${duration} hours`;
    document.getElementById('durationDisplay').textContent = hours;
    document.getElementById('subtotal').textContent = `$${subtotal}`;
    document.getElementById('fee').textContent = `$${fee.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

async function updatePriceAI(billboardId, basePrice) {
    const date = document.getElementById('startDate')?.value;
    const time = document.getElementById('startTime')?.value;
    const duration = parseInt(document.getElementById('duration')?.value || 1);
    
    // If date/time not filled yet, use base price
    if (!date || !time) {
        updatePrice(basePrice);
        document.getElementById('aiPricingInfo').style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/pricing/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ billboardId, date, time, duration })
        });
        
        const pricing = await response.json();
        
        // Show AI pricing info
        document.getElementById('aiPricingInfo').style.display = 'block';
        document.getElementById('aiRate').textContent = `$${pricing.suggestedPrice}/hr (${pricing.multiplier}x)`;
        document.getElementById('aiReason').textContent = pricing.reason;
        
        // Calculate totals with AI price
        const subtotal = pricing.suggestedPrice * duration;
        const fee = subtotal * 0.2;
        const total = subtotal + fee;
        
        const hours = duration === 1 ? '1 hour' : `${duration} hours`;
        document.getElementById('durationDisplay').textContent = hours;
        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('fee').textContent = `$${fee.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
        
    } catch (error) {
        console.error('AI pricing error, falling back to base price:', error);
        updatePrice(basePrice);
        document.getElementById('aiPricingInfo').style.display = 'none';
    }
}

function previewCreative(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('creativePreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

async function uploadCreative(file) {
    const formData = new FormData();
    formData.append('creative', file);
    
    try {
        const response = await fetch(`${API_BASE}/upload-creative`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            return result.fileUrl;
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

async function handleBooking(event, billboardId) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    try {
        // Upload creative first
        const creativeFile = document.getElementById('creativeFile').files[0];
        if (!creativeFile) {
            alert('❌ Please upload a creative image');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Booking';
            return;
        }
        
        submitBtn.textContent = 'Uploading creative...';
        const creativeUrl = await uploadCreative(creativeFile);
        
        submitBtn.textContent = 'Creating booking...';
        
        const formData = {
            billboardId,
            campaignName: document.getElementById('campaignName').value,
            startDate: document.getElementById('startDate').value,
            startTime: document.getElementById('startTime').value,
            duration: document.getElementById('duration').value,
            customerEmail: document.getElementById('customerEmail').value,
            customerName: document.getElementById('customerName').value,
            creativeUrl: creativeUrl
        };
        
        const response = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Submit creative for review
            await fetch(`${API_BASE}/bookings/${result.booking.id}/creative`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ creativeUrl })
            });
            
            // Redirect to Stripe checkout for payment
            submitBtn.textContent = 'Redirecting to payment...';
            
            const checkoutResponse = await fetch(`${API_BASE}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingId: result.booking.id,
                    amount: result.booking.pricing.total
                })
            });
            
            const checkoutSession = await checkoutResponse.json();
            
            if (checkoutSession.url) {
                // Redirect to Stripe checkout
                window.location.href = checkoutSession.url;
            } else if (checkoutSession.demo) {
                // Demo mode - show info message
                alert(`✅ Booking Created (Demo Mode)\n\nBooking ID: ${result.booking.id}\nTotal: $${result.booking.pricing.total.toFixed(2)}\n\n⚠️ Payment system not configured.\n${checkoutSession.message}\n\n📋 Your creative has been submitted for approval.\n\nConfirmation will be sent to ${formData.customerEmail}`);
                closeBookingModal();
            } else {
                throw new Error('Failed to create payment session');
            }
        } else {
            alert('❌ Error creating booking. Please try again.');
        }
    } catch (error) {
        console.error('Booking error:', error);
        alert('❌ Unable to process booking. Please try again later.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Booking';
    }
}

// Close modal on outside click
document.getElementById('bookingModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeBookingModal();
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadBillboards();
});
