import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { KanbanComponent } from './components/kanban/kanban.component';
import { TableComponent } from './components/table/table.component';
import { UploadComponent } from './components/upload/upload.component';
import { ExcelComponent } from './components/excel/excel.component';
import { UsersComponent } from './components/users/users.component';
import { AuditLogComponent } from './components/audit/audit-log.component';
import { ProveedoresComponent } from './components/proveedores/proveedores.component';
import { ContenedoresComponent } from './components/contenedores/contenedores.component';
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

const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.getToken()) {
    router.navigate(['/login']);
    return false;
  }
  const roles = authService.getRoles();
  if (roles.includes('Admin')) {
    return true;
  }
  router.navigate(['/dashboard']);
  return false;
};

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'kanban', component: KanbanComponent, canActivate: [authGuard] },
  { path: 'table', component: TableComponent, canActivate: [authGuard] },
  { path: 'excel', component: ExcelComponent, canActivate: [authGuard] },
  { path: 'proveedores', component: ProveedoresComponent, canActivate: [authGuard] },
  { path: 'contenedores', component: ContenedoresComponent, canActivate: [authGuard] },
  { path: 'usuarios', component: UsersComponent, canActivate: [adminGuard] },
  { path: 'actividad', component: AuditLogComponent, canActivate: [adminGuard] }
];
