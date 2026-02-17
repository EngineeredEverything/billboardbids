# BillboardBids Deployment & Configuration Guide

**Quick reference for production deployment and configuration**

---

## ✅ Pre-Launch Checklist

### 1. Stripe Configuration (Required for Payments)

**Get API Keys:**
1. Sign up at https://stripe.com
2. Go to Developers → API Keys
3. Copy "Secret key" (starts with `sk_live_` for production or `sk_test_` for testing)
4. Go to Developers → Webhooks
5. Create endpoint: `http://92.112.184.224:3010/api/webhook`
6. Select events: `checkout.session.completed`
7. Copy "Signing secret" (starts with `whsec_`)

**Configure PM2:**
```bash
pm2 set billboardbids:STRIPE_SECRET_KEY "sk_live_YOUR_KEY_HERE"
pm2 set billboardbids:STRIPE_WEBHOOK_SECRET "whsec_YOUR_SECRET_HERE"
pm2 restart billboardbids --update-env
```

**Test:**
```bash
curl -s http://92.112.184.224:3010/api/health | jq .
# Should show no errors about Stripe
```

---

### 2. Email Configuration (Required for Notifications)

**Option A: SendGrid (Recommended - Free Tier: 100 emails/day)**

1. Sign up at https://sendgrid.com
2. Create API Key: Settings → API Keys → Create API Key
3. Verify sender email: Settings → Sender Authentication

```bash
pm2 set billboardbids:SMTP_HOST "smtp.sendgrid.net"
pm2 set billboardbids:SMTP_PORT "587"
pm2 set billboardbids:SMTP_USER "apikey"
pm2 set billboardbids:SMTP_PASS "SG.YOUR_API_KEY_HERE"
pm2 set billboardbids:SMTP_FROM "BillboardBids <hello@billboardbids.com>"
pm2 restart billboardbids --update-env
```

**Option B: Postmark**

1. Sign up at https://postmarkapp.com
2. Create server and get API token

```bash
pm2 set billboardbids:SMTP_HOST "smtp.postmarkapp.com"
pm2 set billboardbids:SMTP_PORT "587"
pm2 set billboardbids:SMTP_USER "YOUR_API_TOKEN"
pm2 set billboardbids:SMTP_PASS "YOUR_API_TOKEN"
pm2 set billboardbids:SMTP_FROM "BillboardBids <hello@billboardbids.com>"
pm2 restart billboardbids --update-env
```

**Option C: AWS SES (Cheapest at Scale)**

1. Set up AWS SES in your AWS account
2. Verify your domain or email
3. Get SMTP credentials

```bash
pm2 set billboardbids:SMTP_HOST "email-smtp.us-east-1.amazonaws.com"
pm2 set billboardbids:SMTP_PORT "587"
pm2 set billboardbids:SMTP_USER "YOUR_SMTP_USERNAME"
pm2 set billboardbids:SMTP_PASS "YOUR_SMTP_PASSWORD"
pm2 set billboardbids:SMTP_FROM "BillboardBids <hello@billboardbids.com>"
pm2 restart billboardbids --update-env
```

**Test Email:**
Create a test booking and verify emails are sent to advertiser and owner.

---

### 3. Default Owner Email (Optional)

Set fallback owner email for new billboard alerts:

```bash
pm2 set billboardbids:OWNER_EMAIL "owner@yourdomain.com"
pm2 restart billboardbids --update-env
```

---

## 🔧 System Monitoring

### Check Service Status
```bash
pm2 status
pm2 logs billboardbids --lines 50
```

### Check Database
```bash
curl -s http://92.112.184.224:3010/api/health | jq .
```

Expected output:
```json
{
  "status": "ok",
  "database": "connected",
  "billboards": 6,
  "bookings": 4,
  "timestamp": "2026-02-13T09:24:14.748Z"
}
```

### View Live Billboards
```bash
curl -s http://92.112.184.224:3010/api/billboards | jq 'length'
# Should return 6 (demo data) or more after adding real inventory
```

### View Bookings
```bash
curl -s http://92.112.184.224:3010/api/bookings | jq 'length'
```

---

## 📋 Adding Real Billboard Inventory

Once you've onboarded real owners, add their billboards to the database.

### Method 1: Via Owner Dashboard UI
1. Open: http://92.112.184.224/apps/billboardbids/owner-dashboard.html
2. Click "Add New Billboard"
3. Fill in all fields
4. Submit

### Method 2: Via API (Bulk Import)
```bash
curl -X POST http://92.112.184.224:3010/api/billboards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "I-405 Northbound Prime",
    "location": "Seattle, WA",
    "address": "I-405 Northbound, Mile 42",
    "traffic": "Commuter Traffic",
    "impressions": "95K daily impressions",
    "price": 85,
    "image": "https://your-image-url.com/billboard.jpg",
    "specs": "14 x 48 Digital LED",
    "rotation": "15 second rotation (4x per minute)",
    "ownerId": "owner_seattle_001"
  }'
```

---

## 🧪 Testing the Full Flow

### 1. Test Booking Creation
```bash
curl -X POST http://92.112.184.224:3010/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "billboardId": 1,
    "campaignName": "Test Campaign",
    "startDate": "2026-02-20",
    "startTime": "09:00",
    "duration": 2,
    "customerEmail": "test@example.com",
    "customerName": "Test User"
  }'
```

