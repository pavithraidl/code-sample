import { JobContract } from '@ioc:Rocketseat/Bull';

/*
|--------------------------------------------------------------------------
| Job setup
|--------------------------------------------------------------------------
|
| This is the basic setup for creating a job, but you can override
| some settings.
|
| You can get more details by looking at the bullmq documentation.
| https://docs.bullmq.io/
*/

export default class SampleJob implements JobContract {
  public key = 'ListingsBulkAddJob';

  public async handle (job) {
    console.log(job);
  }
}
