# Onboarding UI Documentation

## Overview
The onboarding UI provides self-service subscription and settings management for TradeLine 24/7 customers.

## Pages

### /pricing
Main pricing page showcasing available plans with integrated Stripe checkout.

**Features:**
- Three plan tiers: Basic ($149), Pro ($299), Enterprise ($599)
- JSON-LD structured data for SEO
- Google Analytics event tracking
- Responsive design with accessibility features

**GA Events Fired:**
- `view_pricing` - When page loads
- `begin_checkout` - When user clicks plan button

### /subscribe?plan=basic|pro|enterprise
Subscription signup form with Stripe Checkout integration.

**Form Fields:**
- Business Name (required)
- Business Email (required) 
- Business Phone Number (required, NANP format)

**Features:**
- Real-time phone number validation and formatting
- Plan-specific pricing display
- Secure Stripe Checkout integration
- Error handling with user-friendly messages

**GA Events Fired:**
- `begin_checkout` - When form is submitted

### /settings
Admin dashboard for managing organization configuration.

**Sections:**
1. **Organization Lookup** - Load settings by email
2. **Organization Details** - Display org info and creation date
3. **Subscription Status** - Show plan, status, renewal date
4. **Service Configuration** - Editable business settings
5. **Test Call** - Verify phone number setup

**Features:**
- Local storage for email persistence
- Stripe Billing Portal integration
- Real-time settings validation
- Test call functionality

## Form Validation

### Phone Numbers
- **Format**: US/Canada numbers only (`+1XXXXXXXXXX`)
- **Validation**: Real-time formatting and error display
- **Normalization**: Automatic cleanup of input (removes punctuation, adds +1)

### Email Addresses
- **Validation**: Standard email regex
- **Case**: Automatically lowercased for consistency
- **Recipients**: Comma-separated list with trimming

### Business Name
- **Required**: Non-empty after trimming
- **Usage**: Displayed to customers in AI conversations

## Error Handling

### User-Friendly Messages
- "Please enter a valid US/Canada phone number (10 digits)"
- "Business name is required"
- "Failed to save settings"

### Network Errors
- Automatic retry suggestions
- Clear error descriptions
- Non-blocking UI (form remains usable)

## Accessibility (A11y)

### Standards Compliance
- Minimum 44px touch targets
- Focus-visible indicators
- Semantic HTML structure
- ARIA labels where appropriate

### Keyboard Navigation
- Tab order follows visual flow
- Enter key submits forms
- Escape key closes modals
- Skip links for screen readers

### Screen Reader Support
- Proper heading hierarchy (H1 → H2 → H3)
- Form labels associated with inputs
- Error announcements
- Loading state descriptions

## Local Storage Usage

### Stored Data
- `tl247_email`: Organization email for auto-login to settings

### Privacy
- No sensitive data stored locally
- Easy to clear via browser settings
- Graceful fallback when unavailable

## Marketing Integration Points

### Google Analytics
Ready for UTM campaign tracking and conversion measurement:

```javascript
// Example custom events for marketing campaigns
gtag('event', 'pricing_cta_click', {
  'campaign': 'summer2025',
  'source': 'email', 
  'medium': 'newsletter'
});
```

### A/B Testing Hooks
Components designed for easy A/B testing:
- Plan positioning and pricing
- CTA button text and colors
- Form field ordering
- Success message content

### SEO Optimization
- Meta descriptions and titles optimized per page
- Canonical URLs properly set
- JSON-LD structured data for pricing
- Open Graph tags for social sharing

## Future Enhancement Areas

### Marketing Copy Customization
Easy areas to modify marketing content:
- Plan feature lists (`src/pages/Pricing.tsx`)
- Success messages (`src/routes/settings.tsx`)
- Form helper text (`src/routes/subscribe.tsx`)
- Error messages (`src/lib/api.ts`)

### Additional GA Events
Consider adding events for:
- Settings page visits
- Test call usage
- Billing portal access
- Plan upgrade/downgrade clicks

### Conversion Optimization
Test variations of:
- Pricing presentation (monthly vs annual)
- Feature highlight order
- Social proof elements
- Trust badges and security mentions

## Technical Notes

### State Management
- React hooks for local state
- URL params for plan selection
- LocalStorage for email persistence
- No global state management needed

### API Integration
- Type-safe API client (`src/lib/api.ts`)
- Consistent error handling
- Loading states for all async operations
- Automatic request retries where appropriate

### Performance
- Lazy loading for non-critical components
- Optimized bundle splitting
- Efficient re-renders with React.memo where needed
- Minimal external dependencies