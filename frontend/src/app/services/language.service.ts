import { Injectable, signal } from '@angular/core';

export type Language = 'es' | 'en' | 'zh';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  currentLang = signal<Language>('es');

  private translations: Record<Language, Record<string, string>> = {
    es: {
      nav_dashboard: 'Dashboard',
      nav_kanban: 'Tablero',
      nav_table: 'Lista',
      nav_excel: 'Subir Excel',
      nav_proveedores: 'Proveedores',
      nav_contenedores: 'Embarques / Contenedores',
      nav_users: 'Usuarios',
      nav_activity: 'Actividad',
      nav_logout: 'Salir',
      search_placeholder: 'Buscar código, producto, ciudad...',
      total_invested: 'Inversión Total',
      total_gain: 'Ganancia Estimada',
      total_orders: 'Pedidos Activos',
      total_cubica: 'Volumen Total (m³)',
      stage_cotizacion: 'Cotización',
      stage_confirmado: 'Confirmado',
      stage_pagado: 'Pagado',
      stage_transito: 'En Tránsito',
      stage_aduana: 'Aduana',
      stage_recibido: 'Recibido',
      login_title: 'Iniciar Sesión',
      login_sub: 'Sistema Enterprise de Gestión de Importaciones',
      login_email: 'Correo Electrónico',
      login_password: 'Contraseña',
      login_remember: 'Recordarme',
      login_forgot: '¿Olvidaste tu contraseña?',
      login_btn: 'Ingresar al Sistema',
      forgot_modal_title: 'Restablecer Contraseña',
      forgot_modal_msg: 'Contacta al Administrador Principal para reexpedir tus credenciales de acceso seguras.'
    },
    en: {
      nav_dashboard: 'Dashboard',
      nav_kanban: 'Kanban Board',
      nav_table: 'Order List',
      nav_excel: 'Upload Excel',
      nav_proveedores: 'Suppliers',
      nav_contenedores: 'Shipment Containers',
      nav_users: 'Users',
      nav_activity: 'Activity Log',
      nav_logout: 'Logout',
      search_placeholder: 'Search code, product, city...',
      total_invested: 'Total Investment',
      total_gain: 'Estimated Profit',
      total_orders: 'Active Orders',
      total_cubica: 'Total Volume (m³)',
      stage_cotizacion: 'Quotation',
      stage_confirmado: 'Confirmed',
      stage_pagado: 'Paid',
      stage_transito: 'In Transit',
      stage_aduana: 'Customs',
      stage_recibido: 'Received',
      login_title: 'Sign In',
      login_sub: 'Enterprise Import Management System',
      login_email: 'Email Address',
      login_password: 'Password',
      login_remember: 'Remember Me',
      login_forgot: 'Forgot Password?',
      login_btn: 'Login to System',
      forgot_modal_title: 'Reset Password',
      forgot_modal_msg: 'Please contact the Lead Administrator to reissue your secure access credentials.'
    },
    zh: {
      nav_dashboard: '仪表板 (Dashboard)',
      nav_kanban: '看板 (Kanban)',
      nav_table: '订单列表 (List)',
      nav_excel: '上传 Excel',
      nav_proveedores: '供应商 (Suppliers)',
      nav_contenedores: '集装箱/运输 (Containers)',
      nav_users: '用户管理 (Users)',
      nav_activity: '活动日志',
      nav_logout: '退出登录',
      search_placeholder: '搜索代码、产品、城市...',
      total_invested: '总投资额',
      total_gain: '预计利润',
      total_orders: '活动订单数',
      total_cubica: '总体积 (m³)',
      stage_cotizacion: '报价 (Quotation)',
      stage_confirmado: '已确认 (Confirmed)',
      stage_pagado: '已付款 (Paid)',
      stage_transito: '运输中 (In Transit)',
      stage_aduana: '海关清关 (Customs)',
      stage_recibido: '已收货 (Received)',
      login_title: '系统登录',
      login_sub: '企业级进口供应链管理系统',
      login_email: '电子邮箱',
      login_password: '密码',
      login_remember: '记住我',
      login_forgot: '忘记密码？',
      login_btn: '登录系统',
      forgot_modal_title: '重置密码',
      forgot_modal_msg: '请联系首席管理员重新颁发您的安全访问凭据。'
    }
  };

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
  }

  t(key: string): string {
    const lang = this.currentLang();
    return this.translations[lang]?.[key] || this.translations['es']?.[key] || key;
  }
}
