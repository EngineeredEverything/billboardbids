/**
 * BillboardBids AI Pricing Engine
 * Intelligent dynamic pricing based on demand signals, time patterns, and historical data
 */

class PricingEngine {
    constructor(db) {
        this.db = db;
    }

    /**
     * Calculate optimal price for a billboard slot
     */
    suggestPrice(billboard, date, time, duration) {
        const factors = this.analyzePricingFactors(billboard, date, time, duration);
        const finalMultiplier = this.calculateMultiplier(factors);
        const suggestedPrice = Math.round(billboard.price * finalMultiplier);

        return {
            basePrice: billboard.price,
            suggestedPrice,
            multiplier: parseFloat(finalMultiplier.toFixed(2)),
            factors: this.explainFactors(factors),
            confidence: this.calculateConfidence(factors)
        };
    }

    /**
     * Analyze all pricing factors
     */
    analyzePricingFactors(billboard, date, time, duration) {
        const targetDate = new Date(date);
        const hour = parseInt(time.split(':')[0]);
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday

        return {
            timeOfDay: this.analyzeTimeOfDay(hour, billboard.traffic),
            dayOfWeek: this.analyzeDayOfWeek(dayOfWeek, billboard.traffic),
            duration: this.analyzeDuration(duration),
            demand: this.analyzeDemand(billboard.id, date),
            urgency: this.analyzeUrgency(date),
            billboardScore: this.analyzeBillboardQuality(billboard)
        };
    }

    /**
     * Time of day analysis with traffic-aware logic
     */
    analyzeTimeOfDay(hour, trafficType) {
        // Normalize traffic type
        const normalizedTraffic = trafficType.toLowerCase();
        
        if (normalizedTraffic.includes('commuter')) {
            // Morning rush: 6-9 AM
            if (hour >= 6 && hour <= 9) {
                return { multiplier: 1.4, reason: 'Morning rush hour (high commuter traffic)' };
            }
            // Evening rush: 4-7 PM
            if (hour >= 16 && hour <= 19) {
                return { multiplier: 1.5, reason: 'Evening rush hour (peak commuter traffic)' };
            }
            // Midday: 10 AM - 3 PM
            if (hour >= 10 && hour <= 15) {
                return { multiplier: 0.9, reason: 'Midday (lower commuter volume)' };
            }
            // Late night: 10 PM - 5 AM
            if (hour >= 22 || hour <= 5) {
                return { multiplier: 0.6, reason: 'Late night (minimal traffic)' };
            }
            return { multiplier: 1.0, reason: 'Standard commuter hours' };
        }

        if (normalizedTraffic.includes('pedestrian') || normalizedTraffic.includes('downtown')) {
            // Lunch rush: 11 AM - 2 PM
            if (hour >= 11 && hour <= 14) {
                return { multiplier: 1.3, reason: 'Lunch rush (high foot traffic)' };
            }
            // Evening activity: 5-9 PM
            if (hour >= 17 && hour <= 21) {
                return { multiplier: 1.4, reason: 'Evening activity (peak foot traffic)' };
            }
            // Early morning: 6-9 AM
            if (hour >= 6 && hour <= 9) {
                return { multiplier: 1.1, reason: 'Morning foot traffic' };
            }
            // Late night: 11 PM - 6 AM
            if (hour >= 23 || hour <= 6) {
                return { multiplier: 0.5, reason: 'Late night (minimal pedestrians)' };
            }
            return { multiplier: 1.0, reason: 'Standard pedestrian hours' };
        }

        // Highway (24/7 visibility)
        if (hour >= 6 && hour <= 22) {
            return { multiplier: 1.2, reason: 'Daylight hours (maximum visibility)' };
        }
        return { multiplier: 0.8, reason: 'Night hours (reduced visibility)' };
    }

    /**
     * Day of week analysis
     */
    analyzeDayOfWeek(dayOfWeek, trafficType) {
        // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isFriday = dayOfWeek === 5;
        const normalizedTraffic = trafficType.toLowerCase();

        if (normalizedTraffic.includes('commuter')) {
            if (isWeekend) {
                return { multiplier: 0.7, reason: 'Weekend (lower commuter traffic)' };
            }
            if (isFriday) {
                return { multiplier: 1.2, reason: 'Friday (high traffic + weekend mood)' };
            }
            return { multiplier: 1.0, reason: 'Weekday commuter traffic' };
        }

        if (normalizedTraffic.includes('pedestrian') || normalizedTraffic.includes('downtown')) {
            if (isWeekend) {
                return { multiplier: 1.3, reason: 'Weekend (high leisure traffic)' };
            }
            if (isFriday) {
                return { multiplier: 1.2, reason: 'Friday evening activity' };
            }
            return { multiplier: 1.0, reason: 'Weekday foot traffic' };
        }

        // Highway
        if (isFriday) {
            return { multiplier: 1.15, reason: 'Friday travel day' };
        }
        if (isWeekend) {
            return { multiplier: 1.1, reason: 'Weekend road trips' };
        }
        return { multiplier: 1.0, reason: 'Weekday highway traffic' };
    }

