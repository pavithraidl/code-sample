import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import UserRole from 'App/Models/User/UserRole';

const userRoles = [
  {id: 1, name: 'System Admin', description: 'System admin who has the full access over the entire system.', permissions: {data: 'FULL'}, isLocked: true, roleImage: '/images/roles/nh-admin.webp', slug: 'system_admin', isManualEnabled: false},
  {id: 2, name: 'Platform Admin', description: 'Super admin who has the full access over the entire platform.', permissions: {data: 'FULL'}, isLocked: true, roleImage: '/images/roles/nh-admin.webp', slug: 'nh_admin'},
  //... there were more items here ;) ...
];

export default class extends BaseSeeder {
  public async run () {
    const createdRoles = await UserRole.query().select(['slug']);
    const createdRoleNames = createdRoles.map((item) => item.slug);

    for (const userRole of userRoles) {
      if (!createdRoleNames.includes(userRole.slug)) {
        await UserRole.create(userRole);
      }
    }
  }
}
