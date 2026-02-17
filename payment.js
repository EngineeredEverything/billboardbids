// Stripe Payment Integration
// Production-ready with environment-based configuration

let stripe;
let stripeConfigured = false;

// Initialize Stripe (client-side)
async function initializeStripe() {
    if (typeof Stripe === 'undefined') {
        console.warn('Stripe.js not loaded');
        return false;
    }
    
    try {
        // Fetch publishable key from server
        const response = await fetch(`${API_BASE}/stripe/config`);
        const config = await response.json();
        
        if (config.publishableKey && config.publishableKey !== 'pk_test_demo') {
            stripe = Stripe(config.publishableKey);
            stripeConfigured = config.configured;
            console.log('Stripe initialized:', stripeConfigured ? 'LIVE' : 'DEMO');
            return true;
        } else {
            console.warn('Stripe not configured - using demo mode');
            return false;
        }
    } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        return false;
    }
}

// Create payment intent and process payment
async function processPayment(bookingData, amount) {
    try {
        // Create Stripe checkout session via API
        const response = await fetch(`${API_BASE}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookingId: bookingData.id,
                amount: amount,
                successUrl: window.location.origin + '/apps/billboardbids/success.html?session_id={CHECKOUT_SESSION_ID}',
                cancelUrl: window.location.origin + '/apps/billboardbids/?canceled=true'
            })
        });
        
        const session = await response.json();
        
        if (session.demo) {
            // Demo mode - show message
            throw new Error(session.message || 'Payment system not configured');
        }
        
        if (session.url) {
            // Redirect to Stripe checkout
            console.log('Redirecting to Stripe checkout...');
            window.location.href = session.url;
            return { success: true, redirecting: true };
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