    /**
     * Duration analysis (longer bookings = better unit economics)
     */
    analyzeDuration(duration) {
        if (duration >= 8) {
            return { multiplier: 0.9, reason: 'Volume discount (8+ hours)' };
        }
        if (duration >= 4) {
            return { multiplier: 0.95, reason: 'Extended booking discount (4+ hours)' };
        }
        return { multiplier: 1.0, reason: 'Standard duration' };
    }

    /**
     * Demand analysis based on existing bookings
     */
    analyzeDemand(billboardId, targetDate) {
        try {
            const stmt = this.db.prepare(`
                SELECT COUNT(*) as bookingCount
                FROM bookings
                WHERE billboard_id = ? 
                AND date(start_time) = date(?)
            `);
            const result = stmt.get(billboardId, targetDate);
            const bookingCount = result.bookingCount || 0;

            if (bookingCount >= 3) {
                return { multiplier: 1.3, reason: 'High demand (multiple bookings same day)' };
            }
            if (bookingCount >= 1) {
                return { multiplier: 1.15, reason: 'Moderate demand (existing bookings)' };
            }
            return { multiplier: 1.0, reason: 'Available inventory' };
        } catch (error) {
            console.error('Demand analysis error:', error);
            return { multiplier: 1.0, reason: 'Standard availability' };
        }
    }

    /**
     * Urgency analysis (last-minute bookings = premium)
     */
    analyzeUrgency(targetDate) {
        const now = new Date();
        const target = new Date(targetDate);
        const hoursUntil = (target - now) / (1000 * 60 * 60);

        if (hoursUntil < 24) {
            return { multiplier: 1.25, reason: 'Rush booking (<24 hours)' };
        }
        if (hoursUntil < 72) {
            return { multiplier: 1.1, reason: 'Short notice (<3 days)' };
        }
        if (hoursUntil > 168) { // > 7 days
            return { multiplier: 0.95, reason: 'Early bird booking (7+ days advance)' };
        }
        return { multiplier: 1.0, reason: 'Standard booking window' };
    }

    /**
     * Billboard quality score based on traffic and price
     */
    analyzeBillboardQuality(billboard) {
        const normalizedTraffic = billboard.traffic.toLowerCase();
        
        // High-traffic, premium locations deserve premium pricing
        if (normalizedTraffic.includes('highway') && billboard.price >= 100) {
            return { multiplier: 1.1, reason: 'Premium highway location' };
        }
        if (normalizedTraffic.includes('commuter') && billboard.price >= 75) {
            return { multiplier: 1.05, reason: 'High-traffic commuter route' };
        }
        return { multiplier: 1.0, reason: 'Standard location quality' };
    }

    /**
     * Calculate final multiplier from all factors
     */
    calculateMultiplier(factors) {
        let multiplier = 1.0;

        multiplier *= factors.timeOfDay.multiplier;
        multiplier *= factors.dayOfWeek.multiplier;
        multiplier *= factors.duration.multiplier;
        multiplier *= factors.demand.multiplier;
        multiplier *= factors.urgency.multiplier;
        multiplier *= factors.billboardScore.multiplier;

        // Cap at 2.0x max, 0.5x min
        return Math.max(0.5, Math.min(2.0, multiplier));
    }

    /**
     * Explain pricing factors in user-friendly format
     */
    explainFactors(factors) {
        const explanations = [];
        
        if (factors.timeOfDay.multiplier !== 1.0) {
            explanations.push(factors.timeOfDay.reason);
        }
        if (factors.dayOfWeek.multiplier !== 1.0) {
            explanations.push(factors.dayOfWeek.reason);
        }
        if (factors.duration.multiplier !== 1.0) {
            explanations.push(factors.duration.reason);
        }
        if (factors.demand.multiplier !== 1.0) {
            explanations.push(factors.demand.reason);
        }
        if (factors.urgency.multiplier !== 1.0) {
            explanations.push(factors.urgency.reason);
        }
        if (factors.billboardScore.multiplier !== 1.0) {
            explanations.push(factors.billboardScore.reason);
        }

        return explanations.length > 0 
            ? explanations.join(' + ') 
            : 'Standard pricing applies';
    }

    /**
     * Calculate confidence score (0-1)
     */
    calculateConfidence(factors) {
        // Higher confidence if we have demand data
        const hasBookings = factors.demand.multiplier !== 1.0;
        return hasBookings ? 0.85 : 0.75;
    }

    /**
     * Get pricing analytics for a billboard
     */
    getPricingAnalytics(billboardId) {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    COUNT(*) as totalBookings,
                    AVG(price_paid) as avgPrice,
                    MAX(price_paid) as maxPrice,
                    MIN(price_paid) as minPrice,
                    SUM(price_paid) as totalRevenue
                FROM bookings
                WHERE billboard_id = ?
            `);
            const stats = stmt.get(billboardId);

            return {
                bookingCount: stats.totalBookings || 0,
                averagePrice: Math.round(stats.avgPrice || 0),
                priceRange: {
                    min: Math.round(stats.minPrice || 0),
                    max: Math.round(stats.maxPrice || 0)
                },
                totalRevenue: Math.round(stats.totalRevenue || 0)
            };
        } catch (error) {
            console.error('Analytics error:', error);
            return null;
        }
    }
}

module.exports = PricingEngine;
