# Coordinator UI Changes - Implementation Guide

This document lists all changes made to the Coordinator UI that need to be implemented in other roles (Student, Instructor, Supervisor, Admin).

## 1. Dark Mode Background Colors

### Main Page Background
- **Changed from**: `dark:bg-gray-900`
- **Changed to**: `dark:bg-[#19191c]`
- **Location**: Main container/wrapper div
- **Example**:
  ```tsx
  <div className="min-h-screen bg-gray-50 dark:bg-[#19191c]">
  ```

### Component Backgrounds (Cards, Modals, Sidebars, etc.)
- **Changed from**: `dark:bg-gray-800` or `dark:bg-gray-700`
- **Changed to**: `dark:bg-[#212124]`
- **Applied to**:
  - All card components
  - Sidebar
  - Modals
  - Input fields
  - Dropdowns
  - Notification panels
  - Top bar (mobile)
  - All white cards in dark mode
- **Example**:
  ```tsx
  <div className="bg-white dark:bg-[#212124] rounded-xl">
  ```

### Progress Bar Track Backgrounds
- **Changed from**: `dark:bg-gray-600` or similar
- **Changed to**: `dark:bg-[#212124]`
- **Example**:
  ```tsx
  <div className="w-full bg-gray-200 dark:bg-[#212124] rounded-full">
  ```

## 2. Sidebar Redesign

### Floating Sidebar Styling
- **Desktop**:
  - Position: `fixed` with `lg:top-4 lg:bottom-4 lg:left-4`
  - Rounded corners: `lg:rounded-2xl`
  - Shadow: `lg:shadow-2xl`
  - Border: `lg:border` (rounded on all corners, not just one side)
  - Width: `w-72` (expanded) or `w-20` (collapsed)
- **Mobile**:
  - Full height: `fixed inset-y-0 left-0`
  - Slide animation: `transform transition-all duration-300 ease-in-out`
  - Translate: `translate-x-0` (open) or `-translate-x-full` (closed)

### Sidebar Structure
- **Collapsed State**: Icon-only view
  - Hamburger icon at top
  - Logo centered
  - Navigation icons only (no labels)
  - Profile icon
  - Logout icon
- **Expanded State**: Full sidebar
  - Hamburger + Logo + Branding text at top
  - Navigation items with icons + labels
  - Profile section with avatar + name
  - Logout button with text

### Sidebar Features
- **Hamburger Toggle**: Top of sidebar for expand/collapse
- **Hidden Scrollbar**: Add `scrollbar-hidden` class to nav element
- **Removed Top Header**: Notification and profile moved into sidebar
- **Mobile Top Bar**: Floating bar with hamburger, logo, notifications, profile (mobile only)
- **Z-index Management**: 
  - Sidebar: `z-[60]`
  - Overlay: `z-[50]`
  - Mobile top bar: `z-50` (when sidebar closed) or `z-30` (when sidebar open)

### Active Tab Styling in Sidebar
- **Active State**:
  ```tsx
  className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/50 dark:to-blue-800/30 dark:text-blue-300"
  ```
- **Inactive State**:
  ```tsx
  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
  ```

## 3. Color Scheme Changes (Purple → Blue)

### Active Tab Colors
- **Background**: `from-blue-100 to-blue-50` (light) / `dark:from-blue-900/50 dark:to-blue-800/30` (dark)
- **Text/Icon**: `text-blue-600` (light) / `dark:text-blue-300` (dark)
- **Previous**: Purple equivalents

### Dashboard Header Gradient
- **Changed from**: Purple gradient
- **Changed to**: `bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400`
- **Text colors**: `text-blue-100` for secondary text

### Buttons
- **Primary Buttons**:
  - Changed from: `bg-purple-600 hover:bg-purple-700`
  - Changed to: `bg-blue-600 hover:bg-blue-700`
