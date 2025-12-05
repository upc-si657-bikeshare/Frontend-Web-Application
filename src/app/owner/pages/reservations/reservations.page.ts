import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Reservation } from '../../model/reservation.entity';
import { bookingService } from '../../../../api/bookingService';
import { catalogService } from '../../../../api/catalogService';
import { identityService } from '../../../../api/identityService';

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule, MatButtonModule, TranslateModule, CurrencyPipe, DatePipe, MatSnackBarModule],
  templateUrl: './reservations.page.html',
  styleUrls: ['./reservations.page.css']
})
export class ReservationsPage implements OnInit {
  allReservations: Reservation[] = [];
  loading = true;

  private translate = inject(TranslateService);
  private snackBar = inject(MatSnackBar);

  get pendingReservations(): Reservation[] {
    return this.allReservations.filter(r => r.status === 'PENDING');
  }
  get upcomingReservations(): Reservation[] {
    return this.allReservations.filter(r => r.status === 'ACCEPTED');
  }
  get completedReservations(): Reservation[] {
    return this.allReservations.filter(r => r.status === 'COMPLETED');
  }
  get historyReservations(): Reservation[] {
    return this.allReservations.filter(r => r.status === 'CANCELLED' || r.status === 'Declined');
  }

  ngOnInit(): void {
    this.loadRealReservations();
  }

  async loadRealReservations() {
    this.loading = true;
    const ownerIdStr = localStorage.getItem('userId');
    if (!ownerIdStr) return;
    const ownerId = parseInt(ownerIdStr, 10);

    try {
      const myBikes: any[] = await catalogService.getAllBikes({ ownerId });

      if (myBikes.length === 0) {
        this.allReservations = [];
        this.loading = false;
        return;
      }
      const reservationsPromises = myBikes.map(bike =>
        bookingService.getReservations({ bikeId: bike.id })
      );

      const results = await Promise.all(reservationsPromises);
      const flatReservations = results.flat();
      const enrichedReservations = await Promise.all(flatReservations.map(async (res: any) => {
        const bike = myBikes.find(b => b.id === res.bikeId);
        const bikeName = bike ? bike.model : 'Bici desconocida';
        let renterName = 'Usuario';
        let renterImage = '';
        try {
          const renterProfile = await identityService.getProfile(res.renterId);
          renterName = renterProfile.fullName;
          renterImage = renterProfile.avatarUrl || 'assets/img/default-avatar.png';
        } catch (e) {
          console.warn(`No se pudo cargar perfil para renter ${res.renterId}`);
        }
        return new Reservation({
          id: res.id,
          renterName: renterName,
          bikeName: bikeName,
          date: new Date(res.startDate),
          endDate: new Date(res.endDate),
          status: res.status,
          totalPrice: res.totalPrice || 0,
          renterImage: renterImage
        });
      }));

      this.allReservations = enrichedReservations;

    } catch (error) {
      console.error('Error cargando reservas:', error);
      this.snackBar.open('Error al cargar reservas', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async accept(id: number) {
    try {
      await bookingService.updateStatus(id, 'ACCEPTED');
      this.snackBar.open(this.translate.instant('Reservations.StatusAccepted'), 'OK', { duration: 2000 });
      this.loadRealReservations();
    } catch (error) {
      console.error('Error aceptando:', error);
      this.snackBar.open('Error al aceptar reserva', 'Cerrar', { duration: 3000 });
    }
  }

  async decline(id: number) {
    try {
      await bookingService.updateStatus(id, 'CANCELLED');
      this.snackBar.open(this.translate.instant('Reservations.StatusCancelled'), 'OK', { duration: 2000 });
      this.loadRealReservations();
    } catch (error) {
      console.error('Error rechazando:', error);
    }
  }

  contactRenter(reservation: Reservation) {
    const promptMessage = this.translate.instant('Reservations.ContactPromptMessage', { renterName: reservation.renterName });
    const message = prompt(promptMessage);
    if (message) {
      console.log(`Mensaje a ${reservation.renterName}: "${message}"`);
      alert(this.translate.instant('Reservations.ContactSuccess'));
    }
  }

  getStatusInfo(status: string): { class: string; icon: string; textKey: string } {
    switch (status) {
      case 'PENDING': return { class: 'status-pending', icon: 'hourglass_top', textKey: 'Reservations.StatusPending' };
      case 'ACCEPTED': return { class: 'status-accepted', icon: 'event_available', textKey: 'Reservations.StatusAccepted' };
      case 'COMPLETED': return { class: 'status-completed', icon: 'check_circle', textKey: 'Reservations.StatusCompleted' };
      case 'CANCELLED': return { class: 'status-cancelled', icon: 'cancel', textKey: 'Reservations.StatusCancelled' };
      default: return { class: 'status-declined', icon: 'help', textKey: status };
    }
  }
}
