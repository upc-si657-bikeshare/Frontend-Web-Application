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

// Servicios Reales
import { bookingService } from '../../../../api/bookingService';
import { catalogService } from '../../../../api/catalogService';
import { identityService } from '../../../../api/identityService';
import { reviewService } from '../../../../api/reviewService'; // <--- IMPORTADO

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
      // -----------------------------------------------------
      // 1. CARGAR DATOS (Paralelo para velocidad)
      // -----------------------------------------------------
      const [myBikesData, myReviews] = await Promise.all([
        catalogService.getAllBikes({ ownerId }),
        reviewService.getReviews({ ownerId })
      ]);

      const myBikes = myBikesData.map((b: any) => new Bike(b));

      // Cargar Reservas de cada bici
      const reservationsPromises = myBikes.map(bike =>
        bookingService.getReservations({ bikeId: bike.id })
      );
      const results = await Promise.all(reservationsPromises);
      const allReservationsRaw = results.flat();

      // -----------------------------------------------------
      // 2. CALCULAR ESTADÍSTICAS
      // -----------------------------------------------------

      // Ingresos
      const monthlyIncome = allReservationsRaw
        .filter((r: any) => r.status === 'COMPLETED')
        .reduce((sum: number, r: any) => sum + (r.totalPrice || 0), 0);

      // Pendientes
      const pendingCount = allReservationsRaw.filter((r: any) => r.status === 'PENDING').length;

      // Rating (Promedio Real)
      let realRating = 0;
      if (myReviews.length > 0) {
        const sumRating = myReviews.reduce((acc: number, r: any) => acc + r.rating, 0);
        realRating = sumRating / myReviews.length;
      }

      this.stats = new DashboardStats({
        monthlyIncome: monthlyIncome,
        pendingReservationsCount: pendingCount,
        activeBikesCount: myBikes.length,
        ownerRating: realRating // <--- DATO REAL
      });

      // -----------------------------------------------------
      // 3. RESERVAS PENDIENTES (Lista enriquecida)
      // -----------------------------------------------------
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

      // -----------------------------------------------------
      // 4. ACTIVIDAD RECIENTE (Reservas + Reseñas Mezcladas)
      // -----------------------------------------------------

      // a) Convertir Reservas a Actividad
      const reservationActivities = await Promise.all(allReservationsRaw.map(async (res: any) => {
        const bike = myBikes.find(b => b.id === res.bikeId);
        let personName = 'Usuario';
        try {
          const profile = await identityService.getProfile(res.renterId);
          personName = profile.fullName;
        } catch(e) {}

        return {
          type: res.status === 'CANCELLED' ? 'cancellation' : 'reservation',
          person: personName,
          bikeName: bike ? bike.model : 'Bici',
          timestamp: new Date(res.startDate)
        } as RecentActivity;
      }));

      // b) Convertir Reseñas a Actividad
      const reviewActivities = await Promise.all(myReviews.map(async (rev: any) => {
        // Encontrar bici asociada a la reseña (usando reservationId si es posible, o buscando el ownerId en mis bicis)
        // Como ReviewService nos devuelve ownerId, asumimos genérico o buscamos match complejo.
        // Simplificación: Ponemos "Bicicleta" o buscamos si el backend nos da más datos.
        let reviewerName = 'Usuario';
        try {
          const profile = await identityService.getProfile(rev.reviewerId);
          reviewerName = profile.fullName;
        } catch(e) {}

        return {
          type: 'review',
          person: reviewerName,
          bikeName: 'Tu servicio', // O el modelo si cruzamos datos con reservationId
          timestamp: new Date(rev.createdAt)
        } as RecentActivity;
      }));

      // c) Mezclar, Ordenar y Cortar
      const combinedActivities = [...reservationActivities, ...reviewActivities]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Más recientes primero
        .slice(0, 6); // Top 6

      this.recentActivities = combinedActivities;

      // Notificar al sidebar
      this.notificationService.setNotifications(this.recentActivities);

      // 5. Top Bikes
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
