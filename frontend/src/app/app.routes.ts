import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { KanbanComponent } from './components/kanban/kanban.component';
import { TableComponent } from './components/table/table.component';
import { UploadComponent } from './components/upload/upload.component';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.getToken()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'kanban', component: KanbanComponent, canActivate: [authGuard] },
  { path: 'table', component: TableComponent, canActivate: [authGuard] },
  { path: 'upload', component: UploadComponent, canActivate: [authGuard] }
];
