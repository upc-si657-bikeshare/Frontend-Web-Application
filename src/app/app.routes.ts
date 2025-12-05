import { Routes } from '@angular/router';

const LoginPage = () => import('./public/pages/login/login.page').then(m => m.LoginPage);
const RegisterPage = () => import('./public/pages/register/register.page').then(m => m.RegisterPage);
const ForgotPasswordPage = () => import('./public/pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage);
const ResetPasswordPage = () => import('./public/pages/reset-password/reset-password.page').then(m => m.ResetPasswordPage);

const OwnerLayoutComponent = () => import('./owner/components/owner-layout/owner-layout.component').then(m => m.OwnerLayoutComponent);
const RenterLayoutComponent = () => import('./renter/components/renter-layout/renter-layout.component').then(m => m.RenterLayoutComponent);

const OwnerHomePage = () => import('./owner/pages/home/owner-home.page').then(m => m.OwnerHomePage);
const OwnerMyBikesPage = () => import('./owner/pages/my-bikes/my-bikes.page').then(m => m.MyBikesPage);
const OwnerReservationsPage = () => import('./owner/pages/reservations/reservations.page').then(m => m.ReservationsPage);
const OwnerProfilePage = () => import('./owner/pages/profile/owner-profile.page').then(m => m.OwnerProfilePage);
const OwnerSupportPage = () => import('./owner/pages/support/owner-support.page').then(m => m.OwnerSupportPage);

const RenterHomePage = () => import('./renter/pages/home/renter-home.page').then(m => m.RenterHomePage);
const RenterMapPage = () => import('./renter/pages/map/map.page').then(m => m.MapPage);
const RenterProfilePage = () => import('./renter/pages/profile/profile.page').then(m => m.ProfilePage);
const RenterSupportPage = () => import('./renter/pages/support/support.page').then(m => m.SupportPage);

export const routes: Routes = [
  {
    path: 'owner',
    loadComponent: OwnerLayoutComponent,
    children: [
      { path: 'home',         loadComponent: OwnerHomePage },
      { path: 'my-bikes',     loadComponent: OwnerMyBikesPage },
      { path: 'reservations', loadComponent: OwnerReservationsPage },
      { path: 'profile',      loadComponent: OwnerProfilePage },
      { path: 'support',      loadComponent: OwnerSupportPage },
      { path: '',             redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  {
    path: 'renter',
    loadComponent: RenterLayoutComponent,
    children: [
      { path: 'home',    loadComponent: RenterHomePage   },
      { path: 'map',     loadComponent: RenterMapPage    },
      { path: 'profile', loadComponent: RenterProfilePage },
      { path: 'support', loadComponent: RenterSupportPage },
      { path: '',        redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  {
    path: 'forgot-password',
    loadComponent: ForgotPasswordPage
  },
  {
    path: 'reset-password',
    loadComponent: ResetPasswordPage
  },
  { path: 'login',    loadComponent: LoginPage },
  { path: 'register', loadComponent: RegisterPage },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
