import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import User from 'App/Models/User';

const defaultUsers = [
  {firstName: 'NH', lastName: 'Bot', email: 'b..@.....nz', avatarUrl: '/images/avatars/nh-bot.png', status: 'ACTIVE', roleId: 1},
  {firstName: 'System', lastName: 'Admin', email: 'a..@....nz', avatarUrl: '...short-logox200.png', status: 'ACTIVE', roleId: 1},
];

export default class extends BaseSeeder {
  public async run () {
    for (const user of defaultUsers) {
      const isUserExists = await User.query().where('email', user.email).first();
      if (!isUserExists) {
        try {
          // @ts-ignore
          await User.create(user);
        } catch (err) {
          console.log(err);
        }
      }
    }
  }
}
