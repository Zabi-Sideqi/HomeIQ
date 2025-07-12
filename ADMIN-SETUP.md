# Admin System Setup Guide

## Overview

This guide explains how to create and manage admin accounts in your HomeIQ application. Admin users have special privileges to manage all listings and users in the system.

## Admin Features

### Dashboard

- View system statistics (total users, listings, admins, recent activity)
- Quick overview of platform health

### Listing Management

- View all listings from all users
- Delete any listing
- Update any listing (admin override)
- Search and filter listings

### User Management

- View all registered users
- Promote users to admin role
- Demote admins to regular users
- Delete users (and their listings)
- Search users by name or email

## Creating the First Admin

### Step 1: Create a Regular User Account

First, register a normal account through the application's sign-up process at `/sign-up`.

### Step 2: Make User Admin via Script

Use the provided script to promote a user to admin:

```bash
cd api
node scripts/makeAdmin.js your-email@example.com
```

Replace `your-email@example.com` with the email address of the account you want to make admin.

### Step 3: Verify Admin Access

1. Log in with the promoted account
2. You should see an "Admin" link in the navigation header
3. Visit `/admin` to access the admin dashboard

## Admin Routes

### Backend API Routes

All admin routes require authentication and admin role verification:

- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/listings` - Get all listings with pagination and search
- `PUT /api/admin/listings/:id` - Update any listing
- `DELETE /api/admin/listings/:id` - Delete any listing
- `GET /api/admin/users` - Get all users with pagination and search
- `PUT /api/admin/users/:id/role` - Update user role (user/admin)
- `DELETE /api/admin/users/:id` - Delete user and their listings

### Frontend Routes

- `/admin` - Admin dashboard (protected route, admin only)

## Security Features

### Role-Based Access Control

- Users have a `role` field in the database (`user` or `admin`)
- Admin middleware (`verifyAdmin.js`) checks user role on protected routes
- Frontend components check user role to show/hide admin features

### Admin Safeguards

- Cannot delete the last admin user
- Cannot demote the last admin user
- Admin privileges override ownership checks on listings

### Authentication

- All admin routes require valid JWT token
- Token can be sent via Authorization header (`Bearer <token>`) or cookie
- Admin role is verified by checking user record in database

## Database Schema

### User Model Updates

The user model includes a `role` field:

```javascript
role: {
  type: String,
  enum: ["user", "admin"],
  default: "user",
}
```

### Listing Model

No changes required - admin privileges are enforced at the controller level.

## Frontend Components

### AdminDashboard.jsx

- Main admin interface
- Tabbed layout for dashboard, listings, and users
- Search functionality
- Responsive design with Tailwind CSS

### Header.jsx Updates

- Shows "Admin" link for admin users
- Available in both desktop and mobile navigation

## API Integration

### Admin API Calls

All admin API calls include authentication headers:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
},
credentials: 'include'
```

### Error Handling

- Proper error responses for unauthorized access
- Toast notifications for user feedback
- Graceful handling of failed operations

## Usage Examples

### Promoting a User to Admin

```bash
cd api
node scripts/makeAdmin.js john@example.com
```

### Admin Deleting a Listing

Admins can delete any listing through:

1. Admin dashboard → Manage Listings tab
2. Search for the listing
3. Click "Delete" button
4. Confirm deletion

### Admin Managing Users

Admins can:

1. View all users in the "Manage Users" tab
2. Search by username or email
3. Promote users to admin with "Make Admin" button
4. Demote admins with "Remove Admin" button
5. Delete users with "Delete" button (also deletes their listings)

## Important Notes

### Production Considerations

1. **First Admin**: Create the first admin manually using the script
2. **Admin Security**: Keep admin accounts secure with strong passwords
3. **Regular Backups**: Admin actions can delete data - ensure backups
4. **Monitoring**: Monitor admin activities in production

### Limitations

- Only one admin role level (no super-admin vs admin distinction)
- Admin actions are not logged (consider adding audit trails)
- No bulk operations (delete multiple listings/users at once)

### Future Enhancements

- Admin activity logging
- Bulk operations
- Advanced filtering and sorting
- User activity monitoring
- Listing analytics and reports

## Troubleshooting

### Admin Link Not Showing

1. Verify user role in database: `db.users.findOne({email: "your-email"})`
2. Check if user is properly logged in with valid token
3. Ensure JWT includes correct user ID

### 403 Forbidden on Admin Routes

1. Verify user has admin role in database
2. Check JWT token is valid and not expired
3. Ensure Authorization header is properly set

### Cannot Access Admin Dashboard

1. Verify route is properly protected with PrivateRoute
2. Check if AdminDashboard component is imported in App.jsx
3. Ensure user role check is working in component

## Support

For issues with the admin system:

1. Check browser console for JavaScript errors
2. Check server logs for API errors
3. Verify database user role field
4. Test with the makeAdmin script

The admin system provides comprehensive control over your HomeIQ platform while maintaining security and user experience.
