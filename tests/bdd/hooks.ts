/**
 * BDD Hooks - инициализация и очистка
 */

import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { ApiWorld } from './world';

Before(async function (this: ApiWorld) {
    await this.initApi();
    this.reset();
});

After(async function (this: ApiWorld) {
    await this.disposeApi();
});
