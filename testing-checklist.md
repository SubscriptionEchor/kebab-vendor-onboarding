# Restaurant Application Testing Checklist

## 1. Authentication Flow
- [ ] Phone number login works for both German and Indian numbers
- [ ] OTP verification works correctly
- [ ] Email verification process completes successfully
- [ ] Session persistence works after page refresh
- [ ] Logout functionality works properly
- [ ] Protected routes redirect to login when not authenticated

## 2. Restaurant Information Step
- [ ] Form retains data between navigation (back/next)
- [ ] All required fields are properly validated:
  - [ ] Company name
  - [ ] Restaurant name
  - [ ] Restaurant email
  - [ ] Restaurant phone
  - [ ] Address fields
  - [ ] Owner information
- [ ] Multiple owners can be added (up to 6 additional)
- [ ] Map location selection works
- [ ] Address search functionality works
- [ ] Phone numbers are properly formatted for both DE and IN

## 3. Menu Details Step
- [ ] Profile image upload works
- [ ] Restaurant images upload (2-4 images)
- [ ] Menu images upload (1-4 images)
- [ ] Cuisine selection (exactly 3 required)
- [ ] Opening hours for all days can be set
- [ ] Form data persists between navigation

## 4. Documents Step
- [ ] All required documents can be uploaded:
  - [ ] Hospitality License
  - [ ] Registration Certificate
  - [ ] Bank Documents
  - [ ] Tax Documents
  - [ ] ID Cards
- [ ] Bank details form works
- [ ] Document validation works
- [ ] Form data persists between navigation

## 5. Data Validation
- [ ] Email format validation
- [ ] Phone number format validation
- [ ] Required field validation
- [ ] Image size and format validation
- [ ] Document format validation

## 6. API Integration
- [ ] All API endpoints are called with correct data
- [ ] Error handling works properly
- [ ] Success responses are handled correctly
- [ ] Loading states are shown appropriately

## 7. Data Persistence
- [ ] Form data is saved in localStorage
- [ ] Data is properly restored after page refresh
- [ ] Data is cleared after successful submission

## 8. UI/UX
- [ ] Responsive design works on all screen sizes
- [ ] Loading states are shown appropriately
- [ ] Error messages are clear and visible
- [ ] Success messages are shown
- [ ] Navigation between steps is smooth
- [ ] Animations work properly

## Test Cases for Critical Paths

### Authentication
1. Login with valid German number
2. Login with valid Indian number
3. Try invalid phone numbers
4. Verify OTP process
5. Test email verification

### Restaurant Information
1. Fill all required fields
2. Test address search and map
3. Add multiple owners
4. Test phone number formatting
5. Test validation messages

### Menu Details
1. Upload profile image
2. Upload restaurant images
3. Upload menu images
4. Select cuisines
5. Set opening hours
6. Test validation

### Documents
1. Upload all required documents
2. Fill bank details
3. Test document validation
4. Test form submission

### Error Scenarios
1. Test network errors
2. Test validation errors
3. Test file upload errors
4. Test session expiration
5. Test form validation errors

## Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Device Testing
- [ ] Desktop
- [ ] Tablet
- [ ] Mobile

## Performance
- [ ] Image upload performance
- [ ] Form submission performance
- [ ] Navigation performance
- [ ] Map loading performance