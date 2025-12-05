import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-reservation-details-dialog',
  standalone: true,
  imports: [ CommonModule, DatePipe, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, TranslateModule ],
  template: `
    <h2 mat-dialog-title>{{ 'RenterHome.ReservationDetails' | translate }}</h2>
    <mat-dialog-content>
      <div class="details-content">
        <img [src]="data.bikeImage" [alt]="data.bikeName" class="bike-image-large">
        <h3>{{ data.bikeName }}</h3>
        <mat-divider></mat-divider>
        <div class="info-grid">
          <mat-icon>person_outline</mat-icon>
          <p><strong>{{ 'RenterHome.Owner' | translate }}:</strong> {{ data.ownerName }}</p>

          <mat-icon>calendar_today</mat-icon>
          <p><strong>{{ 'RenterHome.Date' | translate }}:</strong> {{ data.date | date:'fullDate' }}</p>

          <mat-icon>schedule</mat-icon>
          <p><strong>{{ 'Details.Time' | translate }}:</strong> {{ data.date | date:'shortTime' }}</p>

          <mat-icon>location_on</mat-icon>
          <p><strong>{{ 'Details.Location' | translate }}:</strong> {{ data.address }}</p>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>{{ 'Actions.Close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      --text-primary: #1E293B;
      --text-secondary: #64748B;
      --border-color: #E2E8F0;
      font-family: 'Inter', sans-serif;
    }
    h2[mat-dialog-title] {
      font-weight: 600;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }
    .bike-image-large {
      width: 100%;
      height: 220px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 1rem;
      border: 1px solid var(--border-color);
    }
    .details-content h3 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0.5rem 0 1rem 0;
      color: var(--text-primary);
    }
    .info-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 1rem 1.5rem;
      margin-top: 1.5rem;
    }
    .info-grid mat-icon {
      color: var(--text-secondary);
    }
    .info-grid p {
      margin: 0;
      color: var(--text-secondary);
    }
    .info-grid p strong {
      color: var(--text-primary);
      font-weight: 500;
    }
    mat-dialog-actions {
      padding-top: 1rem;
    }
  `]
})
export class ReservationDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
