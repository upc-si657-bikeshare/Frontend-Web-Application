import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from "@angular/material/icon";
import { NotificationService } from '../../../shared/services/notification.service';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { DashboardStats } from '../../model/dashboard-stats.entity';
import { Reservation } from '../../model/reservation.entity';
import { Bike } from '../../model/bike.entity';
import { bookingService } from '../../../../api/bookingService';
import { catalogService } from '../../../../api/catalogService';
import { identityService } from '../../../../api/identityService';

export interface RecentActivity {
  type: 'reservation' | 'review' | 'cancellation';
  person: string;
  bikeName: string;
  timestamp: Date;
}

@Component({
  selector: 'app-owner-home-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    CurrencyPipe,
    MatIconModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './owner-home.page.html',
  styleUrls: ['./owner-home.page.css']
})
export class OwnerHomePage implements OnInit {
  ownerName = '';
  stats: DashboardStats = new DashboardStats();
  pendingReservations: Reservation[] = [];
  recentActivities: RecentActivity[] = [];
  topBikes: Bike[] = [];

  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private currentUserService = inject(CurrentUserService);

  ngOnInit(): void {
    this.fetchOwnerName();
    this.loadRealDashboardData();
  }

  private fetchOwnerName(): void {
    this.currentUserService.currentUser$.subscribe(user => {
      if (user) {
        this.ownerName = user.fullName;
      }
    });
  }
  private async loadRealDashboardData() {
    const ownerIdStr = localStorage.getItem('userId');
    if (!ownerIdStr) return;
    const ownerId = parseInt(ownerIdStr, 10);

    try {
      const myBikesData: any[] = await catalogService.getAllBikes({ ownerId });
      const myBikes = myBikesData.map(b => new Bike(b));
      const reservationsPromises = myBikes.map(bike =>
        bookingService.getReservations({ bikeId: bike.id })
      );
      const results = await Promise.all(reservationsPromises);
      const allReservationsRaw = results.flat();
      const monthlyIncome = allReservationsRaw
        .filter((r: any) => r.status === 'COMPLETED')
        .reduce((sum: number, r: any) => sum + (r.totalPrice || 0), 0);
      const pendingCount = allReservationsRaw.filter((r: any) => r.status === 'PENDING').length;

      this.stats = new DashboardStats({
        monthlyIncome: monthlyIncome,
        pendingReservationsCount: pendingCount,
        activeBikesCount: myBikes.length,
        ownerRating: 4.8
      });
      const pendingRaw = allReservationsRaw
        .filter((r: any) => r.status === 'PENDING')
        .slice(0, 3);

      this.pendingReservations = await Promise.all(pendingRaw.map(async (res: any) => {
        const bike = myBikes.find(b => b.id === res.bikeId);
        let renterName = 'Usuario';
        try {
          const profile = await identityService.getProfile(res.renterId);
          renterName = profile.fullName;
        } catch(e) {}

        return new Reservation({
          id: res.id,
          renterName: renterName,
          bikeName: bike ? bike.model : 'Bici',
          date: new Date(res.startDate),
          status: 'PENDING',
          totalPrice: res.totalPrice
        });
      }));
      const recentRaw = allReservationsRaw
        .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, 5);

      this.recentActivities = await Promise.all(recentRaw.map(async (res: any) => {
        const bike = myBikes.find(b => b.id === res.bikeId);
        let renterName = 'Usuario';
        try {
          const profile = await identityService.getProfile(res.renterId);
          renterName = profile.fullName;
        } catch(e) {}

        return {
          type: res.status === 'CANCELLED' ? 'cancellation' : 'reservation',
          person: renterName,
          bikeName: bike ? bike.model : 'Bici',
          timestamp: new Date(res.startDate)
        };
      }));
      this.notificationService.setNotifications(this.recentActivities);
      this.topBikes = myBikes.slice(0, 4);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
  }

  navigateToAddBike(): void {
    this.router.navigate(['/owner/my-bikes']);
  }

  async acceptReservation(id: number) {
    try {
      await bookingService.updateStatus(id, 'ACCEPTED');
      console.log(`Reserva ${id} aceptada`);
      this.loadRealDashboardData();
    } catch (error) {
      console.error('Error al aceptar:', error);
    }
  }

  async declineReservation(id: number) {
    try {
      await bookingService.updateStatus(id, 'CANCELLED');
      console.log(`Reserva ${id} rechazada`);
      this.loadRealDashboardData();
    } catch (error) {
      console.error('Error al rechazar:', error);
    }
  }
}
