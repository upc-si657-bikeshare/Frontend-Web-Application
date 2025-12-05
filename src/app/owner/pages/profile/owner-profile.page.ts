import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrentUser, CurrentUserService } from '../../../shared/services/current-user.service';
import { ChangePasswordDialogComponent } from '../../../shared/components/change-password-dialog/change-password-dialog.component';
import { ReviewsDialogComponent } from '../../../shared/components/reviews-dialog/reviews-dialog.component';
import { identityService } from '../../../../api/identityService';
import { reviewService } from '../../../../api/reviewService';

@Component({
  selector: 'app-owner-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatChipsModule, MatTabsModule,
    MatDialogModule, TranslateModule],
  templateUrl: './owner-profile.page.html',
  styleUrls: ['./owner-profile.page.css']
})
export class OwnerProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private currentUserService = inject(CurrentUserService);

  userData: CurrentUser | null = null;
  ownerProfileData: any = {};

  personalInfoForm: FormGroup;
  payoutInfoForm: FormGroup;

  personalInfoEditMode = false;
  payoutInfoEditMode = false;

  currentPasswordVisible = false;
  currentPasswordMock = '••••••••';

  reviewsReceived: any[] = [];
  averageRating = 0;
  stars = Array(5).fill(0);

  constructor() {
    this.personalInfoForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      publicBio: ['', Validators.maxLength(200)],
      avatar: ['']
    });

    this.payoutInfoForm = this.fb.group({
      payoutEmail: ['', Validators.email],
      bankAccountNumber: ['', Validators.pattern('^[0-9-]*$')],
      yapePhoneNumber: ['', Validators.pattern('^9[0-9]{8}$')]
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
      this.ownerProfileData = profile;

      this.personalInfoForm.patchValue({
        name: profile.fullName,
        phone: profile.phone,
        publicBio: profile.publicBio,
        avatar: profile.avatarUrl
      });

      this.payoutInfoForm.patchValue({
        payoutEmail: profile.payoutEmail,
        bankAccountNumber: profile.bankAccountNumber,
        yapePhoneNumber: profile.yapePhoneNumber
      });

      this.currentUserService.updateCurrentUser({
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        avatar: profile.avatarUrl,
        phone: profile.phone,
        publicBio: profile.publicBio
      });
      this.currentUserService.currentUser$.subscribe(user => this.userData = user);

      const reviewsData: any[] = await reviewService.getReviews({ ownerId: userId });

      this.reviewsReceived = await Promise.all(reviewsData.map(async (review) => {
        let renterName = 'Arrendatario';
        let renterImage = 'assets/img/default-avatar.png';

        try {
          const renterProfile = await identityService.getProfile(review.reviewerId);
          renterName = renterProfile.fullName;
          renterImage = renterProfile.avatarUrl || renterImage;
        } catch (e) {
          console.warn('No se pudo cargar perfil del reviewer', e);
        }

        return {
          renterName: renterName,
          renterImage: renterImage,
          rating: review.rating,
          comment: review.comment,
          date: new Date(review.createdAt).toLocaleDateString()
        };
      }));

      if (this.reviewsReceived.length > 0) {
        const sum = this.reviewsReceived.reduce((acc, r) => acc + r.rating, 0);
        this.averageRating = sum / this.reviewsReceived.length;
      } else {
        this.averageRating = 0;
      }

    } catch (error) {
      console.error('Error cargando perfil:', error);
      this.snackBar.open('Error al cargar perfil', 'Cerrar', { duration: 3000 });
    }

    this.personalInfoForm.disable();
    this.payoutInfoForm.disable();
  }

  onChangeProfilePicture(): void {
    if (!this.personalInfoEditMode) return;
    const promptMessage = this.translate.instant('Profile.ChangePicturePrompt');
    const currentAvatarUrl = this.personalInfoForm.get('avatar')?.value || '';
    const newImageUrl = prompt(promptMessage, currentAvatarUrl);

    if (newImageUrl && newImageUrl.trim() !== '') {
      this.personalInfoForm.patchValue({ avatar: newImageUrl });
    }
  }

  async toggleEdit(form: FormGroup, mode: 'personal' | 'payout') {
    const editing = mode === 'personal' ? this.personalInfoEditMode : this.payoutInfoEditMode;

    if (editing) {
      if (!form.valid) {
        this.snackBar.open(this.translate.instant('Profile.ErrorForm'),
          this.translate.instant('Profile.Close'),
          { duration: 3000 });
        return;
      }

      if (!this.userData) return;

      try {
        const userId = Number(this.userData.id);
        const updatePayload = {
          fullName: this.personalInfoForm.get('name')?.value,
          phone: this.personalInfoForm.get('phone')?.value,
          publicBio: this.personalInfoForm.get('publicBio')?.value,
          avatarUrl: this.personalInfoForm.get('avatar')?.value,
          payoutEmail: this.payoutInfoForm.get('payoutEmail')?.value,
          bankAccountNumber: this.payoutInfoForm.get('bankAccountNumber')?.value,
          yapePhoneNumber: this.payoutInfoForm.get('yapePhoneNumber')?.value
        };

        await identityService.updateOwnerProfile(userId, updatePayload);

        this.snackBar.open(this.translate.instant('Profile.Saved'),
          this.translate.instant('Profile.OK'),
          { duration: 2000 });

        form.disable();
        if (mode === 'personal') this.personalInfoEditMode = false;
        else this.payoutInfoEditMode = false;

        this.loadInitialData();

      } catch (error) {
        console.error('Error actualizando perfil:', error);
        this.snackBar.open('Error al guardar cambios', 'Cerrar', { duration: 3000 });
      }

    } else {
      form.enable();
      if (mode === 'personal') this.personalInfoEditMode = true;
      else this.payoutInfoEditMode = true;
    }
  }

  cancelEdit(form: FormGroup, mode: 'personal' | 'payout') {
    form.disable();
    if (mode === 'personal') this.personalInfoEditMode = false;
    else this.payoutInfoEditMode = false;
    this.loadInitialData();
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
          this.snackBar.open('Error al cambiar la contraseña. Verifica tu contraseña actual.', 'Cerrar', { duration: 4000 });
        }
      }
    });
  }

  openReviewsDialog() {
    const dialogData = {
      title: 'OwnerProfile.AllReviews',
      averageRating: this.averageRating,
      reviews: this.reviewsReceived.map(review => ({
        reviewerName: review.renterName,
        reviewerImage: review.renterImage,
        reviewSubject: review.date,
        date: review.date,
        comment: review.comment,
        rating: review.rating
      }))
    };
    this.dialog.open(ReviewsDialogComponent, { width: '600px', data: dialogData });
  }

  getStarType(r: number, i: number) { return r >= i ? 'star' : r >= i - 0.5 ? 'star_half' : 'star_border'; }
}
