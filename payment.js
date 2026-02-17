// Stripe Payment Integration
// NOTE: For demo purposes. In production, use environment variables for API keys.

const STRIPE_PUBLISHABLE_KEY = 'pk_test_demo'; // Replace with real key

// Initialize Stripe (client-side)
let stripe;

function initializeStripe() {
    if (typeof Stripe !== 'undefined') {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    }
}

// Create payment intent and process payment
async function processPayment(bookingData, amount) {
    try {
        // In production, this would:
        // 1. Create Stripe checkout session via API
        // 2. Redirect to Stripe hosted checkout
        // 3. Handle webhook for payment confirmation
        // 4. Update booking status to "confirmed"
        
        const response = await fetch(`${API_BASE}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookingId: bookingData.id,
                amount: amount
            })
        });
        
        const session = await response.json();
        
        if (session.url) {
            // Redirect to Stripe checkout
            window.location.href = session.url;
        } else {
            throw new Error('Failed to create checkout session');
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        throw error;
    }
}

// Mock payment processing for demo
function mockPaymentDemo(bookingId, amount) {
    return new Promise((resolve) => {
        // Simulate payment processing delay
        setTimeout(() => {
            resolve({
                success: true,
                paymentId: `pay_demo_${Date.now()}`,
                amount: amount,
                status: 'succeeded'
            });
        }, 1500);
    });
}

// Handle successful payment
async function handlePaymentSuccess(bookingId, paymentId) {
    try {
        const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'confirmed',
                paymentId: paymentId
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating booking:', error);
        throw error;
    }
}

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeStripe,
        processPayment,
        mockPaymentDemo,
        handlePaymentSuccess
    };
}
