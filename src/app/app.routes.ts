import { Routes } from '@angular/router';
import { MaintenanceComponent } from './pages/maintenance/maintenance.component';
import { LogSearchComponent } from './pages/log-search/log-search.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/org-list' },
  { path: 'org-list-v3', loadChildren: () => import('./pages/org-list-v3/org-list-v3.routes').then(m => m.ORG_LIST_ROUTES) },
  { path: 'maintenance', component: MaintenanceComponent },
  { path: 'log-search', component: LogSearchComponent },
];
