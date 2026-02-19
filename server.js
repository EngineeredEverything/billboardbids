const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_demo');
const { initDatabase, seedData, billboardQueries, bookingQueries, leadQueries, toCamelCase } = require('./database');
const PricingEngine = require('./pricing-engine');
const emailService = require('./services/emailService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'creative-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
        }
    }
});

const app = express();
const PORT = process.env.PORT || 3010;

// Initialize database
initDatabase();
seedData();

// Initialize AI pricing engine
const Database = require('better-sqlite3');
const db = new Database('billboardbids.db');
const pricingEngine = new PricingEngine(db);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Legacy in-memory data (kept for backwards compatibility, not used)
let billboards = [
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
        rotation: "15 second rotation (4x per minute)",
        ownerId: "owner1"
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
        rotation: "10 second rotation (6x per minute)",
        ownerId: "owner2"
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
        rotation: "20 second rotation (3x per minute)",
        ownerId: "owner1"
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
        rotation: "15 second rotation (4x per minute)",
        ownerId: "owner3"
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
        rotation: "8 second rotation (7x per minute)",
        ownerId: "owner4"
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
        rotation: "20 second rotation (3x per minute)",
        ownerId: "owner2"
    }
];

let bookings = [];
let nextBookingId = 1;

// API Routes

// Get all billboards
app.get('/api/billboards', (req, res) => {
    try {
        const { location, traffic, minPrice, maxPrice, available } = req.query;
        
        let filtered = billboardQueries.getAll().map(toCamelCase);
        
        if (location && location !== 'All Locations') {
            filtered = filtered.filter(b => b.location === location);
        }
        
        if (traffic && traffic !== 'All Types') {
            filtered = filtered.filter(b => b.traffic === traffic);
        }
        
        if (minPrice) {
            filtered = filtered.filter(b => b.price >= parseInt(minPrice));
        }
        
        if (maxPrice) {
            filtered = filtered.filter(b => b.price <= parseInt(maxPrice));
        }
        
        if (available === 'true') {
            filtered = filtered.filter(b => b.available === true);
        }
        
        res.json(filtered);
    } catch (error) {
        console.error('Error fetching billboards:', error);
        res.status(500).json({ error: 'Failed to fetch billboards' });
    }
});

// Get single billboard
app.get('/api/billboards/:id', (req, res) => {
    try {
        const billboard = billboardQueries.getById(parseInt(req.params.id));
        if (!billboard) {
            return res.status(404).json({ error: 'Billboard not found' });
        }
        res.json(toCamelCase(billboard));
    } catch (error) {
        console.error('Error fetching billboard:', error);
        res.status(500).json({ error: 'Failed to fetch billboard' });
    }
});

