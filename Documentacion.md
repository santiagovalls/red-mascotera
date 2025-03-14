# Red Mascotera - Technical Documentation

## Project Overview

Red Mascotera is a web application designed for managing pet registrations and adoption statuses across a network of shelters. The application provides a secure authentication system and implements row-level security (RLS) policies to protect data. It offers an intuitive interface for shelter administrators to efficiently manage information about pets available for adoption.

## Architecture

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Tabler UI (Bootstrap-based)
- **Data Visualization**: DataTables.js
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Notifications**: Toastr.js

### Project Structure

```
red-mascotera/
├── assets/
│   ├── images/           # SVG icons for the UI
│   └── jsons/            # Localization files for DataTables
├── libs/
│   ├── supabase.js       # Supabase client configuration and auth utilities
│   └── toastr.js         # Toast notification configuration
├── pets/
│   ├── index.html        # Pet management interface
│   ├── main.js           # Pet management logic
│   └── styles.css        # Pet management specific styles
├── index.html            # Login page
├── main.js               # Login logic
├── styles.css            # Global styles
└── README.md             # Project overview
```

## Database Schema

The application uses Supabase (PostgreSQL) with the following tables:

1. **pets**: Main entity table
   - id (UUID, primary key)
   - name (text)
   - tag (text)
   - pet_type_id (foreign key to pet_types)
   - pet_state_id (foreign key to pet_states)
   - created_at (timestamp)

2. **pet_types**: Types of pets
   - id (UUID, primary key)
   - name (text)

3. **pet_states**: Adoption states
   - id (UUID, primary key)
   - name (text)

## Authentication and Security

- The application uses Supabase Authentication for user management
- Row-Level Security (RLS) policies are implemented to protect data
- Session management ensures users are authenticated before accessing protected resources
- The `checkUserToken()` function verifies user authentication status on protected pages

## Core Functionality

### Authentication Flow

1. Users enter credentials on the login page
2. Credentials are validated against Supabase Auth
3. Upon successful authentication, users are redirected to the pet management interface
4. Session tokens are verified on each protected page load

### Pet Management

1. **Listing**: Pets are displayed in a DataTable with server-side processing
   - Supports pagination, sorting, and searching
   - Highlights search terms in results

2. **Adding**: New pets can be added via a modal form
   - Form includes fields for name, tag, pet type, and adoption state
   - Data is validated before submission

3. **Editing**: Existing pets can be modified via the same form
   - Current data is pre-populated in the form
   - Changes are saved to the database upon submission

4. **Deleting**: Pets can be removed after confirmation
   - Confirmation modal prevents accidental deletions
   - UI is updated to reflect changes

## API Integration

The application communicates with Supabase using the Supabase JavaScript client:

- **Authentication**: `supabase.auth.signInWithPassword()`
- **Data Retrieval**: `supabase.from('table').select()`
- **Data Insertion**: `supabase.from('table').insert()`
- **Data Updates**: `supabase.from('table').update().eq()`
- **Data Deletion**: `supabase.from('table').delete().eq()`

## UI Components

1. **Login Form**: Simple authentication form with email and password fields
2. **DataTable**: Interactive table for displaying and managing pets
3. **Add/Edit Modal**: Form for creating and updating pet records
4. **Delete Confirmation Modal**: Confirmation dialog for pet deletion
5. **Toast Notifications**: Non-intrusive feedback messages for user actions

## Error Handling

- Form validation prevents submission of invalid data
- API errors are caught and displayed to users via toast notifications
- Authentication failures redirect users to the login page
- Network issues are handled gracefully with appropriate error messages

## Performance Considerations

- Server-side processing for DataTables reduces client-side load
- Pagination limits the amount of data transferred in each request
- Efficient SQL queries with proper indexing on the database side
- Minimal DOM manipulation for better UI performance

## Security Considerations

- Authentication tokens are managed securely
- Password fields are properly masked
- No sensitive data is exposed in client-side code
- Supabase RLS policies restrict data access based on user roles
- Input validation helps prevent injection attacks

## Future Enhancements

Potential areas for improvement include:

1. Advanced filtering options for the pet list
2. Image upload functionality for pet profiles
3. User management interface for administrators
4. Reporting and analytics features
5. Mobile application integration
6. Multi-language support
7. Adoption workflow management

## Deployment

The application is designed to be deployed as a static website with Supabase handling the backend functionality. This architecture allows for simple hosting on any static file server or CDN. 