- **Gradient Buttons**:
  - Changed from: `from-purple-600 to-purple-700`
  - Changed to: `from-blue-600 to-blue-700` or `from-blue-500 to-blue-600`
- **Examples**:
  - "Manage Students" button: `bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800`
  - Save buttons: `bg-blue-600 hover:bg-blue-700`
  - Action buttons: `bg-blue-600 hover:bg-blue-700`

### Settings Page
- **Theme Selection Cards**: Purple → Blue borders and backgrounds
- **Save Button**: `bg-blue-600 hover:bg-blue-700`
- **Toggle Switches**: 
  - `peer-checked:bg-blue-600`
  - `peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800`
- **Focus Rings**: `focus:ring-blue-500`
- **Icons**: `text-blue-600`

### Company Management
- All purple accents changed to blue:
  - Borders: `border-blue-500`
  - Text: `text-blue-600`
  - Backgrounds: `bg-blue-600`
  - Hover shadows: `hover:shadow-blue-500/10`

### Progress Bars
- **Tasks Completed**: `bg-gradient-to-r from-blue-500 to-blue-600`
- **Average Rating**: `bg-gradient-to-r from-purple-500 to-purple-600` (note: this one may need to be changed to blue)

## 4. Profile Avatar Changes

### Coordinator Profile Avatar
- **Changed from**: `from-green-500 to-teal-500`
- **Changed to**: `from-blue-500 to-blue-600`
- **Applied to**:
  - Sidebar profile section
  - Mobile top bar profile
- **Example**:
  ```tsx
  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
  ```

### Student Avatars
- **Changed from**: `from-purple-500 to-blue-500`
- **Changed to**: `from-blue-500 to-blue-600`
- **Applied to**:
  - Student list cards
  - Student detail views
  - Dashboard student cards
  - Document cards

## 5. Button Changes

### Primary Action Buttons
- All purple buttons changed to blue
- Examples:
  - `bg-blue-600 hover:bg-blue-700 text-white`
  - `bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800`

### Secondary Buttons
- Blue accents where purple was used
- Border colors: `border-blue-500`
- Text colors: `text-blue-600`

## 6. Text Visibility Improvements (Dark Mode)

### Labels and Secondary Text
- **Performance Overview Labels**:
  - Changed from: `dark:text-gray-300`
  - Changed to: `dark:text-gray-200`
- **General Text**:
  - Changed from: `dark:text-gray-400`
  - Changed to: `dark:text-gray-300`
- **Applied to**:
  - Subtitles
  - Descriptions
  - Empty state messages
  - Timestamps
  - Secondary information

### Placeholder Text
- **Input Fields**:
  - Added: `placeholder:text-gray-500 dark:placeholder:text-gray-400`
  - Ensures placeholder text is visible in dark mode

### Search Icon
- **Added dark mode styling**: `dark:text-gray-500` to search icon

## 7. Notification Integration

### Notification in Sidebar
- Added as navigation item in sidebar
- Notification panel opens when clicked (full panel, not dropdown)
- Unread indicator: Purple dot (`bg-purple-500`) - note: this could be changed to blue

### Notification Badge
- Small dot indicator for unread notifications
- Position: `absolute top-1 right-1` (collapsed) or `ml-auto` (expanded)

## 8. Mobile Top Bar

### Floating Top Bar (Mobile Only)
- **Styling**:
  - Position: `fixed top-4 left-4 right-4 lg:hidden`
  - Background: `bg-white dark:bg-[#212124]`
  - Rounded: `rounded-2xl`
  - Shadow: `shadow-2xl`
  - Border: `border border-gray-200 dark:border-gray-700`
- **Contents**:
  - Hamburger menu button
  - Logo
  - Notification bell
  - Profile picture
- **Z-index**: `z-50` (when sidebar closed) or `z-30` (when sidebar open)

## 9. Main Content Layout

