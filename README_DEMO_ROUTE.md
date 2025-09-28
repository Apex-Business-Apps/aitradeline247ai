# Demo Dashboard Route

## Overview
Interactive demo system that animates through the real dashboard interface with automated click-through tours.

## Route
- **URL**: `/demo/dashboard`
- **Component**: Renders the actual `<NewDashboard />` with demo mode enabled
- **Purpose**: Clean, deterministic tour for screen recordings and user onboarding

## Query Parameters
- `?speed=1.2` - Adjust demo speed (default: 1.0)
- `?loop=1` - Enable continuous looping (default: off)

## Controls
- **Space**: Start/pause demo
- **Escape**: Stop demo and reset
- **Start Demo** button: Begin automated tour

## Adding New Demo Steps

### 1. Update DemoScript.ts
Add steps to the `demoSteps` array:
```typescript
{
  target: '[data-demo="your-element"]',  // CSS selector
  zoom: 1.15,                           // Optional zoom level (1.0 = no zoom)
  wait: 1200,                           // Duration in milliseconds
  description: 'What this step shows'   // Optional tooltip text
}
```

### 2. Add data-demo Attributes
In your component JSX, add data attributes:
```jsx
<div data-demo="your-element">
  Your content
</div>
```

Or use the auto-attribution system in `demo/dashboard.tsx` that adds attributes based on content.

## Demo Behavior
1. **Spotlight**: Highlights current target with animated border
2. **Zoom**: Optional CSS transform to focus on elements  
3. **Scroll**: Automatically scrolls targets into view
4. **Pointer Events**: Disables page interaction during demo (except current target)
5. **Progress**: Shows step counter and progress bar

## Timing Guidelines
- **Quick highlights**: 800-1000ms
- **Standard elements**: 1200-1500ms  
- **Complex sections**: 1800-2000ms
- **Transitions**: 500ms for zoom/scroll animations

## Accessibility
- Respects `prefers-reduced-motion`
- Keyboard navigation support
- ARIA labels for demo controls
- Clear visual indicators for demo state

## Recording Tips
- Use `?speed=0.8` for slower, more deliberate recordings
- Test without loop mode first
- Ensure all `data-demo` targets exist before recording
- Check responsive breakpoints (mobile/desktop)