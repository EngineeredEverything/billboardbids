// Simple SQLite database for MVP
// Replaces in-memory storage with persistence

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'billboardbids.db');
const db = new Database(dbPath);

// Initialize database schema
function initDatabase() {
    // Create billboards table
    db.exec(`
        CREATE TABLE IF NOT EXISTS billboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            address TEXT NOT NULL,
            traffic TEXT NOT NULL,
            impressions TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT,
            available INTEGER DEFAULT 1,
            specs TEXT,
            rotation TEXT,
            owner_id TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create bookings table
    db.exec(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            billboard_id INTEGER NOT NULL,
            billboard_name TEXT NOT NULL,
            campaign_name TEXT NOT NULL,
            start_date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            duration INTEGER NOT NULL,
            customer_email TEXT,
            customer_name TEXT,
            creative_url TEXT,
            hourly_rate REAL NOT NULL,
            subtotal REAL NOT NULL,
            platform_fee REAL NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending_payment',
            approval_status TEXT DEFAULT 'pending',
            approval_notes TEXT,
            payment_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            paid_at TEXT,
            approved_at TEXT,
            FOREIGN KEY (billboard_id) REFERENCES billboards(id)
        )
    `);

    console.log('✅ Database initialized');
}

// Billboard queries
const billboardQueries = {
    getAll: () => {
        return db.prepare('SELECT * FROM billboards').all();
    },
    
    getById: (id) => {
        return db.prepare('SELECT * FROM billboards WHERE id = ?').get(id);
    },
    
    getByOwner: (ownerId) => {
        return db.prepare('SELECT * FROM billboards WHERE owner_id = ?').all(ownerId);
    },
    
    create: (billboard) => {
        const stmt = db.prepare(`
            INSERT INTO billboards (name, location, address, traffic, impressions, price, image, specs, rotation, owner_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            billboard.name,
            billboard.location,
            billboard.address,
            billboard.traffic,
            billboard.impressions,
            billboard.price,
            billboard.image,
            billboard.specs,
            billboard.rotation,
            billboard.ownerId
        );
        return result.lastInsertRowid;
    },
    
    update: (id, updates) => {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        const stmt = db.prepare(`UPDATE billboards SET ${fields} WHERE id = ?`);
        return stmt.run(...values, id);
    },
    
    delete: (id) => {
        return db.prepare('DELETE FROM billboards WHERE id = ?').run(id);
    }
};

// Booking queries
const bookingQueries = {
    getAll: () => {
        return db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
    },
    
    getById: (id) => {
        return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    },
    
    getByBillboard: (billboardId) => {
        return db.prepare('SELECT * FROM bookings WHERE billboard_id = ? ORDER BY created_at DESC').all(billboardId);
    },
    
    getByStatus: (status) => {
        return db.prepare('SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC').all(status);
    },
    
    create: (booking) => {
        const stmt = db.prepare(`
            INSERT INTO bookings (
                billboard_id, billboard_name, campaign_name, start_date, start_time,
                duration, customer_email, customer_name, creative_url,
                hourly_rate, subtotal, platform_fee, total, status, approval_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            booking.billboardId,
            booking.billboardName,
            booking.campaignName,
            booking.startDate,
            booking.startTime,
            booking.duration,
            booking.customerEmail,
            booking.customerName,
            booking.creativeUrl,
            booking.pricing.hourlyRate,
            booking.pricing.subtotal,
            booking.pricing.platformFee,
            booking.pricing.total,
            booking.status || 'pending_payment',
            booking.approvalStatus || 'pending'
        );
        return result.lastInsertRowid;
    },
    
    update: (id, updates) => {
        const fields = ['updated_at = CURRENT_TIMESTAMP'];
        const values = [];
        
        if (updates.status) {
            fields.push('status = ?');
            values.push(updates.status);
        }
        if (updates.paymentId) {
            fields.push('payment_id = ?');
            values.push(updates.paymentId);
        }
        if (updates.approvalStatus) {
            fields.push('approval_status = ?');
            values.push(updates.approvalStatus);
        }
        if (updates.status === 'confirmed' && !updates.paidAt) {
            fields.push('paid_at = CURRENT_TIMESTAMP');
        }
        
        const stmt = db.prepare(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`);
        return stmt.run(...values, id);
    }
};

// Seed sample data if database is empty
function seedData() {
    const count = db.prepare('SELECT COUNT(*) as count FROM billboards').get();
    
    if (count.count === 0) {
        console.log('📊 Seeding sample billboard data...');
        
        const sampleBillboards = [
            {
                name: "I-10 East Commuter",
                location: "Los Angeles, CA",
                address: "I-10 Eastbound, Mile 23",
                traffic: "Commuter Traffic",
                impressions: "85K daily impressions",
                price: 75,
                image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop",
                specs: "14' x 48' Digital LED",
                rotation: "15 second rotation (4x per minute)",
                ownerId: "owner1"
            },
            {
                name: "Downtown Austin Prime",
                location: "Austin, TX",
                address: "6th Street & Congress Ave",
                traffic: "Downtown",
                impressions: "120K daily impressions",
                price: 150,
                image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
                specs: "20' x 60' Digital LED",
                rotation: "10 second rotation (6x per minute)",
                ownerId: "owner2"
            },
            {
                name: "Highway 95 Southbound",
                location: "Miami, FL",
                address: "I-95 Southbound, Exit 12",
                traffic: "Highway",
                impressions: "95K daily impressions",
                price: 65,
                image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop",
                specs: "12' x 40' Digital LED",
                rotation: "20 second rotation (3x per minute)",
                ownerId: "owner1"
            },
            {
                name: "Denver Tech Center",
                location: "Denver, CO",
                address: "I-25 & Belleview Ave",
                traffic: "Commuter Traffic",
                impressions: "70K daily impressions",
                price: 55,
                image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop",
                specs: "14' x 48' Digital LED",
                rotation: "15 second rotation (4x per minute)",
                ownerId: "owner3"
            },
            {
                name: "Sunset Blvd Premium",
                location: "Los Angeles, CA",
                address: "Sunset Blvd & Vine St",
                traffic: "Downtown",
                impressions: "200K daily impressions",
                price: 250,
                image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop",
                specs: "30' x 80' Digital LED",
                rotation: "8 second rotation (7x per minute)",
                ownerId: "owner4"
            },
            {
                name: "Highway 183 North",
                location: "Austin, TX",
                address: "US-183 Northbound, Exit 45",
                traffic: "Highway",
                impressions: "60K daily impressions",
                price: 45,
                image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=300&fit=crop",
                specs: "12' x 36' Digital LED",
                rotation: "20 second rotation (3x per minute)",
                ownerId: "owner2"
            }
        ];
        
        sampleBillboards.forEach(billboard => {
            billboardQueries.create(billboard);
        });
        
        console.log('✅ Sample data seeded');
    }
}

// Helper to convert snake_case to camelCase for API responses
function toCamelCase(obj) {
    if (!obj) return obj;
    
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        result[camelKey] = value;
    }
    
    // Convert boolean integers
    if (result.available !== undefined) result.available = Boolean(result.available);
    
    // Reconstruct pricing object for bookings
    if (result.hourlyRate !== undefined) {
        result.pricing = {
            hourlyRate: result.hourlyRate,
            subtotal: result.subtotal,
            platformFee: result.platformFee,
            total: result.total
        };
        delete result.hourlyRate;
        delete result.subtotal;
        delete result.platformFee;
        delete result.total;
    }
    
    return result;
}

module.exports = {
    db,
    initDatabase,
    seedData,
    billboardQueries,
    bookingQueries,
    toCamelCase
};