**Expected:**
- ✅ Booking created in database
- ✅ Confirmation email sent to `test@example.com`
- ✅ New booking alert sent to owner

### 2. Test AI Pricing
```bash
curl -X POST http://92.112.184.224:3010/api/pricing/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "billboardId": 1,
    "date": "2026-02-20",
    "time": "08:00",
    "duration": 2
  }'
```

**Expected:**
- Returns dynamic pricing with multiplier
- Shows optimization factors (time-of-day, urgency, etc.)

### 3. Test Creative Upload
```bash
# Upload a test image
curl -X POST http://92.112.184.224:3010/api/upload-creative \
  -F "creative=@/path/to/test-image.jpg"
```

**Expected:**
- Returns file URL
- File saved in `/uploads/` directory

### 4. Test Stripe Checkout (After Configuration)
```bash
curl -X POST http://92.112.184.224:3010/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"bookingId": 1}'
```

**Expected:**
- Returns Stripe checkout URL
- Redirecting to URL shows Stripe payment page

---

## 🚨 Troubleshooting

### Emails Not Sending

**Check configuration:**
```bash
pm2 logs billboardbids | grep -i email
```

Look for:
- `✅ Email service initialized` (production SMTP configured)
- `📧 Using Ethereal test email account` (development mode)
- `⚠️ Email service not configured` (missing env vars)

**Fix:**
1. Verify SMTP credentials are correct
2. Check sender email is verified with provider
3. Restart PM2 with `--update-env` flag

### Stripe Webhook Failures

**Check logs:**
```bash
pm2 logs billboardbids | grep -i stripe
```

**Common issues:**
- Webhook secret mismatch → Verify `STRIPE_WEBHOOK_SECRET`
- Endpoint not reachable → Check firewall/port 3010 open
- Event type not handled → Add event type to webhook config

### Database Issues

**Reset database (⚠️ deletes all data):**
```bash
cd /var/www/dashboard/apps/billboardbids
rm billboardbids.db
pm2 restart billboardbids  # Auto-recreates with seed data
```

**Backup database:**
```bash
cp billboardbids.db billboardbids.db.backup-$(date +%Y%m%d)
```

### Service Won't Start

**Check PM2 logs:**
```bash
pm2 logs billboardbids --err --lines 50
```

**Common issues:**
- Port 3010 already in use → Check with `lsof -i :3010`
- Missing dependencies → Run `npm install`
- Database permissions → Check file permissions on `billboardbids.db`

---

## 📊 Performance Monitoring

### Key Metrics to Watch

**System Health:**
```bash
pm2 monit  # Live CPU/memory monitoring
```

**Database Growth:**
```bash
ls -lh billboardbids.db
# Monitor file size growth over time
```

**API Response Time:**
```bash
time curl -s http://92.112.184.224:3010/api/health
# Should be <100ms for healthy system
```

---

## 🔐 Security Checklist

- [ ] Stripe API keys stored in PM2 env (not in code)
- [ ] SMTP credentials stored in PM2 env (not in code)
- [ ] Webhook signatures verified (Stripe)
- [ ] File upload size limits enforced (10MB max)
- [ ] Image file type validation (JPEG/PNG/GIF/WebP only)
- [ ] CORS configured appropriately
- [ ] HTTPS enabled (if using custom domain)

---

## 🎯 Go-Live Checklist

**Before First Real Campaign:**
- [ ] Stripe production keys configured & tested
- [ ] SMTP email delivery configured & tested
- [ ] At least 5 real billboards added
- [ ] Test booking → payment → email flow works end-to-end
- [ ] Owner dashboard accessible to real owners
- [ ] Creative approval workflow tested
- [ ] Database backed up
- [ ] PM2 auto-restart confirmed working
- [ ] Monitoring/alerts configured (optional: uptime monitoring)

**After Go-Live:**
- [ ] Monitor PM2 logs daily
- [ ] Check email delivery rates
- [ ] Verify Stripe payments processing
- [ ] Track booking-to-payment conversion
- [ ] Collect owner feedback on approval workflow
- [ ] Monitor database size growth
- [ ] Set up weekly database backups

---

## 📞 Support

**Platform Issues:**
- Check PM2 logs: `pm2 logs billboardbids`
- Check API health: `curl http://92.112.184.224:3010/api/health`

**Owner Onboarding:**
- Share owner dashboard: http://92.112.184.224/apps/billboardbids/owner-dashboard.html
- Share instructions from `OUTREACH.md`

**Advertiser Support:**
- FAQ: Direct to marketplace help section
- Creative issues: Point to AI Creative Assistant

---

## 🔄 Updating the Platform

**Pull latest changes:**
```bash
cd /var/www/dashboard/apps/billboardbids
# Make changes to files
pm2 restart billboardbids
```

**Update dependencies:**
```bash
npm install
pm2 restart billboardbids
```

**Verify deployment:**
```bash
pm2 logs billboardbids --lines 20
curl http://92.112.184.224:3010/api/health
```

---

**Last Updated:** 2026-02-13  
**Platform Status:** Production Ready  
**Waiting On:** Stripe + SMTP configuration + Real inventory acquisition
