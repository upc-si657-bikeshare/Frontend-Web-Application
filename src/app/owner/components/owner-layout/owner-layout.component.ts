import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd, RouterLink } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { filter } from "rxjs/operators";
import { Observable } from 'rxjs';
import { SidebarComponent, MenuItem } from '../../../shared/components/sidebar/sidebar.component';
import { LanguageSwitcherComponent } from "../../../shared/components/language-switcher/language-switcher.component";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { CurrentUser, CurrentUserService } from '../../../shared/services/current-user.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, SidebarComponent, MatSidenavModule, MatToolbarModule,
    MatIconModule, MatButtonModule, LanguageSwitcherComponent, TranslateModule,
    MatMenuModule, MatBadgeModule, RouterLink, MatDividerModule
  ],
  templateUrl: './owner-layout.component.html',
  styleUrls: ['./owner-layout.component.css']
})
export class OwnerLayoutComponent implements OnInit {
  pageTitle = '';
  ownerMenuItems: MenuItem[] = [
    { label: 'Sidebar.Home', icon: 'home', link: '/owner/home' },
    { label: 'Sidebar.MyBikes', icon: 'directions_bike', link: '/owner/my-bikes' },
    { label: 'Sidebar.Reservations', icon: 'event_note', link: '/owner/reservations' },
    { label: 'Sidebar.Profile', icon: 'person', link: '/owner/profile' },
    { label: 'Sidebar.Support', icon: 'headset', link: '/owner/support' }
  ];

  private router = inject(Router);
  private translate = inject(TranslateService);
  private currentUserService = inject(CurrentUserService);
  private notificationService = inject(NotificationService);
  currentUser$: Observable<CurrentUser | null>;
  notifications$: Observable<any[]>;
  unreadCount$: Observable<number>;

  constructor() {
    this.currentUser$ = this.currentUserService.currentUser$;
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {
    this.restoreUserSession();
    this.updateTitleOnRouteChange();
  }
  private restoreUserSession(): void {
    if (!this.currentUserService.getCurrentUserSnapshot()) {
      const userIdStr = localStorage.getItem('userId');

      if (userIdStr) {
        const userId = parseInt(userIdStr, 10);
        this.currentUserService.loadUser(userId).subscribe({
          error: () => this.onLogout()
        });
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  onNotificationsClosed(): void {
    this.notificationService.markAllAsRead();
  }

  onLogout(): void {
    this.notificationService.clearNotifications();
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigateByUrl('/login');
  }

  private updateTitleOnRouteChange(): void {
    const updateTitle = () => {
      const currentRoute = this.ownerMenuItems.find(item => this.router.url.includes(item.link));
      this.pageTitle = currentRoute ? this.translate.instant(currentRoute.label) : '';
    };
    updateTitle();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(updateTitle);
  }
}
