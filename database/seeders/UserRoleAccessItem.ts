import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import UserRoleAccessItem from 'App/Models/User/UserRoleAccessItem';

const accessItems = [
  {id: 1, code: 'COMPANY-VIEW', section: 'Company', action: 'View', level: 0},
  {id: 2, code: 'COMPANY-MODIFY', section: 'Company', action: 'Add/Edit', level: 1},
  {id: 3, code: 'COMPANY-DELETE', section: 'Company', action: 'DELETE', level: 2},
  //... there were more items here ;) ...
];
export default class extends BaseSeeder {
  public async run () {
    const createdItems = await UserRoleAccessItem.query().select(['id']);
    const createdItemIds = createdItems.map((item) => item.id);

    for (const accessItem of accessItems) {
      if (!createdItemIds.includes(accessItem.id)) {
        await UserRoleAccessItem.create(accessItem);
      }
    }
  }
}
