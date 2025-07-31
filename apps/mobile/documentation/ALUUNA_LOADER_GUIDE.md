# AluunaLoader Component Guide

## Overview

The `AluunaLoader` component provides a beautiful, branded loading animation using Aluuna's color scheme. It features 5 animated dots that bounce, rotate, and scale in sequence, creating a quirky and engaging loading experience.

## Features

- **Branded Colors**: Uses Aluuna's official color palette (`#3D91D7`, `#0FB5BA`, `#9FD070`, `#F7941D`, `#7B61FF`)
- **Multiple Sizes**: Small, medium, and large variants
- **Customizable**: Optional message display with custom styling
- **Quirky Animations**: 300ms bounce cycle with 80ms staggered delays, plus rotation and scaling
- **Responsive**: Works across all screen sizes

## Usage

### Basic Usage

```tsx
import { AluunaLoader } from '../components/AluunaLoader';

// Simple loading state
<AluunaLoader />

// With custom message
<AluunaLoader message="Loading your memories..." />

// Large size for full-screen loading
<AluunaLoader 
  message="Waking up Aluuna..." 
  size="large" 
/>
```

### Advanced Usage

```tsx
// Small size for inline loading
<AluunaLoader 
  message="Processing..." 
  size="small" 
  showMessage={true}
/>

// Custom styling
<AluunaLoader 
  message="Loading memories..." 
  size="medium"
  containerClassName="p-4"
  messageClassName="text-sm text-gray-600"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `'Loading...'` | Text to display below the animation |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the loading animation |
| `showMessage` | `boolean` | `true` | Whether to show the message text |
| `containerClassName` | `string` | `''` | Additional CSS classes for the container |
| `messageClassName` | `string` | `''` | Additional CSS classes for the message text |

## Size Configurations

| Size | Dot Size | Spacing | Use Case |
|------|----------|---------|----------|
| `small` | 6px | 8px | Inline loading, status indicators |
| `medium` | 8px | 10px | Modal loading, section loading |
| `large` | 12px | 14px | Full-screen loading, app initialization |

## Implementation Examples

### Full-Screen Loading (App Loading)

```tsx
if (isLoading) {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Image
        source={require('../assets/images/logo.png')}
        className="w-[200px] h-[60px] mb-8"
        resizeMode="contain"
      />
      <AluunaLoader 
        message="Waking up Aluuna..." 
        size="large" 
        showMessage={true}
      />
    </View>
  );
}
```

### Memory Processing Status

```tsx
{memoryProcessingStatus.visible && (
  <View className="absolute top-20 left-4 right-4 z-50">
    <View className="bg-white rounded-lg px-4 py-3 shadow-lg border border-gray-200">
      <AluunaLoader 
        message={memoryProcessingStatus.message}
        size="small"
        showMessage={true}
        messageClassName="text-sm text-gray-600"
      />
    </View>
  </View>
)}
```

### Section Loading

```tsx
{isLoadingSection && (
  <View className="flex-1 justify-center items-center py-8">
    <AluunaLoader 
      message="Loading your memories..." 
      size="medium" 
    />
  </View>
)}
```

## Color Scheme

The AluunaLoader uses the following colors in sequence:

1. **Blue** (`#3D91D7`) - Primary brand color
2. **Teal** (`#0FB5BA`) - Secondary brand color  
3. **Green** (`#9FD070`) - Success/accent color
4. **Orange** (`#F7941D`) - Warning/attention color
5. **Purple** (`#7B61FF`) - Creative/insight color

## Animation Details

- **Bouncing**: 300ms bounce cycle with 80ms staggered delays
- **Rotation**: Each dot spins 360° while bouncing
- **Scaling**: Dots scale up to 1.2x at the peak of their bounce
- **Bounce Height**: Dots bounce up to 1.5x their size
- **Performance**: Uses `useNativeDriver: true` for smooth 60fps animations

## Best Practices

1. **Use appropriate sizes**: Small for inline, medium for sections, large for full-screen
2. **Provide meaningful messages**: Help users understand what's loading
3. **Consider context**: Use custom styling to match the surrounding UI
4. **Accessibility**: The component includes proper accessibility labels
5. **Performance**: Animations are optimized for smooth performance

## Migration from ActivityIndicator

Replace existing `ActivityIndicator` usage:

```tsx
// Before
<ActivityIndicator size="large" />

// After
<AluunaLoader size="large" />
```

## Integration with Existing Components

The AluunaLoader is designed to work seamlessly with:
- Full-screen loading states
- Modal loading overlays
- Status indicators
- Section loading states
- Memory processing feedback

## Troubleshooting

### Animation not showing
- Ensure the component is mounted and visible
- Check that no CSS is hiding the component
- Verify React Native Animated is properly configured

### Performance issues
- The component uses native driver animations
- If experiencing lag, check for other heavy operations
- Consider using smaller size for multiple instances

### Styling conflicts
- Use `containerClassName` and `messageClassName` for custom styling
- Avoid conflicting CSS classes
- Test on different screen sizes 