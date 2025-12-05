import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CurrentUser, CurrentUserService } from '../../../shared/services/current-user.service';
import { ReviewsDialogComponent } from '../../../shared/components/reviews-dialog/reviews-dialog.component';
import { ChangePasswordDialogComponent } from '../../../shared/components/change-password-dialog/change-password-dialog.component';
import { CreateReviewDialogComponent, ReviewableItem } from '../../../shared/components/create-review-dialog/create-review-dialog.component';

import { identityService } from '../../../../api/identityService';
import { reviewService } from '../../../../api/reviewService';
import { bookingService } from '../../../../api/bookingService';
import { catalogService } from '../../../../api/catalogService';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatSnackBarModule, TranslateModule, MatDialogModule
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css']
})
export class ProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private currentUserService = inject(CurrentUserService);

  userData: CurrentUser | null = null;
  personalInfoForm: FormGroup;
  personalInfoEditMode = false;

  passwordVisible = false;
  currentPasswordVisual = 'Password123!';

  reviewsMade: any[] = [];
  stars = Array(5).fill(0);

  reviewableItems: ReviewableItem[] = [];

  constructor() {
    this.personalInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: [''],
      address: ['', Validators.required],
      avatar: ['']
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  private async loadInitialData() {
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) return;

    const userId = parseInt(userIdStr, 10);

    try {
      const profile = await identityService.getProfile(userId);

      this.personalInfoForm.patchValue({
        name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        avatar: profile.avatarUrl
      });

      this.currentUserService.updateCurrentUser({
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        avatar: profile.avatarUrl,
        phone: profile.phone,
        publicBio: profile.publicBio,
        address: profile.address
      });

      this.currentUserService.currentUser$.subscribe(user => this.userData = user);

      const reviewsData: any[] = await reviewService.getReviews({ renterId: userId });

      this.reviewsMade = await Promise.all(reviewsData.map(async (review) => {
        let ownerName = 'Propietario';
        let ownerImage = 'assets/img/default-avatar.png';
        let bikeModel = 'Bicicleta';

        try {
          const ownerProfile = await identityService.getProfile(review.ownerId);
          ownerName = ownerProfile.fullName;
          ownerImage = ownerProfile.avatarUrl || ownerImage;
        } catch (e) {}

        return {
          ownerName: ownerName,
          ownerImage: ownerImage,
          bikeModel: bikeModel,
          rating: review.rating,
          comment: review.comment,
          date: new Date(review.createdAt).toLocaleDateString()
        };
      }));

      await this.loadItemsToReview(userId);

    } catch (error) {
      console.error('Error cargando perfil:', error);
      this.snackBar.open(this.translate.instant('Profile.ErrorLoad'), 'OK', { duration: 3000 });
    }

    this.personalInfoForm.disable();
  }

  private async loadItemsToReview(userId: number) {
    try {
      const reservations = await bookingService.getReservations({ renterId: userId });
      const completed = reservations.filter((r: any) => r.status === 'COMPLETED');

      this.reviewableItems = await Promise.all(completed.map(async (res: any) => {
        let ownerName = 'Propietario';
        let ownerImage = 'assets/img/default-avatar.png';
        let bikeModel = 'Bicicleta';

        try {
          const bike = await catalogService.getBikeById(res.bikeId);
          bikeModel = bike.model;
          const owner = await identityService.getProfile(bike.ownerId);
          ownerName = owner.fullName;
          ownerImage = owner.avatarUrl || ownerImage;
        } catch (e) {}

        return {
          reservationId: res.id,
          ownerName: ownerName,
          ownerImage: ownerImage,
          bikeModel: bikeModel,
          date: new Date(res.startDate).toLocaleDateString()
        };
      }));
    } catch (e) {
      console.error('Error cargando items para reseñar', e);
    }
  }

  onChangeProfilePicture(): void {
    if (!this.personalInfoEditMode) return;
    const promptMessage = this.translate.instant('Profile.ChangePicturePrompt');
    const newImageUrl = prompt(promptMessage, this.personalInfoForm.get('avatar')?.value || '');

    if (newImageUrl && newImageUrl.trim() !== '') {
      this.personalInfoForm.patchValue({ avatar: newImageUrl });
    }
  }

  toggleEditPersonalInfo() {
    if (this.personalInfoEditMode) {
      this.saveAllData();
    } else {
      this.personalInfoForm.enable();
      this.personalInfoForm.get('email')?.disable();
      this.personalInfoEditMode = true;
    }
  }

  cancelEditPersonalInfo() {
    this.personalInfoEditMode = false;
    this.loadInitialData();
  }

  private async saveAllData() {
    if (this.personalInfoForm.invalid || !this.userData) {
      this.snackBar.open(this.translate.instant('Profile.ErrorForm'), 'Cerrar');
      return;
    }

    try {
      const userId = this.userData.id;
      const personalValues = this.personalInfoForm.getRawValue();

      const updatePayload = {
        fullName: personalValues.name,
        phone: personalValues.phone,
        address: personalValues.address,
        avatarUrl: personalValues.avatar
      };

      await identityService.updateRenterProfile(userId, updatePayload);

      this.snackBar.open(this.translate.instant('Profile.Saved'), 'OK', { duration: 2000 });
      this.personalInfoEditMode = false;
      this.loadInitialData();

    } catch (error) {
      console.error('Error guardando perfil:', error);
      this.snackBar.open(this.translate.instant('Profile.ErrorSave'), 'Cerrar');
    }
  }
  openChangePasswordDialog() {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, { width: '400px', disableClose: true });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.newPassword && result.currentPassword && this.userData) {
        try {
          await identityService.changePassword(this.userData.id, {
            currentPassword: result.currentPassword,
            newPassword: result.newPassword
          });

          this.snackBar.open(this.translate.instant('Password.Success'), 'OK', { duration: 3000 });

        } catch (error) {
          console.error('Error cambiando contraseña:', error);
          this.snackBar.open('Error al cambiar contraseña. Verifica tu contraseña actual.', 'Cerrar', { duration: 4000 });
        }
      }
    });
  }

  openCreateReviewDialog() {
    if (this.reviewableItems.length === 0) {
      this.snackBar.open('No tienes alquileres finalizados para reseñar.', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(CreateReviewDialogComponent, {
      width: '500px',
      data: { reviewableItems: this.reviewableItems }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await reviewService.createReview({
            reservationId: result.reservationId,
            rating: result.rating,
            comment: result.comment
          });

          this.snackBar.open('¡Reseña publicada con éxito!', 'OK', { duration: 3000 });
          this.loadInitialData();

        } catch (error) {
          console.error('Error creando reseña:', error);
          this.snackBar.open('Error al publicar la reseña', 'Cerrar');
        }
      }
    });
  }

  openReviewsDialog() {
    const dialogData = { title: 'Profile.MyReviews', reviews: this.reviewsMade };
    this.dialog.open(ReviewsDialogComponent, { width: '600px', data: dialogData });
  }

  getStarType(rating: number, index: number): string {
    return rating >= index ? 'star' : rating >= index - 0.5 ? 'star_half' : 'star_border';
  }
}
