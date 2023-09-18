/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/
import Route from '@ioc:Adonis/Core/Route';

Route.get('/', async () => {
  return { status: 'ok' };
});

if (process.env.NODE_ENV === 'development') {
  // Temporary test route
  Route.get('/test', 'TestsController.test');
}

// Authenticate Session
Route.post('/auth-session', 'Auth/AuthSessionsController.getToken');

/**
 * PUBLIC Routes
 * -------------------------------------------------------------------------------------------------------------------
 *
 */
Route.group(() => {
  /**
   * PUBLIC User Route Group
   * -------------------------------------------------------------------------------------------------------------------
   */
  // Auth Guest Routes
  Route.group(() => {
    Route.get('/', 'Auth/AuthPublicUserController.show');
    Route.post('/register', 'Auth/AuthPublicUserController.register');
    Route.post('/login', 'Auth/AuthPublicUserController.login');
    Route.post('/activate', 'Auth/AuthPublicUserController.activateAccount');
    Route.post('/request-reset-password-link', 'Auth/AuthPublicUserController.requestPasswordResetLink');
    Route.post('/reset-password', 'Auth/AuthPublicUserController.resetPassword');
  }).prefix('/auth');

  // Auth User Routes
  Route.group(() => {
    Route.group(() => {
      Route.get('/', 'Auth/AuthPublicUserController.show');
      Route.post('/', 'Auth/AuthPublicUserController.update');
      Route.get('/logout', 'Auth/AuthPublicUserController.logout');
    }).prefix('/user');
  }).middleware('auth:api');
}).prefix('/public');

/**
 * Auth SESSION Route Group
 * ---------------------------------------------------------------------------------------------------------------------
 */
