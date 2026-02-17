// Sample billboard data
const billboards = [
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

function showBillboards() {
    document.getElementById('filterBar').style.display = 'block';
    document.getElementById('billboardGrid').style.display = 'block';
    renderBillboards(billboards);
    document.getElementById('billboardGrid').scrollIntoView({ behavior: 'smooth' });
}

function renderBillboards(data) {
    const container = document.getElementById('billboards');
    container.innerHTML = data.map(billboard => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer" onclick="openBookingModal(${billboard.id})">
            <div class="relative">
                <img src="${billboard.image}" alt="${billboard.name}" class="w-full h-48 object-cover">
                <div class="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Available
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg text-gray-900 mb-1">${billboard.name}</h3>
                <p class="text-sm text-gray-600 mb-2"><i class="fas fa-map-marker-alt mr-1"></i>${billboard.location}</p>
                <p class="text-xs text-gray-500 mb-3">${billboard.address}</p>
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${billboard.traffic}</span>
                    <span class="text-xs text-gray-600"><i class="fas fa-eye mr-1"></i>${billboard.impressions}</span>
                </div>
                <div class="border-t pt-3 flex items-center justify-between">
                    <div>
                        <span class="text-2xl font-bold text-gray-900">$${billboard.price}</span>
                        <span class="text-sm text-gray-500">/hour</span>
                    </div>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold">
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
        <div class="mb-6">
            <img src="${billboard.image}" alt="${billboard.name}" class="w-full h-48 object-cover rounded-lg mb-4">
            <h3 class="text-xl font-bold mb-2">${billboard.name}</h3>
            <p class="text-gray-600 mb-1"><i class="fas fa-map-marker-alt mr-2"></i>${billboard.address}</p>
            <p class="text-gray-600 mb-1"><i class="fas fa-eye mr-2"></i>${billboard.impressions}</p>
            <p class="text-gray-600 mb-4"><i class="fas fa-tv mr-2"></i>${billboard.specs} • ${billboard.rotation}</p>
        </div>
        
        <form id="bookingForm" onsubmit="handleBooking(event, ${billboardId})">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input type="text" required class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., Grand Opening Sale">
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input type="date" id="startDate" required class="w-full border border-gray-300 rounded-lg px-3 py-2" onchange="updatePriceAI(${billboard.id}, ${billboard.price})">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input type="time" id="startTime" required class="w-full border border-gray-300 rounded-lg px-3 py-2" onchange="updatePriceAI(${billboard.id}, ${billboard.price})">
                </div>
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                <select id="duration" onchange="updatePriceAI(${billboard.id}, ${billboard.price})" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="4">4 hours</option>
                    <option value="8">8 hours (full day)</option>
                    <option value="24">24 hours</option>
                </select>
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Upload Creative (JPG/PNG)</label>
                <input type="file" accept="image/*" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                <p class="text-xs text-gray-500 mt-1">Recommended: ${billboard.specs.split(' ')[0]} ${billboard.specs.split(' ')[2]} aspect ratio</p>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <div class="flex justify-between mb-2">
                    <span class="text-gray-600">Base Rate</span>
                    <span class="font-semibold">$${billboard.price}/hour</span>
                </div>
                <div id="aiPricingInfo" class="mb-2" style="display: none;">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-gray-600">🤖 AI Rate</span>
                        <span class="font-semibold text-blue-600" id="aiRate">-</span>
                    </div>
                    <div class="text-xs text-gray-500 italic" id="aiReason">-</div>
                </div>
                <div class="flex justify-between mb-2">
                    <span class="text-gray-600">Duration</span>
                    <span class="font-semibold" id="durationDisplay">1 hour</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span class="text-gray-600">Subtotal</span>
                    <span class="font-semibold" id="subtotal">$${billboard.price}</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span class="text-gray-600">Platform Fee (20%)</span>
                    <span class="font-semibold" id="fee">$${(billboard.price * 0.2).toFixed(2)}</span>
                </div>
                <div class="border-t pt-2 mt-2">
                    <div class="flex justify-between">
                        <span class="font-bold text-lg">Total</span>
                        <span class="font-bold text-lg text-blue-600" id="total">$${(billboard.price * 1.2).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="mb-4">
                <label class="flex items-start">
                    <input type="checkbox" required class="mt-1 mr-2">
                    <span class="text-sm text-gray-600">I agree to the <a href="#" class="text-blue-600 hover:underline">Terms of Service</a> and understand that my creative will be reviewed for approval within 4 hours.</span>
                </label>
            </div>
            
            <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 text-lg">
                Proceed to Payment
            </button>
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
        const response = await fetch('http://92.112.184.224:3010/api/pricing/suggest', {
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

function handleBooking(event, billboardId) {
    event.preventDefault();
    
    // In production, this would integrate with Stripe
    alert('Payment integration coming soon!\n\nIn the full version, you would:\n1. Enter payment details (Stripe)\n2. Receive instant booking confirmation\n3. Get email updates on creative approval\n4. Go live within 24 hours');
    
    closeBookingModal();
}

// Close modal on outside click
document.getElementById('bookingModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeBookingModal();
    }
});