### Content Area Adjustments
- **Margin adjustments** based on sidebar state:
  - Expanded: `lg:ml-80` (when sidebar is `w-72` + padding)
  - Collapsed: `lg:ml-28` (when sidebar is `w-20` + padding)
  - Closed: `lg:ml-4`
- **Transition**: `transition-all duration-300`

### Main Content Padding
- Mobile: `pt-24` (accounting for top bar)
- Desktop: `pt-6`

## 10. Help & Support Section (Settings)

### FAQ Card
- **Styling**: Purple theme (kept as purple)
  - Background: `bg-purple-50 dark:bg-purple-900/20`
  - Border: `border-purple-200 dark:border-purple-800`
  - Icon: `text-purple-600`
- **Note**: Only FAQ card is purple, other help cards are blue

## 11. Focus States

### Input Fields
- **Focus Ring**: Changed from purple to blue
- **Class**: `focus:ring-blue-500`
- Applied to all input fields, selects, and textareas

## 12. Settings Navigation

### Active Section Indicator
- Changed from purple to blue
- Active state uses blue gradient: `from-blue-100 to-blue-50` / `dark:from-blue-900/50 dark:to-blue-800/30`

## 13. Profile Information Section (Settings)

### Profile Photo Section
- Background: `bg-blue-100 dark:bg-blue-900`
- Icon: `text-blue-600 dark:text-blue-300`
- Camera button: `bg-blue-600 hover:bg-blue-700`
- Change Photo button: `bg-blue-600 hover:bg-blue-700`

### Input Fields
- Focus ring: `focus:ring-blue-500`

### Save Button
- `bg-blue-600 hover:bg-blue-700`

## 14. Dashboard Cards

### Card Styling
- Background: `bg-white dark:bg-[#212124]`
- Border: `border border-gray-100 dark:border-gray-700`
- Rounded: `rounded-xl` or `rounded-2xl`

## 15. Remaining Purple Elements (May Need Changes)

These purple elements still exist and might need to be changed:
- Notification badge: `bg-purple-500` (dots)
- Average Rating progress bar: `from-purple-500 to-purple-600`
- Some notification-related styling
- FAQ card (intentionally kept purple)

## Implementation Checklist for Other Roles

When implementing in Student, Instructor, Supervisor, and Admin UIs:

- [ ] Update main page background to `dark:bg-[#19191c]`
- [ ] Update all component backgrounds to `dark:bg-[#212124]`
- [ ] Redesign sidebar with floating style and collapse/expand functionality
- [ ] Move notifications and profile into sidebar
- [ ] Remove top header bar
- [ ] Add mobile floating top bar
- [ ] Change all purple colors to blue
- [ ] Update active tab styling to blue gradient
- [ ] Update profile avatars to blue gradient
- [ ] Update student avatars to blue gradient
- [ ] Update all buttons from purple to blue
- [ ] Improve dark mode text visibility
- [ ] Add placeholder styling for inputs
- [ ] Update focus rings to blue
- [ ] Update settings page colors
- [ ] Hide scrollbar in sidebar navigation
- [ ] Adjust main content margins for sidebar states
- [ ] Update dashboard header gradient to blue
- [ ] Test z-index layering on mobile

## Key Color Values Reference

### Dark Mode Backgrounds
- Main background: `#19191c`
- Component background: `#212124`

### Blue Color Palette
- Primary: `blue-600`, `blue-700`
- Gradient: `from-blue-500 to-blue-600` or `from-blue-600 to-blue-700`
- Light: `blue-100`, `blue-50`
- Dark mode: `blue-900/50`, `blue-800/30`, `blue-300`
- Accent: `blue-400`, `blue-500`

### Text Colors (Dark Mode)
- Primary text: `dark:text-white`
- Secondary text: `dark:text-gray-300` (improved from gray-400)
- Labels: `dark:text-gray-200` (for better visibility)
- Placeholder: `dark:placeholder:text-gray-400`

