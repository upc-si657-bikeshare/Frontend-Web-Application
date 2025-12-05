import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { CurrentUserService } from '../../../shared/services/current-user.service';
import { ReservationDialogComponent, ReservationDialogData } from '../../../shared/components/reservation-dialog/reservation-dialog.component';
import { ReservationDetailsDialogComponent } from '../../../shared/components/reservation-details-dialog/reservation-details-dialog.component';
import { CancelConfirmationDialogComponent } from '../../../shared/components/cancel-confirmation-dialog/cancel-confirmation-dialog.component';

import { bookingService } from '../../../../api/bookingService';
import { catalogService } from '../../../../api/catalogService';
import { identityService } from '../../../../api/identityService';

interface RenterStats {
  distanceTraveled: number;
  rentalsCount: number;
  drivingTime: number;
  rating: number;
}

interface UpcomingReservation {
  id: number;
  bikeName: string;
  date: string;
  address: string;
  bikeImage: string;
  ownerName: string;
  totalPrice?: number;
}

interface RentalHistory {
  bikeName: string;
  date: string;
  status: string;
  location: string;
}

interface Recommendation {
  id: number;
  bikeName: string;
  pricePerMinute: number;
  distance: string;
  imageUrl: string;
  ownerName?: string;
}

@Component({
  selector: 'app-renter-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatDialogModule,
    MatSnackBarModule,
    CurrencyPipe,
    DatePipe,
    MatIconModule
  ],
  templateUrl: './renter-home.page.html',
  styleUrls: ['./renter-home.page.css']
})
export class RenterHomePage implements OnInit {
  private translate = inject(TranslateService);
  private currentUserService = inject(CurrentUserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  username = '';
  stats: RenterStats | null = null;
  upcomingReservation: UpcomingReservation | null = null;
  recentRentals: RentalHistory[] = [];
  recommendations: Recommendation[] = [];

  loading = true;

  ngOnInit(): void {
    this.currentUserService.currentUser$.subscribe(user => {
      if (user) this.username = user.fullName.split(' ')[0];
    });
    this.loadRealDashboardData();
  }

  async loadRealDashboardData() {
    this.loading = true;
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) return;
    const userId = parseInt(userIdStr, 10);

    try {
      const allReservations: any[] = await bookingService.getReservations({ renterId: userId });
      const upcomingRaw = allReservations
        .filter(r => r.status === 'PENDING' || r.status === 'ACCEPTED')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      const historyRaw = allReservations
        .filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'DECLINED')
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      if (upcomingRaw.length > 0) {
        const nextRes = upcomingRaw[0];
        this.upcomingReservation = await this.enrichReservation(nextRes);
      } else {
        this.upcomingReservation = null;
      }
      this.recentRentals = await Promise.all(historyRaw.slice(0, 3).map(async (res) => {
        let bikeName = 'Bicicleta';
        try {
          const bike = await catalogService.getBikeById(res.bikeId);
          bikeName = bike.model;
        } catch (e) {}

        return {
          bikeName: bikeName,
          date: res.startDate,
          status: res.status,
          location: 'Lima, Perú'
        };
      }));

      const availableBikes: any[] = await catalogService.getAllBikes({ status: 'AVAILABLE' });
      this.recommendations = availableBikes.slice(0, 3).map(bike => ({
        id: bike.id,
        bikeName: bike.model,
        pricePerMinute: bike.costPerMinute,
        distance: 'Cerca de ti',
        imageUrl: bike.imageUrl || 'assets/img/bike-placeholder.jpg'
      }));

      this.stats = {
        distanceTraveled: historyRaw.length * 5,
        rentalsCount: historyRaw.filter(r => r.status === 'COMPLETED').length,
        drivingTime: historyRaw.length * 45,
        rating: 4.9
      };

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      this.loading = false;
    }
  }
  private async enrichReservation(res: any): Promise<UpcomingReservation> {
    let bikeName = 'Cargando...';
    let bikeImage = '';
    let ownerName = 'Propietario';

    try {
      const bike = await catalogService.getBikeById(res.bikeId);
      bikeName = bike.model;
      bikeImage = bike.imageUrl;
      const ownerProfile = await identityService.getProfile(bike.ownerId);
      ownerName = ownerProfile.fullName;
    } catch (e) {
      console.warn('Error enriqueciendo reserva', e);
    }

    return {
      id: res.id,
      bikeName: bikeName,
      date: res.startDate,
      address: 'Ver ubicación en mapa',
      bikeImage: bikeImage,
      ownerName: ownerName,
      totalPrice: res.totalPrice
    };
  }

  viewDetails(reservation: UpcomingReservation): void {
    this.dialog.open(ReservationDetailsDialogComponent, {
      width: '500px',
      data: reservation
    });
  }

  cancelReservation(reservation: UpcomingReservation): void {
    const dialogRef = this.dialog.open(CancelConfirmationDialogComponent, { width: '450px' });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await bookingService.updateStatus(reservation.id, 'CANCELLED');

          this.snackBar.open(this.translate.instant('Reservations.StatusCancelled'), 'OK', { duration: 3000 });
          this.loadRealDashboardData();
        } catch (error) {
          console.error('Error cancelando:', error);
          this.snackBar.open('Error al cancelar reserva', 'Cerrar');
        }
      }
    });
  }
  reserveBike(rec: Recommendation): void {
    const dialogData: ReservationDialogData = {
      bikeName: rec.bikeName,
      pricePerMinute: rec.pricePerMinute,
      imageUrl: rec.imageUrl
    };

    const dialogRef = this.dialog.open(ReservationDialogComponent, {
      width: '450px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        const userIdStr = localStorage.getItem('userId');
        if (!userIdStr) return;

        try {
          const now = new Date();
          const endDate = new Date(now.getTime() + 60 * 60 * 1000);

          const payload = {
            renterId: parseInt(userIdStr, 10),
            bikeId: rec.id,
            startDate: now.toISOString(),
            endDate: endDate.toISOString()
          };

          await bookingService.createReservation(payload);

          this.snackBar.open(this.translate.instant('RenterHome.ReservationSuccess'), 'OK', { duration: 3000 });
          this.loadRealDashboardData();

        } catch (error) {
          console.error('Error reservando:', error);
          this.snackBar.open('Error al crear reserva', 'Cerrar');
        }
      }
    });
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'COMPLETED': return this.translate.instant('RenterHome.StatusFinalizado') || 'Finalizado';
      case 'CANCELLED': return this.translate.instant('RenterHome.StatusCancelada') || 'Cancelada';
      case 'ACCEPTED': return this.translate.instant('RenterHome.StatusActiva') || 'Aceptada';
      case 'PENDING': return this.translate.instant('Reservations.StatusPending') || 'Pendiente';
      default: return status;
    }
  }
}