Route.group(() => {
  // Auth Guest Routes
  Route.group(()=> {
    Route.post('/login', 'Auth/AuthUserController.login');
    Route.post('/request-password-reset-link', 'Auth/AuthUserController.requestPasswordResetLink');
    Route.post('/validate-reset-password-token', 'Auth/AuthUserController.validateResetPasswordToken');
    Route.post('/reset-password', 'Auth/AuthUserController.resetPassword');
    Route.post('/validate-join-invitation', 'Auth/AuthUserController.validateJoinInvitation');
    Route.post('/resend-activation-email', 'Auth/AuthUserController.resendActivationEmail');
  }).prefix('/auth');

  /**
   * Auth USER Route Group
   * -------------------------------------------------------------------------------------------------------------------
   */
  Route.group(() => {
    // Auth User Routes
    Route.group(() => {
      Route.get('/user', 'Auth/AuthUserController.get');
      Route.post('/logout', 'Auth/AuthUserController.logout');
    }).prefix('/auth');

    // Company Routes
    Route.group(() => {
      Route.get('/', 'Company/CompanyController.list').middleware('access:COMPANY-VIEW');
      Route.get('/:did?', 'Company/CompanyController.show').middleware('access:COMPANY-VIEW');
      Route.put('/', 'Company/CompanyController.update').middleware('access:COMPANY-MODIFY');
      Route.post('/', 'Company/CompanyController.create').middleware('access:COMPANY-MODIFY');
      Route.delete('/', 'Company/CompanyController.delete').middleware('access:COMPANY-MODIFY');
    }).prefix('/companies');
    // Company ownership transfer
    Route.put('/companies-transfer-ownership', 'Company/CompanyController.transferOwnership').middleware('access:COMPANY-DELETE');

    // Booking Routes
    Route.group(() => {
      Route.get('/check-availability', 'Booking/BookingController.checkAvailability').middleware('access:SERVICE-VIEW');
      Route.get('/', 'Booking/BookingController.list').middleware('access:SERVICE-MODIFY');
      Route.get('/:did?', 'Booking/BookingController.show').middleware('access:SERVICE-MODIFY');
      Route.put('/', 'Booking/BookingController.createOrUpdate').middleware('access:SERVICE-MODIFY');
    }).prefix('/bookings');

    // Booking Routes
    Route.group(() => {
      Route.post('/', 'Booking/BookingPaymentController.create').middleware('access:SERVICE-MODIFY');
    }).prefix('/booking-payments');

    // Booking Schedule Routes
    Route.group(() => {
      Route.get('/', 'Booking/BookingScheduleController.list').middleware('access:SERVICE-MODIFY');
      Route.put('/', 'Booking/BookingScheduleController.createOrUpdate').middleware('access:SERVICE-MODIFY');
    }).prefix('/booking-schedules');

    // Product Routes
    Route.group(() => {
      Route.get('/', 'Product/ProductController.list').middleware('access:SERVICE-VIEW');
      Route.get('/:did?', 'Product/ProductController.show').middleware('access:SERVICE-VIEW');
      Route.put('/', 'Product/ProductController.update').middleware('access:SERVICE-MODIFY');
      Route.post('/', 'Product/ProductController.create').middleware('access:SERVICE-MODIFY');
      Route.delete('/', 'Product/ProductController.delete').middleware('access:SERVICE-MODIFY');
    }).prefix('/products');

    // Product Pricing Routes
    Route.group(() => {
      Route.put('/', 'Product/ProductPricingController.update').middleware('access:SERVICE-MODIFY');
      Route.delete('/:guid', 'Product/ProductPricingController.delete').middleware('access:SERVICE-MODIFY');
    }).prefix('/product/pricing');

    // Product Resources Routes
    Route.group(() => {
      Route.put('/', 'Product/ProductResourceController.update').middleware('access:SERVICE-MODIFY');
      Route.delete('/:guid', 'Product/ProductResourceController.delete').middleware('access:SERVICE-MODIFY');
    }).prefix('/product/resource');

    // Office Routes
    Route.group(() => {
      Route.get('/', 'Office/OfficeController.list').middleware('access:OFFICE-VIEW');
      Route.get('/:did?', 'Office/OfficeController.show').middleware('access:OFFICE-VIEW');
      Route.put('/', 'Office/OfficeController.update').middleware('access:OFFICE-MODIFY');
      Route.post('/', 'Office/OfficeController.create').middleware('access:OFFICE-MODIFY');
      Route.delete('/', 'Office/OfficeController.delete').middleware('access:OFFICE-MODIFY');
    }).prefix('/offices');

    // Roles and Permissions routes
    Route.group(() => {
      Route.get('/', 'Role/RoleController.list').middleware('access:ROLE-VIEW|USER-VIEW');
      Route.post('/', 'Role/RoleController.create').middleware('access:ROLE-MODIFY');
      Route.get('/permission-list', 'Role/RoleController.getPermissionList').middleware('access:ROLE-VIEW');
      Route.get('/:slug', 'Role/RoleController.show').middleware('access:ROLE-VIEW');
      Route.put('/:slug', 'Role/RoleController.update').middleware('access:ROLE-MODIFY');
    }).prefix('/roles-and-permissions');

    // Customers Routes
    Route.group(() => {
      Route.get('/:did', 'Customer/CustomerController.show').middleware('access:USER-VIEW');
      Route.get('/', 'Customer/CustomerController.list').middleware('access:USER-VIEW');
      Route.post('/', 'Customer/CustomerController.createOrUpdate').middleware('access:USER-VIEW');
    }).prefix('/customers');

    // User Routes
    Route.group(() => {
      Route.get('/', 'User/UserController.list').middleware('access:USER-VIEW');
      Route.post('/', 'User/UserController.create').middleware('access:USER-MODIFY');
      Route.get('/:did?', 'User/UserController.show').middleware('access:USER-VIEW');
      Route.put('/', 'User/UserController.update').middleware('access:USER-MODIFY');
      Route.put('/change-password/:did', 'User/UserController.changePassword');
      Route.get('/get-login-history/:did', 'User/UserController.getLoginHistory').middleware('access:USER-VIEW');
    }).prefix('/users');

    // Payment routes
    Route.group(() => {
      Route.group(() => {
        Route.get('/portal-url', 'Payment/PaymentCustomersController.getPortalUrl').middleware('access:COMPANY-MODIFY');
      }).prefix('/customer');
      Route.group(() => {
        Route.get('/', 'Payment/PaymentProductsController.list');
        Route.get('/sync', 'Payment/PaymentProductsController.syncWithStripe');
      }).prefix('/product');
      Route.group(() => {
        Route.get('/link/:companyDid/:priceStripeId', 'Payment/PaymentSubscriptionsController.getSubscribeLink').middleware('access:COMPANY-MODIFY');
        Route.get('/cancel/:companyDid', 'Payment/PaymentSubscriptionsController.cancel').middleware('access:COMPANY-MODIFY');
      }).prefix('/subscribe');
    }).prefix('/payments');

    // Common Routes
    Route.group(() => {
      Route.post('/file-manager/upload', 'Common/FileManagerController.uploadFiles');
      Route.post('/log/', 'Common/Log/LogResourcesController.list');
    }).prefix('/common');

    // AI Routes
    Route.group(() => {
      Route.post('/chat', 'AI/AIController.chat');
      Route.post('/write-content', 'AI/AIController.writeContent');
      Route.post('/check-to-preform-action', 'AI/AIController.checkUserWantToPreformAnAction');
    }).prefix('/ai');
  }).middleware('auth:api');
}).middleware('sessionAuth');
