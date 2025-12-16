import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/org-list' },
  { path: 'information', loadChildren: () => import('./pages/information/information.routes').then(m => m.INFORMATION_ROUTES) },
  { path: 'org-list', loadChildren: () => import('./pages/org-list/org-list.routes').then(m => m.ORG_LIST_ROUTES) },
  { path: 'org-list-v2', loadChildren: () => import('./pages/org-list-v2/org-list-v2.routes').then(m => m.ORG_LIST_ROUTES) },
  { path: 'org-list-v3', loadChildren: () => import('./pages/org-list-v3/org-list-v3.routes').then(m => m.ORG_LIST_ROUTES) },
];