// Create booking
app.post('/api/bookings', (req, res) => {
    try {
        const {
            billboardId,
            campaignName,
            startDate,
            startTime,
            duration,
            customerEmail,
            customerName,
            creativeUrl
        } = req.body;
        
        // Validate required fields
        if (!billboardId || !campaignName || !startDate || !startTime || !duration) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const billboard = billboardQueries.getById(parseInt(billboardId));
        if (!billboard) {
            return res.status(404).json({ error: 'Billboard not found' });
        }
        
        // Calculate pricing
        const subtotal = billboard.price * parseInt(duration);
        const platformFee = subtotal * 0.20;
        const total = subtotal + platformFee;
        
        const bookingData = {
            billboardId: parseInt(billboardId),
            billboardName: billboard.name,
            campaignName,
            startDate,
            startTime,
            duration: parseInt(duration),
            customerEmail,
            customerName,
            creativeUrl: creativeUrl || '',
            pricing: {
                hourlyRate: billboard.price,
                subtotal,
                platformFee,
                total
            },
            status: 'pending_payment',
            approvalStatus: 'pending'
        };
        
        const bookingId = bookingQueries.create(bookingData);
        const booking = bookingQueries.getById(bookingId);
        
        // Send confirmation email to advertiser
        if (customerEmail) {
            emailService.sendBookingConfirmation(toCamelCase(booking), billboard)
                .catch(err => console.error('Failed to send confirmation email:', err));
        }
        
        // Send new booking alert to billboard owner
        // Note: In production, fetch owner email from database
        const ownerEmail = process.env.OWNER_EMAIL || 'owner@example.com';
        emailService.sendNewBookingAlert(toCamelCase(booking), billboard, ownerEmail)
            .catch(err => console.error('Failed to send owner alert:', err));
        
        res.status(201).json({
            success: true,
            booking: toCamelCase(booking),
            message: 'Booking created. Proceed to payment.'
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Get all bookings (for admin/owner dashboard)
app.get('/api/bookings', (req, res) => {
    try {
        const { billboardId, status } = req.query;
        
        let filtered;
        
        if (billboardId) {
            filtered = bookingQueries.getByBillboard(parseInt(billboardId));
        } else if (status) {
            filtered = bookingQueries.getByStatus(status);
        } else {
            filtered = bookingQueries.getAll();
        }
        
        res.json(filtered.map(toCamelCase));
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Get single booking
app.get('/api/bookings/:id', (req, res) => {
    try {
        const booking = bookingQueries.getById(parseInt(req.params.id));
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.json(toCamelCase(booking));
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});

// Update booking status (for payment confirmation)
app.patch('/api/bookings/:id', (req, res) => {
    try {
        const booking = bookingQueries.getById(parseInt(req.params.id));
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const { status, paymentId, approvalStatus } = req.body;
        
        bookingQueries.update(parseInt(req.params.id), { status, paymentId, approvalStatus });
        
        const updated = bookingQueries.getById(parseInt(req.params.id));
        
        res.json({
            success: true,
            booking: toCamelCase(updated)
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// Upload creative
app.post('/api/upload-creative', upload.single('creative'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileUrl = `/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            fileUrl,
            filename: req.file.filename,
            size: req.file.size,
            message: 'Creative uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload creative' });
    }
});

// Update booking with creative URL
app.post('/api/bookings/:id/creative', (req, res) => {
    try {
        const { creativeUrl } = req.body;
        
        const booking = bookingQueries.getById(parseInt(req.params.id));
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Update creative URL and set approval status to pending
        const { db } = require('./database');
        db.prepare(`
            UPDATE bookings 
            SET creative_url = ?, approval_status = 'pending_review', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(creativeUrl, parseInt(req.params.id));
        
        const updated = bookingQueries.getById(parseInt(req.params.id));
        
        res.json({
            success: true,
            booking: toCamelCase(updated),
            message: 'Creative submitted for review'
        });
    } catch (error) {
        console.error('Error updating creative:', error);
        res.status(500).json({ error: 'Failed to update creative' });
    }
});

// Approve/reject creative (owner endpoint)
app.post('/api/bookings/:id/approve', (req, res) => {
    try {
        const { approved, notes } = req.body;
        
        const booking = bookingQueries.getById(parseInt(req.params.id));
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const newStatus = approved ? 'approved' : 'rejected';
        const { db } = require('./database');
        
        const stmt = db.prepare(`
            UPDATE bookings 
            SET approval_status = ?, 
                approval_notes = ?,
                approved_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        stmt.run(newStatus, notes || null, approved, parseInt(req.params.id));
        
        const updated = bookingQueries.getById(parseInt(req.params.id));
        
        // Send approval/rejection notification to advertiser
        if (updated.advertiser_email) {
            const billboard = billboardQueries.getById(updated.billboard_id);
            emailService.sendCreativeApprovalNotification(
                toCamelCase(updated), 
                billboard, 
                approved, 
                notes || ''
            ).catch(err => console.error('Failed to send approval email:', err));
        }
        
        res.json({
            success: true,
            booking: toCamelCase(updated),
            message: approved ? 'Creative approved' : 'Creative rejected'
        });
    } catch (error) {
        console.error('Error approving creative:', error);
        res.status(500).json({ error: 'Failed to process approval' });
    }
});

// AI Pricing suggestion endpoint (placeholder for future ML model)
app.post('/api/pricing/suggest', (req, res) => {
    try {
        const { billboardId, date, time, duration } = req.body;
        
        const billboard = toCamelCase(billboardQueries.getById(parseInt(billboardId)));
        if (!billboard) {
            return res.status(404).json({ error: 'Billboard not found' });
        }
    
        // Use AI pricing engine
        const pricing = pricingEngine.suggestPrice(billboard, date, time, parseInt(duration));
        
        res.json({
            ...pricing,
            reason: pricing.factors
        });
    } catch (error) {
        console.error('Error suggesting pricing:', error);
        res.status(500).json({ error: 'Failed to suggest pricing' });
    }
});

// Get pricing analytics for a billboard
app.get('/api/billboards/:id/analytics', (req, res) => {
    try {
        const billboardId = parseInt(req.params.id);
        const billboard = billboardQueries.getById(billboardId);
        
        if (!billboard) {
            return res.status(404).json({ error: 'Billboard not found' });
        }
        
        const analytics = pricingEngine.getPricingAnalytics(billboardId);
        res.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    const { bookingId, amount, successUrl, cancelUrl } = req.body;
    
    // Use database query instead of in-memory array
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
    }
    
    try {
        // Check if Stripe is properly configured
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_demo') {
            return res.json({
                demo: true,
                message: 'Stripe not configured. Set STRIPE_SECRET_KEY environment variable.',
                bookingId,
                amount
            });
        }
        
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Billboard Ad: ${booking.billboard_name}`,
                        description: `${booking.campaign_name} - ${booking.duration} hours starting ${booking.start_date} at ${booking.start_time}`,
                        images: booking.creative_url ? [`${req.headers.origin}${booking.creative_url}`] : []
                    },
                    unit_amount: Math.round(amount * 100) // Convert to cents
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: successUrl || `${req.headers.origin || 'http://92.112.184.224/apps/billboardbids'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.headers.origin || 'http://92.112.184.224/apps/billboardbids'}/?canceled=true`,
            metadata: {
                bot: 'billboardbids', // Required for fleet revenue tracking
                bookingId: bookingId.toString(),
                billboardId: booking.billboard_id.toString(),
                campaignName: booking.campaign_name,
                duration: booking.duration.toString(),
                startDate: booking.start_date,
                startTime: booking.start_time
            }
        });
        
        res.json({
            url: session.url,
            sessionId: session.id
        });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: 'Payment processing failed', details: error.message });
    }
});

// Stripe webhook handler (for payment confirmations)
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    try {
        let event;
        
        // Verify webhook signature if secret is configured
        if (webhookSecret && webhookSecret !== 'whsec_demo') {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // In test mode without webhook secret, parse directly
            event = JSON.parse(req.body.toString());
        }
        
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const bookingId = session.metadata.bookingId;
                
                if (bookingId) {
                    // Update booking status in database
                    const updateStmt = db.prepare(`
                        UPDATE bookings 
                        SET status = ?, 
                            payment_id = ?,
                            updated_at = ?
                        WHERE id = ?
                    `);
                    
                    updateStmt.run(
                        'confirmed',
                        session.payment_intent,
                        new Date().toISOString(),
                        parseInt(bookingId)
                    );
                    
                    console.log(`Payment confirmed for booking ${bookingId}`);
                    
                    // TODO: Send confirmation email via emailService
                    // TODO: Alert billboard owner
                }
                break;
                
            case 'payment_intent.succeeded':
                console.log('Payment intent succeeded:', event.data.object.id);
                break;
                
            case 'payment_intent.payment_failed':
                console.log('Payment failed:', event.data.object.id);
                // TODO: Handle failed payment (update booking status, notify user)
                break;
                
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        
        res.json({received: true});
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

// AI Creative Suggestions
app.post('/api/creative-suggestions', (req, res) => {
    try {
        const { campaignType, mainMessage, supportingText } = req.body;
        
        // Generate 3 creative suggestions based on campaign type
        const suggestions = generateCreativeSuggestions(campaignType, mainMessage, supportingText);
        
        res.json({
            success: true,
            suggestions,
            tips: [
                'Keep your main message under 7 words for maximum impact',
                'Use high-contrast colors for readability',
                'Include only one clear call to action',
                'Test your creative at small size to ensure readability'
            ]
        });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

function generateCreativeSuggestions(campaignType, mainMessage = '', supportingText = '') {
    const templates = {
        proposal: [
            {
                mainMessage: mainMessage || '💍 Will You Marry Me?',
                supportingText: supportingText || 'Sarah, you\'re my everything',
                callToAction: 'Say Yes! ❤️',
                reason: 'Classic proposal with emotional appeal'
            },
            {
                mainMessage: 'The Answer Is YES',
                supportingText: 'Sarah, let\'s spend forever together',
                callToAction: 'Call me: 555-1234',
                reason: 'Confident and direct approach'
            },
            {
                mainMessage: '💕 Sarah + Mike = Forever',
                supportingText: 'Will you be my wife?',
                callToAction: 'Look behind you!',
                reason: 'Personal and playful'
            }
        ],
        birthday: [
            {
                mainMessage: mainMessage || '🎂 Happy Birthday Sarah!',
                supportingText: supportingText || 'You light up every room',
                callToAction: 'Love, Your Family',
                reason: 'Warm and celebratory'
            },
            {
                mainMessage: 'Sarah Turns 30 Today!',
                supportingText: '3 decades of amazing',
                callToAction: 'Party at 7pm!',
                reason: 'Fun milestone celebration'
            },
            {
                mainMessage: 'Another Year, Still Fabulous',
                supportingText: 'Happy Birthday Sarah!',
                callToAction: '🎉',
                reason: 'Playful and fun'
            }
        ],
        business: [
            {
                mainMessage: mainMessage || 'Best Pizza in Town',
                supportingText: supportingText || 'Family-owned since 1985',
                callToAction: 'Visit Us: 123 Main St',
                reason: 'Trust-building with location'
            },
            {
                mainMessage: 'Your Neighborhood Expert',
                supportingText: 'Real estate that feels like home',
                callToAction: 'Call: 555-HOME',
                reason: 'Service-focused with clear CTA'
            },
            {
                mainMessage: '50% Off This Week Only',
                supportingText: 'Premium services, local prices',
                callToAction: 'Book Now',
                reason: 'Urgency-driven promotion'
            }
        ],
        event: [
            {
                mainMessage: mainMessage || 'Live Music This Saturday',
                supportingText: supportingText || 'Doors open at 7pm',
                callToAction: 'Get Tickets Now',
                reason: 'Clear event details with urgency'
            },
            {
                mainMessage: 'The Event of the Year',
                supportingText: 'Food, music, family fun',
                callToAction: 'Saturday @ City Park',
                reason: 'Excitement with location'
            },
            {
                mainMessage: 'Don\'t Miss Out',
                supportingText: 'Limited spots available',
                callToAction: 'Register: EventURL.com',
                reason: 'FOMO-driven with action'
            }
        ],
        announcement: [
            {
                mainMessage: mainMessage || 'We\'re Having A Baby!',
                supportingText: supportingText || 'Sarah & Mike',
                callToAction: 'Due March 2024',
                reason: 'Joyful personal news'
            },
            {
                mainMessage: 'Big News Coming Soon',
                supportingText: 'Stay tuned for the reveal',
                callToAction: 'Follow @username',
                reason: 'Teaser announcement'
            },
            {
                mainMessage: 'Thank You, Community',
                supportingText: '10 years of support',
                callToAction: '❤️',
                reason: 'Gratitude message'
            }
        ],
        custom: [
            {
                mainMessage: mainMessage || 'Your Message Here',
                supportingText: supportingText || 'Make it memorable',
                callToAction: 'Add Your CTA',
                reason: 'Customizable template'
            },
            {
                mainMessage: 'Bold Statement',
                supportingText: 'Supporting details',
                callToAction: 'Take Action',
                reason: 'Simple and direct'
            },
            {
                mainMessage: 'Catch Their Attention',
                supportingText: 'Tell your story',
                callToAction: 'What\'s next?',
                reason: 'Engagement-focused'
            }
        ]
    };
    
    return templates[campaignType] || templates.custom;
}

// =====================
// LEAD CAPTURE ENDPOINTS
// =====================

// Owner signup - billboard owners interested in listing
app.post('/api/owner-signup', (req, res) => {
    try {
        const { name, email, phone, company, city, state, numSigns, signType, message } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const id = leadQueries.createOwnerLead({ name, email, phone, company, city, state, numSigns, signType, message });

        console.log(`📋 New owner lead: ${name} (${email}) - ${numSigns || '?'} signs in ${city || '?'}, ${state || '?'}`);

        res.json({
            success: true,
            id,
            message: "Thanks for your interest! We'll be in touch within 24 hours to get your billboard listed."
        });
    } catch (error) {
        console.error('Owner signup error:', error);
        res.status(500).json({ error: 'Failed to submit. Please try again.' });
    }
});

// Advertiser lead - calculator users and waitlist signups
app.post('/api/advertiser-lead', (req, res) => {
    try {
        const { email, name, business, city, monthlyBudget, useCase, impressionsCalculated, cpmCalculated, source } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const id = leadQueries.createAdvertiserLead({ email, name, business, city, monthlyBudget, useCase, impressionsCalculated, cpmCalculated, source });

        console.log(`🎯 New advertiser lead: ${email} (source: ${source || 'calculator'})`);

        res.json({
            success: true,
            id,
            message: "You're on the list! We'll notify you when new billboard inventory goes live in your area."
        });
    } catch (error) {
        console.error('Advertiser lead error:', error);
        res.status(500).json({ error: 'Failed to submit. Please try again.' });
    }
});

// Admin: get all leads
app.get('/api/leads', (req, res) => {
    try {
        const stats = leadQueries.getLeadStats();
        const ownerLeads = leadQueries.getAllOwnerLeads();
        const advertiserLeads = leadQueries.getAllAdvertiserLeads();
        res.json({ stats, ownerLeads, advertiserLeads });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    try {
        const billboards = billboardQueries.getAll();
        const bookings = bookingQueries.getAll();
        
        const leadStats = leadQueries.getLeadStats();
        res.json({ 
            status: 'ok',
            database: 'connected',
            billboards: billboards.length,
            bookings: bookings.length,
            ownerLeads: leadStats.ownerLeads,
            advertiserLeads: leadStats.advertiserLeads,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Stripe config (publishable key for client-side)
app.get('/api/stripe/config', (req, res) => {
    res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_demo',
        configured: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_demo')
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 BillboardBids API running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api/health`);
});
