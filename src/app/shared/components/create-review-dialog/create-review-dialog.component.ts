import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface ReviewableItem {
  reservationId: number;
  ownerName: string;
  ownerImage: string;
  bikeModel: string;
  date: string;
}

@Component({
  selector: 'app-create-review-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, TranslateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ 'Reviews.WriteReview' | translate }}</h2> <!-- Asegúrate de tener esta clave o usa texto fijo -->

    <mat-dialog-content>
      <form [formGroup]="reviewForm" class="review-form">

        <!-- 1. SELECCIONAR EXPERIENCIA -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Selecciona un alquiler finalizado</mat-label>
          <mat-select formControlName="reservationId">
            <mat-select-trigger>
              {{ getSelectedTrigger() }}
            </mat-select-trigger>
            <mat-option *ngFor="let item of data.reviewableItems" [value]="item.reservationId">
              <div class="option-row">
                <img [src]="item.ownerImage" class="mini-avatar" onerror="this.src='assets/img/default-avatar.png'">
                <div class="option-text">
                  <span class="owner-name">{{ item.ownerName }}</span>
                  <span class="bike-info">{{ item.bikeModel }} - {{ item.date }}</span>
                </div>
              </div>
            </mat-option>
          </mat-select>
          <mat-error>Debes seleccionar una experiencia</mat-error>
        </mat-form-field>

        <!-- 2. CALIFICACIÓN (ESTRELLAS) -->
        <div class="rating-section">
          <p class="rating-label">Tu Calificación:</p>
          <div class="stars-input">
            <mat-icon *ngFor="let i of [1,2,3,4,5]"
                      (click)="setRating(i)"
                      [class.filled]="currentRating >= i">
              {{ currentRating >= i ? 'star' : 'star_border' }}
            </mat-icon>
          </div>
          <input type="hidden" formControlName="rating">
        </div>

        <!-- 3. COMENTARIO -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tu Opinión</mat-label>
          <textarea matInput formControlName="comment" rows="4" placeholder="¿Qué tal estuvo la bicicleta y el dueño?"></textarea>
          <mat-error>El comentario es obligatorio (mínimo 5 letras)</mat-error>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="reviewForm.invalid">
        Publicar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 10px; }
    .option-row { display: flex; align-items: center; gap: 12px; padding: 5px 0; }
    .mini-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd; }
    .option-text { display: flex; flex-direction: column; line-height: 1.2; }
    .owner-name { font-weight: 500; font-size: 14px; }
    .bike-info { font-size: 12px; color: #666; }

    .rating-section { margin: 10px 0 20px 0; text-align: center; }
    .rating-label { font-weight: 500; margin-bottom: 8px; color: #555; }
    .stars-input { display: flex; justify-content: center; cursor: pointer; color: #ffca28; }
    .stars-input mat-icon { font-size: 36px; width: 36px; height: 36px; transition: transform 0.2s; }
    .stars-input mat-icon:hover { transform: scale(1.1); }
  `]
})
export class CreateReviewDialogComponent {
  reviewForm: FormGroup;
  currentRating = 0;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateReviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { reviewableItems: ReviewableItem[] }
  ) {
    this.reviewForm = this.fb.group({
      reservationId: ['', Validators.required],
      rating: [0, [Validators.required, Validators.min(1)]],
      comment: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  setRating(rating: number) {
    this.currentRating = rating;
    this.reviewForm.patchValue({ rating });
  }

  getSelectedTrigger(): string {
    const id = this.reviewForm.get('reservationId')?.value;
    const selected = this.data.reviewableItems.find(i => i.reservationId === id);
    return selected ? `${selected.ownerName} - ${selected.bikeModel}` : '';
  }

  submit() {
    if (this.reviewForm.valid) {
      this.dialogRef.close(this.reviewForm.value);
    }
  }
}
