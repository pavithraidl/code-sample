/*
|--------------------------------------------------------------------------
| Model field sections
|--------------------------------------------------------------------------
|
| This provided constants for differnet model fields to select when
| responding to api requests.
*/
const modelSelectionQueries = {
  // Common
  common: {
    getSeo: (seoQuery) => {
      seoQuery.select(['title', 'description', 'robots', 'imageUrl']);
    },
    getAddress: (addressQuery) => {
      addressQuery.select(['streetNumber', 'addressLine1', 'addressLine2', 'city', 'postalCode', 'latitude', 'longitude', 'formattedAddress']);
    },
  },

  // Company
  company: {
    getBasic: (companyQuery, activeItemsOnly = true) => {
      if (activeItemsOnly) {
        companyQuery.where('status', 'ACTIVE');
      }
      companyQuery.select(modelSelectionQueries.company.basic);
    },
    basic: ['id', 'name', 'did', 'slug', 'themeColor', 'logoUrl', 'status'],
    full: ['id', 'did', 'name', 'displayName', 'websiteUrl', 'themeColor', 'logoUrl', 'addressId', 'keyInformation', 'gallery', 'slug', 'seoId'],
  },

  // Product
  product: {
    getBasic: (serviceQuery) => {
      serviceQuery.where('status', 'ACTIVE').select(modelSelectionQueries.product.basic);
    },
    basic: ['name', 'did', 'heroImageUrl', 'companyId', 'status', 'slug', 'createdAt'],
    full: ['id', 'did', 'name', 'description', 'heroImageUrl', 'slug', 'gallery', 'companyId', 'meta', 'guid', 'seoId'],
  },

  // Resource
  resource: {
    getBasic: (resourceQuery) => {
      resourceQuery
        .preload('tool', ((toolQuery) => toolQuery.select(modelSelectionQueries.product.basic)))
        .preload('consumable', ((consumableQuery) => consumableQuery.select(modelSelectionQueries.product.basic)))
        .preload('personnels', ((personnelQuery) => personnelQuery.preload('office', ((officeQuery) => officeQuery.select(modelSelectionQueries.office.basic))).select(modelSelectionQueries.user.basic)))
        .select(modelSelectionQueries.resource.basic);
    },
    basic: ['id', 'name', 'productId', 'guid', 'type', 'preparationTime', 'finalizingTime', 'toolDid', 'requiredQuantity', 'consumableDid', 'status'],
    full: ['id', 'name', 'productId', 'guid', 'type', 'preparationTime', 'finalizingTime', 'toolDid', 'requiredQuantity', 'consumableDid', 'status'],
  },

  // Customer
  customer: {
    getBasic: (customerQuery, preloadModels: string[] = []) => {
      customerQuery.where('status', 'ACTIVE').select(modelSelectionQueries.customer.basic);
      if (preloadModels.length) {
        for (const preloadModel of preloadModels) {
          switch (preloadModel) {
            case 'user':
              customerQuery.preload('user', ((userQuery) => userQuery.select(modelSelectionQueries.user.basic)));
              break;
          }
        }
      }
    },
    basic: ['id', 'did', 'firstName', 'lastName', 'creditBalance', 'avatarUrl', 'userId', 'emails', 'phoneNumbers', 'status'],
    full: ['id', 'did', 'name', 'avatarUrl', 'creditBalance', 'displayName', 'websiteUrl', 'themeColor', 'logoUrl', 'addressId', 'keyInformation', 'gallery', 'slug', 'seoId'],
  },

  // Office
  office: {
    getBasic: (officeQuery) => {
      officeQuery.where('status', 'ACTIVE').select(modelSelectionQueries.office.basic);
    },
    basic: ['id', 'did', 'name', 'status', 'createdAt'],
    full: ['id', 'did', 'name', 'description', 'heroImageUrl', 'slug', 'gallery', 'companyId', 'meta', 'guid', 'seoId'],
  },

  user: {
    getBasic: (userQuery) => {
      userQuery.select(modelSelectionQueries.user.basic);
    },
    basic: ['id', 'did', 'companyId', 'officeId', 'email', 'firstName', 'lastName', 'avatarUrl', 'phoneNumber', 'status'],
  },
};

export default modelSelectionQueries;
