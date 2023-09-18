export interface RequestAccessData {
  roleId: number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  myCompanyId: number;
  checkCompanyAccess: (companyIdOrDid: number | string | null) => Promise<boolean>;
};
