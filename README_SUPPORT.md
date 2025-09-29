# Support Portal

## Overview
Simple support ticket system for customer inquiries and technical support.

## Features
- Customer-facing support form with validation
- Email notifications to support team
- Ticket tracking in database
- Admin access to view tickets

## Components
- `support_tickets` table with RLS policies
- `POST /api/support` endpoint for ticket submission
- Support form with client-side validation
- Email notifications via Resend

## Security
- Input validation with Zod schema
- RLS policies restrict ticket access to admins
- Honeypot field protection (consider adding for spam prevention)

## Usage
1. Users submit tickets via `/support` page
2. Tickets stored in database with status tracking
3. Email sent to info@tradeline247ai.com
4. Admins can view tickets via Supabase dashboard

## Escalation Path
- Urgent issues: Direct phone contact
- Technical issues: Engineering team review
- Billing issues: Customer success team

## Future Enhancements
- Ticket status updates
- Customer ticket viewing portal
- Priority levels and SLA tracking